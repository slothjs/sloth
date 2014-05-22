var fs = require('fs');
var path = require('path');
var filesystem = require('./filesystem');

function Sloth(directory) {
  this.directory = directory;
  this.middleware = [];

  this.index = null;
}


/**
 * Method to use a piece of middleware
 */
Sloth.prototype.use = function (middleware) {
  this.middleware.push(middleware);

  /* Allow chaining */
  return this;
};


/**
 * Builds the index - an object containing representing the filesystem
 * Sets `this.index` and invokes a callback with that same index
 */
Sloth.prototype._buildIndex = function(callback) {
  var ignoreFile = path.join(this.directory, '.gitignore');
  var ignore = fs.readFile(ignoreFile, 'utf-8', function (err, data) {
    if (err) return callback(err);

    return filesystem.crawl(this.directory, data.split('\n'), function (err, directory) {
      if (err) return callback(err);
      this.index = directory.toObject();
      callback(null, this.index);
    });
  }
};


filesystem.crawl('/Users/jordan/Projects/isomer', ['.git', 'node_modules'], function (err, directory) {
  if (err) console.log(err);
  console.log(JSON.stringify(directory.toObject(), null, 2));
});
