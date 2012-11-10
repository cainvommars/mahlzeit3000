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

  $('#invites').on('click', function(e) {
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
        time: inviteTime
      }
    }).done(function(msg) {
        console(msg);
      });
  });
  var inviteTime;

  function setTime() {
    var slider = $('.time').get(0);
    position = (parseInt((slider.scrollLeft) / 40));
    var hours = parseInt(position / 4) + 11;
    var minutes = (position % 4) * 15
    var date = new Date();
    date.setHours(hours, minutes, 0, 0);
    $('.time').off('scroll', setScrollListener);
    slider.scrollLeft = 160 + position * 4;
    setTimeout(function() {

      $('.time').on('scroll', setScrollListener);
    }, 10)
    console.log(date);
    inviteTime = date;
  }

  function search(value) {
    var regExp = new RegExp(value + '.*', 'i');
    var result = users.filter(function(user) {
      return regExp.test(user.name);
    })
      .map(function(user) {
        return '<li id="' + user.id + '">' + user.name + '</li>';
      });
    $('#result').html(result.join(''))
  }

  function addToInvite(id) {
    var selectedUser;
    selectedUser = remove(users, id);
    invites.push(selectedUser);
    $('#search').val('');
    $('#invites').append('<li><img src="' + selectedUser.image + '"><button data-id="' + selectedUser.id + '"></button></li>')
  }

  function remove(array, id) {
    for (var i = 0, l = array.length; i < l; i++) {
      if (array[i].id == id) {
        return  array.splice(i, 1)[0];
      }
    }
  }

});
