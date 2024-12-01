const { supabase } = require("../config/supabase");

const createTask = async (req, res) => {
  try {
    const {
      name,
      description,
      priority,
      due_date,
      estimated_hours,
      team_id,
      status,
    } = req.body;
    const userId = req.user.id;

    // Validate priority
    const validPriorities = ["low", "medium", "high"];
    if (!validPriorities.includes(priority)) {
      return res.status(400).json({
        error: "Priority must be one of: low, medium, high",
      });
    }

    // Check team membership and admin role
    const { data: teamMember } = await supabase
      .from("team_members")
      .select()
      .eq("team_id", team_id)
      .eq("user_id", userId)
      .single();

    if (!teamMember || teamMember.role !== "admin") {
      return res.status(403).json({ error: "Access denied" });
    }

    // Create task
    const { data: task, error } = await supabase
      .from("tasks")
      .insert({
        name,
        description,
        priority,
        due_date,
        estimated_hours: estimated_hours ? parseFloat(estimated_hours) : null,
        team_id,
        status,
        created_by: userId,
      })
      .select()
      .single();

    if (error) {
      console.error("Task creation error:", error);
      throw error;
    }

    res.status(201).json({
      message: "Task created successfully",
      data: task,
    });
  } catch (error) {
    console.error("Create task error:", error);
    res.status(500).json({
      error: error.message,
    });
  }
};

const getTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const userId = req.user.id;

    const { data: task, error } = await supabase
      .from("tasks")
      .select(
        `
        *,
        created_by:users!tasks_created_by_fkey(username),
        assigned_to:users!tasks_assigned_to_fkey(username),
        team:teams!tasks_team_id_fkey(name)
      `
      )
      .eq("id", taskId)
      .single();

    if (error) throw error;

    if (!task) {
      return res.status(404).json({
        error: "Task not found",
      });
    }

    // Check if user has access to this task
    const { data: teamMember } = await supabase
      .from("team_members")
      .select()
      .eq("team_id", task.team_id)
      .eq("user_id", userId)
      .single();

    if (!teamMember) {
      return res.status(403).json({
        error: "You don't have access to this task",
      });
    }

    res.json({ data: task });
  } catch (error) {
    console.error("Get task error:", error);
    res.status(500).json({
      error: error.message,
    });
  }
};

const getTeamTasks = async (req, res) => {
  try {
    const { teamId } = req.params;
    const userId = req.user.id;

    // Check team membership
    const { data: teamMember } = await supabase
      .from("team_members")
      .select()
      .eq("team_id", teamId)
      .eq("user_id", userId)
      .single();

    if (!teamMember) {
      return res.status(403).json({ error: "Access denied" });
    }

    // Get tasks with assignee information
    const { data: tasks, error } = await supabase
      .from("tasks")
      .select(
        `
        *,
        assigned_to:users!tasks_assigned_to_fkey (
          id,
          username,
          avatar_url
        )
      `
      )
      .eq("team_id", teamId)
      .order("created_at", { ascending: false });

    if (error) throw error;

    res.json({
      data: tasks,
    });
  } catch (error) {
    console.error("Get team tasks error:", error);
    res.status(500).json({
      error: error.message,
    });
  }
};

const updateTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const updates = req.body;
    const userId = req.user.id;

    // Get task to check team membership
    const { data: task } = await supabase
      .from("tasks")
      .select("team_id")
      .eq("id", taskId)
      .single();

    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }

    // Check team membership and admin role
    const { data: teamMember } = await supabase
      .from("team_members")
      .select()
      .eq("team_id", task.team_id)
      .eq("user_id", userId)
      .single();

    if (!teamMember || teamMember.role !== "admin") {
      return res.status(403).json({ error: "Access denied" });
    }

    // Update task
    const { data: updatedTask, error } = await supabase
      .from("tasks")
      .update(updates)
      .eq("id", taskId)
      .select()
      .single();

    if (error) throw error;

    res.json({
      message: "Task updated successfully",
      data: updatedTask,
    });
  } catch (error) {
    console.error("Update task error:", error);
    res.status(500).json({
      error: error.message,
    });
  }
};

const deleteTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const userId = req.user.id;

    // Get task to check team membership
    const { data: task } = await supabase
      .from("tasks")
      .select("team_id")
      .eq("id", taskId)
      .single();

    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }

    // Check team membership and admin role
    const { data: teamMember } = await supabase
      .from("team_members")
      .select()
      .eq("team_id", task.team_id)
      .eq("user_id", userId)
      .single();

    if (!teamMember || teamMember.role !== "admin") {
      return res.status(403).json({ error: "Access denied" });
    }

    // Delete task
    const { error } = await supabase.from("tasks").delete().eq("id", taskId);

    if (error) throw error;

    res.json({
      message: "Task deleted successfully",
    });
  } catch (error) {
    console.error("Delete task error:", error);
    res.status(500).json({
      error: error.message,
    });
  }
};

const assignTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { assignee_id } = req.body;
    const userId = req.user.id;

    // Get current task
    const { data: task } = await supabase
      .from("tasks")
      .select(
        `
        *,
        team:teams!tasks_team_id_fkey(*)
      `
      )
      .eq("id", taskId)
      .single();

    if (!task) {
      return res.status(404).json({
        error: "Task not found",
      });
    }

    // Check if assigner has permission (team admin or task creator)
    const { data: teamMember } = await supabase
      .from("team_members")
      .select()
      .eq("team_id", task.team_id)
      .eq("user_id", userId)
      .single();

    if (
      !teamMember ||
      (teamMember.role !== "admin" && task.created_by !== userId)
    ) {
      return res.status(403).json({
        error: "You don't have permission to assign this task",
      });
    }

    // Check if assignee is team member
    const { data: assigneeTeamMember } = await supabase
      .from("team_members")
      .select()
      .eq("team_id", task.team_id)
      .eq("user_id", assignee_id)
      .single();

    if (!assigneeTeamMember) {
      return res.status(400).json({
        error: "Assignee must be a team member",
      });
    }

    // Update task assignment
    const { data, error } = await supabase
      .from("tasks")
      .update({
        assigned_to: assignee_id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", taskId)
      .select()
      .single();

    if (error) throw error;

    res.json({
      message: "Task assigned successfully",
      data,
    });
  } catch (error) {
    console.error("Assign task error:", error);
    res.status(500).json({
      error: error.message,
    });
  }
};

const updateTaskProgress = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { actual_hours, status } = req.body;
    const userId = req.user.id;

    // Get current task
    const { data: task } = await supabase
      .from("tasks")
      .select()
      .eq("id", taskId)
      .single();

    if (!task) {
      return res.status(404).json({
        error: "Task not found",
      });
    }

    // Check if user is assigned to task or is admin
    const { data: teamMember } = await supabase
      .from("team_members")
      .select()
      .eq("team_id", task.team_id)
      .eq("user_id", userId)
      .single();

    if (
      !teamMember ||
      (teamMember.role !== "admin" && task.assigned_to !== userId)
    ) {
      return res.status(403).json({
        error: "You don't have permission to update this task's progress",
      });
    }

    // Calculate progress based on actual vs estimated hours
    let progress = null;
    if (task.estimated_hours && actual_hours) {
      progress = Math.min((actual_hours / task.estimated_hours) * 100, 100);
    }

    const { data, error } = await supabase
      .from("tasks")
      .update({
        actual_hours,
        status,
        progress,
        updated_at: new Date().toISOString(),
      })
      .eq("id", taskId)
      .select()
      .single();

    if (error) throw error;

    res.json({
      message: "Task progress updated successfully",
      data,
    });
  } catch (error) {
    console.error("Update task progress error:", error);
    res.status(500).json({
      error: error.message,
    });
  }
};

const addTaskDependency = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { dependent_task_id } = req.body;
    const userId = req.user.id;

    // Check if both tasks exist and are in the same team
    const { data: tasks, error: tasksError } = await supabase
      .from("tasks")
      .select()
      .in("id", [taskId, dependent_task_id]);

    if (tasksError) throw tasksError;

    if (tasks.length !== 2) {
      return res.status(404).json({
        error: "One or both tasks not found",
      });
    }

    const [task1, task2] = tasks;
    if (task1.team_id !== task2.team_id) {
      return res.status(400).json({
        error: "Tasks must belong to the same team",
      });
    }

    // Check user permission
    const { data: teamMember } = await supabase
      .from("team_members")
      .select()
      .eq("team_id", task1.team_id)
      .eq("user_id", userId)
      .single();

    if (!teamMember || teamMember.role !== "admin") {
      return res.status(403).json({
        error: "Only team admins can manage task dependencies",
      });
    }

    // Add dependency
    const { error } = await supabase.from("task_dependencies").insert({
      task_id: taskId,
      dependent_task_id,
    });

    if (error) {
      if (error.code === "23505") {
        // Unique violation
        return res.status(400).json({
          error: "This dependency already exists",
        });
      }
      throw error;
    }

    res.json({
      message: "Task dependency added successfully",
    });
  } catch (error) {
    console.error("Add task dependency error:", error);
    res.status(500).json({
      error: error.message,
    });
  }
};

const removeTaskDependency = async (req, res) => {
  try {
    const { taskId, dependentTaskId } = req.params;
    const userId = req.user.id;

    // Get task to check team membership
    const { data: task } = await supabase
      .from("tasks")
      .select()
      .eq("id", taskId)
      .single();

    if (!task) {
      return res.status(404).json({
        error: "Task not found",
      });
    }

    // Check user permission
    const { data: teamMember } = await supabase
      .from("team_members")
      .select()
      .eq("team_id", task.team_id)
      .eq("user_id", userId)
      .single();

    if (!teamMember || teamMember.role !== "admin") {
      return res.status(403).json({
        error: "Only team admins can manage task dependencies",
      });
    }

    // Remove dependency
    const { error } = await supabase
      .from("task_dependencies")
      .delete()
      .eq("task_id", taskId)
      .eq("dependent_task_id", dependentTaskId);

    if (error) throw error;

    res.json({
      message: "Task dependency removed successfully",
    });
  } catch (error) {
    console.error("Remove task dependency error:", error);
    res.status(500).json({
      error: error.message,
    });
  }
};

const getTaskDependencies = async (req, res) => {
  try {
    const { taskId } = req.params;
    const userId = req.user.id;

    // Get task to check team membership
    const { data: task } = await supabase
      .from("tasks")
      .select()
      .eq("id", taskId)
      .single();

    if (!task) {
      return res.status(404).json({
        error: "Task not found",
      });
    }

    // Check user permission
    const { data: teamMember } = await supabase
      .from("team_members")
      .select()
      .eq("team_id", task.team_id)
      .eq("user_id", userId)
      .single();

    if (!teamMember) {
      return res.status(403).json({
        error: "You don't have access to this task",
      });
    }

    // Get dependencies
    const { data: dependencies, error } = await supabase
      .from("task_dependencies")
      .select(
        `
        dependent_task:tasks!task_dependencies_dependent_task_id_fkey(
          id,
          name,
          status,
          priority
        )
      `
      )
      .eq("task_id", taskId);

    if (error) throw error;

    res.json({
      data: dependencies,
    });
  } catch (error) {
    console.error("Get task dependencies error:", error);
    res.status(500).json({
      error: error.message,
    });
  }
};

module.exports = {
  createTask,
  updateTask,
  deleteTask,
  getTask,
  getTeamTasks,
  assignTask,
  updateTaskProgress,
  addTaskDependency,
  removeTaskDependency,
  getTaskDependencies,
};
