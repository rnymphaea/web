import gulp from 'gulp';
import pug from 'gulp-pug';
import dartSass from 'sass';
import gulpSass from 'gulp-sass';
import babel from 'gulp-babel';

const sass = gulpSass(dartSass);

const paths = {
    pug: 'client/src/views/**/*.pug',
    scss: 'client/src/scss/**/*.scss',
    js: 'client/src/js/**/*.js'
};

function buildPug() {
    return gulp.src(paths.pug)
        .pipe(pug())
        .pipe(gulp.dest('client/dist'));
}

function buildSass() {
    return gulp.src(paths.scss)
        .pipe(sass().on('error', sass.logError))
        .pipe(gulp.dest('client/dist/css'));
}

function buildJs() {
    return gulp.src(paths.js)
        .pipe(babel({ 
            presets: ['@babel/preset-env']
        }))
        .pipe(gulp.dest('client/dist/js'));
}

export const build = gulp.parallel(buildPug, buildSass, buildJs);
export default build;
