var gulp = require('gulp');
var browserify = require('gulp-browserify');
var concat = require('gulp-concat');

var jest = require('gulp-jest');

gulp.task('jest', function () {
    return gulp.src('./').pipe(jest({
        scriptPreprocessor: "preprocessor.js",
        unmockedModulePathPatterns: [
            'react',
            'flux',
            'immutable',
            'route-recognizer',
            'js/constants/AppConstants'

        ],
        testPathIgnorePatterns: [
            "node_modules"
        ],
        moduleFileExtensions: [
            "js"
        ]
    }));
});

gulp.task('browserify', function() {
    gulp.src('src/js/index.js')
      .pipe(browserify({transform: 'reactify'}))
      .pipe(concat('index.js'))
      .pipe(gulp.dest('dist/js'));
});

gulp.task('copy', function() {
    gulp.src('src/index.html')
      .pipe(gulp.dest('dist'));
    gulp.src('node_modules/route-recognizer/lib/route-recognizer.js')
      .pipe(gulp.dest('dist/js'));
    gulp.src('node_modules/bootstrap/dist/**/*.*')
      .pipe(gulp.dest('dist'));
});

gulp.task('build', ['browserify', 'copy']);

gulp.task('watch', ['build'], function() {
    gulp.watch('src/**/*.*', ['build']);
});

gulp.task('default', ['build']);

