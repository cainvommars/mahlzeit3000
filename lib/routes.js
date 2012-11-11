var Twitter = require('./twitter');
Event = require('./event'),
Follower = require('./follower'),
crypto = require('crypto'),
Session = require('./session');

var OAuth = require('oauth').OAuth;
var oa = new OAuth(
  'https://twitter.com/oauth/request_token',
  'https://twitter.com/oauth/access_token',
  process.env.TWITTER_KEY,
  process.env.TWITTER_SECRET,
  '1.0',
  process.env.HOST + '/auth/twitter/callback',
  'HMAC-SHA1');

module.exports = function(db) {

  var loggedIn = function(req) {
    var o = Session(req).get('oauth');
    return (o && o.access_token);
  };

  var renderError = function(res, msg) {
    res.render('error', {error: msg});
    return;
  };

  var createOauthSession = function(req, token, secret) {
    var s = Session(req);
    s.set('oauth', {
      token: token,
      token_secret: token
    });
  };

  var getTwitter = function(req) {
    var o = Session(req).get('oauth');

    return new Twitter(
      o.access_token,
      o.access_token_secret
    );
  }

  return {

    /**
     * login page
     */
    login: function(req, res) {
      if (!loggedIn(req)) {
        res.render('login');
      } else {
        res.redirect('/');
      }
    },

    auth: {

    /**
     * twitter auth endpoint
     */
      twitter: function(req, res) {
        oa.getOAuthRequestToken(function(error, oauth_token, oauth_token_secret, results) {
          if (error) {
            renderError(res, 'Authentication with twitter failed.');
          } else {
            createOauthSession(req, oauth_token, oauth_token_secret);
            res.redirect('https://twitter.com/oauth/authenticate?oauth_token=' + oauth_token)
          }
        });
      },

    /**
     * twitter auth callback
     */
      twitter_callback: function(req, res, next) {
        var o = Session(req).get('oauth');

        if (o) {
          o.verifier = req.query.oauth_verifier;
          oa.getOAuthAccessToken(o.token, o.token_secret, o.verifier,
            function(error, oauth_access_token, oauth_access_token_secret, results) {
              if (error) {
                renderError(res, 'Authentication with twitter failed.');
              } else {
                var s = Session(req);
                s.get('oauth').access_token = oauth_access_token;
                s.get('oauth').access_token_secret = oauth_access_token_secret;
                s.set('twitter', results);

                var twit = getTwitter(req);

                twit.getUserInfo(parseInt(results.user_id, 10), function(user) {
                  s.get('twitter').name = user.name;
                  s.get('twitter').image = user.profile_image_url;
                  res.redirect('/');
                });
              }
            }
          );
        } else
          renderError(res, 'You are not supposed to be here.');
      }
    },

    /**
     * index page
     */
    index: function(req, res) {

      if (!loggedIn(req)) {
        res.redirect('/login');
        return;
      }

      var s = Session(req);

      Follower(db).load(s.get('twitter').user_id, function(err, users) {
        if (! users) {
          users = [];
        }

        res.render('index', {
          viewer: s.get('twitter'),
          users: JSON.stringify(users)
        });
      });
    },

    /**
     * logout page
     */
    logout: function(req, res) {
      if(loggedIn(req))
        req.session.destroy();

      res.render('logout');
    },

    /**
     * event detail page
     */
    event: function(req, res) {
      Event(db).retreive(req.params.id, function(err, data) {
        var time = new Date(+data.time);
        var minutes =  time.getMinutes();
        if(!minutes){
          minutes = '00';
        }
        data.time = time.getHours() + ':' + minutes;
        res.render('event', {event: data});
      });
    },

    /**
     * event create endpoint
     */
    create_event: function(req, res) {

      if (! loggedIn(req)) {
        res.redirect('/login');
        return;
      }

      var s = Session(req);
      var t = s.get('twitter');

      var event = {
        users: req.body.users,
        title: req.body.title,
        time: req.body.time,
        owner: {
          id: t.user_id,
          screen_name: t.screen_name,
          name: t.name,
          image: t.image,
          status: 'join'
        }
      };

      Event(db).create(event, function(err, data) {
        var twit = getTwitter(req);

        data.users.forEach(function(user) {
          user.status = 'unknown';

          var msg = 'You were invited to: ' +
            process.env.HOST + '/event/' +
            data.id + '/join/' + user.hash +
            ' . GO GO GO';

          twit.sendDm(parseInt(user.id, 10), msg);
        });

        res.send(data);
      });
    },

    /**
     * join event endpoint
     */
    join_event: function(req, res) {
      if (!req.params.hash) {
        renderError(res,'You are not allowed to join this event.');
        return;
      }

      var url_hash = req.params.hash;

      Event(db).retreive(req.params.id, function(err, data) {
        var viewer;
        data.users.some(function(user) {
          if (user.hash == url_hash) {
            viewer = user;
            return true;
          }
        });

        if (!viewer) {
          renderError(res,'You are not allowed to join this event.');
          return;
        }

        if (viewer.status && viewer.status != 'unknown') {
          res.redirect('/event/'
                       + req.params.id);
          return;
        }

        res.render('join', {event: data, viewer: viewer});
      });
    },

    /** 
     * join event endpoint
     */
    do_join_event: function(req, res, join) {
      if (!req.params.hash) {
        renderError(res,'You are not allowed to join this event.');
        return;
      }

      var url_hash = req.params.hash;

      Event(db).retreive(req.params.id, function(err, data) {
        var viewer;
        data.users.some(function(user) {
          if (user.hash == url_hash) {
            viewer = user;
            return true;
          }
        });

        if (!viewer) {
          res.send(404,'You are not allowed to join this event.');
          return;
        }

        if (viewer.status && viewer.status != 'unknown') {
          res.redirect('/event/'
                       + req.params.id);
          return;
        }

        viewer.status = join == true ? 'join' : 'decline';

        Event(db).update(data, function() {
          var time = new Date(+data.time);
          data.time = time.getHours() + ':' + time.getMinutes();
          res.render('event', {event: data, viewer: viewer});
        });
      });

    },

    /**
     * get followers endpoint
     */
    get_followers: function(req, res) {
      if (!loggedIn(req)) {
        res.redirect('/login');
        return;
      }

      var twit = getTwitter(req);
      var s = Session(req);

      Follower(db).load(s.get('twitter').user_id, function(err, users) {
        if (!users) {
          twit.getFollowers(function(users) {
            Follower(db).store(s.get('twitter').user_id, users, function() {
              res.send(users);
            });
          });
        } else {
          res.send(users);
        }
      });
    }
  }
}
