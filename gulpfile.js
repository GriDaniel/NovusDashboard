const gulp = require('gulp');
const concat = require('gulp-concat');
const cssmin = require('gulp-cssmin');
const uglify = require('gulp-uglify');
const cleanCSS = require('gulp-clean-css');
const rename = require('gulp-rename');
const del = require('del');
const merge = require('merge-stream');
const fs = require('fs');
const path = require('path');

// Helper function to get folders in a directory
function getFolders(dir) {
    try {
        return fs.readdirSync(dir)
            .filter(f => fs.statSync(path.join(dir, f)).isDirectory());
    } catch (error) {
        console.error(`Error reading ${dir}: ${error.message}`);
        return [];
    }
}

// Helper function to get files in a directory (non-recursive)
function getFiles(dir) {
    try {
        return fs.readdirSync(dir)
            .filter(f => fs.statSync(path.join(dir, f)).isFile());
    } catch (error) {
        console.error(`Error reading ${dir}: ${error.message}`);
        return [];
    }
}

// Development: Mirror src to wwwroot for css and js
gulp.task('development-css', () => {
    return gulp.src('src/css/**/*', { base: 'src/css' })
        .pipe(gulp.dest('wwwroot/css'));
});

gulp.task('development-js', () => {
    return gulp.src('src/js/**/*', { base: 'src/js' })
        .pipe(gulp.dest('wwwroot/js'));
});

gulp.task('development', gulp.parallel('development-css', 'development-js'));

// Production: Minify individual files and concatenate folders for css
gulp.task('production-css', () => {
    const cssDir = 'src/css';
    const files = getFiles(cssDir).filter(f => f.endsWith('.css'));
    const folders = getFolders(cssDir);

    // Minify individual files
    const minifyFiles = files.map(file => {
        return gulp.src(path.join(cssDir, file))
            .pipe(cleanCSS())
            .pipe(rename({ suffix: '.min' }))
            .pipe(gulp.dest('wwwroot/css'));
    });

    // Concatenate and minify folders
    const minifyFolders = folders.map(folder => {
        return gulp.src(path.join(cssDir, folder, '**/*.css'))
            .pipe(concat(`${folder}.min.css`))
            .pipe(cleanCSS())
            .pipe(gulp.dest('wwwroot/css'));
    });

    return merge([...minifyFiles, ...minifyFolders]);
});

// Production: Minify individual files and concatenate folders for js
gulp.task('production-js', () => {
    const jsDir = 'src/js';
    const files = getFiles(jsDir).filter(f => f.endsWith('.js'));
    const folders = getFolders(jsDir);

    // Minify individual files
    const minifyFiles = files.map(file => {
        return gulp.src(path.join(jsDir, file))
            .pipe(uglify())
            .pipe(rename({ suffix: '.min' }))
            .pipe(gulp.dest('wwwroot/js'));
    });

    // Concatenate and minify folders
    const minifyFolders = folders.map(folder => {
        return gulp.src(path.join(jsDir, folder, '**/*.js'))
            .pipe(concat(`${folder}.min.js`))
            .pipe(uglify())
            .pipe(gulp.dest('wwwroot/js'));
    });

    return merge([...minifyFiles, ...minifyFolders]);
});

// Clean wwwroot for production (remove non-minified files and folders)
gulp.task('clean-production', () => {
    return del([
        'wwwroot/css/**/*', '!wwwroot/css/*.min.css',
        'wwwroot/js/**/*', '!wwwroot/js/*.min.js'
    ], { force: true });
});

// Combined production task
gulp.task('production', gulp.series(
    gulp.parallel('production-css', 'production-js'),
    'clean-production'
));

// Watch task for development
gulp.task('watch', () => {
    gulp.watch('src/**/*', gulp.series('development'));
});
