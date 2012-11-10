var Twitter = require('../lib/twitter');
ev = require('../lib/event'),
  fo = require('../lib/follower'),
  crypto = require('crypto');

var OAuth = require('oauth').OAuth;
var oa = new OAuth(
  "https://twitter.com/oauth/request_token",
  "https://twitter.com/oauth/access_token",
  process.env.TWITTER_KEY,
  process.env.TWITTER_SECRET,
  "1.0",
  process.env.HOST + "/auth/twitter/callback",
  "HMAC-SHA1");

module.exports = function(db) {

  var logged_in = function(req) {
    return (req.session.oauth
      && req.session.oauth.access_token);
  };

  return {
    /** */
    login: function(req, res) {
      if (!logged_in(req)) {
        res.render('login');
      } else {
        res.redirect('/');
      }
    },

    auth: {
      /** */
      twitter: function(req, res) {
        oa.getOAuthRequestToken(function(error, oauth_token, oauth_token_secret, results) {
          if (error) {
            console.dir(error);
            res.send("yeah no. didn't work.");
          } else {
            req.session.oauth = {};
            req.session.oauth.token = oauth_token;
            req.session.oauth.token_secret = oauth_token_secret;
            res.redirect('https://twitter.com/oauth/authenticate?oauth_token=' + oauth_token)
          }
        });
      },

      /** */
      twitter_callback: function(req, res, next) {
        if (req.session.oauth) {
          req.session.oauth.verifier = req.query.oauth_verifier;
          var oauth = req.session.oauth;
          oa.getOAuthAccessToken(oauth.token, oauth.token_secret, oauth.verifier,
            function(error, oauth_access_token, oauth_access_token_secret, results) {
              if (error) {
                res.send("yeah something broke.");
              } else {
                req.session.oauth.access_token = oauth_access_token;
                req.session.oauth.access_token_secret = oauth_access_token_secret;
                req.session.twitter = results;


                var twit = new Twitter(
                  req.session.oauth.access_token,
                  req.session.oauth.access_token_secret
                );

                twit.getUserInfo(parseInt(results.user_id, 10), function(user) {
                  req.session.twitter.name = user.name;
                  req.session.twitter.image = user.profile_image_url;
                  res.redirect("/");
                });
              }
            }
          );
        } else
          next(new Error("you're not supposed to be here."));
      }
    },

    /** */
    index: function(req, res) {

      if (!logged_in(req)) {
        res.redirect("/login");
        return;
      }

      var twit = new Twitter(
        req.session.oauth.access_token,
        req.session.oauth.access_token_secret
      );

      fo.Follower(db).load(req.session.twitter.user_id, function(err, users) {
        console.dir(err);
        console.dir(users);
        if (!users) {
          console.log('LOADING FOLLOWERS');

          twit.getFollowers(function(users) {
            fo.Follower(db).store(req.session.twitter.user_id, users, function() {
              res.render('index', {
                screen_name: req.session.twitter.screen_name,
                users: JSON.stringify(users)
              });
            });
          });

        } else {
          console.log('USING CACHED FOLLOWERS');
          res.render('index', {
            screen_name: req.session.twitter.screen_name,
            users: JSON.stringify(users)
          });
        }

      });


    },

    /** */
    logout: function(req, res) {
      req.session.destroy();
      res.render('logout');
    },

    /** */
    event: function(req, res) {
      if (!req.params.hash) {
        res.send('verpiss dich');
        return;
      }

      var url_hash = req.params.hash;

      ev.Event(db).retreive(req.params.id, function(err, data) {
        var viewer;
        data.users.some(function(user) {
          if (user.hash == url_hash) {
            viewer = user;
            return true;
          }
        });

        if (!viewer) {
          if (data.owner.hash == url_hash) {
            viewer = data.owner;
          } else {
            res.send('verpiss dich');
            return;
          }
        }

        viewer.join = viewer.status == 'join';
        viewer.isViewer = 'viewer'
        var time = new Date(+data.time);
        data.time = time.getHours() + ':' + time.getMinutes();
        console.dir(data);
        res.render('event', {event: data, viewer: viewer});
      });
    },

    /** */
    create_event: function(req, res) {

      if (!logged_in(req)) {
        res.redirect("/login");
        return;
      }

      var event = {
        users: req.body.users,
        title: req.body.title,
        time: req.body.time,
        owner: {
          id: req.session.twitter.user_id,
          screen_name: req.session.twitter.screen_name,
          name: req.session.twitter.name,
          image: req.session.twitter.image,
          status: 'join'
        }
      };

      ev.Event(db).create(event, function(err, data) {

        var twit = new Twitter(
          req.session.oauth.access_token,
          req.session.oauth.access_token_secret
        );

        data.users.forEach(function(user) {
          var msg = "You were invited to: " +
            process.env.HOST + '/event/' +
            data.id + "/" + user.hash +
            " . GO GO GO";
          twit.sendDm(parseInt(user.id, 10), msg);
        });

        res.send(data);
      });
    },

    join_event: function(req, res) {
      if (!req.params.hash) {
        res.send('verpiss dich');
        return;
      }

      var url_hash = req.params.hash;

      ev.Event(db).retreive(req.params.id, function(err, data) {
        var viewer;
        data.users.some(function(user) {
          if (user.hash == url_hash) {
            viewer = user;
            return true;
          }
        });

        if (!viewer) {
          res.send('verpiss dich');
          return;
        }

        viewer.status = "join";

        ev.Event(db).update(data, function() {
          var time = new Date(+data.time);
          data.time = time.getHours() + ':' + time.getMinutes();
          res.render('event', {event: data, viewer: viewer});
        });
      });

    }
  }
}
