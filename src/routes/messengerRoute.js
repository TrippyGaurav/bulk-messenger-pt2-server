const express = require("express");
const {
  sendMessage,
  getAllMessages,
  getAllMessagesByUsername,
} = require("../controllers/messengerController");
const {
  registerUser,
  loginUser,
  deleteUsers,
  updateUser,
  getAllUsers,
  getUserByUsername,
  getAllAgents,
  getAgentByUsername,
} = require("../controllers/authController");
const { authenticate } = require("../middleware.js/middleware");
const router = express.Router();

router.get("/", (req, res) => {
  res.status(200).send({ message: "I'm Bulk Messenger" });
});

// LOGIN
router.post("/auth/users/login", loginUser);

// REGISTER
router.post("/auth/users/register", authenticate, registerUser);

// GET ALL USERS
router.get("/users", authenticate, getAllUsers);

// GET A USER BY USERNAME
router.get("/users/:username", authenticate, getUserByUsername);

// GET ALL AGENTS
router.get("/agents", authenticate, getAllAgents);

// GET AGENT BY USERNAME
router.get("/agents/:username", authenticate, getAgentByUsername);

// DELETE A USER BY USERNAME
router.delete("/users/:username", authenticate, deleteUsers);

// UPDATE A USER BY USERNAME
router.put("/users/:username", authenticate, updateUser);

// SEND A MESSAGE
router.post("/send", authenticate, sendMessage);

// GET ALL MESSAGES
router.get("/messages", authenticate, getAllMessages);

// GET ALL AGENT's MESSAGE
router.get("/messages/:agent", authenticate, getAllMessagesByUsername);

module.exports = router;
