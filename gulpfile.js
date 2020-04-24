/*GULP:
Gulp is a node package that concatenates your files. It basically can convert a whole bunch of files (i.e., your whole js tree structure) into just ONE, minified file. At the time of writing, that reduces the js payload from 22kb to just 7kb. 
More importantly, it also means our user's browser only needs to fetch ONE file (all.min.js), instead of... however many i create. 
*/

const gulp = require('gulp'),
    tscConfig = require('./tsconfig.json'),
    typescript = require('gulp-typescript'),
    sourcemaps = require('gulp-sourcemaps'),
    jshint = require('gulp-jshint'),
    sass = require('gulp-sass'),
    concat = require('gulp-concat'),
    uglify = require('gulp-uglify'),
    rename = require('gulp-rename'),
    kid = require('child_process'),
    ps = require('ps-node'),
    gutil = require('gulp-util'),
    cleany = require('gulp-clean-css'),
    babel = require('gulp-babel'),
    ngAnnotate = require('gulp-ng-annotate');
// Lint Task
gulp.task('lint', function () {
    return gulp.src(['build/js/controllers/*.js', 'build/js/factories/*.js'])
        .pipe(jshint({
            esversion: 6
        }))
        .pipe(jshint.reporter('default'));
});

// Compile Our Sass
gulp.task('sass', function () {
    return gulp.src(['build/scss/*.scss', 'build/scss/**/*.scss'])
        .pipe(sass())
        .pipe(concat('styles.css'))
        .pipe(cleany())
        .pipe(gulp.dest('public/css'));
});
// Concatenate & Minify JS
// gulp.task('scripts', function () {
//     return gulp.src(['build/js/misc/*.js', 'build/js/controllers/*.js', 'build/js/factories/*.js'])
//         .pipe(concat('all.js'))
//         .pipe(gulp.dest('public/js'))
//         .pipe(rename('all.min.js'))
//         .pipe(babel({
//             presets: ['es2015']
//         }))
//         .pipe(ngAnnotate())
//         .pipe(uglify().on('error', gutil.log))
//         .pipe(gulp.dest('public/js'));
// });

gulp.task('copy:libs', ['clean'], function() {
    return gulp.src([
        // 'node_modules/angular2/bundles/angular2-polyfills.js',
        'node_modules/systemjs/dist/system.src.js',
        'node_modules/rxjs/bundles/Rx.js',
        'node_modules/angular2/bundles/angular2.dev.js',
        // 'node_modules/angular2/bundles/router.dev.js'
      ])
      .pipe(gulp.dest('dist/lib'))
  });

gulp.task('scripts', function () {
    return gulp.src('build/js/src/**/*.ts')
        .pipe(sourcemaps.init()) // <--- sourcemaps
        .pipe(typescript(tscConfig.compilerOptions))
        .pipe(sourcemaps.write('.')) // <--- sourcemaps
        .pipe(gulp.dest('dist/app'));
});

gulp.task('checkDB', function () {
    if (process.platform == 'win32' && process.env.USERNAME == 'Newms') {
        console.log('Checking to see if mongod already running!');
        ps.lookup({
            command: 'mongod'
        }, function (e, f) {
            if (!f.length) {
                //database not already running, so start it up!
                kid.exec('c: && cd C:\Program Files\MongoDB\Server\4.2\bin && start mongod -dbpath "e:\mongodata" && pause', function (err, stdout, stderr) {
                    if (err) console.log('Uh oh! An error of "', err, '" prevented the DB from starting!');
                })
            } else {
                console.log('mongod running!')
            }
        })
    }
})

// Watch Files For Changes
gulp.task('watch', function () {
    gulp.watch(['build/js/*.js', 'build/js/**/*.js'], ['lint', 'scripts']);
    gulp.watch(['build/scss/*.scss', 'build/scss/**/*.scss'], ['sass']);
});

//no watchin!
// gulp.task('render', ['lint', 'sass', 'scripts'])

// Default Task
// gulp.task('default', ['lint', 'sass', 'scripts', 'checkDB', 'watch']);

//task to simply create everything without actually watching or starting the DB
gulp.task('render', gulp.series('lint', 'sass', 'scripts'))

// Default Task
gulp.task('default', gulp.series('lint', 'sass', 'scripts', 'checkDB', 'watch'));