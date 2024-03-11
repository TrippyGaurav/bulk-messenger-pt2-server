CREATE DATABASE bulk_messenger;

CREATE TYPE message_status AS ENUM ('pending', 'success', 'failed');

CREATE TABLE users (
    user_id VARCHAR(255),
    message TEXT NOT NULL,
    status message_status NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
