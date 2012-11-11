var twitter = require('twitter'),
Flow = require('node.flow');

module.exports = function(access_token, access_token_secret) {
  var twit = new twitter({
    consumer_key: process.env.TWITTER_KEY,
    consumer_secret: process.env.TWITTER_SECRET,
    access_token_key: access_token,
    access_token_secret: access_token_secret
  });

  return {
    sendDm : function(id, message) {
      twit.newDirectMessage(id, message, function() {});
    },

    getUserInfo : function(id, cb) {
      twit.showUser(id, cb);
    },

    getFollowers : function(cb) {
      twit.get('/followers/ids.json', {include_entities: true}, function(data) {
        var flow = new Flow();
        var all_users = [];

        // twitter allows us to load 100 users at max
        // so we split into multiple requests and let flow
        // handle the parallelization
        var slice_count = Math.ceil(data.ids.length / 100);
        for (var i = 0; i < slice_count; i++) {
          var id_part = data.ids.slice(i*100, i*100 + 99).join(',');

          flow.series(function(all_users, it, id_part, ready) {
            twit.post('/users/lookup.json?user_id=' + id_part, {include_entities:true}, function(data) {
              data.forEach(function(user) {
                all_users.push({
                  id: user.id,
                  screen_name: user.screen_name,
                  name: user.name,
                  image: user.profile_image_url
                });

              });

              ready(all_users);
            });
          }, all_users, i, id_part);
        }

        flow.end(cb);

        //flow.end(function(all_users) {
          //var users = [];
          //console.dir(all_users);

          // merge users from subrequests
          //all_users.forEach(function(obj) {
          //  users = users.concat(obj[0]);
          //});

          //cb(all_users);
        //});
      });
    }
  }
};

