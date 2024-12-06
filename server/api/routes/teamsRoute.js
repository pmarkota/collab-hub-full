const express = require("express");
const router = express.Router();
const {
  createTeam,
  getUserTeams,
  addTeamMember,
  getTeamMembers,
  removeTeamMember,
  getTeam,
} = require("../controllers/teamsController");
const { authenticateToken } = require("../middleware/auth");

// All routes require authentication
router.use(authenticateToken);

// Create new team
router.post("/", createTeam);

// Get user's teams
router.get("/", getUserTeams);

// Add member to team
router.post("/:teamId/members", addTeamMember);

// Get team members
router.get("/:teamId/members", getTeamMembers);

// Remove member from team
router.delete("/:teamId/members/:memberId", removeTeamMember);

// Get team details
router.get("/:teamId", getTeam);

module.exports = router;
