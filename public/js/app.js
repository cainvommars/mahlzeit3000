$(function() {
  var invites = [];
  $('#search').on('keyup', function() {
    search(this.value);
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
    console.log(invites);
    $('#search').val('');
    $('#invites').append('<li><img src="' + selectedUser.image + '"><button data-id="' + selectedUser.id + '"></button></li>')
  }

  function remove(array, id) {
    for (var i = 0; i < array.length; i++) {
      if (array[i].id == id) {
        return  array.splice(i, 1)[0];
      }
    }
  }
});
