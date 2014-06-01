var fs = require('fs');
var path = require('path');
var vinylFs = require('vinyl-fs');
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
    if (this.files[i].constructor.name === 'File') {
      map[this.files[i].relative] = '[stream]';
    } else {
      map[this.files[i].name] = this.files[i].toObject();
    }
  }

  return map;
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
    var i, child, operations = [], stat, stream;
    var vinylDeffered;

    for (i = 0; i < items.length; i++) {
      if (ignore.indexOf(items[i]) !== -1) {
        continue;
      }

      /* Get the full path of item */
      item = path.join(directory.path, items[i]);
      stat = fs.statSync(item);

      if (stat.isFile()) {
        vinylDeffered = Q.defer();

        /* Create a new file, and invoke the callback with it */
        vinylFs
          .src(item, { buffer: false })
          .once('data', (function (vinylDeffered) {
            return function (vinyl) {
              callback(vinyl);
              directory.add(vinyl);
              vinylDeffered.resolve(vinyl);
            };
          })(vinylDeffered));

        operations.push(vinylDeffered.promise);
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
