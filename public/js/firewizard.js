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

  console.log($('loginbutton'));
});

document.body.onload = startSite();
