var express = require('express'),
routes = require('./routes'),
db = require('./lib/db');

var app = express();

app.configure(function() {
  app.use(express.static(__dirname + '/public'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.cookieParser());
  app.use(express.session({ secret: process.env.SESSION_SECRET }));
  app.use(app.router);
  app.set('view options', {
    layout: 'layout'
  });
  app.set('views', __dirname + '/views');
  app.set('view engine', 'hbs');
});

app.configure('development', function() {
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.configure('production', function() {
  app.use(express.errorHandler());
});

db.start('var/data', function(err, db) {
  var handlers = routes(db);

  app.get('/', handlers.index);
  app.get('/login', handlers.login);
  app.get('/auth/twitter', handlers.auth.twitter);
  app.get('/auth/twitter/callback', handlers.auth.twitter_callback);
  app.get('/logout', handlers.logout);
  app.get('/event/:id?/:hash?', handlers.event);
  app.post('/event', handlers.create_event);
  app.post('/event/:id?/join/:hash?', handlers.join_event);

  app.listen(3000);
});

console.log('Server running at ' + process.env.HOST);
