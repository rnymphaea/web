import gulp from 'gulp';
import less from 'gulp-less';
import cleanCSS from 'gulp-clean-css';
import terser from 'gulp-terser';
import pug from 'gulp-pug';
import babel from 'gulp-babel';

export const compileStyles = () => {
    return gulp.src('src/client/less/main.less')
        .pipe(less())
        .pipe(cleanCSS())
        .pipe(gulp.dest('dist-gulp/css'));
};

export const compileScripts = () => {
    return gulp.src('src/client/js/**/*.js')
        .pipe(babel({
            presets: [
                ['@babel/preset-env', {
                    targets: {
                        browsers: ['last 2 versions', 'ie >= 11']
                    },
                    modules: false
                }]
            ],
            plugins: [
                '@babel/plugin-syntax-dynamic-import'
            ]
        }))
        .pipe(terser())
        .pipe(gulp.dest('dist-gulp/js'));
};

export const compileTemplates = () => {
    return gulp.src('src/client/views/**/*.pug')
        .pipe(pug({
            pretty: true
        }))
        .pipe(gulp.dest('dist-gulp/html'));
};

export const copyAssets = () => {
    return gulp.src('src/client/images/**/*')
        .pipe(gulp.dest('dist-gulp/images'));
};

export const watchStyles = () => {
    return gulp.watch('src/client/less/**/*.less', compileStyles);
};

export const watchScripts = () => {
    return gulp.watch('src/client/js/**/*.js', compileScripts);
};

export const watchTemplates = () => {
    return gulp.watch('src/client/views/**/*.pug', compileTemplates);
};

export const watchAssets = () => {
    return gulp.watch('src/client/images/**/*', copyAssets);
};

export const build = gulp.parallel(compileStyles, compileScripts, compileTemplates, copyAssets);

export const dev = () => {
    build();
    gulp.watch('src/client/less/**/*.less', compileStyles);
    gulp.watch('src/client/js/**/*.js', compileScripts);
    gulp.watch('src/client/views/**/*.pug', compileTemplates);
    gulp.watch('src/client/images/**/*', copyAssets);
};

export const watch = gulp.parallel(watchStyles, watchScripts, watchTemplates, watchAssets);

export default build;
