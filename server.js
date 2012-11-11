var express = require('express'),
routes = require('./lib/routes'),
leveldb = require('leveldb');

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

leveldb.open('var/data',
             {create_if_missing: true},
             function(err, db)
{
  var handlers = routes(db);

  app.get('/', handlers.index);
  app.get('/help', handlers.help);
  app.get('/team', handlers.team);
  app.get('/engine', handlers.engine);
  app.get('/login', handlers.login);
  app.get('/auth/twitter', handlers.auth.twitter);
  app.get('/auth/twitter/callback', handlers.auth.twitter_callback);
  app.get('/logout', handlers.logout);
  app.get('/event/:id?', handlers.event);
  app.post('/event', handlers.create_event);
  app.get('/event/:id?/join/:hash?', handlers.join_event);

  app.post('/event/:id?/join/:hash?', 
           function(req, res) {handlers.do_join_event(req,res,true)});

  app.delete('/event/:id?/join/:hash?',
             function(req, res) {handlers.do_join_event(req,res,false)});

  app.get('/followers', handlers.get_followers);


  app.listen(3000);

  console.log('Server running at ' + process.env.HOST);
});

