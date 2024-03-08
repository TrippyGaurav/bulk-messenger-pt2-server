const Pool = require("pg").Pool;

const pool = new Pool({
  user: "postgres",
  password: "9870",
  host: "localhost",
  database: "messenger",
});

module.exports = pool;
