$(function() {
  if (window.users.length == 0) {
    $('#search')
      .attr('placeholder', 'loading your followers')
      .attr('disabled', true);
    $.ajax({
      url: '/followers',
      success: function(response) {
        window.users = response;
        $('#search')
          .attr('placeholder', 'search')
          .attr('disabled', false);
      }
    });
  }

  var invites = [];
  setTime(4);
  $('#search').on('keyup', function(e) {
    var keyCode = e.keyCode;
    if (keyCode >= 37 && keyCode <= 40) {
      //TODO select user with keyboard
    } else {
      search(this.value);
    }
  });

  $('#result').on('click li', function(e) {
    var target = e.target;

    if (target.tagName != 'LI') {
      target = target.parentNode;
    }

    $(target).remove();
    addToInvite(target.id)
    $(this).empty()
  });

  $('#invites').on('click', 'button', function(e) {
    var target = $(e.target);
    var id = target.data('id');
    target.parent().remove();
    users.push(remove(invites, id));
  });

  var scrollTimer;
  $('.time').on('scroll', setScrollListener);

  function setScrollListener() {
    if (scrollTimer) {
      clearTimeout(scrollTimer);
    }
    scrollTimer = setTimeout(setTime, 150);
  }

  $('#invite').on('click', function() {
    if (!invites.length) {
      return
    }
    $.ajax({
      type: "POST",
      url: "event",
      data: {
        users: invites,
        time: inviteTime,
        title: $('#title').val() || 'Lunch'
      }
    }).done(function(response) {
        window.location.href = 'event/' + response.id;
      });
  });

  $('#reset').on('click', function() {
    setTime(4);
    invites = [];
    $('#invites').empty()
  });
  var inviteTime;

  function setTime(position) {

    var itemWidth = 60;
    var slider = $('.time').get(0);

    if (!position) {
      position = (parseInt((30 + slider.scrollLeft) / itemWidth));
    } else {
      slider.scrollLeft = position * itemWidth;
    }

    var hours = parseInt(position / 4) + 11;
    var minutes = ((position % 4) * 15) || '00';

    $('.time ul .active').removeClass('active');
    $('.time ul').children(':nth-child(' + (position + 1) + ')').addClass('active');

    inviteTime = hours + ':' + minutes;
  }

  function search(value) {
    var regExp = new RegExp(value + '.*', 'i');
    var result = users.filter(function(user) {
      return regExp.test(user.name) || regExp.test(user.screen_name);
    })
      .map(function(user) {
        return '<li id="' + user.id + '" class="row"><p class="content">' + user.name + '</p><i>' + user.screen_name + '</i></li>';
      });
    $('#result').html(result.join(''))
  }

  function addToInvite(id) {
    var selectedUser;
    selectedUser = remove(users, id);
    invites.push(selectedUser);
    $('#search').val('');
    $('#invites').append('<li class="row"><div><img src="' + selectedUser.image + '"></div><p class="content"><span>' + selectedUser.name + '</span>@' + selectedUser.screen_name + '</p><button class="icon-cancel-circled" data-id="' + selectedUser.id + '"></button></li>')
  }

  function remove(array, id) {
    for (var i = 0, l = array.length; i < l; i++) {
      if (array[i].id == id) {
        return  array.splice(i, 1)[0];
      }
    }
  }

});
