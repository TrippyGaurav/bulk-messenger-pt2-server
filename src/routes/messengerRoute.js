const express = require("express");
const { sendMessage } = require("../controllers/messengerController");
const router = express.Router();

router.get("/", (req, res) => {
  res.status(200).send({ message: "I'm Bulk Messenger" });
});
router.post("/send", sendMessage);
module.exports = router;
