var express = require('express')
  routes = require('./routes')

var app = express();

app.configure(function() {
  app.use(express.static(__dirname + '/public'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.cookieParser());
  app.use(express.session({ secret: 'mysecretsessionsecret' }));
  app.use(app.router);
  app.set('view options', {
      layout: 'layout'
  });
  app.set('views', __dirname + '/views');
  app.set('view engine', 'hbs');
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.configure('production', function(){
  app.use(express.errorHandler());
});

app.get('/', routes.index);
app.get('/login', routes.login);
app.get('/auth/twitter', routes.auth.twitter);
app.get('/auth/twitter/callback', routes.auth.twitter.callback);
app.post('/post', routes.post);
app.get('/logout', routes.logout);

console.dir(process.env)

app.listen(3000);

console.log('Server running at http://0.0.0.0:3000/');
