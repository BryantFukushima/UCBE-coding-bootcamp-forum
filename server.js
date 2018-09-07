var mysql = require('mysql');
var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var bcrypt = require('bcryptjs');
var flash = require('req-flash');
var path = require("path");

//Session Init
var cookieParser = require('cookie-parser');
var session = require('express-session');
//allow sessions
app.use(session({ secret: 'app', cookie: { maxAge: 1 * 1000 * 60 * 60 * 24 * 365 } }));
app.use(cookieParser());

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: true }));

// parse application/json
app.use(bodyParser.json());

//Allow redirect messages
app.use(flash());

//Public route
app.use(express.static("views"));

//View engine to ejs
app.set('view engine', 'ejs');

// mysql connection
var connection = mysql.createConnection({
    host: "localhost",
    port: 3306,
    user: "root",
    password: "",
    database: "ucbe_forum_db"
});

//Root
app.get("/", function(req, res) {
    // sql to select and order posts based on top likes
    connection.query('SELECT posts.*, SUM((liked=1)-(liked=0)) AS num_likes, users.username, total_comm FROM posts LEFT JOIN likes ON posts.id = likes.type_id LEFT JOIN users ON posts.user_id = users.id LEFT JOIN (SELECT posts.id, COUNT(comments.comment) AS total_comm FROM posts LEFT JOIN comments ON posts.id = comments.post_id GROUP BY posts.id) C ON posts.id = C.id WHERE likes.type = "post" OR likes.type IS NULL GROUP BY posts.id ORDER BY num_likes DESC', function(err, results, fields) {
        var topPosts = {
            user: req.session.user,
            username: req.session.username,
            posts: results,
        }
        res.render('pages/', topPosts);
        // res.json(topPosts);
    });
});

//Full Post Page route
app.get('/post/:id', function(req, res) {
    var postId = req.params.id;
    // selecting all from posts and its likes
    connection.query('SELECT posts.*, users.username, SUM((liked=1)-(liked=0)) AS total_likes FROM posts LEFT JOIN users ON posts.user_id = users.id LEFT JOIN likes ON posts.id = likes.type_id AND likes.type = "post" WHERE posts.id = ?', postId, function(err, postsResults, fields) {
        // selecting all comments and its likes
        connection.query('SELECT comments.*, users.username, SUM((liked=1)-(liked=0)) AS total_likes FROM comments LEFT JOIN users ON comments.user_id = users.id LEFT JOIN likes ON comments.id = likes.type_id AND likes.type = "comment" LEFT JOIN posts ON comments.post_id = posts.id WHERE posts.id = ? GROUP BY comments.id ORDER BY comments.tim DESC', postId, function(err, commResults, fields) {
            // selecting users likes for dynamic like/dislike (work in progress)
            connection.query('SELECT * FROM likes WHERE user_id = ?', req.session.ID, function(err, likesResults, fields) {
                var postInfo = {
                    user: req.session.user,
                    username: req.session.username,
                    posts: postsResults,
                    comments: commResults,
                    likes: likesResults,
                    loginErr: req.flash()
                };
                // res.render('pages/post', postInfo);
                res.json(likesResults.length);
            });
        });
    });
});

//Create Comment Form
app.post('/createcomment', function(req, res) {
    var comPId = req.body.post_id;
    var comment = req.body.comment;
    // if logged in
    if (req.session.username) {
        var commentData = {
            user_Id: req.session.ID,
            post_id: comPId,
            comment: comment
        };
        // if there's a comment
        if (comment.length > 0) {
            // inserting into comments table
            connection.query('INSERT INTO comments SET ?', commentData, function(err, response) {
                res.redirect('/post/' + comPId);
            });
        // if no comment
        } else {
            req.flash("commErr", "Don't forget to write your comment");
            res.redirect('/post/' + comPId);
        }
    // if not logged in
    } else {
        req.flash("errLogin", "Please log in.");
        res.redirect('/post/' + comPId);
    }
});

//Create New Post Page
app.get('/newpost', function(req, res) {
    var userLogin = {
        loginErrPost: "",
        postErr: req.flash(),
        user_id: req.session.ID,
        user: req.session.user,
        username: req.session.username
    }
    res.render('pages/newpost', userLogin);
});

//Create New Post Form Route
app.post('/createpost', function(req, res) {
    var title = req.body.title;
    var category = req.body.category;
    var post = req.body.post;
    var postData = {
        user_id: req.session.ID,
        title: title,
        category: category,
        post: post
    };
    // if title and textarea has something
    if (title.length > 0 && post.length > 0) {
        //Insert a new post into posts table
        connection.query('INSERT INTO posts SET ?', postData, function(err, response) {
            // err msg if not logged in
            if (err) {
                req.flash("errLogin", "Please log in.");
                res.redirect('/newpost');
            // selecting most recent post and redirecting page
            } else {
                connection.query('SELECT * FROM posts WHERE id = ( SELECT MAX(id) FROM posts)', function(err, response) {
                    res.redirect('/post/' + response[0].id);
                });
            }
        });
    // if title and textarea does not have something
    } else {
        req.flash("postErr", "Please enter all fields");
        res.redirect('/newpost')
    }
});

//Inserting likes
app.post('/likes', function(req, res) {
    var likeData = {
        user_id: req.session.ID,
        type: req.body.type,
        type_id: req.body.type_id,
        liked: req.body.like
    };
    //Insert a new like row in likes db table
    connection.query('INSERT INTO likes SET ?', likeData, function(err, response) {
        if (err) {
            req.flash("errLogin", "Please log in.");
            res.redirect("/post/" + req.body.post_id);
        } else {
            res.redirect("/post/" + req.body.post_id);
        }
    });
});

// //Search Bar (work in progress)
// app.post('/search', function(req, rest) {
//     var input = req.body.input;
//     var inputSplit = input.split(' ');
//     console.log(inputSplit);
// });

//Signup route
app.get("/signup", function(req, res) {
    res.render('pages/signup', { err: req.flash() });
});

//Signup field
app.post("/signing-in", function(req, res) {

    //missing field
    if (req.body.user == "" || req.body.username == "" || req.body.password == "") {
        req.flash('errorM', 'All Fields Required');
        res.redirect('/signup');
    } else {
        bcrypt.genSalt(10, function(err, salt) {
            bcrypt.hash(req.body.password, salt, function(err, p_hash) {
                connection.query('INSERT INTO users (user, username, password) VALUES (?, ?, ?)', [req.body.user, req.body.username, p_hash], function(error, results, fields) {

                    //username availability check
                    if (error) {
                        req.flash('errorM', 'Username already taken');
                        res.redirect('/signup');
                    } else {
                        login(req, res);
                    }
                });
            });
        });
    }
});

//Log In
app.get("/login", function(req, res) {
    res.render('pages/login', { err: req.flash() });
});

app.post("/logging-in", function(req, res) {
    login(req, res);
});

function login(req, res) {
    connection.query('SELECT * FROM users WHERE username = ?', [req.body.username], function(error, results, fields) {

        if (error) throw error;

        //username check
        if (results.length == 0) {
            req.flash('errorM', 'Invalid Username/Password');
            res.redirect("/login");
        } else {
            bcrypt.compare(req.body.password, results[0].password, function(err, result) {

                //successful login
                if (result == true) {
                    req.session.username = results[0].username;
                    req.session.user = results[0].user;
                    req.session.avatar = results[0].avatar;
                    req.session.ID = results[0].id;
                    res.redirect("/userpage/" + req.session.username);
                } else {

                    //incorrect password
                    req.flash('errorM', 'Incorrect Password');
                    res.redirect("/login");
                }
            });
        }
    });
}

//User Profile Page
app.get('/userpage/:user', function(req, res) {
    //sql to select users posts ordering by time posted
    connection.query('SELECT posts.id, posts.title, posts.category, posts.tim, COUNT(likes.liked) AS num_likes, users.username FROM posts LEFT JOIN likes ON posts.id = likes.type_id LEFT JOIN users ON posts.user_id = users.id WHERE users.username = ? AND (likes.type = "post" OR likes.type IS NULL) GROUP BY posts.id ORDER BY posts.tim DESC;', req.params.user, function(err, results1, fields) {
        userP = results1;
        //sql to select and display number of comments 
        connection.query('SELECT COUNT(comments.comment) AS num_comments FROM posts LEFT JOIN users ON posts.user_id = users.id LEFT JOIN comments ON posts.id = comments.post_id WHERE users.username = ? GROUP BY posts.id ORDER BY posts.tim DESC', req.params.user, function(err, results2, fields) {
            userC = results2;
            var user_info = {
                user: req.session.user,
                username: req.session.username,
                avatar: req.session.avatar,
                id: req.session.ID,
                userP: userP,
                comments: userC
            }
            res.render("pages/user", user_info);
            // res.json(user_info);
        });
    });
});

//Session Logout
app.get('/logout', function(req, res) {
    req.session.destroy(function(err) {
        res.redirect('/login');
    })
});

app.listen(3000, function() {
    console.log("listening on 3000");
});