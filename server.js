var mysql = require('mysql');
var inquirer = require('inquirer');
var express = require('express');
var app = express();
var bcrypt = require('bcryptjs');
var flash = require('req-flash');

//session stuff
    var cookieParser = require('cookie-parser');

    var session = require('express-session');

    //allow sessions
    app.use(session({ secret: 'app', cookie: { maxAge: 1*1000*60*60*24*365 }}));

    app.use(cookieParser());

//you need this to be able to process information sent to a POST route
    var bodyParser = require('body-parser');

    // parse application/x-www-form-urlencoded
    app.use(bodyParser.urlencoded({ extended: true }));

    // parse application/json
    app.use(bodyParser.json());

var path = require("path");
app.use(express.static("public"));

app.use(flash());

var connection = mysql.createConnection({
    host: "localhost",
    port: 3306,
    user: "root",
    password: "",
    database: "ucbe_forum_db"
});

// connection.connect(function(err) {
//     if (err) {
//         throw err;
//     } else {
//         console.log("connected as id " + connection.threadId + "\n");
//         newPost();
//     }
// });

// function newPost() {
//     inquirer.prompt([{
//         type: 'input',
//         message: 'Title: ',
//         name: 'title'
//     },
//     {
//         type: 'list',
//         message: 'Category: ',
//         choices: ['Javascript', 'HTML&CSS', 'MYSQL', 'Node.js', 'Bootstrap'],
//         name: 'category'
//     },
//     {
//         type: 'input',
//         message: 'Post: ',
//         name: 'post'
//     }
//     ]).then(function(inquirerResponse) {
//         console.log(inquirerResponse.title + inquirerResponse.category + inquirerResponse.post);
//         var newDate = new Date().toDateString();
//         var title = inquirerResponse.title;
//         var category = inquirerResponse.category;
//         var post = inquirerResponse.post;
//         var data = {
//             user_id: 2,
//             date_posted: newDate,
//             title: title,
//             category: category,
//             post: post
//         }
//         connection.query('INSERT INTO posts SET ?', data);
//         connection.query('SELECT title, category, post FROM posts', function(err, res) {
//             console.log(res[0]);
//         });
//     });
// };

app.get("/" , function(req,res) {
    res.send("hi");
})

app.get("/errors" , function(req,res) {
    res.send(req.flash());
});

app.post("/signing-in" , function(req,res) {
    if (req.body.user == "" || req.body.username == "" || req.body.password == "") {
        req.flash('errorM' , 'All Fields Required');
        res.redirect('/signup.html');
    } else {
        bcrypt.genSalt(10, function(err, salt) {
        // res.send(salt);
        bcrypt.hash(req.body.password, salt, function(err, p_hash) { 

            connection.query('INSERT INTO users (user, username, password) VALUES (?, ?, ?)', [req.body.user, req.body.username, p_hash],function (error, results, fields) {

                  if (error){
                    req.flash('errorM' , 'Username already taken');
                    res.redirect('/signup.html');
                  }else{
                    req.flash('errorM' , 'Sign Up Successful, please login to continue');
                    res.redirect('/login.html');
                  }
              
                });
            });
        });
    }
      
});

app.post("/logging-in" , function(req,res) {
    connection.query('SELECT * FROM users WHERE username = ?', [req.body.username],function (error, results, fields) {

      if (error) throw error;
      
      if (results.length == 0){
        req.flash('errorM' , 'Invalid Username');
        res.redirect("/login.html");
      } else {
        bcrypt.compare(req.body.password, results[0].password, function(err, result) {
            
            if (result == true){

              req.session.username = results[0].username;
              req.session.user= results[0].user;

              res.redirect("/another-page");

            } else {
                req.flash('errorM' , 'Incorrect Password');
                res.redirect("/login.html");
            }
        });
      }
    });
});

app.get('/another-page', function(req, res){
    var user_info = {
        user : req.session.user,
        username: req.session.username
    }

    res.json(user_info);
});

app.get('/logout', function(req, res){
    req.session.destroy(function(err){
        res.redirect('/login.html');
    })
});

app.listen(3000, function(){
    console.log("listening on 3000");
});