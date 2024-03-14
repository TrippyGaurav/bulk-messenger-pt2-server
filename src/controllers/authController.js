const { pool } = require("../utlis/db");
const bcrypt = require("bcrypt");
const queries = require("../utlis/queries");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const checkTableExists = async (database) => {
  const query = `SELECT to_regclass('public.${database}')`;
  const { rows } = await pool.query(query);
  return rows[0].to_regclass !== null;
};

const checkKeyExist = async (key) => {
  const result = await pool.query("SELECT * FROM keys WHERE key = $1", [key]);
  if (result.rowCount === 0) {
    return false;
  }
  return true;
};

// Register User
const registerUser = async (req, res) => {
  const { username, name, password, role } = req.body;

  const errors = [];

  if (!username || !name || !password) {
    errors.push({ message: "Please enter all fields" });
  }

  if (password.length < 6) {
    errors.push({ message: "Password should be at least 6 characters" });
  }

  if (errors.length > 0) {
    return res.status(400).json({ errors });
  }

  const token = req.headers.authorization.split(" ")[1];

  try {
    if (role === "admin") {
      const keyExists = await checkKeyExist(token);

      if (!keyExists) {
        errors.push({ message: "Invalid key" });
        return res.status(401).json({ errors });
      }
    } else {
      const decodedToken = jwt.verify(token, process.env.JWT_SECRET_KEY);
      // Access the user information from the decoded token
      const userId = decodedToken.id;
      const username = decodedToken.username;
      const role = decodedToken.role;

      const checkForAdmin = await pool.query(queries.checkForAdmin, [username]);

      if (checkForAdmin.rows.length <= 0) {
        return res
          .status(401)
          .json({ success: false, message: "You are not an Admin" });
      }
    }

    const tableExists = await checkTableExists("users");

    if (!tableExists) {
      await pool.query(queries.createUsersTable);
    }

    const existingUser = await pool.query(queries.getUserByUsername, [
      username,
    ]);

    if (existingUser.rows.length > 0) {
      errors.push({ message: "Username already registered" });
      return res.status(400).json({ errors });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await pool.query(queries.addNewUser, [
      username,
      name,
      hashedPassword,
      "active",
      role,
    ]);

    return res.json({ success: true, message: "User registered successfully" });
  } catch (error) {
    console.log("Error registering user : ", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};

// Login
const loginUser = async (req, res) => {
  const { username, password } = req.body;
  console.log("Login : ", username, password);
  // Check if both username and password are provided
  if (!username || !password) {
    return res.status(400).json({
      success: false,
      message: "Please provide username and password",
    });
  }

  try {
    // Retrieve the user from the database based on the provided username
    const userResult = await pool.query(queries.getUserByUsername, [username]);
    const user = userResult.rows[0];

    // Check if the user exists
    if (!user) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid username or password" });
    }

    // Compare the provided password with the hashed password stored in the database
    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid username or password" });
    }

    // If the passwords match, create a JWT token
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET_KEY,
      { expiresIn: "1h" }
    );

    res.json({ success: true, message: "Login successful", token });
  } catch (error) {
    console.error("Error during login:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

// DELETE AGENTS
const deleteUsers = async (req, res) => {
  try {
    const token = req.headers.authorization.split(" ")[1];
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET_KEY);
    const admin = decodedToken.username;
    const usernameToDelete = req.params.username;

    console.log("Admin username:", admin);
    console.log("Username to delete:", usernameToDelete);

    const checkForAdmin = await pool.query(queries.checkForAdmin, [admin]);

    if (checkForAdmin.rows.length <= 0) {
      return res.status(401).json({
        success: false,
        message: "Only Admin can delete Agent's Account",
      });
    }

    if (usernameToDelete === admin) {
      return res
        .status(403)
        .json({ success: false, message: "Cannot delete own Admin account" });
    }

    const { rows } = await pool.query(queries.deleteAgent, [usernameToDelete]);

    if (rows.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    return res
      .status(201)
      .json({ success: true, message: "User deleted successfully" });
  } catch (error) {
    console.log("DELETE : ", error);
    return res
      .status(201)
      .json({ success: false, message: "Unable to delete user" });
  }
};

// UPDATE AGENTS
const updateUser = async (req, res) => {
  try {
    const token = req.headers.authorization.split(" ")[1];
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET_KEY);
    const admin = decodedToken.username;
    const usernameToUpdate = req.params.username;
    const { name, password, status } = req.body;

    console.log("Admin username:", admin);
    console.log("Username to update:", usernameToUpdate);

    // Check if the requester is an admin
    const checkForAdmin = await pool.query(queries.checkForAdmin, [admin]);

    if (checkForAdmin.rows.length === 0) {
      return res
        .status(401)
        .json({ success: false, message: "You are not an Admin" });
    }

    // Check if the admin is trying to update their own account
    if (usernameToUpdate === admin) {
      return res
        .status(403)
        .json({ success: false, message: "Cannot update own Admin account" });
    }

    // Check if the user to be updated exists
    const user = await pool.query(queries.checkUserExist, [usernameToUpdate]);

    if (user.rows.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    // Update user's name
    if (name) {
      await pool.query(queries.updateUserName, [name, usernameToUpdate]);
    }

    // Update user's password if a new password is provided
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);

      await pool.query(queries.updateUserPassword, [
        hashedPassword,
        usernameToUpdate,
      ]);
    }

    // Update user's status if a new status is provided
    if (status) {
      await pool.query(queries.updateUserStatus, [status, usernameToUpdate]);
    }

    return res
      .status(200)
      .json({ success: true, message: "User updated successfully" });
  } catch (error) {
    console.error("Error updating user:", error);
    return res
      .status(500)
      .json({ success: false, message: "Unable to update user" });
  }
};

// GET ALL USERS
const getAllUsers = async (req, res) => {
  try {
    const { rows } = await pool.query(queries.getAllUsers);
    return res.status(200).json({ success: true, users: rows });
  } catch (error) {
    console.log(error);
    return res
      .status(400)
      .json({ success: false, message: "Failed to get users" });
  }
};

// GET USER BY USERNAME
const getUserByUsername = async (req, res) => {
  try {
    const { username } = req.params;
    const { rows } = await pool.query(queries.getUserByUsername, [username]);
    return res.status(200).json({ success: true, users: rows });
  } catch (error) {
    console.log(error);
    return res
      .status(400)
      .json({ success: false, message: "Failed to get user" });
  }
};

// GET ALL AGENTS
const getAllAgents = async (req, res) => {
  try {
    const { rows } = await pool.query(queries.getAllAgents);
    return res.status(200).json({ success: true, users: rows });
  } catch (error) {
    console.log(error);
    return res
      .status(400)
      .json({ success: false, message: "Failed to get user" });
  }
};

// GET AGENT BY USERNAME
const getAgentByUsername = async (req, res) => {
  try {
    const { username } = req.params;
    const { rows } = await pool.query(queries.getAgentByUsername, [username]);
    return res.status(200).json({ success: true, users: rows });
  } catch (error) {
    console.log(error);
    return res
      .status(400)
      .json({ success: false, message: "Failed to get user" });
  }
};

module.exports = {
  registerUser,
  loginUser,
  deleteUsers,
  updateUser,
  getAllUsers,
  getUserByUsername,
  getAllAgents,
  getAgentByUsername,
};
