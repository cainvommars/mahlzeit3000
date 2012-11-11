$(function() {
  var invites = [];
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
    $(target).remove();
    addToInvite(target.id)
  });

  $('#invites').on('click', 'button', function(e) {
    console.log(e);
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
    $.ajax({
      type: "POST",
      url: "event",
      data: {
        users: invites,
        time: inviteTime.getTime(),
        title: $('#title').val()
      }
    }).done(function(response) {
        window.location.href = 'event/' + response.id + '/' + response.owner.hash;
      });
  });
  var inviteTime;

  function setTime() {
    var itemwidth = 60;
    var slider = $('.time').get(0);
    position = (parseInt((slider.scrollLeft) / itemwidth));
    var hours = parseInt(position / 4) + 11;
    var minutes = (position % 4) * 15
    var date = new Date();
    date.setHours(hours, minutes, 0, 0);
    $('.time').off('scroll', setScrollListener);
    slider.scrollLeft = position * itemwidth;

    $('.time ul .active').removeClass('active');
    $('.time ul').children(':nth-child(' + (position + 1) + ')').addClass('active');

    setTimeout(function() {
      $('.time').on('scroll', setScrollListener);
    }, 10)
    inviteTime = date;
  }

  function search(value) {
    var regExp = new RegExp(value + '.*', 'i');
    var result = users.filter(function(user) {
      return regExp.test(user.name) || regExp.test(user.screen_name);
    })
      .map(function(user) {
        return '<li id="' + user.id + '">' + user.name + '<i>' + user.screen_name + '</i></li>';
      });
    $('#result').html(result.join(''))
  }

  function addToInvite(id) {
    var selectedUser;
    selectedUser = remove(users, id);
    invites.push(selectedUser);
    $('#search').val('');
    $('#invites').append('<li><img src="' + selectedUser.image + '"><p><span>' + selectedUser.name + '</span>' + selectedUser.screen_name + '</p><button data-id="' + selectedUser.id + '"></button></li>')
  }

  function remove(array, id) {
    for (var i = 0, l = array.length; i < l; i++) {
      if (array[i].id == id) {
        return  array.splice(i, 1)[0];
      }
    }
  }

});
