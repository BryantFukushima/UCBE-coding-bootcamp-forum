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

// SELECT posts.*, COUNT(comments.post_id) AS numb_comments, users.user FROM posts LEFT JOIN comments ON posts.id = comments.post_id LEFT JOIN users ON posts.user_id = users.id GROUP BY posts.id, comments.post_id;

// SELECT posts.id, posts.title, posts.category, posts.tim, likes.type, COUNT(likes.type_id) AS postlikes, users.user, COUNT(comments.post_id) FROM posts LEFT JOIN likes ON posts.id = likes.type_id LEFT JOIN users ON posts.user_id = users.id LEFT JOIN comments ON posts.id = comments.post_id WHERE likes.type = "post" GROUP BY posts.id;

//Root
app.get("/", function(req, res) {
    // sql to select and order posts based on # of likes
    connection.query('SELECT posts.id, posts.title, posts.category, posts.tim, COUNT(likes.liked) AS num_likes, users.username FROM posts LEFT JOIN likes ON posts.id = likes.type_id LEFT JOIN users ON posts.user_id = users.id WHERE likes.type = "post" OR posts.id > 0 GROUP BY posts.id ORDER BY posts.tim DESC;', function(err, results1, fields) {
        likesData = results1;
        connection.query('SELECT COUNT(comments.comment) AS num_comments FROM posts LEFT JOIN users ON posts.user_id = users.id LEFT JOIN comments ON posts.id = comments.post_id GROUP BY posts.id ORDER BY posts.tim DESC', function(err, results2, fields) {
            commentData = results2;
            var topHits = {
            posts: likesData,
            comments: commentData
        }
        res.render('pages/', topHits);
        // res.json(topHits);
        });
    });

});

//Full Post Page route
app.get('/post/:id', function(req, res) {
    var postId = req.params.id;
    connection.query('SELECT * FROM posts LEFT JOIN comments ON posts.id = comments.post_id WHERE posts.id = ?', postId, function(err, results, fields) {
        // res.json(results);
        var postInfo = {
            user: req.session.ID,
            post_id: postId,
            title: results[0].title,
            category: results[0].category,
            post: results[0].post,
            comments: results,
            loginErr: req.flash()
        }
        res.render('pages/post', postInfo);
        // res.json(req.session.username);
    });
});

//Create Comment Form
app.post('/createcomment', function(req, res) {
    var comPId = req.body.post_id;
    var comment = req.body.comment;
    if (req.session.username) {
        var commentData = {
            post_id: comPId,
            comment: comment
        };
        connection.query('INSERT INTO comments SET ?', commentData, function(err, response) {
            res.redirect('/post/' + comPId);
        });
    } else {
        req.flash("errLogin", "Please log in.");
        res.redirect('/post/' + comPId);
    }
});

//Create Post Page route
app.get('/newpost', function(req, res) {
    var userLogin;
    if (req.session.username) {
        userLogin = {
            loginErrPost: "",
            user_id: req.session.ID
        }
        res.render('pages/newpost', userLogin);
    } else {
        userLogin = {
            loginErrPost: "Login to create post.",
            user_id: req.session.ID
        }
        res.render('pages/newpost', userLogin);
    }

});

//Create Post Form
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
    connection.query('INSERT INTO posts SET ?', postData, function(err, response) {

        if (err) {
            req.flash("errLogin", "Please log in.");
            res.redirect('/newpost');
        } else {
            connection.query('SELECT * FROM posts WHERE id = (SELECT MAX(id) FROM posts)', function(err, response) {

                res.redirect('/post/' + response[0].id);

            });
        }
    });
});

//Inserting likes
app.post('/likes', function(req, res) {
    var likeData = {
        user_id: req.session.ID,
        type: req.body.type,
        type_id: req.body.type_id,
        liked: req.body.like
    };
    connection.query('INSERT INTO likes SET ?', likeData, function(err, response) {
        if (err) {
            req.flash("errLogin", "Please log in.");
            res.redirect("/post/" + req.body.post_id);
        } else {
            res.redirect("/post/" + req.body.post_id);
        }
    });
});

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
                    res.redirect("/userpage/" + req.session.ID);
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
app.get('/userpage/:user_id', function(req, res) {
    //sql to select users posts ordering by time posted
    // connection.query('SELECT likes.type, COUNT(likes.type_id) AS postlikes, posts.*, users.id, users.user FROM likes LEFT JOIN posts ON likes.type_id = posts.id LEFT JOIN users ON posts.user_id = users.id WHERE users.user = ? GROUP BY likes.type, posts.id ORDER BY posts.tim DESC', req.params.user, function(err, results, fields) {
    //     var user_info = {
    //         user: req.session.user,
    //         username: req.session.username,
    //         avatar: req.session.avatar,
    //         id: req.session.ID,
    //         userP: results
    //     }
    //     res.render("pages/user", user_info);
    // });

    connection.query('SELECT * FROM users WHERE users.id = ?' , req.params.user_id , function(err, results1, fields) {
               connection.query('SELECT SUM((liked=1)-(liked=0)) AS total, posts.* FROM likes RIGHT JOIN posts ON posts.id = likes.type_id AND likes.type = "post" WHERE posts.user_id = 2 GROUP BY posts.id ORDER BY posts.tim DESC' , req.params.user_id, function(err, results2, fields) {
                    var info = {
                        log_user: req.session.user,
                        user_info: results1[0],
                        posts: results2
                    }
                    res.render('pages/user' , info);
        });
    });
});

//change avatar
app.post('/newavatar' , function(req,res) {
    connection.query('UPDATE users SET ? WHERE ?',[ 
        {
            avatar: req.body.avatar
        },
        {
            id: req.body.user_id
        }] , function(err, results, fields) {
        res.redirect('/userpage/' + req.body.user_id);
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