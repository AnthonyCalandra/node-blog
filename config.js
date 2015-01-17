module.exports = {
	// Site config.
	siteTitle: 'Welcome to NodeBlog!',
	siteDesc: 'A blog about things.',

	// Category config.
	// Each element of the array is a string which is the category name.
	// Category ID's are mapped to this array. Thus, there should be ATLEAST ONE
	// element in this array at all times.
	categories: ['Uncategorized', 'General'],

	// Posts config.
	maxPostLength: 10000,
	minPostLength: 10,
	maxTitleLength: 100,
	minTitleLength: 3,
	postPreviewLength: 100,

	// Admin config.
	admin: {
		username: 'admin',
		password: ''
	},

	// Mongodb config.
	// mongodb://username:password@host:port/database?options...
	mongoConnStr: '',
	mongoOpts: {
		server: {
			socketOptions: {
				keepAlive: 1
			}
		}
	},

	// Session config.
	cookieSecret: ''
};
