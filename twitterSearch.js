//TO DO: enable the following options:
// 		- number of results per page
//		- language of results (all/EN/FR/DE/JP/CN/...)
//		- type of results (recent/popular/mixed)

var g_frameHeight = 250;
var g_frameWidth = 550;

var LOADING_URL = chrome.extension.getURL('img/load_anim.gif');
var BIRD_URL = chrome.extension.getURL('img/bird_16_blue.png');
var LOGO_URL = chrome.extension.getURL('img/logo_twitter_withbird_1000_allblue.png');
var FAVORITE_URL = chrome.extension.getURL('img/favorite_hover.png');
var RETWEET_URL = chrome.extension.getURL('img/retweet_hover.png');
var REPLY_URL = chrome.extension.getURL('img/reply_hover.png');

var SIGNATURE = 'TWEET_SEARCH';
var PADDING_LEFT = 10;
var PADDING_RIGHT = 0;
var PADDING_TOP = 5;
var PADDING_BOTTOM = 15;

var TWEET_HEAD = 'xyztshead';
var TWEET_CLASS = 'xyztstweet';
var TWEET_AVATAR = 'xyztsavatar';
var TWEET_USERNAME = 'xyztsusername';
var TWEET_FULLNAME = 'xyztsfullname';
var TWEET_UNDER = 'xyztsundertweet';
var TWEET_MAIN = 'xyztstweetmain';

var options = {
    hotkey: 'Alt',
    language: 'all',
    result_type: 'mixed',
    numtweets: '20'
};

function loadOptions() {
var ua = navigator.userAgent.toLowerCase();
if (ua.indexOf("mac") != -1) {
   options['hotkey'] = 'Command';
}
    for(var optionName in options) {
	getOptionFromStorage(optionName);
    }

};

function getOptionFromStorage(option) {
    chrome.extension.sendRequest({method: "getOption", theOption: option}, function(response) {
    if(response.status == "success") options[option] = response.optionVal;
});
};

String.prototype.trunc = function(n){
  return this.substr(0,n-1)+(this.length>n?'...':'');
};

String.prototype.preprocess = function(){
  return this.replace('#','%23');
};

function run() {
    loadOptions();
  window.addEventListener('keydown', onKeyPress, false);
  setTimeout(function() {
      window.addEventListener('mouseup', onClick, false);
    }, 100);
}

function onClick(e) {
  var is_inside = isInside(e);
  if (!is_inside) removeFrame();
    var hotkey =options.hotkey;
  if (checkHotKey(hotkey, e)) {
    var searchTerm = String(getSelection());
    searchTerm = searchTerm.replace(/^\s+|\s+$/g, ''); //remove leading and trailing whitespace
    if (searchTerm != '') {
      createFrame(searchTerm, e);
    }
    e.preventDefault();
  }
}

function onKeyPress(e) {
  if (e.keyCode == 27) {
    removeFrame();
    return;
  }
}
 
function createFrame(searchTerm, e) {
  // If an old frame still exists, wait until it is killed.
  var frame_ref = document.getElementById(SIGNATURE); //TO DO: need to define SIGNATURE at the beginning
  if (frame_ref) {
    if (frame_ref.style.opacity == 1) removeFrame();
    setTimeout(function() {createPopup(searchTerm, e);}, 50);
    return;
  }
  // Create the frame, set its id and insert it.
  var frame = document.createElement('div');
  
  frame.id = SIGNATURE;
  // Unique class to differentiate between frame instances.
  frame.className = SIGNATURE + (new Date()).getTime();
  document.body.appendChild(frame);
  var searchTerm_p = searchTerm.preprocess();
    var url = "http://search.twitter.com/search.json?q=" + searchTerm_p + "&rpp=" + options["numtweets"]
	+ "&include_entities=true&result_type="+options["result_type"] +(options["language"] == "all" ? "" : "&lang="+options["language"]);
  var xhr = new XMLHttpRequest();
  xhr.onreadystatechange = function() {
    if (xhr.readyState == 4) {
      var response = xhr.responseText;
      if (response != null) {
	var wrapper = document.createElement('div');
 
	wrapper.innerHTML = generateHtml(searchTerm, JSON.parse(response)); // this will have to be customised
	for (var i = 0; i < wrapper.childNodes.length; i++) {
	  frame.appendChild(wrapper.childNodes[i]);
	}
      }
    }
  };
  xhr.open('GET', url, true);
  xhr.send();   
  var x = e.pageX;
  var y = e.pageY;
  var clientX = e.clientX;
  var clientY = e.clientY;
  var window_width = window.innerWidth;
  var window_height = window.innerHeight;
  var frame_width = PADDING_LEFT + g_frameWidth + PADDING_RIGHT;
  var frame_height = PADDING_TOP + g_frameHeight + PADDING_BOTTOM;
  var top = 0;
  var left = 0;
  var zoom = getZoom();

  if (clientX + frame_width * zoom >= window.innerWidth) {
    left = x / zoom - frame_width;
    if (left < 0) left = 5;
  } else {
    left = x / zoom;
  }
  var y_new = y + 3;
  var clientY_new = clientY + 5;
  if (clientY_new + frame_height * zoom >= window.innerHeight) {
    top = (y - 3) / zoom - frame_height;
    if (top < 0) top = 5;
  } else {
    top = y_new / zoom;
  }

  // Set frame style.
  frame.style.position = 'absolute';
  frame.style.left = left + 'px';
  frame.style.top = top + 'px';
  frame.style.width = g_frameWidth + 'px';
  frame.style.height = g_frameHeight + 'px';
  frame.style.background = 'white url("' + LOADING_URL + '") center no-repeat !important';
  frame.style.zIndex = 65000;

  // Initiate the fade-in animation in after 100 milliseconds.
  // Setting it now will not trigger the CSS3 animation sequence.
  setTimeout(function() {
      frame.style.opacity = 1;
    }, 100);

}

function isInside(e) {
  frame_ref = document.getElementById(SIGNATURE);
  if (frame_ref) {
    var x, y;
    if (frame_ref.style.position == 'absolute') {
      x = e.pageX;
      y = e.pageY;
    } else if (frame_ref.style.position == 'fixed') {
      x = e.clientX;
      y = e.clientY;
    }

    var zoom = getZoom();
    x /= zoom;
    y /= zoom;

    if (x >= frame_ref.offsetLeft &&
        x <= frame_ref.offsetLeft + frame_ref.offsetWidth &&
        y >= frame_ref.offsetTop &&
        y <= frame_ref.offsetTop + frame_ref.offsetHeight) {
      return true;
    }
  }

  return false;
}

function removeFrame() {
  var frame_ref = document.getElementById(SIGNATURE);
  var frame_class = frame_ref ? frame_ref.className : null;

  if (frame_ref) {
    frame_ref.style.opacity = 0;
    setTimeout(function() {
	var frame_ref = document.getElementById(SIGNATURE);
	if (frame_ref && frame_ref.className == frame_class) {
	  document.body.removeChild(frame_ref);
	}
      }, 400);
  }
}

Date.prototype.time_ago_in_words = function() {
  var words;
  distance_in_milliseconds = new Date() - this;
  distance_in_minutes = Math.round(  Math.abs(distance_in_milliseconds / 60000)  );

  if (distance_in_minutes == 0) {
    words = "less than a minute";
  } else if (distance_in_minutes == 1) {
    words = "1 minute";
  } else if (distance_in_minutes < 45) {
    words = distance_in_minutes + " minutes";
  } else if (distance_in_minutes < 90) {
    words = "about 1 hour";
  } else if (distance_in_minutes < 1440) {
    words = "about " + Math.round(distance_in_minutes / 60) + " hours";
  } else if (distance_in_minutes < 2160) {
    words = "about 1 day";
  } else if (distance_in_minutes < 43200) {
    words = Math.round(distance_in_minutes / 1440) + " days";
  } else if (distance_in_minutes < 86400) {
    words = "about 1 month";
  } else if (distance_in_minutes < 525600) {
    words = Math.round(distance_in_minutes / 43200) + " months";
  } else if (distance_in_minutes < 1051200) {
    words = "about 1 year";
  } else {
    words = "over " + Math.round(distance_in_minutes / 525600) + " years";
  }

  return words;
};

function generateHtml(searchTerm, results_json) {
	
  function  reformatMessageText(text) {
    text = text.replace('&amp;', '&');
  	
    var link_regex = new RegExp("(([a-zA-Z]+:\/\/)([a-z][a-z0-9_\..-]*[a-z]{2,6})([a-zA-Z0-9\/*-_\?&%]*))", "i");
    text = text.replace(link_regex, '<a href="$1">$1</a>');
  	
    var reply_regex = new RegExp("@([a-zA-Z0-9_]+)", "g");
    text = text.replace(reply_regex, '@<a href="http://twitter.com/$1">$1</a>');	
    
    
    var hashtag_regex = new RegExp("#([a-zA-Z0-9_]+)", "g");
    text = text.replace(hashtag_regex, '#<a href="http://twitter.com/#!/search/%23$1">$1</a>');
    return(text); 
  }
  var buffer = [];
  buffer.push('<div class="' + TWEET_CLASS + '_cont">');
  buffer.push('<div style="display: table; width: 100%;">');
 
  buffer.push('<li class="'+ TWEET_HEAD + '"><div class="xyztsheadinside"><span class="' + TWEET_HEAD + '"><img class="' + TWEET_HEAD
	      + '" src="' + LOGO_URL +'""/> search results for <em>' + searchTerm.trunc(20) + '</em></span></div></li>');
 
  for(var i=0; i<results_json.results.length; i++) {
    var result    = results_json.results[i];
    var text      = reformatMessageText(result.text);
    var date      = new Date(result.created_at);
    var tweet_id = result.id_str;
    var tweetlist = '<li class="'+ TWEET_CLASS + '"> <a href="http://twitter.com/'+result.from_user+'"><img class="'+TWEET_AVATAR+'" src="'+result.profile_image_url
      + '"/></a><div class="' + TWEET_MAIN + '"><span style="color:blue"` class="'+TWEET_USERNAME+'"><a href="http://twitter.com/'+result.from_user+'">' +result.from_user_name+'</a></span> <span class="'
      + TWEET_FULLNAME+'">'+result.from_user + '</span>'
      + '<br/>' + text
      + '<br/><span class="' + TWEET_UNDER +'">'
      + '<img class="'+ TWEET_UNDER + '" src="'+BIRD_URL+'"/>' + date.time_ago_in_words()
      + ' ago <a target="_blank" href="https://twitter.com/intent/tweet?in_reply_to='+ tweet_id + '"><img class="'+ TWEET_UNDER + '" src="'+REPLY_URL+'"/> Reply</a>'
      + ' <a href="https://twitter.com/intent/retweet?tweet_id='+tweet_id+'"><img class="'+ TWEET_UNDER + '" src="' + RETWEET_URL + '"/> Retweet</a>'
      + ' <a href="https://twitter.com/intent/retweet?tweet_id='+tweet_id+'"><img class="' + TWEET_UNDER + '" src="'+FAVORITE_URL+'"/> Favorite</a></span></div></li>';
    buffer.push(tweetlist)
      }
  buffer.push('</div>');
  buffer.push('</div>');    
  return buffer.join('');  
}

function getZoom() {
  var zoom = document.defaultView.getComputedStyle(document.body, null).getPropertyValue('zoom');
  return parseFloat(zoom || '0');
}

function checkHotKey(key, e) {
  switch (key) {
  case 'Control':
    return e.ctrlKey;
  case 'Alt':
    return e.altKey;
  case 'Command':
    return e.metaKey;
  default:
    return false;
  }
}

run();
