var express = require('express');
var app = express();
var http = require('http').Server(app);
var path = require('path');
var request = require('request');
var twilio = require('twilio');
var client = twilio('SK785e306d6393a3447f7f79e7afb49e3e','397309ede524e8d035688035e9f4188a');
var notif;
var lastTime = Date.now()/1000;
var currentTime;

app.set('view engine', 'ejs');
app.set('views', __dirname + "/views");
app.use(express.static(path.join(__dirname, 'public')));
var bodyParser = require('body-parser')
app.use( bodyParser.json() );       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
  extended: true
})); 

var csrf;
var session;
var ds;

app.get('/', function(req, res){
  res.render('index');
});

app.post('/setup', function(req, res) {
  csrftoken = req.csrf;
  session = req.session;
  ds = req.ds;
});

app.post('/getsms', function(req, res) {
  for (key in req.body) {
    console.log('key: ' + key);
  }
  var twiml = new twilio.TwimlResponse();

  twiml.message('message received!');

  res.type('text/xml');
  res.send(twiml.toString());
});

function loop() {
  request.get({
    url: 'https://www.instagram.com/accounts/activity/?__a=1',
  }, function(error, response, body) {
    notif = JSON.parse(body).activityFeed.stories;
    currentTime = Date.now()/1000;
    console.log('\nretrieved json: ' + notif.length);
    console.log('current time: ' + currentTime);
  });
  
  for (i = 0; i < notif.length; i++) {

    if (notif[i].timestamp < lastTime) { break; } //if notification is too old, break

    if (notif[i].type != 5 && notif[i].type != 2) { continue; } //5: mentioned somewhere else, 2: own photo

    console.log('notification: ' + i);
    var text = '';
    var mediaID = '';
    var mediaCode = '';
    var username = '';

    //grab data
    try {
      text = notif[i].text;
      mediaID = notif[i].media.id;
      mediaCode = notif[i].media.code; //needed for headers
      username = notif[i].user.username;
    } catch (err) {
      console.log('error grabbing attributes: ' + err);
      continue;
    }

    //trims mediaID; posting an answer requires the part up to an underscore
    for (j = 0; j < mediaID.length; j++) { 
      if (mediaID.charAt(j) == '_') {
        mediaID = mediaID.slice(0, j);
      }
    }

    console.log('\ntext: ' + text);
    console.log('mediaID: '+ mediaID);
    console.log('mediaCode: ' + mediaCode);
    console.log('username: ' + username);

  }

  setTimeout(function() {
    loop();
  }, 10000);
}

var port = process.env.PORT || 8080;
app.listen(port, function() {
    console.log('Our app is running on http://localhost:' + port);
});