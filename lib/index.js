var filesystem = require('./filesystem');

filesystem.crawl('/Users/jordan/Projects/isomer', ['.git', 'node_modules'], function (err, directory) {
  if (err) console.log(err);
  console.log(JSON.stringify(directory.toObject(), null, 2));
});
