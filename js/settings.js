$(function() {
  var savedKey = localStorage.getItem('apiKey');
  if (savedKey && savedKey.length === 32) {
    $('#api-key').val(savedKey);
    $('.callout.success').removeClass('hide');
    $('.callout.alert').addClass('hide');
  }

  $('#submit-button').on('click', function() {
    var apiKey = $('#api-key').val();
    if (apiKey && apiKey.length === 32) {
      localStorage.setItem('apiKey', apiKey);

      if (localStorage.getItem('apiKey') === apiKey) {
        $('.callout.success').removeClass('hide');
        $('.callout.alert').addClass('hide');
      } else {
        $('.callout.alert').removeClass('hide');
        $('.callout.success').addClass('hide');
      }
    } else {
      $('.callout.alert').removeClass('hide');
      $('.callout.success').addClass('hide');
    }
  });
});