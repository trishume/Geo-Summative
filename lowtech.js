function loadBottomText(file) {
	//$("#pagetext").load('pages/' + file + '.html');
	$("#pagetext").fadeOut("fast",function() {
		$("#pagetext").load('http://tristan.hume.ca/geosummative/pages/' + file + '.html?rand=' + Math.random(),function(){
			$("#pagetext").fadeIn('fast');
		})
	});
}