var fs = require('fs');
var path = require('path');
var async = require('async');

function Directory(pathName, files) {
  this.path = pathName;
  this.name = path.basename(pathName);
  this.files = files || [];
}

Directory.prototype.add = function (file) {
  this.files.push(file);
};

Directory.prototype.toObject = function () {
  return this.files.map(function (file) {
    var obj = {};
    obj[file.name] = file.toObject();
    return obj;
  });
};

function File(pathName, contents) {
  this.path = pathName;
  this.name = path.basename(pathName);
  this.dir = path.dirname(pathName);
  this.contents = contents || fs.readFileSync(pathName);
}

File.prototype.toObject = function () {
  return '...';
};

/**
 * Crawls a given directory object
 */
function crawl(directory, ignore, callback) {
  /* Convert to a Directory if we are given a string */
  if (!(directory instanceof Directory)) {
    directory = new Directory(directory);
  }

  fs.readdir(directory.path, function (err, items) {
    if (err) return callback(err);
    var i, child, operations = [], stat;

    for (i = 0; i < items.length; i++) {
      if (ignore.indexOf(items[i]) !== -1) {
        continue;
      }

      /* Get the full path of item */
      item = path.join(directory.path, items[i]);
      stat = fs.statSync(item);

      if (stat.isFile()) {
        directory.add(new File(item));
      } else {
        /* Create a child directory which we will add to our parent */
        child = new Directory(item);

        /* Push a new asynchronous operation */
        operations.push((function (child) {
          return function(callback) {
            /**
             * Crawl the item, which is a directory, sending it a new
             * child directory object to modify, the same ignore, and a
             * callback which will add our new child directory to the parent
             */
            crawl(child, ignore, function (err) {
              if (err) return callback(err);

              directory.add(child);
              return callback();
            });
          };
        /* Create a closure with `child` since it will be reused */
        })(child));
      }
    }

    /* Invoke async.parallel and send the directory object to a callback */
    return async.parallel(operations, function (err) {
      callback(err, directory);
    });
  });
}

exports.crawl = crawl;
exports.Directory = Directory;
exports.File = File;
