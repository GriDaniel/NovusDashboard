const gulp = require('gulp');
const concat = require('gulp-concat');
const cssmin = require('gulp-cssmin');
const uglify = require('gulp-uglify');
const del = require('del');
const merge = require('merge-stream');
const fs = require('fs');
const path = require('path');

// Helper function to get parent folders
function getParentFolders(srcPath) {
    return fs.readdirSync(srcPath)
        .filter(f => fs.statSync(path.join(srcPath, f)).isDirectory());
}

// Development CSS: Concatenate without minification
gulp.task('development-css', () => {
    const parentFolders = getParentFolders('src/css');
    const streams = parentFolders.map(folder => {
        return gulp.src(`src/css/${folder}/**/*.css`)
            .pipe(concat(`${folder}.css`))
            .pipe(gulp.dest('wwwroot/css'));
    });
    return merge(streams);
});

// Development JS: Concatenate without minification
gulp.task('development-js', () => {
    const parentFolders = getParentFolders('src/js');
    const streams = parentFolders.map(folder => {
        return gulp.src(`src/js/${folder}/**/*.js`)
            .pipe(concat(`${folder}.js`))
            .pipe(gulp.dest('wwwroot/js'));
    });
    return merge(streams);
});

// Combined development task
gulp.task('development', gulp.parallel('development-css', 'development-js'));

// Production CSS: Concatenate and minify
gulp.task('production-css', () => {
    const parentFolders = getParentFolders('src/css');
    const streams = parentFolders.map(folder => {
        return gulp.src(`src/css/${folder}/**/*.css`)
            .pipe(concat(`${folder}.min.css`))
            .pipe(cssmin())
            .pipe(gulp.dest('wwwroot/css'));
    });
    return merge(streams);
});

// Production JS: Concatenate and minify
gulp.task('production-js', () => {
    const parentFolders = getParentFolders('src/js');
    const streams = parentFolders.map(folder => {
        return gulp.src(`src/js/${folder}/**/*.js`)
            .pipe(concat(`${folder}.min.js`))
            .pipe(uglify())
            .pipe(gulp.dest('wwwroot/js'));
    });
    return merge(streams);
});

// Clean non-minified files in production
gulp.task('clean-non-minified', () => {
    return del([
        'wwwroot/css/**/*.css', '!wwwroot/css/**/*.min.css',
        'wwwroot/js/**/*.js', '!wwwroot/js/**/*.min.js'
    ]);
});

// Combined production task
gulp.task('production', gulp.series(
    gulp.parallel('production-css', 'production-js'),
    'clean-non-minified'
));

// Watch task for development
gulp.task('watch', () => {
    gulp.watch('src/**/*', gulp.series('development'));
});
