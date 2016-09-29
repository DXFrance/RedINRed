var express = require('express');
var app = express();

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
  Red.find().sort({_id:-1}).limit(3).exec(function(err, reds) {
    res.render('index', {reds: reds});
  });
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
      try {
        var happy = response[0]['scores']['happiness'];
      } catch (e) {
        var happy = 0;
      }
      client_face.face.detect({
          path: img_url,
          analyzesAge: true,
          analyzesGender: true
      }).then(function (response) {
          try {
            var age = response[0].faceAttributes.age;
            var gender = response[0].faceAttributes.gender;
          } catch (e) {
            var age = 0;
            var gender = "-";
          }
          client_vision.vision.analyzeImage({
              path: img_url,
              Description: true,
              Color: true
          }).then(function (response) {
            try {
              var color = response.color.dominantColors[0];
              var trust = response.description.captions[0].confidence;
              var trust_context = response.description.captions[0].text;
            } catch (e) {
              var color = "-";
              var trust = 0;
              var trust_context = 0;
            }
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

app.listen(process.env.PORT || 1337, function() {
  console.log('Listening on port' + process.env.PORT || 1337);
});
