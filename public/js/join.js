$(function() {
  $('#join').on('click', function() {
    var button = $(this);
    $.ajax({
      url : "/event/" + button.data('event-id') + "/join/" + button.data('viewer-id'),
      type: "POST",
      success: function(res) {
        button.remove();
      }
    });
  });
});
