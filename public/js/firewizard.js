function startSite() {
	var platform = navigator.platform.toLowerCase();
	var userAgent = navigator.userAgent.toLowerCase();
}

$(document).ready(function() {
  // jquery extend function
$.extend(
{
    redirectPost: function(location, args)
    {
        var form = '';
        $.each( args, function( key, value ) {
            value = value.split('"').join('\"')
            form += '<input type="hidden" name="'+key+'" value="'+value+'">';
        });
        $('<form action="' + location + '" method="POST">' + form + '</form>').appendTo($(document.body)).submit();
    }
});


  $('#signupbutton').click(enableSignupform);
  $('#signup').hide();
  $('#loginbutton').click(enableLoginform);
  function enableLoginform(){
    $('#signupbutton').removeClass('highlight');
    $('#loginbutton').addClass('highlight');
    $('#login').show();
    $('#signup').hide();
  }
  function enableSignupform(){
    $('#signupbutton').addClass('highlight');
    $('#loginbutton').removeClass('highlight');
    $('#login').hide();
    $('#signup').show();
  }
  $('#loginlink').click(function() {
    $('html,body').animate({
      scrollTop: $('#loginlocation').offset().top
    }, 1000);
  });
  $('#loginlink2').click(function() {
    $('html,body').animate({
      scrollTop: $('#loginlocation').offset().top
    }, 1000);
  });

  $('#justtest').submit(function() {
    //console.log(this.val());
    $.post('/justtest',{"nui":$('#fuckyou').val(), "success":0}, function(msg) {
      console.log(msg);
      console.log(msg.success);
    });
    return false;
  });

  function logmsg(msg) {
    $('#logsignmsg').text(msg);
  }

  $('#signup').submit(function() {
    var username = $('input[name="signname"]');
    var password = $('input[name="signpass"]');
    console.log(password);
    $.post('/signup', {
      //'signname':$("input[name='signname']"),
      //'signpass':$("input[name='signpass']")
      'signname':username.val(),
      'signpass':password.val()
    },
    function(msg) {
      console.log(msg);
      enableLoginform();
      logmsg(msg);
    });
    return false;
  });

  $('#login').submit(function() {
    var dd = null;
    var username = $('input[name="logname"]');
    var password = $('input[name="logpass"]');
    //console.log(password);
    $.post('/login', {
      //'signname':$("input[name='signname']"),
      //'signpass':$("input[name='signpass']")
      'logname':username.val(),
      'logpass':password.val()
    },
    function(msg) {
      //console.log(msg);
			if (msg == 'fail') {
				logmsg('Wrong username or password.');
			}
			else {
				$.redirectPost('/login',{ logname: username.val(), logpass: password.val() });
			}
    });
		return false;
  });
    
  $('#loginlink').click(enableSignupform);
  $('#loginlink2').click(enableLoginform);
  $('#return-to-top').fadeIn(800);  
  $(window).scroll(function() {
    if ($(this).scrollTop() >= 50) {        
        $('#return-to-top').fadeIn(600);    
    }
    else {
        $('#return-to-top').fadeOut(600);   
        // Else fade out the arrow
    }
  });
  $('#return-to-top').click(function() {      
    // When arrow is clicked
    $('body,html').animate({
        scrollTop : 0                       
        // Scroll to top of body
    }, 500);
  });
  console.log($('loginbutton'));
  
});

document.body.onload = startSite();
