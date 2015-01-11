var Post = require('../models/post.js');
module.exports = function(app) {
  app.get('/', function(req, res) {
    // Get all posts in descending order by date.
    Post.find().sort({
      'date': 'desc'
    }).exec(function(err, posts) {
      var context = {
        posts: posts.map(function(post) {
          return {
            title: post.title,
            urlTitle: post.urlTitle,
            content: post.getPreviewContent()
          };
        })
      };
      res.render('home', context);
    });
  });
};
