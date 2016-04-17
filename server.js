var express = require('express');
var app = express();
var http = require('http').Server(app);
var path = require('path');
var request = require('request');
var twilio = require('twilio');
var client = twilio('ACe11fd22adcb53a74d88e7c28cd4846e7','66e16a7e5b56937320b571a15b5c61c5');
var notif;
var notifList = [];
var lastTime = Date.now()/1000;
var currentTime;
var jar = request.jar();
request = request.defaults({jar:jar});

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
var number;



app.get('/', function(req, res){
  res.render('index');
});

app.post('/setup', function(req, res) {
  csrf = req.body.csrf;
  session = req.body.session;
  ds = req.body.ds;
  
  jar.setCookie(request.cookie('ds_user_id=' + ds), 'https://www.instagram.com/');
  jar.setCookie(request.cookie('sessionid=' + session), 'https://www.instagram.com/');
  jar.setCookie(request.cookie('csrftoken=' + csrf), 'https://www.instagram.com/');
  
  number = req.body.number;
  loop();
  res.render('setup');
});

app.post('/getsms', function(req, res) {
  var bod = req.body.Body;
  console.log('text: ' + bod);
  var spl = bod.split(" ");
  console.log(spl);
  if (spl[0].toLowerCase() == "reply") {
    var ind = spl[1] - 1;
    request.post({
      url: 'https://www.instagram.com/web/comments/' + notifList[ind].mediaID + '/add/',
      headers: {referer: 'https://www.instagram.com/p/' + notifList[ind].mediaCode, 'x-csrftoken': csrf},
      formData: {comment_text: '@' + notifList[ind].username + ': ' +  bod.slice(spl[1].length + 6, bod.length - 1)}, //adding the username of the requester increases question variability which helps hide from the spam filter
    }, function(error, response, body) {
      console.log(body); //an HTML response is an error (redirects to error page), JSON is success!
    });
    
  }
  var twiml = new twilio.TwimlResponse();

  twiml.message('message successfully sent: ' + bod);

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
  
  
    for (i = 0; i < notif.length; i++) {

      if (notif[i].timestamp < lastTime) { break; } //if notification is too old, break

      if (notif[i].type != 5 && notif[i].type != 2) { continue; } //5: mentioned somewhere else, 2: own photo

      console.log('notification: ' + i);
      
      var text = notif[i].text;
      var mediaID = notif[i].media.id;
      var mediaCode = notif[i].media.code;
      var username = notif[i].user.username;
      
      console.log(text);
      console.log(mediaID);
      console.log(mediaCode);
      console.log(username);
      
      notifList.push({
        text: text,
        mediaID: mediaID,
        mediaCode: mediaCode,
        username: username
      });
      
      
      //trims mediaID; posting an answer requires the part up to an underscore
      for (j = 0; j < mediaID.length; j++) { 
        if (mediaID.charAt(j) == '_') {
          notifList[notifList.length-1].mediaID = mediaID.slice(0, j);
        }
      }


      //Send an SMS text message
      client.sendMessage({

        to: number, // Any number Twilio can deliver to
        from: '+16314173206', // A number you bought from Twilio and can use for outbound communication
        body: '\nComment #' + notifList.length + '\n\n' + username + ': ' + text + '\n\nType "reply [number] [comment]" to reply'  // body of the SMS message

      }, function(err, responseData) { //this function is executed when a response is received from Twilio

        if (!err) {
          console.log('error: ' + err);
        }
      });

    }
    lastTime = currentTime;
    setTimeout(function() {
      loop();
    }, 2000);
  });
}

var port = process.env.PORT || 8080;
app.listen(port, function() {
    console.log('Our app is running on http://localhost:' + port);
});