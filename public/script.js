$(document).ready(function() {
  var is_rec = false;
  var is_http = false;

  var canvas = document.getElementById('canvas');
  var context = canvas.getContext('2d');
  var video = document.getElementById('video');

  var snap = new Audio('/snap.wav');
  var resize = function() {
    $('.video-wrapper').css('height', $('.video-wrapper').width());
    canvas.width = $('.video-wrapper').width();
    canvas.height = $('.video-wrapper').height();
  };
  resize();
  $(window).on('resize', resize);

  if(navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
    navigator.mediaDevices.getUserMedia({ video: true }).then(function(stream) {
        video.src = window.URL.createObjectURL(stream);
        video.play();
    });
  }

  $('.control').click(function() {
    if (is_http) {
      return;
    }
    if (!is_rec) {
      $('.scott').fadeOut();
      $('.control').attr('src', '/img/rec.png');
      is_rec = true;
    } else {
      context.drawImage(video, 0, 0, $('.video-wrapper').width(), $('.video-wrapper').height());
      //TODO To fix later (w/h)
      var url_b64 = canvas.toDataURL();
      is_http = true;
      $('canvas').fadeIn();
      if (confirm("Is this photo OK ?")) {
        snap.play();
        $('#loader').fadeIn();
        is_http = false;
        $.post('/snap', {snap: url_b64}, function(data){
          $('.stat-age').text(data.age);
          $('.stat-trust').text(data.trust * 100);
          $('.stat-happy').text(data.happy * 100);
          $('.stat-time-hours').text(getTime('h'));
          $('.stat-time-minutes').text(getTime('m'));
          $('.stat-gender').shuffleLetters({
      			"text": data.gender
      		});
          $('.stat-color').shuffleLetters({
            "text": data.color
          });
          $('.stat-context').shuffleLetters({
            "text": data.trust_context
          });
          $('canvas').fadeOut();
          $('.scott').fadeIn(function() {
            $('#loader').fadeOut();
          });
        });
      } else {
        is_http = false;
        $('canvas').fadeOut();
      }
    }
  });

  var getTime = function(what) {
    var d = new Date();
    if (what == 'h') {
      return ('0' + d.getHours()).slice(-2);
    } else {
      return ('0' + d.getMinutes()).slice(-2);
    }
  };

  $('.stat-time-hours').text(getTime('h'));
  $('.stat-time-minutes').text(getTime('m'));

});
