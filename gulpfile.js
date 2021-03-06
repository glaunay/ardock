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
    plumber = require("gulp-plumber"),
   // path         = require("path"),
    source       = require("vinyl-source-stream"),
    util         = require("gulp-util"),
    watchify     = require("watchify"),
    minify = require('gulp-minify'),
    concat = require('gulp-concat'),
    uglify = require('gulp-uglify'),
    babel = require('gulp-babel'),

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
            /*.pipe(plumber({
                errorHandler: function (err) {
                util.log.bind(util, "Browserify Error");
                //console.log(err);
                this.emit('end');
                }
            }))
            */
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

/*
gulp.task('compress', function() {
  gulp.src('./js/bundleTest.js')
    .pipe(minify({
        ext:{
            src:'-debug.js',
            min:'.js'
        },
        exclude: ['tasks'],
        ignoreFiles: ['.combo.js', '-min.js']
    }).on('error', util.log))
    .pipe(gulp.dest('./js/bundleTest-min.js'))
});
*/


/* GL - 2017/12/22
gulp-uglify Cant handle ES6 arrow function
We use babel to transpile into ES5
symbol still remains udenfined, maybe a mangling/whitespace retrieval error,
WE cant provide minified version yet
*/
gulp.task('compress', function() {
    return gulp.src('./js/bundleTest.js')
            .pipe(babel({
                presets: ['env']
            }))
        /*.pipe(concat('./js/scripts.js'))
        .pipe(gulp.dest('./js/scripts-tmp.js'))
        .pipe(rename('scripts.min.js'))*/
        .pipe(uglify({mangle: false, compress:false}))
        .on('error',  util.log)
        .pipe(gulp.dest('./js/minified'));
});

/*
gulp.task('default', () =>
    gulp.src('src/app.js')
        .pipe(babel({
            presets: ['env']
        }))
        .pipe(gulp.dest('dist'))
);
*/


gulp.task('server', function (cb) {
    //spawn('node', ['index.js', '--conf', '../default.conf', '--http','--slurm','-p','3'], { stdio: 'inherit' })
    spawn('node', ['index.js', '--conf', './node_modules/nslurm/config/arwen-dev_ardockConf.json', '--set', '../webServer.conf', '--http','--slurm','-p','5','-d', '/data/dev/ardock/tmp/persistantNslurmCache_dvl'], { stdio: 'inherit' })
     /*
 exec('node index.js --conf ../default.conf --http', function (err, stdout, stderr) {
    console.log(stdout);
    console.log(stderr);
    cb(err);
  });
  */
});

gulp.task("compile", ["watch","js"]);
gulp.task("default", ["watch", "js", "server"]);


/* Restore a 5 probes job w/ key -> Error in calc
 45d41555-fbe5-4e31-9a33-d02d6b5254ca
 */


 /* Restore a 5 probes job w/ key => OK
    45d41555-fbe5-4e31-9a33-d02d6b5254ca

 */