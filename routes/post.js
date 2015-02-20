var config = require('../config.js'),
  utils = require('../lib/utils.js'),
  Post = require('../models/post.js');

module.exports = function(app) {
  app.get('/posts', function(req, res) {
    // Get all posts and order them by date in descending order.
    Post.find().sort({
      'date': 'desc'
    }).exec(function(err, posts) {
      // Get all categories (no duplicates).
      var categories = (function() {
          var cats = [];
          for (var postIndex in posts) {
            if (posts.hasOwnProperty(postIndex)) {
              var post = posts[postIndex];
              // Skip drafted posts if we aren't logged in.
              if (post.draft && !utils.isUserLoggedIn(req)) {
                continue;
              } else if (cats.indexOf(post.getCategory()) === -1) {
                cats.push(post.getCategory());
              }
            }
          }

          return cats;
        })(),
        indexedPosts = {},
        context = {};

      // Order posts by category.
      categories.forEach(function(cat) {
        indexedPosts[cat] = posts.filter(function(post) {
          return post.getCategory() === cat && !(post.draft &&
            !utils.isUserLoggedIn(req));
        }).map(function(post) {
          if (post.draft && !utils.isUserLoggedIn(req)) {
            return;
          }

          return {
            title: post.title,
            urlTitle: post.urlTitle,
            draft: post.draft
          };
        });
      });
      context.posts = indexedPosts;
      context.categories = categories;
      res.render('posts-index', context);
    });
  });

  app.get('/posts/:post', function(req, res) {
    // Get the post with the given url title.
    Post.findOne({
      urlTitle: req.params.post
    }).exec(function(err, post) {
      var context = {};
      if (post) {
        if (post.draft && !utils.isUserLoggedIn(req)) {
          res.render('error', {
            error: 'The post doesn\'t exist!'
          });
          return;
        }

        app.locals.postId = post._id;
        context = {
          title: post.title,
          content: post.parseMarkdown(),
          category: post.getCategory(),
          tags: post.tags,
          draft: post.draft
        };
      } else {
        res.render('error', {
          error: 'The post doesn\'t exist!'
        });
        return;
      }

      app.locals.inPost = true;
      res.render('post', context);
    });
  });

  app.get('/create', utils.loggedIn(true), function(req, res) {
    var context = {
      categories: config.categories.map(function(categoryName, index) {
        return {
          id: index,
          name: categoryName,
          checked: index === 0
        };
      })
    };
    res.render('create-post', context);
  });

  app.post('/create', utils.loggedIn(true), function(req, res) {
    req.body.category = parseInt(req.body.category, 10);
    // Sanitize the category id.
    if (req.body.category === NaN || req.body.category < 0 || req.body.category >=
      config.categories.length) {
      req.body.category = 0;
    }

    var context = {
        title: req.body.title,
        content: req.body.content,
        tags: req.body.tags,
        draft: req.body.draft,
        categories: config.categories.map(function(categoryName, index) {
          return {
            id: index,
            name: categoryName,
            checked: req.body.category === index
          };
        })
      },
      errors = false;

    if (!errors && req.body.title.length < config.minTitleLength) {
      context.errors = 'The title must be as long as ' + config.minTitleLength +
        ' characters.';
      errors = true;
    }

    if (!errors && req.body.title.length > config.maxTitleLength) {
      context.errors = 'The title exceeds the maximum length of ' +
        config.maxTitleLength +
        ' characters.';
      errors = true;
    }

    if (!errors && req.body.content.length < config.minPostLength) {
      context.errors = 'The content must be as long as ' + config.minPostLength +
        ' characters.';
      errors = true;
    }

    if (!errors && req.body.content.length > config.maxPostLength) {
      context.errors = 'The post exceeds the maximum length of ' + config
        .maxPostLength +
        ' characters.';
      errors = true;
    }

    if (!errors) {
      new Post({
        title: req.body.title,
        content: req.body.content,
        categoryId: req.body.category,
        tags: req.body.tags,
        draft: req.body.draft
      }).save(function(err) {
        if (err) {
          console.log(err.stack);
          res.render('error', {
            error: 'Database error. Report to admin.'
          });
          return;
        } else {
          res.redirect(303, '/posts');
        }
      });
    } else {
      res.render('create-post', context);
    }
  });

  app.get('/edit/:id', utils.loggedIn(true), function(req, res) {
    if (!req.params.id) {
      res.render('error', {
        error: 'No post ID given.'
      });
      return;
    }

    var postCat = '';
    // Get the post with the given permanent id (don't rely on url title).
    Post.findOne({
      _id: req.params.id
    }).exec(function(err, post) {
      var context = {};
      if (post) {
        postCat = post.getCategory();
        context = {
          id: post._id,
          title: post.title,
          content: post.content,
          category: post.getCategory(),
          tags: post.tags.join(', '),
          draft: post.draft
        };
      } else {
        res.render('error', {
          error: 'The post doesn\'t exist!'
        });
        return;
      }

      context.categories = config.categories.map(function(
        categoryName,
        index) {
        return {
          id: index,
          name: categoryName,
          checked: postCat === categoryName
        };
      });
      res.render('edit-post', context);
    });
  });

  app.post('/edit/:id', utils.loggedIn(true), function(req, res) {
    if (!req.params.id) {
      res.render('error', {
        error: 'No post ID given.'
      });
      return;
    }

    req.body.category = parseInt(req.body.category, 10);
    // Sanitize the category id.
    if (req.body.category === NaN || req.body.category < 0 || req.body.category >=
      config.categories.length) {
      req.body.category = 0;
    }

    var context = {
        id: req.params.id,
        title: req.body.title,
        content: req.body.content,
        tags: req.body.tags,
        draft: req.body.draft,
        categories: config.categories.map(function(categoryName, index) {
          return {
            id: index,
            name: categoryName,
            checked: req.body.category === index
          };
        })
      },
      errors = false;

    if (!errors && req.body.title.length < config.minTitleLength) {
      context.errors = 'The title must be as long as ' + config.minTitleLength +
        ' characters.';
      errors = true;
    }

    if (!errors && req.body.title.length > config.maxTitleLength) {
      context.errors = 'The title exceeds the maximum length of ' +
        config.maxTitleLength +
        ' characters.';
      errors = true;
    }

    if (!errors && req.body.content.length < config.minPostLength) {
      context.errors = 'The content must be as long as ' + config.minPostLength +
        ' characters.';
      errors = true;
    }

    if (!errors && req.body.content.length > config.maxPostLength) {
      context.errors = 'The post exceeds the maximum length of ' + config
        .maxPostLength +
        ' characters.';
      errors = true;
    }

    if (!errors) {
      Post.findById(req.params.id, function(err, post) {
        if (post) {
          post.title = req.body.title;
          post.content = req.body.content;
          post.categoryId = req.body.category;
          post.tags = req.body.tags;
          post.draft = req.body.draft;
          post.save(function(err) {
            if (err) {
              console.log(err.stack);
              res.render('error', {
                error: 'Database error. Report to admin.'
              });
              return;
            } else {
              res.redirect(303, '/posts');
            }
          });
        } else {
          res.render('error', {
            error: 'The post doesn\'t exist!'
          });
          return;
        }
      });
    } else {
      res.render('edit-post', context);
    }
  });

  app.get('/delete/:id', utils.loggedIn(true), function(req, res) {
    if (!req.params.id) {
      res.render('error', {
        error: 'No post ID given.'
      });
      return;
    }

    var postCat = '';
    // Get the post with the given permanent id (don't rely on url title).
    Post.findOne({
      _id: req.params.id
    }).exec(function(err, post) {
      var context = {};
      if (post) {
        postCat = post.getCategory();
        context = {
          id: req.params.id,
          title: post.title
        };
      } else {
        res.render('error', {
          error: 'The post doesn\'t exist!'
        });
        return;
      }

      res.render('delete-post', context);
    });
  });

  app.post('/delete/:id', utils.loggedIn(true), function(req, res) {
    if (!req.params.id) {
      res.render('error', {
        error: 'No post ID given.'
      });
      return;
    }

    Post.findOne({
      _id: req.params.id
    }).remove(function(err, post) {
      if (post) {
        if (err) {
          console.log(err.stack);
          res.render('error', {
            error: 'Database error. Report to admin.'
          });
          return;
        } else {
          res.redirect(303, '/posts');
        }
      } else {
        res.render('error', {
          error: 'The post doesn\'t exist!'
        });
        return;
      }
    });
  });
};
