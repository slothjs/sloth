var fs = require('fs');
var path = require('path');
var stream = require('stream');
var filesystem = require('./filesystem');


/**
 * Constructor
 *
 * Takes a directory
 */
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
Sloth.prototype.buildIndex = function (callback) {
  var self = this;
  /* Assume we want to ignore .gitignore - may want this in a config */
  var ignoreFile = path.join(this.directory, '.gitignore');
  fs.readFile(ignoreFile, 'utf-8', function (err, data) {
    if (err) return callback(err);
    var ignore = data.split('\n').concat('.git');

    return filesystem.crawl(self.directory, ignore, function (err, directory) {
      if (err) return callback(err);
      self.index = directory.toObject();
      callback(null, self.index);
    });
  });
};


/**
 * Pretty prints an index
 */
Sloth.prototype.prettyPrint = function () {
  return JSON.stringify(this.index, function (key, value) {
    if (value instanceof stream) {
      return '[stream]';
    }
    return value;
  }, 2);
};


/**
 * Main run method
 */
Sloth.prototype.run = function () {

};


var s = new Sloth('.');
s.buildIndex(function (err, index) {
  if (err) throw err;
  console.log(s.prettyPrint());
});
