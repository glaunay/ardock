/*
npm install --save-dev gulp browserify browserify-css gulp-rename watchify vinyl-buffer vinyl-source-stream gulp-util


cp node_modules/dist/socket.io.js node_modules/dist/
rm -rf  node_modules/ngl*
cp -r ngl-bak/* node_modules/

*/

"use strict";
const
    rename = require("gulp-rename"),
    spawn = require('child_process').spawn,
    browserify = require("browserify"),
    buffer       = require("vinyl-buffer"),
    gulp         = require("gulp"),
   // path         = require("path"),
    source       = require("vinyl-source-stream"),
    util         = require("gulp-util"),
    watchify     = require("watchify"),
    src = {
        js: ["./app.js"]
    },
    dest = {
        js: "./js"
    },
    path = [ __dirname + '/web/css', __dirname + '/web/js'],
    transform = ['browserify-css']
    ;
let bundler;
function bundles(profile) {
    if (bundler === undefined) {
        if (profile === "watch") {
            //bundler = watchify(browserify(src.js));
            bundler = watchify(browserify({entries : src.js, transform: [ transform ], path : [path] }));
        } else {
            bundler = watchify(browserify({entries : src.js, transform: [ transform ], path : [path] }));
            //bundler = browserify(src.js);
        }
    }
    bundle();
}
function bundle() {
    let start = new Date().getTime(),
        _ = bundler
            .bundle()
            .on("error", util.log.bind(util, "Browserify Error"))
            .pipe(source("main.js"))
            .pipe(buffer())
            .pipe(rename("bundleTest.js"))
            .pipe(gulp.dest(dest.js)),
        time = new Date().getTime() - start;
    util.log("[browserify] rebundle took ", util.colors.cyan(`${time} ms`), util.colors.grey(`(${src.js})`));
    return _;
}
gulp.task("js", bundles.bind(null));
gulp.task("watch", function () {
    bundles("watch");
    bundler.on("update", bundle.bind(null));
});

gulp.task('server', function (cb) {

    spawn('node', ['index.js', '--conf', '../default.conf', '--http'], { stdio: 'inherit' })

 /*
 exec('node index.js --conf ../default.conf --http', function (err, stdout, stderr) {
    console.log(stdout);
    console.log(stderr);
    cb(err);
  });
  */
});


gulp.task("default", ["watch", "js", "server"]);
