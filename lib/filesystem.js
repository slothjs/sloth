var fs = require('fs');
var path = require('path');
var async = require('async');
var Q = require('q');

function Directory(pathName, files) {
  this.path = path.resolve(pathName);
  this.name = path.basename(pathName);
  this.files = files || [];
}

Directory.prototype.add = function (file) {
  this.files.push(file);
};

Directory.prototype.toObject = function () {
  var i, map = {};
  for (i = 0; i < this.files.length; i++) {
    map[this.files[i].name] = this.files[i].toObject();
  }

  return map;
};


function File(pathName) {
  this.path = pathName;
  this.name = path.basename(pathName);
  this.dir = path.dirname(pathName);
  this.contentStream = fs.createReadStream(pathName);
}

File.prototype.toObject = function (opts) {
  return this.contentStream;
};

/**
 * Crawls a given directory object
 * Invokes callback on each leaf node (file) in the tree
 * Returns a promise
 */
function crawl(directory, ignore, callback) {
  var deferred = Q.defer();

  /* Convert to a Directory if we are given a string */
  if (!(directory instanceof Directory)) {
    directory = new Directory(directory);
  }

  fs.readdir(directory.path, function (err, items) {
    if (err) return deferred.reject(err);
    var i, child, file, operations = [], stat;

    for (i = 0; i < items.length; i++) {
      if (ignore.indexOf(items[i]) !== -1) {
        continue;
      }

      /* Get the full path of item */
      item = path.join(directory.path, items[i]);
      stat = fs.statSync(item);

      if (stat.isFile()) {
        /* Create a new file, and invoke the callback with it */
        file = new File(item);
        callback(file);
        directory.add(file);
      } else {
        /* Create a child directory which we will add to our parent */
        child = new Directory(item);
        directory.add(child);

        /* Push a new asynchronous operation */
        operations.push((function (child) {
          return crawl(child, ignore, callback);
        /* Create a closure with `child` since it will be reused */
        })(child));
      }
    }

    /* Invoke async.parallel and send the directory object to a callback */
    return Q.all(operations).then(function () {
      return deferred.resolve(directory);
    });
  });

  return deferred.promise;
}

exports.crawl = crawl;
exports.Directory = Directory;
exports.File = File;
