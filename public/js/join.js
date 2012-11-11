$(function() {
  var join_or_decline = function(action, eventId, viewerId, cb) {
    var method = action == 'join' ? 'POST' : 'DELETE';

    $.ajax({
      url : '/event/' + eventId + '/join/' + viewerId,
      type: method,
      success: cb
    });
  };

  $('button.join_decline').on('click', function() {
    var button = $(this);
    join_or_decline(button.data('action'),
                   button.data('event-id'),
                   button.data('viewer-id'),
                   function()
    {
      window.location.href = '/event/' + button.data('event-id');
    });
  });
});
