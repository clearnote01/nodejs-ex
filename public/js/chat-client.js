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
    var lastchild = $('.msg:last-child');
    console.log(lastchild[0]);
    $('#msg-box').animate({
      scrollTop: lastchild.offset().top
    }, 1);
  }

  $('#txt-form').submit(function() {
    console.log(username);
    console.log('LIGE');
    msg = $('#txt-msg').val();
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
  });
  socket.on('a-quote', function(msg) {
    botnewmsg(msg);
  });
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
