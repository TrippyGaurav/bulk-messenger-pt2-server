const addMessage =
  "INSERT INTO messages (sent_to, message, status, sent_from, agent) VALUES($1, $2, $3, $4, $5) RETURNING sent_to, message, status";

const createMessageTable =
  "CREATE TABLE messages ( id SERIAL PRIMARY KEY, sent_to VARCHAR(255) NOT NULL, message TEXT NOT NULL, status VARCHAR(20) NOT NULL DEFAULT 'pending', created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, sent_from VARCHAR(255) NOT NULL, agent VARCHAR(255) NOT NULL REFERENCES users(username));";

const getAllMessages = "SELECT * FROM messages";

const createUsersTable =
  "CREATE TABLE users( id SERIAL NOT NULL, username VARCHAR(255) PRIMARY KEY, name VARCHAR(255) NOT NULL, password VARCHAR(255) NOT NULL, status VARCHAR(20) NOT NULL DEFAULT 'inactive', role VARCHAR(20) NOT NULL DEFAULT 'agent');";

const getUserByUsername = "SELECT * FROM users WHERE username = $1";

const addNewUser =
  "INSERT INTO users (username, name, password, status, role) VALUES($1, $2, $3, $4, $5) RETURNING username, password, role";

const createfacebookIdsTable =
  "CREATE TABLE facebook_Ids( id VARCHAR(255) PRIMARY KEY, assigned_to VARCHAR(255) NOT NULL REFERENCES users(username));";

const addFacebookId =
  "INSERT INTO facebook_Ids (id, assigned_to) VALUES($1, $2)";

module.exports = {
  addMessage,
  createMessageTable,
  getAllMessages,
  createUsersTable,
  getUserByUsername,
  addNewUser,
  addFacebookId,
  createfacebookIdsTable
};
