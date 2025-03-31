const gulp = require('gulp');
const concat = require('gulp-concat');
const uglify = require('gulp-uglify');
const sourcemaps = require('gulp-sourcemaps');
const del = require('del');
const beautify = require('gulp-beautify');
const rename = require('gulp-rename');
const path = require('path');

const paths = {
    elementManagers: {
        src: 'wwwroot/js/ProductionHistory/ElementManagers/**/*.js',
        dest: 'wwwroot/dist/js/productionhistory/elementmanagers/',
        bundleName: 'element-managers.js'
    },
    modules: {
        src: 'wwwroot/js/ProductionHistory/Modules/*.js',
        dest: 'wwwroot/dist/js/productionhistory/modules/',
        bundleName: 'modules.js'
    },
    utilities: {
        src: 'wwwroot/js/ProductionHistory/Utilities/*.js',
        dest: 'wwwroot/dist/js/productionhistory/utilities/',
        bundleName: 'utilities.js'
    },
    index: {
        src: 'wwwroot/js/ProductionHistory/Index.js',
        dest: 'wwwroot/dist/js/productionhistory/',
        bundleName: 'index.js'
    },
    minifiedFiles: 'wwwroot/dist/js/**/*.min.js',
    unminifiedOutput: 'wwwroot/dist/unminified'
};

// Clean dist folders
function cleanDist() {
    return del([
        'wwwroot/dist/js/**/*.js',
        'wwwroot/dist/js/**/*.map'
    ]);
}

// Process and bundle ElementManagers
function processElementManagers() {
    return gulp.src(paths.elementManagers.src)
        .pipe(sourcemaps.init())
        .pipe(concat(paths.elementManagers.bundleName))
        .pipe(uglify())
        .pipe(rename({ suffix: '.min' }))
        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest(paths.elementManagers.dest));
}

// Process and bundle Modules
function processModules() {
    return gulp.src(paths.modules.src)
        .pipe(sourcemaps.init())
        .pipe(concat(paths.modules.bundleName))
        .pipe(uglify())
        .pipe(rename({ suffix: '.min' }))
        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest(paths.modules.dest));
}

// Process and bundle Utilities
function processUtilities() {
    return gulp.src(paths.utilities.src)
        .pipe(sourcemaps.init())
        .pipe(concat(paths.utilities.bundleName))
        .pipe(uglify())
        .pipe(rename({ suffix: '.min' }))
        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest(paths.utilities.dest));
}

// Process Index
function processIndex() {
    return gulp.src(paths.index.src)
        .pipe(sourcemaps.init())
        .pipe(uglify())
        .pipe(rename({
            basename: 'index',
            suffix: '.min'
        }))
        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest(paths.index.dest));
}

function watch() {
    gulp.watch(paths.elementManagers.src, processElementManagers);
    gulp.watch(paths.modules.src, processModules);
    gulp.watch(paths.utilities.src, processUtilities);
    gulp.watch(paths.index.src, processIndex);
}

function unminifyFiles() {
    return gulp.src(paths.minifiedFiles)
        .pipe(beautify({ indent_size: 2 }))
        .pipe(rename((file) => {
            file.basename = file.basename.replace('.min', '');
            file.extname = '.unmin.js';
        }))
        .pipe(gulp.dest(paths.unminifiedOutput));
}



// Build task for individual category bundles
const buildCategories = gulp.parallel(
    processElementManagers,
    processModules,
    processUtilities,
    processIndex
);

// Build task
const build = gulp.series(
    cleanDist,
    buildCategories
);

// Define tasks
exports.clean = cleanDist;
exports.buildCategories = buildCategories;
exports.build = build;
exports.watch = watch;
exports.default = build;
exports.unminify = unminifyFiles;
