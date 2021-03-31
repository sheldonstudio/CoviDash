const autoprefixer = require('gulp-autoprefixer');
const bourbon = require('bourbon').includePaths;
const cachebust = require('gulp-cache-bust');
const cleancss = require('gulp-clean-css');
const concat = require('gulp-concat');
const del = require('del');
const imagemin = require('gulp-imagemin');
const fs = require('fs');
const gulp = require('gulp');
const nunjucks = require('gulp-nunjucks-render');
const path = require('path');
const sass = require('gulp-sass');
const uglify = require('gulp-uglify');
const util = require('gulp-util');
const webserver = require('gulp-webserver');
const _ = require('lodash');

const config = require('./config');

const mode = require('gulp-mode')({
  modes: ['development', 'production'],
  default: 'development',
  verbose: false
});

const paths = {
  build: 'build/',
  pages: 'src/pages/**/*.+(html|nunjucks|njk)',
  templates: [
    'src/includes'
  ],
  data: 'src/data/**/*',
  images: 'src/images/**/*',
  fonts: 'src/fonts/**/*',
  styles: [
    'src/styles/**/*.scss',
    '!src/styles/**/_*.scss'
  ],
  scripts: [
    'src/scripts/sprintf.js',
    'src/scripts/lodash.js',
    'src/scripts/moment.js',
    'src/scripts/numeral.js',
    'src/scripts/jquery.js',
    'src/scripts/jquery.animateNumber.js',
    'src/scripts/d3.js',
    'src/scripts/scripts.js'
  ]
};

gulp.task('pages', () => {
  return gulp.src(paths.pages)
    .pipe(nunjucks({
      path: paths.templates,
      manageEnv: (env) => {
        env.addGlobal('baseConfig', (mode.production() ? config.production : config.development));
      }
    }))
    .pipe(cachebust({type: 'timestamp'}))
    .pipe(gulp.dest(paths.build));
});

gulp.task('copy-data', () => {
  return gulp.src(paths.data)
    .pipe(gulp.dest(paths.build + '/data'));
});

gulp.task('copy-images', () => {
  return gulp.src(paths.images)
    .pipe(gulp.dest(paths.build + '/images'));
});

gulp.task('copy-fonts', () => {
  return gulp.src(paths.fonts)
    .pipe(gulp.dest(paths.build + '/fonts'));
});

gulp.task('styles', gulp.parallel('copy-fonts', () => {
  return gulp.src(paths.styles)
    .pipe(sass({
      includePaths: ['styles'].concat(
        bourbon,
        [ 'node_modules/breakpoint-sass/stylesheets/' ]
      )
    }))
    .pipe(autoprefixer({
      cascade: false
    }))
    .pipe(cleancss({compatibility: 'ie8'}))
    .pipe(concat('styles.min.css'))
    .pipe(gulp.dest(paths.build));
}));

gulp.task('scripts', () => {
  return gulp.src(paths.scripts)
    // .pipe(uglify())
    .pipe(concat('scripts.min.js'))
    .pipe(gulp.dest(paths.build));
});

gulp.task('clean', () => {
  return del([paths.build]);
});

gulp.task('build', gulp.parallel('pages', 'styles', 'scripts', 'copy-data', 'copy-images'));

gulp.task('default', gulp.parallel('pages', 'styles', 'scripts', 'copy-data', 'copy-images'));

gulp.task('watch', gulp.series('build', () => {
  gulp.watch(paths.pages, gulp.series('pages'));
  gulp.watch(paths.templates, gulp.series('pages'));
  gulp.watch(paths.styles, gulp.series('styles'));
  gulp.watch(paths.scripts, gulp.series('scripts'));
  gulp.watch(paths.data, gulp.series('copy-data'));
  gulp.watch(paths.images, gulp.series('copy-images'));
}));

gulp.task('serve', () => {
  gulp.src(paths.build)
    .pipe(webserver({
      livereload: true
    }));
});