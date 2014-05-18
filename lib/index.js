var fs = require('fs');
var path = require('path');
var through = require('through');
var mustache = require('mustache');
var gulp = require('gulp');
var markdown = require('gulp-markdown');
var rename = require('gulp-rename');
var gutil = require('gulp-util');
var File = gutil.File;

gulp.task('posts', function () {
  return gulp.src('posts/*.md')
    .pipe(markdown())
    .pipe(rename(function (path) {
      path.dirname = '/' + path.basename;
      path.basename = 'index';
    }))
    .pipe(gulp.dest('build/'))
});

gulp.task('index', function () {
  var indexTemplate = fs.readFileSync(path.join(__dirname, '/templates/index.mustache')).toString();
  var posts = [];
  var firstFile = null;

  return gulp.src('posts/*.md', { read: false })
    .pipe(through(function (file, enc, contents) {
      if (!firstFile) {
        firstFile = file;
      }

      var title = path.basename(file.path, '.md')

      posts.push({
        title: title,
        url: '/' + title
      });
    }))
    .on('end', function () {
      this.emit('data', new File({
        cwd: firstFile.cwd,
        base: firstFile.base,
        path: path.join(firstFile.base, 'index.html'),
        contents: new Buffer(mustache.render(indexTemplate, { posts: posts }))
      }));
    })
    .pipe(gulp.dest('build/'));
});

module.exports = function () {
  gulp.start('posts', 'index');
};
