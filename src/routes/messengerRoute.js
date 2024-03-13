const express = require("express");
const {
  sendMessage,
  getAllMessages,
} = require("../controllers/messengerController");
const { registerUser, loginUser } = require("../controllers/authController");
const router = express.Router();

router.get("/", (req, res) => {
  res.status(200).send({ message: "I'm Bulk Messenger" });
});

router.post("/auth/register", registerUser);
router.post("/auth/login", loginUser);
router.post("/send", sendMessage);
router.get("/messages", getAllMessages);

module.exports = router;
