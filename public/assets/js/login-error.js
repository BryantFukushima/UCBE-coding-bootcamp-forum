$.ajax({
	url: "/errors"
}).then(function(data) {
	var error = data.errorM;

	if (error != undefined) {
		var p = $('<p>');
		p.text(error);
		$('body').append(p);
	}
	
 	console.log(error);
});