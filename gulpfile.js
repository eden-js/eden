/**
 * Created by Awesome on 1/30/2016.
 */

'use strict';

// import dependancies
var gulp       = require('gulp');
var rename     = require('gulp-rename');
var sass       = require('gulp-sass');
var babel      = require('gulp-babel');
var through    = require('through2');
var path       = require('path');
var uglify     = require('gulp-uglifyjs');
var routing    = require('./bin/util/gulp.routing');
var fs         = require('fs');
var del        = require('del');
var server     = require('gulp-express');
var minifyCss  = require('gulp-minify-css');
var sourcemaps = require('gulp-sourcemaps');

/**
 * GULP TASKS
 */

// gulp sass task
gulp.task('sass', function () {
    gulp.src(['node_modules/bootstrap/scss/bootstrap-flex.scss', './sass/**/bootstrap.scss'])
        .pipe(sourcemaps.init())
        .pipe(sass.sync().on('error', sass.logError))
        .pipe(minifyCss())
        .pipe(rename('app.min.css'))
        .pipe(sourcemaps.write('./'))
        .pipe(gulp.dest('./www/assets/css'));
});

// gulp routes task
gulp.task('routes', function () {
    var allRoutes = {};
    gulp.src('./app/bundles/**/*Controller.js')
        .pipe(through.obj(routing))
        .on('data', function (data) {
            MergeRecursive(allRoutes, data.routes);
        })
        .on('end', function () {
            fs.writeFile('./cache/routes.json', JSON.stringify(allRoutes), function (err) {
                if (err) {
                    return console.log(err);
                }
            });
        });
});

// gulp views task
gulp.task('views', function() {
    gulp.src(['./app/bundles/*/view/**/*.hbs', './bin/bundles/*/view/**/*.hbs'])
        .pipe(rename(function(filePath) {
            var amended = filePath.dirname.split(path.sep);
            amended.shift();
            amended.shift();
            filePath.dirname = amended.join(path.sep);
        }))
        .pipe(gulp.dest('cache/view'));
});

/**
 * GULP WATCH TASKS
 */

// gulp sass watch task
gulp.task('sass:watch', function () {
    gulp.watch('./sass/**/*.scss', ['sass']);
});

// gulp routes watch task
gulp.task('routes:watch', function () {
    gulp.watch('./app/bundles/**/*Controller.js', ['routes']);
});

// gulp routes watch task
gulp.task('views:watch', function () {
    gulp.watch('./app/bundles/**/*.hbs', ['views']);
});

// main gulp watch task
gulp.task('watch', ['sass:watch', 'routes:watch', 'views:watch']);

// full server task
gulp.task('devServer', function () {
    // Start the server at the beginning of the task
    server.run(['./bin/server.js']);

    // watch sass pipe
    gulp.watch(['./sass/**/*.scss'], function(event){
        gulp.run('sass');
        server.notify(event);
    });

    // watch routes pipe
    gulp.watch(['./app/bundles/**/*Controller.js'], function(event){
        gulp.run('routes');
        server.notify(event);
    });

    // watch javascript
    gulp.watch(['./app/**/*.js'], function(event) {
        server.notify(event);
    });
});

// set default task devServer
gulp.task('default', ['devServer']);

/**
 * recursively merge object
 * @param obj1
 * @param obj2
 * @returns {*}
 * @constructor
 */
function MergeRecursive(obj1, obj2) {
    for (var p in obj2) {
        try {
            // Property in destination object set; update its value.
            if (obj2[p].constructor == Object) {
                obj1[p] = MergeRecursive(obj1[p], obj2[p]);
            } else {
                obj1[p] = obj2[p];
            }
        } catch (e) {
            // Property in destination object not set; create it and set its value.
            obj1[p] = obj2[p];
        }
    }

    return obj1;
}