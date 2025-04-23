const gulp = require('gulp');
const concat = require('gulp-concat');
const cleanCSS = require('gulp-clean-css');
const terser = require('gulp-terser');
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
        console.error(`Error reading directories in ${dir}: ${error.message}`);
        return [];
    }
}

// Helper function to get files in a directory (non-recursive)
function getFiles(dir) {
    try {
        return fs.readdirSync(dir)
            .filter(f => fs.statSync(path.join(dir, f)).isFile());
    } catch (error) {
        console.error(`Error reading files in ${dir}: ${error.message}`);
        return [];
    }
}

// Clean minified files for development
gulp.task('clean-development', () => {
    console.log('Removing minified files for development...');
    return del([
        'wwwroot/css/*.min.css',
        'wwwroot/js/*.min.js'
    ]).then(paths => console.log('Deleted minified files:\n', paths.join('\n')));
});

// Development: Mirror src to wwwroot for css and js
gulp.task('development-css', () => {
    return gulp.src('src/css/**/*', { base: 'src/css' })
        .pipe(gulp.dest('wwwroot/css'));
});

gulp.task('development-js', () => {
    return gulp.src('src/js/**/*', { base: 'src/js' })
        .pipe(gulp.dest('wwwroot/js'));
});

gulp.task('development', gulp.series(
    'clean-development',
    gulp.parallel('development-css', 'development-js')
));

// Production: Minify individual files and concatenate folders for css
gulp.task('production-css', () => {
    const cssDir = 'src/css';
    const files = getFiles(cssDir).filter(f => f.endsWith('.css'));
    const folders = getFolders(cssDir);

    console.log('Individual CSS files detected:', files);
    console.log('CSS folders detected:', folders);

    // Minify individual files at root level
    const minifyFiles = files.length > 0 ? files.map(file => {
        console.log(`Processing individual CSS file: ${file}`);
        return gulp.src(path.join(cssDir, file))
            .pipe(cleanCSS())
            .pipe(rename({ suffix: '.min' }))
            .pipe(gulp.dest('wwwroot/css'))
            .on('end', () => console.log(`Generated: wwwroot/css/${file.replace('.css', '.min.css')}`));
    }) : [];

    // Concatenate and minify folders
    const minifyFolders = folders.length > 0 ? folders.map(folder => {
        console.log(`Processing CSS folder: ${folder}`);
        return gulp.src(path.join(cssDir, folder, '**/*.css'))
            .pipe(concat(`${folder}.min.css`))
            .pipe(cleanCSS())
            .pipe(gulp.dest('wwwroot/css'))
            .on('end', () => console.log(`Generated: wwwroot/css/${folder}.min.css`));
    }) : [];

    return merge([...minifyFiles, ...minifyFolders]);
});

// Production: Minify individual files and concatenate folders for js
gulp.task('production-js', () => {
    const jsDir = 'src/js';
    const files = getFiles(jsDir).filter(f => f.endsWith('.js'));
    const folders = getFolders(jsDir);

    console.log('Individual JS files detected:', files);
    console.log('JS folders detected:', folders);

    // Minify individual files at root level
    const minifyFiles = files.length > 0 ? files.map(file => {
        console.log(`Processing individual JS file: ${file}`);
        return gulp.src(path.join(jsDir, file))
            .pipe(terser())
            .pipe(rename({ suffix: '.min' }))
            .pipe(gulp.dest('wwwroot/js'))
            .on('end', () => console.log(`Generated: wwwroot/js/${file.replace('.js', '.min.js')}`));
    }) : [];

    // Concatenate and minify folders
    const minifyFolders = folders.length > 0 ? folders.map(folder => {
        console.log(`Processing JS folder: ${folder}`);
        return gulp.src(path.join(jsDir, folder, '**/*.js'))
            .pipe(concat(`${folder}.min.js`))
            .pipe(terser())
            .pipe(gulp.dest('wwwroot/js'))
            .on('end', () => console.log(`Generated: wwwroot/js/${folder}.min.js`));
    }) : [];

    return merge([...minifyFiles, ...minifyFolders]);
});

// Clean wwwroot for production (remove non-minified files)
gulp.task('clean-production', () => {
    console.log('Cleaning wwwroot, preserving minified files...');
    return del([
        'wwwroot/css/**/*',
        '!wwwroot/css/*.min.css',
        'wwwroot/js/**/*',
        '!wwwroot/js/*.min.js'
    ]).then(paths => console.log('Deleted files and folders:\n', paths.join('\n')));
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
