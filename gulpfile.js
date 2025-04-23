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
    try {
        return fs.readdirSync(srcPath)
            .filter(f => fs.statSync(path.join(srcPath, f)).isDirectory());
    } catch (error) {
        console.error(`Error reading ${srcPath}: ${error.message}`);
        return [];
    }
}

// Development CSS: Concatenate without minification
gulp.task('development-css', () => {
    const parentFolders = getParentFolders('src/css');
    if (!parentFolders.length) {
        console.log('No CSS parent folders found in src/css');
        return Promise.resolve();
    }
    const streams = parentFolders.map(folder => {
        return gulp.src(`src/css/${folder}/**/*.css`, { allowEmpty: true })
            .pipe(concat(`${folder}.css`))
            .pipe(gulp.dest('wwwroot/css'))
            .on('error', err => console.error(`Error processing CSS for ${folder}: ${err.message}`));
    });
    return merge(streams);
});

// Development JS: Concatenate without minification
gulp.task('development-js', () => {
    const parentFolders = getParentFolders('src/js');
    if (!parentFolders.length) {
        console.log('No JS parent folders found in src/js');
        return Promise.resolve();
    }
    const streams = parentFolders.map(folder => {
        return gulp.src(`src/js/${folder}/**/*.js`, { allowEmpty: true })
            .pipe(concat(`${folder}.js`))
            .pipe(gulp.dest('wwwroot/js'))
            .on('error', err => console.error(`Error processing JS for ${folder}: ${err.message}`));
    });
    return merge(streams);
});

// Combined development task
gulp.task('development', gulp.parallel('development-css', 'development-js'));

// Production CSS: Concatenate and minify
gulp.task('production-css', () => {
    const parentFolders = getParentFolders('src/css');
    if (!parentFolders.length) {
        console.log('No CSS parent folders found in src/css');
        return Promise.resolve();
    }
    const streams = parentFolders.map(folder => {
        return gulp.src(`src/css/${folder}/**/*.css`, { allowEmpty: true })
            .pipe(concat(`${folder}.min.css`))
            .pipe(cssmin())
            .pipe(gulp.dest('wwwroot/css'))
            .on('error', err => console.error(`Error minifying CSS for ${folder}: ${err.message}`));
    });
    return merge(streams);
});

// Production JS: Concatenate and minify
gulp.task('production-js', () => {
    const parentFolders = getParentFolders('src/js');
    if (!parentFolders.length) {
        console.log('No JS parent folders found in src/js');
        return Promise.resolve();
    }
    const streams = parentFolders.map(folder => {
        return gulp.src(`src/js/${folder}/**/*.js`, { allowEmpty: true })
            .pipe(concat(`${folder}.min.js`))
            .pipe(uglify())
            .pipe(gulp.dest('wwwroot/js'))
            .on('error', err => console.error(`Error minifying JS for ${folder}: ${err.message}`));
    });
    return merge(streams);
});

// Clean non-minified files in production
gulp.task('clean-non-minified', () => {
    return del([
        'wwwroot/css/**/*.css', '!wwwroot/css/**/*.min.css',
        'wwwroot/js/**/*.js', '!wwwroot/js/**/*.min.js'
    ], { force: true })
        .then(() => console.log('Non-minified files deleted'))
        .catch(err => console.error(`Error cleaning non-minified files: ${err.message}`));
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
