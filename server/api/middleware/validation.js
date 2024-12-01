const validateTask = (req, res, next) => {
  const { name, team_id, priority, status } = req.body;

  if (!name || !team_id) {
    return res.status(400).json({
      error: "Name and team_id are required",
    });
  }

  const validPriorities = ["low", "medium", "high"];
  if (priority && !validPriorities.includes(priority)) {
    return res.status(400).json({
      error: "Priority must be one of: low, medium, high",
    });
  }

  const validStatuses = ["pending", "in_progress", "completed"];
  if (status && !validStatuses.includes(status)) {
    return res.status(400).json({
      error: "Status must be one of: pending, in_progress, completed",
    });
  }

  next();
};

const validateComment = (req, res, next) => {
  const { comment } = req.body;

  if (!comment) {
    return res.status(400).json({
      error: "Comment text is required",
    });
  }

  next();
};

module.exports = {
  validateTask,
  validateComment,
};
