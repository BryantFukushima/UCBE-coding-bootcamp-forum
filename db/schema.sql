CREATE DATABASE ucbe_forum_db

USE ucbe_forum_db

CREATE TABLE users (
    id INT AUTO_INCREMENT NOT NULL,
    user VARCHAR(45) NOT NULL,
    username VARCHAR(45) NOT NULL,
    password VARCHAR(45) NOT NULL,
    PRIMARY KEY (id)
);

CREATE TABLE posts (
    id INT AUTO_INCREMENT NOT NULL,
    user_id INT NOT NULL,
    date_posted VARCHAR(45) NOT NULL,
    title VARCHAR(45) NOT NULL,
    category VARCHAR(45) NOT NULL,
    post TEXT NOT NULL,
    PRIMARY KEY (id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE comments (
    id INT AUTO_INCREMENT NOT NULL,
    post_id INT NOT NULL,
    comment VARCHAR(45) NOT NULL,
    title VARCHAR(45) NOT NULL,
    category VARCHAR(45) NOT NULL,
    post TEXT NOT NULL,
    PRIMARY KEY (id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE likes (
    id INT AUTO_INCREMENT NOT NULL,
    user_id INT NOT NULL,
    table VARCHAR(45) NOT NULL,
    table_id INT NOT NULL,
    liked BOOLEAN NULL,
    PRIMARY KEY (id),
);

