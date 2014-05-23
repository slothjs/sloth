var fs = require('fs');
var path = require('path');
var stream = require('stream');
var async = require('async');
var filesystem = require('./filesystem');


/**
 * Constructor
 *
 * Takes a directory
 */
function Sloth(directory, destination) {
  this.directory = path.resolve(directory || '.');
  this.middleware = [];
  this.destination = path.resolve(destination || 'build');

  if (!fs.existsSync(this.destination)) {
    fs.mkdirSync(this.destination);
  }

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

    var ignore = data.split('\n').concat(['.git', '.gitignore']).map(function (item) {
      if (item.match(/\/$/g)) {
        item = item.slice(0, -1);
      }

      return item;
    });

    return filesystem.crawl(self.directory, ignore, function (err, directory) {
      if (err) return callback(err);
      self.index = directory.toObject();
      callback(null, self.index);
    });
  });
};


/**
 * Writes the index to the destination
 */
Sloth.prototype.write = function (destination, index, callback) {
  var key, operations = [], fullPath;
  var self = this;

  for (key in index) {
    fullPath = path.resolve(destination, key);

    /* Individual file - pipe to its destination */
    if (index[key] instanceof stream) {
      index[key]
          .pipe(fs.createWriteStream(fullPath))
          .on('error', function (err) {
            return callback(err);
          })
          .on('done', function () {
            return callback();
          });
    /* Folder - mkdir and write into that directory */
    } else {
      operations.push((function (key) {
        return function (callback) {
          fullPath = path.resolve(destination, key);
          if (!fs.existsSync(fullPath)) {
            fs.mkdirSync(fullPath);
          }

          self.write(fullPath, index[key], callback);
        };
      })(key));
    }
  }

  return async.parallel(operations, callback);
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


var s = new Sloth('/Users/jordan/Projects/isomer');
s.buildIndex(function (err, index) {
  if (err) throw err;
//  console.log(s.prettyPrint());
  s.write(s.destination, s.index, function (err) {
    if (err) throw err;
  });
});
