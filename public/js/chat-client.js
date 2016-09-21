$(document).ready(function() {
  var socket = io()
  var heading = $('#main')
  var msgs = 0
  var username = $('#username').text();
  function botnewmsg(msg) {
    msgs = msgs + 1;
    var box = $('#bot-msg').clone();
    box.text(msg);
    box.appendTo($('#msg-box'));
    //let msg_last = $('.msg').length-1;
    //$('#msg-box').scrollTop($('.msg')[msg_last]);
    scrollLast();
  }
  function ownnewmsg(msg) {
    msgs = msgs + 1;
    var box = $('#usr-msg').clone();
    box.text(msg);
    box.appendTo($('#msg-box'));
    //let msg_last = $('.msg').length-1;
    //$('#msg-box').scrollTop($('.msg')[msg_last]);
    scrollLast();
  }
  function scrollLast() {
    //var lastchild = $('#msg-box :last-child');
    //var lastchild = $('.msg:last-child');
    //console.log(lastchild[0]);
    //$('#msg-box').animate({
      //scrollTop: lastchild.offset().top
    //}, 1);
    $('#msg-box').scrollTop($('#msg-box')[0].scrollHeight);
  }

  //var data = {
    //series: [5, 3, 4]
  //};
  //var sum = function(a, b) { return a + b };
  //new Chartist.Pie('.ct-chart', data, {
    //labelInterpolationFnc: function(value) {
      //return Math.round(value / data.series.reduce(sum) * 100) + '%';
    //}
  //});

  $('#play-again').click(function() {
    console.log('Sending signal to restart game');
    $('#play-again').hide();
    //$('#play-again').css('display','none');
    socket.emit('restart','');
  });

  socket.on('restart-ack', function(msg) {
    //$('#play-again').hide();
  });


  $('#txt-form').submit(function() {
    console.log(username);
    console.log('LIGE');
    msg = $('#txt-msg').val();
    if (msg.length == 0) {
      return false;
    }
    ownnewmsg(msg);
    msg = {
      name: username,
      msg: msg
    }
    msg = JSON.stringify(msg);
    console.log('MESSAGE HERE '+msg);
    socket.emit('ques-ans', msg);
    $('#txt-msg').val('');
    return false;
  });
  socket.on('new_ques', function(msg) {
    botnewmsg(msg);
    $('#play-again').text('Play again?');
    $('#play-again').hide();
  });
  socket.on('a-quote', function(msg) {
    botnewmsg(msg);
  });
  socket.on('reload-charts', function(msg) {
    reloadCharts(msg);
    //botnewmsg(msg);
  });

  function reloadCharts(data) {
    let stats = JSON.parse(data);
    //Finish day update
    $('#finish-date').text(stats['finish-day']);
    //Fitness score
    let fitnessScore = stats['fitness_score'];
    console.log('Fitness score', fitnessScore);
    $('#fitness-score').text(fitnessScore);
    botnewmsg('Updated your fitmeup stats.');
    //Update stats
    $('#play-again').css('display','block');
  }

  //$('#nick-form').submit(function() {
    //$('#nick-form').hide();
    //socket.emit('new-user', my_nick);
    //$('#helloMsg').show();
    //$('#helloNick').text(my_nick);
    //return false;
  //});
  //socket.on('respsresp', function(msg) {
    //botnewmsg(msg);
  //});
  //socket.on('new-user', function(msg) {
     //let mem_block = $('#a_mem').clone();
     //console.log('Message ' + msg);
     //mem_block.attr('id',msg);
     //mem_block.text(msg).appendTo($('#all_mems'));
  //});
  //socket.on('a-user-disc', function(msg) {
    //$('#'+msg).remove();
  //});
  //socket.on('got-a-text', function(msg) {
    //json_msg = JSON.parse(msg);
    //console.log(json_msg);
    //let new_msg_block = $('#msg').clone();
    //new_msg_block.find('#msg_cont').text(json_msg.the_msg);
    //new_msg_block.find('#msg_nick')
      //.text(json_msg.name)
      //.css({'color':json_msg.col});
    //new_msg_block.appendTo($('#msgs'));
    //$('.my-msgs').scrollTop($('#msgs')[0].scrollHeight);
  //});
});
