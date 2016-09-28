var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);

var fs = require('fs');
var request = require('sync-request');
var shortid = require('shortid');
var bodyParser = require('body-parser');

var config = JSON.parse(fs.readFileSync('config.json'));

var mongoose = require('mongoose');
mongoose.connect(config.mongo);

var Red = require('./models/red');

var oxford = require('project-oxford');
var client_emotion = new oxford.Client(config.oxford_emotion);
var client_face = new oxford.Client(config.oxford_face);
var client_vision = new oxford.Client(config.oxford_vision);

app.use(bodyParser({limit: '5000mb'}));
app.set('view engine', 'ejs');
app.use(express.static('public'));

app.get('/', function(req, res) {
  res.render('index');
});

app.post('/snap', function(req, res) {
  console.log('NEW SNAP');
  var snap = req.body.snap.replace(/^data:image\/png;base64,/, "");
  var id = shortid.generate();
  var img_url = "./public/photos/" + id + ".png";
  fs.writeFile(img_url, snap, 'base64', function() {
    client_emotion.emotion.analyzeEmotion({
      path: img_url
    }).then(function (response) {
      var happy = (typeof response[0]['scores']['happiness'] !== "undefined") ? response[0]['scores']['happiness'] : 0;
      client_face.face.detect({
          path: img_url,
          analyzesAge: true,
          analyzesGender: true
      }).then(function (response) {
          var age = (typeof response[0].faceAttributes.age !== "undefined") ? response[0].faceAttributes.age : 0;
          var gender = (typeof response[0].faceAttributes.gender !== "undefined") ? response[0].faceAttributes.gender : "-";
          client_vision.vision.analyzeImage({
              path: img_url,
              Description: true,
              Color: true
          }).then(function (response) {
              var color = (typeof response.color.dominantColors[0] !== "undefined") ? response.color.dominantColors[0] : "-" ;
              var trust = (typeof response.description.captions[0].confidence !== "undefined") ? response.description.captions[0].confidence : 0;
              var trust_context = (typeof response.description.captions[0].text !== "undefined") ? response.description.captions[0].text : 0;
              var red = {
                trust: trust,
                trust_context: trust_context,
                gender: gender,
                age: age,
                color: color,
                happy: happy
              };
              res.json(red);
              red.img = img_url;
              var new_red = new Red(red);
              new_red.save();
          });
      });
    });
  });
});

server.listen(process.env.PORT || 1337, function() {
  console.log('Listening on port' + process.env.PORT || 1337);
});
