function startSite() {
	var platform = navigator.platform.toLowerCase();
	var userAgent = navigator.userAgent.toLowerCase();
}

$(document).ready(function() {
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
