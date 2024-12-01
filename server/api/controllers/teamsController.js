const { supabase } = require("../config/supabase");
const { emitTeamEvent } = require("../socket");

// Create a new team
const createTeam = async (req, res) => {
  try {
    const { name, description } = req.body;
    const userId = req.user.userId;

    if (!name) {
      return res.status(400).json({
        error: "Team name is required",
      });
    }

    // Create team
    const { data: team, error: teamError } = await supabase
      .from("teams")
      .insert({
        name,
        description,
      })
      .select()
      .single();

    if (teamError) {
      return res.status(400).json({ error: teamError.message });
    }

    // Add creator as team member with 'admin' role
    const { error: memberError } = await supabase.from("team_members").insert({
      team_id: team.id,
      user_id: userId,
      role: "admin",
    });

    if (memberError) {
      await supabase.from("teams").delete().eq("id", team.id);
      return res.status(400).json({ error: memberError.message });
    }

    res.status(201).json({
      message: "Team created successfully",
      data: team,
    });
  } catch (error) {
    console.error("Team creation error:", error);
    res.status(500).json({
      error: "Internal server error during team creation",
    });
  }
};

// Get all teams for a user
const getUserTeams = async (req, res) => {
  try {
    console.log("Getting teams for user:", req.user.id);

    // First get teams where user is a member
    const { data: teamMembers, error: memberError } = await supabase
      .from("team_members")
      .select(
        `
        team_id,
        role,
        team:teams (
          id,
          name,
          description,
          created_at
        )
      `
      )
      .eq("user_id", req.user.id);

    if (memberError) {
      console.error("Error fetching team members:", memberError);
      throw memberError;
    }

    // Transform the data
    const teams = teamMembers.map((member) => ({
      ...member.team,
      userRole: member.role,
    }));

    // Get member count for each team
    const teamsWithCounts = await Promise.all(
      teams.map(async (team) => {
        const { count, error: countError } = await supabase
          .from("team_members")
          .select("*", { count: "exact" })
          .eq("team_id", team.id);

        if (countError) {
          console.error("Error getting member count:", countError);
          throw countError;
        }

        return {
          ...team,
          memberCount: count,
        };
      })
    );

    res.json({
      data: teamsWithCounts,
    });
  } catch (error) {
    console.error("Get teams error:", error);
    res.status(500).json({
      error: error.message,
    });
  }
};

// Add member to team
const addTeamMember = async (req, res) => {
  try {
    const { teamId } = req.params;
    const { email } = req.body;
    const requestingUserId = req.user.id;

    // Check if requesting user is team admin
    const { data: adminCheck, error: adminError } = await supabase
      .from("team_members")
      .select("role")
      .eq("team_id", teamId)
      .eq("user_id", requestingUserId)
      .single();

    if (adminError) {
      console.error("[Teams] Admin check error:", adminError.message);
      return res.status(403).json({
        error: "Failed to verify admin status",
      });
    }

    if (!adminCheck || adminCheck.role !== "admin") {
      return res.status(403).json({
        error: "Only team admins can add members",
      });
    }

    // Find user by email
    const { data: userToAdd, error: userError } = await supabase
      .from("users")
      .select("id, username, email")
      .eq("email", email)
      .single();

    if (userError || !userToAdd) {
      return res.status(404).json({
        error: "User not found with this email",
      });
    }

    // Check if user is already a member
    const { data: existingMember, error: existingError } = await supabase
      .from("team_members")
      .select("*")
      .eq("team_id", teamId)
      .eq("user_id", userToAdd.id)
      .single();

    if (existingError && existingError.code !== "PGRST116") {
      console.error("[Teams] Membership check error:", existingError.message);
      return res.status(500).json({
        error: "Failed to check existing membership",
      });
    }

    if (existingMember) {
      return res.status(400).json({
        error: "User is already a member of this team",
      });
    }

    // Get team details
    const { data: team, error: teamError } = await supabase
      .from("teams")
      .select("name")
      .eq("id", teamId)
      .single();

    if (teamError) {
      console.error("[Teams] Team fetch error:", teamError.message);
      return res.status(500).json({
        error: "Failed to fetch team details",
      });
    }

    // Add new member
    const { data: member, error: memberError } = await supabase
      .from("team_members")
      .insert({
        team_id: teamId,
        user_id: userToAdd.id,
        role: "member",
      })
      .select()
      .single();

    if (memberError) {
      console.error("[Teams] Member insert error:", memberError.message);
      return res.status(500).json({
        error: "Failed to add team member",
      });
    }

    // Get updated member count
    const { count: newMemberCount } = await supabase
      .from("team_members")
      .select("*", { count: "exact" })
      .eq("team_id", teamId);

    try {
      emitTeamEvent("MEMBER_ADDED", {
        teamId,
        teamName: team.name,
        memberCount: newMemberCount,
        userId: userToAdd.id,
        adminId: requestingUserId,
      });
    } catch (socketError) {
      console.error("[Teams] Socket emission error:", socketError.message);
    }

    res.status(201).json({
      message: "Team member added successfully",
      data: {
        ...member,
        user: userToAdd,
        memberCount: newMemberCount,
      },
    });
  } catch (error) {
    console.error("[Teams] Add member error:", error.message);
    res.status(500).json({
      error: "Internal server error while adding team member",
    });
  }
};

// Get team members
const getTeamMembers = async (req, res) => {
  try {
    const { teamId } = req.params;
    const userId = req.user.userId;

    // Check if user is team member
    const { data: memberCheck, error: checkError } = await supabase
      .from("team_members")
      .select()
      .eq("team_id", teamId)
      .eq("user_id", userId)
      .single();

    if (checkError || !memberCheck) {
      return res.status(403).json({
        error: "Access denied",
      });
    }

    const { data: members, error: memberError } = await supabase
      .from("team_members")
      .select(
        `
        role,
        users (
          id,
          username,
          email,
          avatar_url
        )
      `
      )
      .eq("team_id", teamId);

    if (memberError) {
      return res.status(400).json({ error: memberError.message });
    }

    res.json({ data: members });
  } catch (error) {
    console.error("Get team members error:", error);
    res.status(500).json({
      error: "Internal server error while fetching team members",
    });
  }
};

// Remove member from team
const removeTeamMember = async (req, res) => {
  try {
    const { teamId, memberId } = req.params;
    const requestingUserId = req.user.id;

    // Check if requesting user is team admin
    const { data: adminCheck, error: adminError } = await supabase
      .from("team_members")
      .select("role")
      .eq("team_id", teamId)
      .eq("user_id", requestingUserId)
      .single();

    if (adminError) {
      console.error("[Teams] Admin check error:", adminError.message);
      return res.status(403).json({
        error: "Failed to verify admin status",
      });
    }

    if (!adminCheck || adminCheck.role !== "admin") {
      return res.status(403).json({
        error: "Only team admins can remove members",
      });
    }

    // Get team name and current member count
    const [teamData, memberCountData] = await Promise.all([
      supabase.from("teams").select("name").eq("id", teamId).single(),
      supabase
        .from("team_members")
        .select("*", { count: "exact" })
        .eq("team_id", teamId),
    ]);

    if (teamData.error) {
      console.error("[Teams] Team fetch error:", teamData.error.message);
      return res.status(500).json({
        error: "Failed to fetch team details",
      });
    }

    const team = teamData.data;
    const currentMemberCount = memberCountData.count;

    // Remove member
    const { error: deleteError } = await supabase
      .from("team_members")
      .delete()
      .eq("team_id", teamId)
      .eq("user_id", memberId);

    if (deleteError) {
      console.error("[Teams] Delete member error:", deleteError.message);
      throw deleteError;
    }

    const newMemberCount = currentMemberCount - 1;

    try {
      emitTeamEvent("MEMBER_REMOVED", {
        teamId,
        teamName: team.name,
        memberCount: newMemberCount,
        userId: memberId,
        adminId: requestingUserId,
      });
    } catch (socketError) {
      console.error("[Teams] Socket emission error:", socketError.message);
    }

    res.json({
      message: "Team member removed successfully",
      memberCount: newMemberCount,
    });
  } catch (error) {
    console.error("[Teams] Remove member error:", error.message);
    res.status(500).json({
      error: "Internal server error while removing team member",
    });
  }
};

module.exports = {
  createTeam,
  getUserTeams,
  addTeamMember,
  getTeamMembers,
  removeTeamMember,
};
