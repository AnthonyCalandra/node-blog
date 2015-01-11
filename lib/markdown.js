var marked = require('marked');
marked.setOptions({
  sanitize: true,
});
module.exports = marked;
