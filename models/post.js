var mongoose = require('mongoose'),
  postSchema = mongoose.Schema({
    title: String,
    urlTitle: String,
    content: String,
    categoryId: {
      type: Number,
      default: 0
    },
    date: {
      type: Date,
      default: Date.now
    },
    draft: Boolean,
    tags: [String]
  });

postSchema.methods.parseMarkdown = function() {
  var markdown = require('../lib/markdown.js');
  return markdown(this.content);
};

postSchema.methods.getCategory = function() {
  var config = require('../config.js');
  // Category sanitizartion...
  if (this.categoryId < 0 || this.categoryId >= config.categories.length) {
    this.categoryId = 0;
  }

  return config.categories[this.categoryId];
};

postSchema.methods.getPreviewContent = function() {
  var postPreviewLength = require('../config.js').postPreviewLength,
    HtmlStrip = require('htmlstrip-native');

  // Strip off HTML tags and decode HTML entities.
  this.content = HtmlStrip.html_strip(this.content, {
    include_script: false,
    include_style: false,
    compact_whitespace: true,
    include_attributes: {}
  });
  // Strip off the extra content and add ellipses.
  if (this.content.length >= postPreviewLength) {
    return this.content.substring(0, postPreviewLength - 2) + '...';
  } else {
    return this.content;
  }
};

postSchema.pre('save', function(next) {
  var validator = require('validator'),
    ent = require('ent'),
    entOpts = {
      named: true
    },
    post = this,
    postId = post.id || 0;

  // The url title should only contain url-friendly chars.
  post.urlTitle = validator.whitelist(post.title, 'a-zA-Z0-9 ').replace(
    / /g, '-');
  mongoose.model('Post', postSchema).find({
    urlTitle: new RegExp('^' + post.urlTitle + '(?:-\d+)?')
  }).sort({
    'urlTitle': 'desc'
  }).exec(function(err, posts) {
    if (posts.length === 1 && posts[0].id !== postId) {
      // Add on an extra number at the end to keep it unique.
      post.urlTitle += '-2';
    } else if (posts.length > 1) {
      // Find current post already in DB.
      var currentPost = posts.filter(function(aPost) {
        return aPost.id === postId;
      });
      // If the current post is not in the DB...
      if (currentPost.length === 0) {
        // Get the index of the latest post with the same url title and add 1.
        var latestIndex = parseInt(posts[0].urlTitle[posts[0].urlTitle.length -
          1], 10);
        post.urlTitle += '-' + (latestIndex + 1);
      } else {
        // Or, use the original url title.
        post.urlTitle = currentPost[0].urlTitle;
      }
    }

    // Filter duplicate and empty tags.
    post.tags = post.tags[0].split(/\s*,\s*/).filter(function(tag, idx,
      self) {
      return tag !== '' && self.indexOf(tag) === idx;
    });
    next();
  });
});
module.exports = mongoose.model('Post', postSchema);
