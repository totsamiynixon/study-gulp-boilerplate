"use strict";

var config = {
  paths: {
    base: "src",
    assets: {
      sass: "src/assets/sass",
      fonts: "src/assets/fonts",
      image: "src/assets/img",
      js: "src/assets/js"
    },
    libs: {
      js: "src/libs/js",
      css: "src/libs/css"
    },
    dist: process.env.NODE_ENV == "production" ? "dist/build" : "dist/dev"
  },
  libs: {
    js: [
      "modernizr.js",
      "jquery-1.11.2.min.js",
      "bootstrap.min.js",
      "plugins-scroll.js"
    ],
    css: ["bootstrap.min.css", "bootstrap_skin.css"]
  },
  isProd: function() {
    return process.env.NODE_ENV == "production";
  }
};

var gulp = require("gulp"),
  gulpIf = require("gulp-if"),
  browserSync = require("browser-sync"),
  sourcemaps = require("gulp-sourcemaps"),
  sass = require("gulp-sass"),
  sassGlob = require("gulp-sass-glob"),
  rename = require("gulp-rename"),
  postcss = require("gulp-postcss"),
  autoprefixer = require("autoprefixer"),
  mqpacker = require("css-mqpacker"),
  cssnano = require("gulp-cssnano"),
  plumber = require("gulp-plumber"),
  concat = require("gulp-concat"),
  uglify = require("gulp-uglify"),
  imagemin = require("gulp-imagemin"),
  tinypng = require("gulp-tinypng-nokey"),
  pngquant = require("imagemin-pngquant"),
  del = require("del"),
  run = require("run-sequence"),
  cache = require("gulp-cache");

gulp.task("browser-sync", function() {
  browserSync({
    server: {
      baseDir: config.paths.dist
    },
    notify: false
  });
});

gulp.task("style", function() {
  return gulp
    .src(config.paths.assets.sass + "/style.scss")
    .pipe(plumber())
    .pipe(sassGlob())
    .pipe(gulpIf(!config.isProd(), sourcemaps.init()))
    .pipe(sass())
    .pipe(
      postcss([
        autoprefixer({ browsers: ["last 10 versions"] }),
        mqpacker({
          sort: true
        })
      ])
    )
    .pipe(cssnano())
    .pipe(rename({ suffix: ".min" }))
    .pipe(gulpIf(!config.isProd(), sourcemaps.write(".")))
    .pipe(gulp.dest(config.paths.dist + "/css"))
    .pipe(browserSync.reload({ stream: true }));
});

gulp.task("js", function() {
  return gulp
    .src(config.paths.assets.js + "/app.js")
    .pipe(gulpIf(!config.isProd(), sourcemaps.init()))
    .pipe(uglify())
    .pipe(rename({ suffix: ".min" }))
    .pipe(gulpIf(!config.isProd(), sourcemaps.write(".")))
    .pipe(gulp.dest(config.paths.dist + "/js"));
});

gulp.task("img", function() {
  return gulp
    .src(config.paths.assets.image + "/**/*")
    .pipe(
      cache(
        imagemin(
          [
            imagemin.gifsicle({ interlaced: true }),
            imagemin.jpegtran({ progressive: true }),
            imagemin.svgo(),
            imagemin.optipng({ optimizationLevel: 3 }),
            pngquant({ quality: "65-70", speed: 5 })
          ],
          {
            verbose: true
          }
        )
      )
    )
    .pipe(gulpIf(config.isProd(), tinypng()))
    .pipe(gulp.dest(config.paths.dist + "/img"));
});

gulp.task("css-libs", function() {
  return gulp
    .src(
      config.libs.css.map(function(lib) {
        return config.paths.libs.css + "/" + lib;
      })
    )
    .pipe(concat("libs.min.css"))
    .pipe(cssnano())
    .pipe(gulp.dest(config.paths.dist + "/css"));
});

gulp.task("js-libs", function() {
  return gulp
    .src(
      config.libs.js.map(function(lib) {
        return config.paths.libs.js + "/" + lib;
      })
    )
    .pipe(concat("libs.min.js"))
    .pipe(uglify())
    .pipe(gulp.dest(config.paths.dist + "/js"));
});

gulp.task("clean", function() {
  del.sync(config.paths.dist + "");
});

gulp.task("copy:html", function() {
  var buildHtml = gulp
    .src(config.paths.base + "/*.html")
    .pipe(gulp.dest(config.paths.dist + ""))
    .pipe(browserSync.reload({ stream: true }));
});

gulp.task("copy:fonts", function() {
  var buildFonts = gulp
    .src(config.paths.assets.fonts + "/**/*")
    .pipe(gulp.dest(config.paths.dist + "/fonts"));
});

gulp.task(
  "watch",
  [
    "clean",
    "browser-sync",
    "style",
    "js",
    "css-libs",
    "js-libs",
    "img",
    "copy:fonts",
    "copy:html"
  ],
  function() {
    gulp.watch(config.paths.base + "/**/*.html", ["copy:html"]);
    gulp.watch(
      [
        config.paths.assets.sass + "/**/*.scss",
        config.paths.assets.sass + "/**/*.css"
      ],
      ["style"]
    );
    gulp.watch(config.paths.assets.js + "/**/*.js", ["js"]);
  }
);

gulp.task("build", function(fn) {
  run(
    "clean",
    "css-libs",
    "js-libs",
    "style",
    "js",
    "img",
    "copy:fonts",
    "copy:html",
    fn
  );
});

gulp.task("clear", function(callback) {
  return cache.clearAll();
});
