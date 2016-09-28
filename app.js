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
  fs.writeFile("./public/photos/" + id + ".png", snap, 'base64', function() {
    console.log('http://b6646032.ngrok.io/photos/' + id + '.png');
    var api_emotion = request('POST', 'https://api.projectoxford.ai/emotion/v1.0/recognize', {
        json: { url: 'https://sec.ch9.ms/ch9/b4c5/2da38755-aaee-4ab3-afbb-9ef60112b4c5/BTCScottGuthrie_512_ch9.jpg' },
        headers: {
            'Content-Type': 'application/json',
            'Ocp-Apim-Subscription-Key': '61b5012e969d43fca126a7f062e179d0'
        }
    });

    var data_emotion = JSON.parse(api_emotion.getBody('utf8'))[0]['scores']['happiness'];

    console.log(data_emotion);

    var red = {
      trust: 78,
      gender: 'Male',
      age: 24,
      color: 'Blue',
      happy: 20
    };

    res.json(red);

    red.img = snap;

    var new_red = new Red(red);
    new_red.save();
  });
});

server.listen(1337, function() {
  console.log('Listening on port 1337...');
});

io.on('connection', function (socket) {
  //SOCKET IO
});
