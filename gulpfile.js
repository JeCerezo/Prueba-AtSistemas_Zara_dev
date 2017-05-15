var gulp = require('gulp');
var rename = require('gulp-rename');
var concat = require('gulp-concat');
var browserSync = require('browser-sync').create();

// Static server


gulp.task('serve', function() {

    browserSync.init({
        server: "./src"
    });

    gulp.watch("src/css/*.css");
    gulp.watch("src/*.html").on('change', browserSync.reload);
    gulp.watch("src/scripts/.js").on('change', browserSync.reload);
});

gulp.task('vendor', function() {
	 gulp.src([
          './node_modules/jquery/dist/jquery.js',
          './node_modules/page/page.js'
      ])
    .pipe(concat('vendor.js'))
    .pipe(gulp.dest('src/scripts/'));
});




gulp.task('default', ['vendor','serve']);