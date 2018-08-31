//posts ajax
$.ajax({
    url: '/posts',
    method: 'GET'
}).then(function(data) {
    var ob = data[data.length - 1];
    var p = $('<p>');
    p.html(ob.category + '<br>' + ob.title + '<br>' + ob.post);
    $('body').prepend(p);
});

//comments ajax
$.ajax({
    url: '/comments',
    method: 'GET'
}).then(function(data) {
    var commP;
    for (var i in data) {
        commP = $('<p>');
        commP.html(data[i].comment);
        $('body').append(commP);
    }
});

// //likes ajax
// $.ajax({
//   url: '/likes',
//   method: 'GET'
// }).then(function(data) {

// });