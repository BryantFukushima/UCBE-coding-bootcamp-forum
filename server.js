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

//Root page
app.get("/", function(req, res) {
    connection.query('SELECT * FROM posts LEFT JOIN likes ON posts.id = likes.type_id ORDER BY liked')
})

//Full Post Page route
app.get('/post/:id', function(req, res) {
    var postId = req.params.id;
    //selecting all from posts and comments db table
    connection.query('SELECT * FROM posts LEFT JOIN comments ON posts.id = comments.post_id WHERE posts.id = ?', postId, function(err, results, fields) {
        var postInfo = {
            user: req.session.user,
            post_id: req.params.id,
            title: results[0].title,
            category: results[0].category,
            post: results[0].post,
            comments: results
        }
        //Rendering Post.ejs page
        res.render('pages/post',
            postInfo);
    });
});

//Create Comment Form
app.post('/createcomment', function(req, res) {
    var comPId = req.body.post_id;
    var comment = req.body.comment;
    var commentData = {
        post_id: comPId,
        comment: comment
    };

    connection.query('INSERT INTO comments SET ?', commentData, function(err, response) {
        res.redirect('/post/' + comPId);
    });
});

//Create Post Page route
app.get('/newpost', function(req, res) {
    res.render('pages/newpost');
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
    //Insert a new post into posts db table
    connection.query('INSERT INTO posts SET ?', postData, function(err, response) {
        //Select the most recent post from posts db table
        connection.query('SELECT * FROM posts WHERE id = (SELECT MAX(id) FROM posts)', function(err, response) {
            //Redirecting page
            res.redirect('/post/' + response[0].id);
        });
    });
});

//Inserting likes
app.post('/likes', function(req, res) {
    var likeData = {
        user_id: req.session.ID,
        type: req.body.type,
        type_id: req.body.post_id,
        liked: req.body.like
    };
    //Insert a new like row in likes db table
    connection.query('INSERT INTO likes SET ?', likeData, function(err, response) {
        res.json(response);
    });
});

//Sign up route
app.get("/signup", function(req, res) {
    res.render('pages/signup', { err: req.flash() });
});

//Signup
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
                    res.redirect("/userpage");
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
app.get('/userpage', function(req, res) {
    var user_info = {
        user: req.session.user,
        username: req.session.username,
        avatar: req.session.avatar
    }
    res.render("pages/user", user_info)
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