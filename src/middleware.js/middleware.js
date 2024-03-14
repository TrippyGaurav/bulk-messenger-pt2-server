const { pool } = require("../utlis/db");
const queries = require("../utlis/queries");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const authenticate = async (req, res, next) => {
  try {
    if (!req.headers.authorization) {
      return res.status(401).json({
        success: false,
        message: "Authorization token is missing.",
      });
    }

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Something went wrong with Authorization token",
    });
  }
};



module.exports = { authenticate };
