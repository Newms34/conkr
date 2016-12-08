/*GULP:
Gulp is a node package that concatenates your files. It basically can convert a whole bunch of files (i.e., your whole js tree structure) into just ONE, minified file. At the time of writing, that reduces the js payload from 22kb to just 7kb. 
More importantly, it also means our user's browser only needs to fetch ONE file (all.min.js), instead of... however many i create. 
*/

var gulp = require('gulp');
var jshint = require('gulp-jshint');
var sass = require('gulp-sass');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var rename = require('gulp-rename');
var kid = require('child_process');
var ps = require('ps-node');
var gutil = require('gulp-util');
var cleany = require('gulp-clean-css')
var babel = require('gulp-babel');
// Lint Task
gulp.task('lint', function() {
    return gulp.src(['build/js/controllers/*.js','build/js/factories/*.js'])
        .pipe(jshint({esversion:6}))
        .pipe(jshint.reporter('default'));
});

// Compile Our Sass
gulp.task('sass', function() {
    return gulp.src(['build/scss/*.scss', 'build/scss/**/*.scss'])
        .pipe(sass())
        .pipe(concat('styles.css'))
        .pipe(cleany())
        .pipe(gulp.dest('public/css'));
});
// Concatenate & Minify JS
gulp.task('scripts', function() {
    return gulp.src(['build/js/misc/*.js','build/js/controllers/*.js','build/js/factories/*.js'])
        .pipe(concat('all.js'))
        .pipe(gulp.dest('public/js'))
        .pipe(rename('all.min.js'))
        .pipe(babel({presets: ['es2015']}))
        .pipe(uglify({ mangle: false }).on('error', gutil.log))
        .pipe(gulp.dest('public/js'));
});

gulp.task('checkDB', function() {
    if (process.platform == 'win32' && process.env.USERNAME == 'Newms') {
        console.log('Checking to see if mongod already running!');
        ps.lookup({ command: 'mongod' }, function(e, f) {
            if (!f.length){
                //database not already running, so start it up!
                kid.exec('c: && cd c:\\mongodb\\bin && start mongod -dbpath "d:\\data\\mongo\\db" && pause',function(err,stdout,stderr){
                    if (err) console.log('Uh oh! An error of "',err,'" prevented the DB from starting!');
                })
            }else{
                console.log('mongod running!')
            }
        })
    }
})

// Watch Files For Changes
gulp.task('watch', function() {
    gulp.watch(['build/js/*.js', 'build/js/**/*.js'], ['lint', 'scripts']);
    gulp.watch(['build/scss/*.scss', 'build/scss/**/*.scss'], ['sass']);
});

//no watchin!
gulp.task('render', ['lint', 'sass', 'scripts'])

// Default Task
gulp.task('default', ['lint', 'sass', 'scripts', 'checkDB', 'watch']);
