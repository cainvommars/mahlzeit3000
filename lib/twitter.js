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

        /** 
         * Twitter has two restrictions for loading followers:
         * 1) Max 100 Users per request
         * 2) At most 3 parallel requests for one user (better 2)
         * 
         * So what we do:
         * - split whole id range into steps with each having 200 ids
         * - load each step in serial order
         * - each step is splitted into subrequests with 100 ids
         * - subrequests are executed in parallel
         */
        var parallel_steps = 2;
        var step_size = 100;
        var step_count = Math.ceil(data.ids.length / (parallel_steps * step_size));
        for (var step = 0; step < step_count; step++) {
          var step_ids = data.ids.slice(
                           step * step_size * parallel_steps,
                           step * step_size * parallel_steps + (parallel_steps * step_size) - 1
                         );

          // stepwise requests over the ids
          flow.series(function(all_users, it, step_ids, next) {
            var subflow = new Flow();
            var part_users = [];
            var slice_count = Math.ceil(step_ids.length / step_size);

            for (var i = 0; i < slice_count; i++) {
              var id_part = step_ids.slice(i*100, i*100 + 99).join(',');

              // parallel subrequests
              subflow.parallel(function(part_users, it, id_part, ready) {
                
                twit.post('/users/lookup.json?user_id=' + id_part, {include_entities:true}, function(data) {
                  data.forEach(function(user) {
                    part_users.push({
                      id: user.id,
                      screen_name: user.screen_name,
                      name: user.name,
                      image: user.profile_image_url
                    });
                  });

                  ready(part_users);
                });
              }, part_users, i, id_part);
            }

            // join parallel requests and aggregate fetched followers
            subflow.join();
            subflow.end(function(part_users) {
              part_users.forEach(function(obj) {
                all_users = all_users.concat(obj[0]);
              });

              // call next step
              next(all_users);
            });

          }, all_users, step, step_ids);
        }

        // finish the whole request
        flow.end(cb);
      });
    }
  }
};

