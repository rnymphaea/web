import gulp from 'gulp';
import less from 'gulp-less';
import cleanCSS from 'gulp-clean-css';
import terser from 'gulp-terser';
import pug from 'gulp-pug';
import babel from 'gulp-babel';

const paths = {
    styles: 'src/client/less/**/*.less',
    mainStyle: 'src/client/less/main.less',
    scripts: 'src/client/js/**/*.js',
    templates: 'src/client/views/**/*.pug',
    images: 'src/client/images/**/*'
};

// Компиляция стилей
export const compileStyles = () =>
    gulp.src(paths.mainStyle)
        .pipe(less())
        .pipe(cleanCSS())
        .pipe(gulp.dest('dist-gulp/css'));

// Компиляция скриптов
export const compileScripts = () =>
    gulp.src(paths.scripts)
        .pipe(babel()) // Использует .babelrc
        .pipe(terser())
        .pipe(gulp.dest('dist-gulp/js'));

// Компиляция Pug-шаблонов
export const compileTemplates = () =>
    gulp.src(paths.templates)
        .pipe(pug({ pretty: true }))
        .pipe(gulp.dest('dist-gulp/html'));

// Копирование изображений
export const copyAssets = () =>
    gulp.src(paths.images)
        .pipe(gulp.dest('dist-gulp/images'));

// Параллельная сборка всех ресурсов
export const build = gulp.parallel(
    compileStyles,
    compileScripts,
    compileTemplates,
    copyAssets
);

// Watcher для dev
export const watch = () => {
    gulp.watch(paths.styles, compileStyles);
    gulp.watch(paths.scripts, compileScripts);
    gulp.watch(paths.templates, compileTemplates);
    gulp.watch(paths.images, copyAssets);
};

// Dev: сборка + watch
export const dev = gulp.series(build, watch);

// По умолчанию: просто сборка
export default build;

