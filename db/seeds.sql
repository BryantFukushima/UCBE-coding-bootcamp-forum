SELECT posts.id, posts.title, posts.category, posts.tim, likes.type COUNT(likes.type_id) AS postlikes, users.user
FROM
    posts
    LEFT JOIN likes ON posts.id = likes.type_id
    LEFT JOIN users ON posts.user_id = users.id
    WHERE likes.type = "post" 
    GROUP BY posts.id;