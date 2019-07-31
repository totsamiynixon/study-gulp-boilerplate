"use strict";

var argv = require("yargs").argv;

var config = {
  paths: {
    base: "src",
    assets: {
      sass: "src/assets/sass",
      fonts: "src/assets/fonts",
      image: "src/assets/img",
      js: "src/assets/js/main.js"
    },
    libs: {
      js: "src/libs/js/main.js",
      sass: "src/libs/sass"
    }
  },
  isProd: function() {
    return argv.production === undefined ? false : true;
  }
};

var webpackConfig = {
  output: {
    filename: "main.min.js"
  },
  module: {
    rules: [
      // {test: /modernizr/, loader: 'imports-loader?this=>window!exports-loader?window.Modernizr'},
      {
        test: /\.(js|jsx)$/,
        exclude: /(node_modules)/,
        loader: "babel-loader",
        query: {
          presets: [["env", { modules: false }]]
        }
      }
    ]
  }
};

config.paths.dist = config.isProd() ? "dist/build" : "dist/dev";

if (!config.isProd()) {
  webpackConfig.devtool = 'source-map';
}

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
  cache = require("gulp-cache"),
  webpack = require("webpack"),
  webpack = require("webpack"),
  webpackStream = require("webpack-stream");

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
  return (
    gulp
      .src(config.paths.assets.js)
      // .pipe(gulpIf(!config.isProd(), sourcemaps.init()))
      .pipe(
        webpackStream(webpackConfig),
        webpack
      )
      // .pipe(uglify())
      // .pipe(rename({ suffix: ".min" }))
      // .pipe(gulpIf(!config.isProd(), sourcemaps.write(".")))
      .pipe(gulp.dest(config.paths.dist + "/js"))
  );
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

// gulp.task("sass-libs", function() {
//   return gulp
//     .src(config.paths.libs.sass + "/libs.scss")
//     .pipe(plumber())
//     .pipe(sassGlob())
//     .pipe(gulpIf(!config.isProd(), sourcemaps.init()))
//     .pipe(sass())
//     .pipe(
//       postcss([
//         autoprefixer({ browsers: ["last 10 versions"] }),
//         mqpacker({
//           sort: true
//         })
//       ])
//     )
//     .pipe(cssnano())
//     .pipe(rename({ suffix: ".min" }))
//     .pipe(gulpIf(!config.isProd(), sourcemaps.write(".")))
//     .pipe(gulp.dest(config.paths.dist + "/css"))
//     .pipe(browserSync.reload({ stream: true }));
// });

// gulp.task("js-libs", function() {
//   return gulp
//     .src(config.paths.libs.js)
//     .pipe(
//       webpackStream(webpackConfig),
//       webpack
//     )
//     .pipe(uglify())
//     .pipe(rename({ name: "libs", suffix: ".min" }))
//     .pipe(gulp.dest(config.paths.dist + "/js"));
// });

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
  ["clean", "browser-sync", "js", "style", "img", "copy:fonts", "copy:html"],
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
  run("clean", "js", "style", "img", "copy:fonts", "copy:html", fn);
});

gulp.task("clear", function(callback) {
  return cache.clearAll();
});
