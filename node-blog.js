var config = require('./config.js'),
  express = require('express'),
  expressHandlebars = require('express-handlebars'),
  mongoose = require('mongoose'),
  MongoSessionStore = require('session-mongoose')(require('connect')),
  sessionStore = new MongoSessionStore({
    url: config.mongoConnStr
  }),
  app = express();

app.use(express.static(__dirname + '/public'));
mongoose.connect(config.mongoConnStr, config.mongoOpts);
app.use(require('body-parser').urlencoded({
  extended: true
}));
app.use(require('cookie-parser')(config.cookieSecret));
app.use(require('express-session')({
  store: sessionStore,
  secret: config.cookieSecret,
  resave: false,
  saveUninitialized: true
}));
app.use(require('csurf')());
app.engine('handlebars', expressHandlebars({
  defaultLayout: 'main'
}));
app.set('view engine', 'handlebars');
app.set('port', process.env.PORT || 3000);
app.use(function(req, res, next) {
  // Have the following available to every view/layout.
  res.locals.csrfToken = req.csrfToken();
  res.locals.siteTitle = config.siteTitle;
  res.locals.siteDesc = config.siteDesc;
  app.locals.loggedIn = req.session.loggedIn;
  // Used for having the 'edit post' link available.
  app.locals.inPost = false;
  app.locals.postId = 0;
  next();
});

require('./routes/index.js')(app);
require('./routes/post.js')(app);
require('./routes/login-logout.js')(app);

app.use(function(req, res) {
  res.type('text/plain').status(404).send('404 - Not Found');
});

app.use(function(err, req, res, next) {
  console.log(err.stack);
  res.type('text/plain').status(500).send('500 - Internal Server Error');
});

app.listen(app.get('port'), function() {
  console.log('Express started in ' + app.get('env') +
    ' mode on localhost:' + app.get('port'));
  console.log('Press Ctrl-C to terminate.');
});
