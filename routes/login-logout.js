var config = require('../config.js'),
  utils = require('../lib/utils.js');

module.exports = function(app) {
  app.get('/login', utils.loggedIn(false), function(req, res) {
    res.render('login');
  });

  app.post('/login', utils.loggedIn(false), function(req, res) {
    var username = req.body.username,
      password = req.body.password;

    if (username !== config.admin.username) {
      res.render('login', {
        invalidUsername: true
      });
      return;
    }

    if (password !== config.admin.password) {
      res.render('login', {
        invalidPassword: true
      });
      return;
    }

    req.session.loggedIn = true;
    res.redirect(303, '/');
    return;
  });

  // FIXME: find clean solution for CSRF querystring check for just this route.
  app.get('/logout', utils.loggedIn(true), function(req, res) {
    if (!req.session.loggedIn) {
      res.redirect(303, '/');
      return;
    }

    delete req.session.loggedIn;
    res.redirect(303, '/');
    return;
  });
};
