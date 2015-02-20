var Post = require('../models/post.js'),
  utils = require('../lib/utils.js');

module.exports = function(app) {
  app.get('/', function(req, res) {
    // Get all posts in descending order by date.
    Post.find().sort({
      'date': 'desc'
    }).exec(function(err, posts) {
      var context = {
        posts: posts.map(function(post) {
          if (post.draft && !utils.isUserLoggedIn(req)) {
            return;
          }

          return {
            title: post.title,
            urlTitle: post.urlTitle,
            content: post.getPreviewContent(),
            draft: post.draft
          };
        })
      };
      res.render('home', context);
    });
  });
};
