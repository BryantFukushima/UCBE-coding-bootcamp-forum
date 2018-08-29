var mysql = require('mysql');
var express = require('express');
var app = express();
var bodyParser = require('body-parser');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

var path = require("path");

var connection = mysql.createConnection({
    host: "localhost",
    port: 3306,
    user: "root",
    password: "",
    database: "ucbe_forum_db"
});

app.use(express.static("public"));

app.get('/posts', function(req, res) {
    connection.query('SELECT title, category, post FROM posts', function(err, results, fields) {
        res.json(results);
    });
});

app.get('/comments', function(req, res) {
    connection.query('SELECT comment FROM comments', function(err, results, fields) {
        res.json(results);
    });
});


app.post('/createpost', function(req, res) {
    var title = req.body.title;
    var category = req.body.category;
    var post = req.body.post;
    var postData = {
        user_id: 2, 
        title: title,
        category: category,
        post: post
    };
    connection.query('INSERT INTO posts SET ?', postData, function(err, response) {
        res.redirect('/post.html');
    });
});

app.post('/createcomment', function(req, res) {
    var comment = req.body.comment;
    var commentData = {
        post_id: 3,
        comment: comment
    };
    connection.query('INSERT INTO comments SET ?', commentData, function(err, response) {
        res.redirect('/post.html');
    });
});

app.listen(3000, function() {
    console.log('listening on 3000')
});








