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

  try {
    if (role === "admin") {
      if (!req.headers.authorization) {
        errors.push({ message: "Authorization token is missing" });
        return res.status(401).json({ errors });
      }

      const token = req.headers.authorization.split(" ")[1];
      const keyExists = await checkKeyExist(token);

      if (!keyExists) {
        errors.push({ message: "Invalid key" });
        return res.status(401).json({ errors });
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

    return res.json({ message: "User registered successfully" });
  } catch (error) {
    console.log("Error registering user : ", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

// Login
const loginUser = async (req, res) => {
  const { username, password } = req.body;
  console.log("Login : ", username, password);
  // Check if both username and password are provided
  if (!username || !password) {
    return res
      .status(400)
      .json({ message: "Please provide username and password" });
  }

  try {
    // Retrieve the user from the database based on the provided username
    const userResult = await pool.query(queries.getUserByUsername, [username]);
    const user = userResult.rows[0];

    // Check if the user exists
    if (!user) {
      return res.status(401).json({ message: "Invalid username or password" });
    }

    // Compare the provided password with the hashed password stored in the database
    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.status(401).json({ message: "Invalid username or password" });
    }

    // If the passwords match, create a JWT token
    const token = jwt.sign(
      { id: user.id, username: user.username },
      process.env.JWT_SECRET_KEY,
      { expiresIn: "1h" }
    );

    // If the passwords match, you can create a session for the user or return a token for authentication
    // For example, you can use JSON Web Tokens (JWT) for authentication

    // Here, you can create a JWT token and send it back to the client for authentication

    res.json({ message: "Login successful", token });
  } catch (error) {
    console.error("Error during login:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

module.exports = { registerUser, loginUser };
