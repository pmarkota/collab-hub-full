const { supabase } = require("../config/supabase");

const getTaskComments = async (req, res) => {
  try {
    const { taskId } = req.params;
    const userId = req.user.id;

    // Check if user has access to the task
    const { data: task } = await supabase
      .from("tasks")
      .select("team_id")
      .eq("id", taskId)
      .single();

    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }

    // Check team membership
    const { data: teamMember } = await supabase
      .from("team_members")
      .select()
      .eq("team_id", task.team_id)
      .eq("user_id", userId)
      .single();

    if (!teamMember) {
      return res.status(403).json({ error: "Access denied" });
    }

    // Get comments with user information
    const { data: comments, error } = await supabase
      .from("task_comments")
      .select(
        `
        *,
        user:users!task_comments_user_id_fkey (
          id,
          username,
          avatar_url
        )
      `
      )
      .eq("task_id", taskId)
      .order("created_at", { ascending: false });

    if (error) throw error;

    res.json({
      data: comments,
    });
  } catch (error) {
    console.error("Get task comments error:", error);
    res.status(500).json({
      error: error.message,
    });
  }
};

const createComment = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { comment } = req.body;
    const userId = req.user.id;

    // Check if user has access to the task
    const { data: task } = await supabase
      .from("tasks")
      .select("team_id")
      .eq("id", taskId)
      .single();

    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }

    // Check team membership
    const { data: teamMember } = await supabase
      .from("team_members")
      .select()
      .eq("team_id", task.team_id)
      .eq("user_id", userId)
      .single();

    if (!teamMember) {
      return res.status(403).json({ error: "Access denied" });
    }

    // Create comment
    const { data: newComment, error } = await supabase
      .from("task_comments")
      .insert({
        task_id: taskId,
        user_id: userId,
        comment,
      })
      .select(
        `
        *,
        user:users!task_comments_user_id_fkey (
          id,
          username,
          avatar_url
        )
      `
      )
      .single();

    if (error) throw error;

    res.status(201).json({
      message: "Comment created successfully",
      data: newComment,
    });
  } catch (error) {
    console.error("Create comment error:", error);
    res.status(500).json({
      error: error.message,
    });
  }
};

module.exports = {
  getTaskComments,
  createComment,
};
