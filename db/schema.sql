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
    post_id INT NOT NULL,
    tim TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    comment TEXT NOT NULL,
    PRIMARY KEY (id),
    FOREIGN KEY (post_id) REFERENCES posts(id)
);

CREATE TABLE likes(
    id INT AUTO_INCREMENT NOT NULL,
    user_id INT NOT NULL,
    type VARCHAR(45) NOT NULL,
    type_id INT NOT NULL,
    liked BOOLEAN DEFAULT 0,
    PRIMARY KEY (id)
);



-- SELECT posts.id, posts.title, posts.category, posts.tim, users.user, COUNT(comments.comment) AS num_comments, COUNT(likes.liked) AS num_likes FROM posts LEFT JOIN users ON posts.user_id = users.id LEFT JOIN comments ON posts.id = comments.post_id LEFT JOIN likes ON posts.id = likes.type_id WHERE likes.type = "post" GROUP BY posts.id;




-- SELECT posts.id, posts.title, posts.category, posts.tim, users.user, comments.comment, likes.liked FROM posts LEFT JOIN users ON posts.user_id = users.id LEFT JOIN comments ON posts.id = comments.post_id LEFT JOIN likes ON posts.id = likes.type_id WHERE likes.type = "post";