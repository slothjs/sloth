var gulp = require('gulp');
var markdown = require('gulp-markdown');
var rename = require('gulp-rename');

/* Where do we find `posts/` */
gulp.src('posts/*.md')
  .pipe(markdown())
  .pipe(rename(function (path) {
    path.dirname = '/' + path.basename;
    path.basename = 'index';
  }))
  .pipe(gulp.dest('build/'))
