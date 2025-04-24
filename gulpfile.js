const gulp = require('gulp');
const concat = require('gulp-concat');
const cleanCSS = require('gulp-clean-css');
const terser = require('gulp-terser');
const rename = require('gulp-rename');
const del = require('del');
const merge = require('merge-stream');
const fs = require('fs');
const path = require('path');

function getFolders(dir) {
    try {
        return fs.readdirSync(dir)
            .filter(f => fs.statSync(path.join(dir, f)).isDirectory());
    } catch (error) {
        console.error(`Error reading directories in ${dir}: ${error.message}`);
        return [];
    }
}

function getFiles(dir) {
    try {
        return fs.readdirSync(dir)
            .filter(f => fs.statSync(path.join(dir, f)).isFile());
    } catch (error) {
        console.error(`Error reading files in ${dir}: ${error.message}`);
        return [];
    }
}

gulp.task('clean-development', () => {
    console.log('Removing minified files for development...');
    return del([
        'wwwroot/css/**/*.min.css',
        'wwwroot/js/**/*.min.js'
    ]).then(paths => console.log('Deleted minified files:\n', paths.join('\n')));
});

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

gulp.task('production-css', () => {
    const cssDir = 'src/css';
    const viewsDir = path.join(cssDir, 'Views');
    const files = getFiles(cssDir).filter(f => f.endsWith('.css'));
    const rootFolders = getFolders(cssDir).filter(folder => folder !== 'Views');
    const viewsSubfolders = fs.existsSync(viewsDir) ? getFolders(viewsDir) : [];

    console.log('Individual CSS files detected:', files);
    console.log('CSS root folders (excluding Views):', rootFolders);
    console.log('CSS Views subfolders:', viewsSubfolders);

    const minifyFiles = files.map(file => {
        console.log(`Processing individual CSS file: ${file}`);
        return gulp.src(path.join(cssDir, file), { base: cssDir })
            .pipe(cleanCSS({ format: { breaks: { afterRule: false } } })) // Single line
            .pipe(rename({ suffix: '.min' }))
            .pipe(gulp.dest('wwwroot/css'))
            .on('end', () => console.log(`Generated: wwwroot/css/${file.replace('.css', '.min.css')}`));
    });

    const minifyRootFolders = rootFolders.map(folder => {
        console.log(`Processing CSS root folder: ${folder}`);
        return gulp.src(path.join(cssDir, folder, '**/*.css'))
            .pipe(concat(`${folder}.min.css`))
            .pipe(cleanCSS({ format: { breaks: { afterRule: false } } }))
            .pipe(gulp.dest(path.join('wwwroot/css', folder)))
            .on('end', () => console.log(`Generated: wwwroot/css/${folder}/${folder}.min.css`));
    });

    const minifyViewsSubfolders = viewsSubfolders.map(subfolder => {
        console.log(`Processing CSS Views subfolder: ${subfolder}`);
        return gulp.src(path.join(viewsDir, subfolder, '**/*.css'))
            .pipe(concat(`${subfolder}.min.css`))
            .pipe(cleanCSS({ format: { breaks: { afterRule: false } } }))
            .pipe(gulp.dest(path.join('wwwroot/css/Views', subfolder)))
            .on('end', () => console.log(`Generated: wwwroot/css/Views/${subfolder}/${subfolder}.min.css`));
    });

    return merge([...minifyFiles, ...minifyRootFolders, ...minifyViewsSubfolders]);
});

gulp.task('production-js', () => {
    const jsDir = 'src/js';
    const viewsDir = path.join(jsDir, 'Views');
    const files = getFiles(jsDir).filter(f => f.endsWith('.js'));
    const rootFolders = getFolders(jsDir).filter(folder => folder !== 'Views');
    const viewsSubfolders = fs.existsSync(viewsDir) ? getFolders(viewsDir) : [];

    console.log('Individual JS files detected:', files);
    console.log('JS root folders (excluding Views):', rootFolders);
    console.log('JS Views subfolders:', viewsSubfolders);

    const minifyFiles = files.map(file => {
        console.log(`Processing individual JS file: ${file}`);
        return gulp.src(path.join(jsDir, file), { base: jsDir })
            .pipe(terser({ output: { beautify: false, comments: false } })) // Single line
            .pipe(rename({ suffix: '.min' }))
            .pipe(gulp.dest('wwwroot/js'))
            .on('end', () => console.log(`Generated: wwwroot/js/${file.replace('.js', '.min.js')}`));
    });

    const minifyRootFolders = rootFolders.map(folder => {
        console.log(`Processing JS root folder: ${folder}`);
        return gulp.src(path.join(jsDir, folder, '**/*.js'))
            .pipe(concat(`${folder}.min.js`))
            .pipe(terser({ output: { beautify: false, comments: false } }))
            .pipe(gulp.dest(path.join('wwwroot/js', folder)))
            .on('end', () => console.log(`Generated: wwwroot/js/${folder}/${folder}.min.js`));
    });

    const minifyViewsSubfolders = viewsSubfolders.map(subfolder => {
        console.log(`Processing JS Views subfolder: ${subfolder}`);
        return gulp.src(path.join(viewsDir, subfolder, '**/*.js'))
            .pipe(concat(`${subfolder}.min.js`))
            .pipe(terser({ output: { beautify: false, comments: false } }))
            .pipe(gulp.dest(path.join('wwwroot/js/Views', subfolder)))
            .on('end', () => console.log(`Generated: wwwroot/js/Views/${subfolder}/${subfolder}.min.js`));
    });

    return merge([...minifyFiles, ...minifyRootFolders, ...minifyViewsSubfolders]);
});

gulp.task('clean-production', () => {
    console.log('Cleaning wwwroot/js and wwwroot/css...');
    return del(['wwwroot/js/**/*', 'wwwroot/css/**/*']);
});

gulp.task('production', gulp.series(
    'clean-production',
    gulp.parallel('production-css', 'production-js')
));
