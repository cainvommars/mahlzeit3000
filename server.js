var http = require('http');
var express = require('express');

var app = express();

app.configure(function() {
  app.use(express.static(__dirname + '/public'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.set('view options', {
      layout: false
  });

  app.set('view engine', 'hbs');
});

app.get('/', function(req, res) {
  res.render('index', {});
})

app.listen(3000)

console.log('Server running at http://0.0.0.0:3000/');
