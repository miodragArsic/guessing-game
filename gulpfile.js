/*
 DEPENDENCIES
 ===========================================================
 */

'use strict';

var gulp = require('gulp');
var less = require('gulp-less');
var watch = require('gulp-watch');
var concat = require('gulp-concat');
var server = require('gulp-express');
var gulpif = require('gulp-if');
var sourcemaps = require('gulp-sourcemaps');
var runSequence = require('run-sequence');
var angularTemplates = require('gulp-angular-templatecache');
var minifyCSS = require('gulp-minify-css');
var uglify = require('gulp-uglifyjs');
var replace = require('gulp-replace');
var argv = require('yargs').argv;
var embedTemplates = require('gulp-angular-embed-templates');
var gutil = require('gulp-util');

var BRAND_NAME = 'smartliving';

if (argv.brand) {
    BRAND_NAME = argv.brand;
}

var BRAND_CONFIG = require('./assets/js/app/branding/' + BRAND_NAME + '/config.json');

/*
 PATHS
 ===========================================================
 */

var paths = {
    styles: {
        src: ['assets/css/**/*.css',
            'assets/css/*.css',
            'node_modules/leaflet/dist/leaflet.css',
            'assets/vendor/nvd3/nv.d3.css',
            'widgets/smartliving.widgets.css'

        ],
        dst: 'public/assets/css'
    },
    lessStyles: {
        all: 'assets/less/**/*.less',
        src: 'assets/less/main.less',
        dst: 'public/assets/css'
    },
    scripts: {
        src: [
            'assets/js/app.js',
            'assets/js/**/*.js',
            'widgets/smartliving.widgets.js'
        ],
        dst: 'public/assets/js'
    },
    vendorScripts: {
        src: [
            'assets/vendor/jquery/jquery-2.1.1.min.js',
            'assets/vendor/masonry/imagesloaded.pkgd.min.js',
            'assets/vendor/masonry/masonry.pkgd.min.js',
            'assets/vendor/codemirror/codemirror.js',
            'assets/vendor/codemirror/javascript.js',
            'assets/vendor/angular/angular.js',
            'assets/vendor/angular-mocks/angular-mocks.js',
            'assets/vendor/codemirror/ui-codemirror.js',
            'assets/vendor/angular/angular-local-storage.min.js',
            'assets/vendor/angular/angular-ui-router.min.js',
            'assets/vendor/moment/moment.js',
            'assets/vendor/moment/angular-moment.min.js',
            'assets/vendor/angular/angular-animate.min.js',
            'assets/vendor/masonry/angular-masonry.min.js',
            'assets/vendor/select/select.js',
            'assets/vendor/bootstrap/modal.js',
            'assets/vendor/bootstrap/transition.js',
            'assets/vendor/mousewheel/jquery.mousewheel.min.js',
            'assets/vendor/stompjs/stomp.min.js',
            'assets/vendor/sockjs/sockjs-0.3.4.min.js',
            'assets/vendor/capplive/capp.messaging.js',
            'assets/vendor/angular-aria/angular-aria.min.js',
            'assets/vendor/angular-material/angular-material.js',
            'assets/vendor/angular-knob/angular-knob.js',
            'assets/vendor/jquery-knob/jquery.knob.js',
            'assets/vendor/json-formatter/json-formatter.js',
            'assets/vendor/angular-color-picker/angular-spectrum-colorpicker.js',
            'assets/vendor/spectrum/spectrum.js',
            'assets/vendor/qrcode/lib/qrcode.js',
            'assets/vendor/angular-qr/angular-qr.min.js',
            'assets/vendor/d3/d3.min.js',
            'assets/vendor/nvd3/nv.d3.min.js',
            'assets/vendor/angular-nvd3/angular-nvd3.min.js',
            'assets/vendor/angular-sanitize/angular-sanitize.min.js',
            'assets/vendor/showdown/compressed/Showdown.min.js',
            'assets/vendor/angular-markdown-directive/markdown.js',
            'assets/vendor/angular-ripple/angular-ripple.js',
            'assets/vendor/offline/offline.js',
            'assets/vendor/angular-tooltip/angular-tooltips.min.js',
            'node_modules/angular-simple-logger/dist/angular-simple-logger.js',
            'node_modules/leaflet/dist/leaflet.js',
            'node_modules/angular-leaflet-directive/dist/angular-leaflet-directive.js',
            'assets/vendor/fileSaver/fileSaver.js',
            'assets/vendor/angular-dragdrop/angular-drag-and-drop-lists.js',
            'bower_components/ngtouch/build/ngTouch.min.js',
            'bower_components/angular-intercom/angular-intercom.js'
        ],
        dst: 'public/assets/js'
    },
    angularTemplates: {
        src: 'assets/js/**/*.html',
        dst: 'public/assets/js'
    }
};

/*
 CSS STYLES
 ===========================================================
 */

gulp.task('build:styles_development', function() {
    return gulp.src(paths.styles.src)
        .pipe(concat('styles.css'))
        .pipe(gulp.dest(paths.styles.dst));
});

gulp.task('build:styles_production', function() {
    return gulp.src(paths.styles.src)
        .pipe(concat('styles.css'))
        .pipe(minifyCSS())
        .pipe(gulp.dest(paths.styles.dst));
});

gulp.task('watch:styles', function() {
    watch(paths.styles.src, function(files, callback) {
        gulp.start('build:styles_development', callback);
    });
});

/*
    LESS STYLES
    ===========================================================
 */

gulp.task('build:less_styles_development', function() {
    return gulp.src(paths.lessStyles.src)
        .pipe(sourcemaps.init())
        .pipe(replace('%BRAND_COLOR%', BRAND_CONFIG.brandColor))
        .pipe(less())
        .pipe(concat('main.css'))
        .pipe(sourcemaps.write())
        .pipe(gulp.dest(paths.lessStyles.dst));
});

gulp.task('build:less_styles_production', function() {
    return gulp.src(paths.lessStyles.src)
        .pipe(replace('%BRAND_COLOR%', BRAND_CONFIG.brandColor))
        .pipe(less())
        .pipe(concat('main.css'))
        .pipe(minifyCSS())
        .pipe(gulp.dest(paths.lessStyles.dst));
});

gulp.task('watch:less_styles', function() {
    watch(paths.lessStyles.all, function(files, callback) {
        gulp.start('build:less_styles_development', callback);
    });
});

/*
 SCRIPTS
 ===========================================================
 */
gulp.task('build:scripts_development', function() {
    return gulp.src(paths.scripts.src)
        .pipe(gulpif(argv.APIURL != null, replace('%CONFIGURATION_API_URL%', argv.APIURL), replace('%CONFIGURATION_API_URL%', 'https://apidev.smartliving.io/')))
        // .pipe(gulpif(argv.APIURL != null, replace('%CONFIGURATION_API_URL%', argv.APIURL), replace('%CONFIGURATION_API_URL%', 'http://192.168.1.108:8001/')))
        .pipe(gulpif(argv.APICLIENTID != null, replace('%CONFIGURATION_API_CLIENTID%', argv.APICLIENTID), replace('%CONFIGURATION_API_CLIENTID%', 'maker_local')))
        .pipe(gulpif(argv.BROKERURL != null, replace('%CONFIGURATION_BROKER_URL%', argv.BROKERURL), replace('%CONFIGURATION_BROKER_URL%', 'https://brokerdev.smartliving.io')))
        .pipe(gulpif(argv.BROKERPORT != null, replace('%CONFIGURATION_BROKER_PORT%', argv.BROKERPORT), replace('%CONFIGURATION_BROKER_PORT%', '15671')))
        .pipe(gulpif(argv.BROKERSOURCEROOT != null, replace('%CONFIGURATION_BROKER_SOURCE_ROOT%', argv.BROKERSOURCEROOT), replace('%CONFIGURATION_BROKER_SOURCE_ROOT%', '/exchange/root/')))
        .pipe(gulpif(argv.WIDGETHOSTURL != null, replace('%CONFIGURATION_WIDGET_HOSTURL%', argv.WIDGETHOSTURL), replace('%CONFIGURATION_WIDGET_HOSTURL%', 'http://widget.smartliving.io')))
        .pipe(gulpif(argv.ORIGIN != null, replace('%CONFIGURATION_ORIGIN%', argv.ORIGIN), replace('%CONFIGURATION_ORIGIN%', 'https://feature-create-kit-device.firebaseapp.com')))
        .pipe(gulpif(argv.PUBLICTOKEN != null, replace('%CONFIGURATION_PUBLIC_TOKEN%', argv.PUBLICTOKEN), replace('%CONFIGURATION_PUBLIC_TOKEN%', '0LLHtj3ytaYIg2XyAB-5NjyTY1edZVL1td3l2SJx7wKwEG')))
        .pipe(gulpif(argv.PUBLICCLIENTID != null, replace('%CONFIGURATION_PUBLIC_CLIENT_ID%', argv.PUBLICCLIENTID), replace('%CONFIGURATION_PUBLIC_CLIENT_ID%', 'guest_user')))
        .pipe(gulpif(argv.PUBLICCLIENTKEY != null, replace('%CONFIGURATION_PUBLIC_CLIENT_KEY%', argv.PUBLICCLIENTKEY), replace('%CONFIGURATION_PUBLIC_CLIENT_KEY%', 'guest_user')))
        .pipe(replace('%BRAND_CONFIG%', JSON.stringify(BRAND_CONFIG)))
        .pipe(replace('%USE_INTERCOM%', 'false'))
        .pipe(sourcemaps.init())
        .pipe(concat('app.js'))
        .pipe(sourcemaps.write())
        .pipe(gulp.dest(paths.scripts.dst));
});

gulp.task('build:scripts_production', function() {
    return gulp.src(paths.scripts.src)
        .pipe(gulpif(argv.APIURL != null, replace('%CONFIGURATION_API_URL%', argv.APIURL), replace('%CONFIGURATION_API_URL%', 'https://api.smartliving.io/')))
        .pipe(gulpif(argv.APICLIENTID != null, replace('%CONFIGURATION_API_CLIENTID%', argv.APICLIENTID), replace('%CONFIGURATION_API_CLIENTID%', 'maker')))
        .pipe(gulpif(argv.BROKERURL != null, replace('%CONFIGURATION_BROKER_URL%', argv.BROKERURL), replace('%CONFIGURATION_BROKER_URL%', 'https://broker.smartliving.io')))
        .pipe(gulpif(argv.BROKERPORT != null, replace('%CONFIGURATION_BROKER_PORT%', argv.BROKERPORT), replace('%CONFIGURATION_BROKER_PORT%', '15671')))
        .pipe(gulpif(argv.BROKERSOURCEROOT != null, replace('%CONFIGURATION_BROKER_SOURCE_ROOT%', argv.BROKERSOURCEROOT), replace('%CONFIGURATION_BROKER_SOURCE_ROOT%', '/exchange/root/')))
        .pipe(gulpif(argv.WIDGETHOSTURL != null, replace('%CONFIGURATION_WIDGET_HOSTURL%', argv.WIDGETHOSTURL), replace('%CONFIGURATION_WIDGET_HOSTURL%', 'http://widget.smartliving.io')))
        .pipe(gulpif(argv.ORIGIN != null, replace('%CONFIGURATION_ORIGIN%', argv.ORIGIN), replace('%CONFIGURATION_ORIGIN%', 'https://maker.smartliving.io')))
        .pipe(gulpif(argv.PUBLICTOKEN != null, replace('%CONFIGURATION_PUBLIC_TOKEN%', argv.PUBLICTOKEN), replace('%CONFIGURATION_PUBLIC_TOKEN%', '0LLveDEB16K8pCC9O0-GughGYAppWivwTOwlDHq1ryQihT')))
        .pipe(gulpif(argv.PUBLICCLIENTID != null, replace('%CONFIGURATION_PUBLIC_CLIENT_ID%', argv.PUBLICCLIENTID), replace('%CONFIGURATION_PUBLIC_CLIENT_ID%', 'guest_user')))
        .pipe(gulpif(argv.PUBLICCLIENTKEY != null, replace('%CONFIGURATION_PUBLIC_CLIENT_KEY%', argv.PUBLICCLIENTKEY), replace('%CONFIGURATION_PUBLIC_CLIENT_KEY%', 'guest_user')))
        .pipe(replace('%BRAND_CONFIG%', JSON.stringify(BRAND_CONFIG)))
        .pipe(replace('%USE_INTERCOM%', 'true'))
        .pipe(concat('app.js'))
        .pipe(uglify())
        .pipe(gulp.dest(paths.scripts.dst));
});

gulp.task('watch:scripts', function() {
    watch(paths.scripts.src, function(files, callback) {
        gulp.start('build:scripts_development', callback);
    });
});

/*
 VENDOR SCRIPTS
 ===========================================================
 */

gulp.task('build:vendor_scripts_development', function() {
    return gulp.src(paths.vendorScripts.src)
        .pipe(concat('vendor.js'))
        //.pipe(uglify())
        .pipe(gulp.dest(paths.vendorScripts.dst));
});

gulp.task('build:vendor_scripts_production', function() {
    return gulp.src(paths.vendorScripts.src)
        .pipe(concat('vendor.js'))
        .pipe(uglify())
        .pipe(gulp.dest(paths.vendorScripts.dst));
});

gulp.task('watch:vendor_scripts', function() {
    watch(paths.vendorScripts.src, function(files, callback) {
        gulp.start('build:vendor_scripts_development', callback);
    });
});

/*
 ANGULAR TEMPLATES
 ===========================================================
 */

gulp.task('build:angular_templates_production', function() {
    return gulp.src(paths.angularTemplates.src)
        .pipe(replace(/test-id=["']([^'"]+)["']/g, ''))
        .pipe(angularTemplates({
            root: '/assets/js/',
            module: 'app'
        }))
        .pipe(concat('templates.js'))
        .pipe(replace('%BRAND_NAME%', BRAND_NAME))
        .pipe(uglify())
        .pipe(gulp.dest(paths.angularTemplates.dst));
});

gulp.task('build:angular_templates_development', function() {
    return gulp.src(paths.angularTemplates.src)
        .pipe(angularTemplates({
            root: '/assets/js/',
            module: 'app'
        }))
        .pipe(sourcemaps.init())
        .pipe(concat('templates.js'))
        .pipe(replace('%BRAND_NAME%', BRAND_NAME))
        .pipe(sourcemaps.write())
        .pipe(gulp.dest(paths.angularTemplates.dst));
});

gulp.task('build:index', function() {

    var hash = '';
    var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (var i = 0; i < 12; i++) {
        hash += possible.charAt(Math.floor(Math.random() * possible.length));
    }

    gulp.src('assets/index.html')
        .pipe(replace('@@hash', hash))
        .pipe(gulp.dest('public'));
});

gulp.task('watch:index', function() {
    watch('assets/index.html', function(files, callback) {
        gulp.start('build:index', callback);
    });
});

gulp.task('build:webconfig_development', function() {
    gulp.src('assets/web_dev.config')
        .pipe(concat('web.config'))
        .pipe(gulp.dest('public'));
});

gulp.task('build:webconfig_production', function() {
    gulp.src('assets/web_master.config')
        .pipe(concat('web.config'))
        .pipe(gulp.dest('public'));
});

gulp.task('watch:angular_templates', function() {
    watch(paths.angularTemplates.src, function(files, callback) {
        gulp.start('build:angular_templates_development', callback);
    });
});

/*
 TASKS
 ===========================================================
 */

gulp.task('build_development', [
    'build:styles_development',
    'build:less_styles_development',
    'build:scripts_development',
    'build:vendor_scripts_development',
    'build:angular_templates_development',
    'build:index',
    'build:webconfig_development'
]);

gulp.task('watch', [
    'watch:styles',
    'watch:less_styles',
    'watch:scripts',
    'watch:vendor_scripts',
    'watch:angular_templates',
    'watch:index'
]);

gulp.task('build_production', [
    'build:styles_production',
    'build:less_styles_production',
    'build:scripts_production',
    'build:vendor_scripts_production',
    'build:angular_templates_production',
    'build:index',
    'build:webconfig_production'
]);

gulp.task('default', function(callback) {
    runSequence('build_development', 'watch', callback);
});

gulp.task('dev', function(callback) {
    runSequence('build_development', callback);
});

gulp.task('production', function(callback) {
    runSequence('build_production', callback);
});
