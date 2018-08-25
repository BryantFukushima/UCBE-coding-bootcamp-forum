var mysql = require('mysql');
var inquirer = require('inquirer');

var connection = mysql.createConnection({
    host: "localhost",
    port: 3306,
    user: "root",
    password: "",
    database: "ucbe_forum_db"
});

connection.connect(function(err) {
    if (err) {
        throw err;
    } else {
        console.log("connected as id " + connection.threadId + "\n");
        newPost();
    }
});

function newPost() {
    inquirer.prompt([{
        type: 'input',
        message: 'Title: ',
        name: 'title'
    },
    {
        type: 'list',
        message: 'Category: ',
        choices: ['Javascript', 'HTML&CSS', 'MYSQL', 'Node.js', 'Bootstrap'],
        name: 'category'
    },
    {
        type: 'input',
        message: 'Post: ',
        name: 'post'
    }
    ]).then(function(inquirerResponse) {
        console.log(inquirerResponse.title + inquirerResponse.category + inquirerResponse.post);
        var newDate = new Date().toDateString();
        var title = inquirerResponse.title;
        var category = inquirerResponse.category;
        var post = inquirerResponse.post;
        var data = {
            user_id: 2,
            date_posted: newDate,
            title: title,
            category: category,
            post: post
        }
        connection.query('INSERT INTO posts SET ?', data);
        connection.query('SELECT title, category, post FROM posts', function(err, res) {
            console.log(res[0]);
        });
    });
};













