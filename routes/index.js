var twitter = require('twitter');

// SECRET = require('secret-strings').EXPRESS_OAUTH_SAMPLE;
// Edit below.
var SECRET = {
  CONSUMER_KEY: process.env.TWITTER_KEY,
  CONSUMER_SECRET: process.env.TWITTER_SECRET
};

var OAuth = require('oauth').OAuth;
var oa = new OAuth(
    "https://twitter.com/oauth/request_token",
    "https://twitter.com/oauth/access_token",
    SECRET.CONSUMER_KEY,
    SECRET.CONSUMER_SECRET,
    "1.0",
    process.env.HOST + "/auth/twitter/callback",
    "HMAC-SHA1");

exports.index = function (req, res) {
  if(req.session.oauth && req.session.oauth.access_token) {
    res.render('index', {
      screen_name: req.session.twitter.screen_name
    });
  } else {
    res.redirect("/login");
  }
};

exports.login = function (req, res) {
  if(req.session.oauth && req.session.oauth.access_token) {
  } else {
    res.render('login');
  }
};

exports.auth = {};
exports.auth.twitter = function(req, res){
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
};

exports.auth.twitter.callback = function(req, res, next){
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
};

exports.index = function (req, res) {
  if(req.session.oauth && req.session.oauth.access_token) {

    twitter = require('twitter');
    var twit = new twitter({
      consumer_key: SECRET.CONSUMER_KEY,
      consumer_secret: SECRET.CONSUMER_SECRET,
      access_token_key: req.session.oauth.access_token,
      access_token_secret: req.session.oauth.access_token_secret
    });

    twit.get('/followers/ids.json', {include_entities:true}, function(data) {
      var ids = data.ids.slice(0, 100).join(',');
      console.log(ids);
      twit.post('/users/lookup.json?user_id=' + ids, {include_entities:true}, function(data) {
        console.dir(data);
        var users = data.map(function(user) {
          return {
            id:user.id,
            screen_name:user.screen_name,
            name:user.name,
            image:user.profile_image_url
          };
        });

        console.dir(users);
        res.render('index', {
          screen_name: req.session.twitter.screen_name,
          users: JSON.stringify(users)
        });
      });
    });
  } else {
    res.redirect("/login");
  }
};

exports.post = function (req, res) {
  if(req.session.oauth && req.session.oauth.access_token) {
    var text = req.body.text;
    oa.post(
      'https://api.twitter.com/1/statuses/update.json',
      req.session.oauth.access_token,
      req.session.oauth.access_token_secret,
      {"status": text},
      function (err, data, response) {
        if (err) {
          res.send('too bad.' + JSON.stringify(err));
        } else {
          res.send('posted successfully...!');
        }
      });
  } else {
    res.send('fail.');
  }
};

exports.logout = function (req, res) {
  req.session.destroy();
  res.render('logout');
};