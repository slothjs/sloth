var gulp = require('gulp');
var markdown = require('gulp-markdown');

/* Where do we find `posts/` */
gulp.src('posts/*.md')
  .pipe(markdown())
  .pipe(gulp.dest('build/'))
