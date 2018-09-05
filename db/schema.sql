CREATE DATABASE ucbe_forum_db;

USE ucbe_forum_db;

CREATE TABLE users(
    id INT AUTO_INCREMENT NOT NULL,
    user VARCHAR(45) NOT NULL,
    username VARCHAR(45) NOT NULL UNIQUE,
    password VARCHAR(100) NOT NULL,
    avatar INT DEFAULT 1,
    PRIMARY KEY (id)
);

CREATE TABLE posts(
    id INT AUTO_INCREMENT NOT NULL,
    user_id INT NOT NULL,
    tim TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    title VARCHAR(45) NOT NULL,
    category VARCHAR(45) NOT NULL,
    post TEXT NOT NULL,
    PRIMARY KEY (id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE comments(
    id INT AUTO_INCREMENT NOT NULL,
    user_id INT NOT NULL,
    post_id INT NOT NULL,
    tim TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    comment TEXT NOT NULL,
    PRIMARY KEY (id),
    FOREIGN KEY (post_id) REFERENCES posts(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE likes(
    id INT AUTO_INCREMENT NOT NULL,
    user_id INT NOT NULL,
    type VARCHAR(45) NOT NULL,
    type_id INT NOT NULL,
    liked BOOLEAN DEFAULT 0,
    PRIMARY KEY (id)
);