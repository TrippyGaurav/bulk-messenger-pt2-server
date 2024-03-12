CREATE DATABASE bulk_messenger;

CREATE TYPE message_status AS ENUM ('pending', 'success', 'failed');

CREATE TABLE messages (
    id SERIAL PRIMARY KEY,
    sent_to VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    sent_from VARCHAR(255) NOT NULL,
    agent VARCHAR(255) NOT NULL REFERENCES users(username)
);


CREATE TABLE users(
    id SERIAL,
    username VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(255) NOT NULL DEFAULT 'agent'
);


SELECT EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'users'
);


