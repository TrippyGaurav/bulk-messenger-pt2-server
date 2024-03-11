const { Pool } = require("pg");
const pool = require("../utlis/db");
const bcrypt = require("bcrypt");

const registerUser = async (req, res) => {
  const { username, password, role } = req.body;
  console.log(req.body);
  try {
    
    res.status(201).json("Agent registered successfully");
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Login
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }
    const agent = await userModule.Agent.findOne({ email });
    if (!agent) {
      return res.status(401).json({ error: "Invalid email or password" });
    }
    const isPasswordValid = await agent.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: "Invalid email or password" });
    }
    const token = jwt.sign({ _id: agent._id }, process.env.JWT_SECRET_KEY, {});
    res.status(200).json({ token, agentName: agent.name, id: agent._id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { registerUser, loginUser };
