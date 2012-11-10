var Twitter = require('../lib/twitter');
  ev = require('../lib/event');

var OAuth = require('oauth').OAuth;
var oa = new OAuth(
  "https://twitter.com/oauth/request_token",
  "https://twitter.com/oauth/access_token",
  process.env.TWITTER_KEY,
  process.env.TWITTER_SECRET,
  "1.0",
  process.env.HOST + "/auth/twitter/callback",
  "HMAC-SHA1");

module.exports = function(db)
{

  var logged_in = function(req) {
    return (req.session.oauth
            && req.session.oauth.access_token);
  };

  return {
    /** */
    login : function (req, res) {
      if(!logged_in(req)) {
        res.render('login');
      } else {
        res.redirect('/');
      }
    },

    auth : {
    /** */
      twitter : function(req, res){
        oa.getOAuthRequestToken(function(error, oauth_token, oauth_token_secret, results){
          if (error) {
            console.dir(error);
            res.send("yeah no. didn't work.");
          } else {
            req.session.oauth = {};
            req.session.oauth.token = oauth_token;
            req.session.oauth.token_secret = oauth_token_secret;
            res.redirect('https://twitter.com/oauth/authenticate?oauth_token='+oauth_token)
          }
        });
      },

    /** */
      twitter_callback : function(req, res, next){
        if (req.session.oauth) {
          req.session.oauth.verifier = req.query.oauth_verifier;
          var oauth = req.session.oauth;
          oa.getOAuthAccessToken(oauth.token, oauth.token_secret, oauth.verifier,
             function(error, oauth_access_token, oauth_access_token_secret, results){
               if (error){
                 res.send("yeah something broke.");
               } else {
                 req.session.oauth.access_token = oauth_access_token;
                 req.session.oauth.access_token_secret = oauth_access_token_secret;
                 req.session.twitter = results;
                 res.redirect("/");
               }
             }
          );
        } else
          next(new Error("you're not supposed to be here."));
      }
    },

    /** */
    index : function (req, res) {

      if(! logged_in(req)) {
        res.redirect("/login");
        return;
      }

      var twit = new Twitter(
        req.session.oauth.access_token,
        req.session.oauth.access_token_secret
      );
      
      twit.getFollowers(function(users) {
        console.dir(users);
        res.render('index', {
          screen_name: req.session.twitter.screen_name,
          users: JSON.stringify(users)
        });
      });
    },

    /** */
    logout : function(req, res) {
      req.session.destroy();
      res.render('logout');
    },

    /** */
    event : function(req, res) {
      ev.Event(db).retreive(req.params.id, function(err, data) {
        var time = new Date(+data.time);
        data.time = time.getHours() + ':' + time.getMinutes();
        res.render('event', {event: data});
      });
    },

    /** */
    create_event : function(req, res) {

      if(! logged_in(req)) {
        res.redirect("/login");
        return;
      }

      var event = {
        users: req.body.users,
        title: req.body.title,
        time: req.body.time,
        owner: req.session.twitter.user_id
      };

      ev.Event(db).create(event, function(err, data) {
        
        var twit = new Twitter(
          req.session.oauth.access_token,
          req.session.oauth.access_token_secret
        );

        var msg = "You were invited to: " +
                  process.env.HOST + '/event/' +
                  data.id +
                  " . GO GO GO";

        data.users.forEach(function(user) {
          twit.sendDm(parseInt(user.id, 10), msg);
        });

        res.send(data);
      });
    }
  }
}
