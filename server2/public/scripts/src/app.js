
define([
    'angular',
    'angularRoute',
    'angularAnimate',
    'angularLocalStorage',
    'angularToastr',
    'cryptojslib',
    'controllers',
    'services',
    'ui',
    'moment',
    'bootstrapLightbox'

], function (angular) {
    'use strict';

    var mainApp =  angular.module('mainApp', [
        'ngRoute',
        'ngAnimate',
        'LocalStorageModule',
        'toastr',
        'myAppServices',
        'mainAppControllers',
        'ui.bootstrap',
        'bootstrapLightbox'

    ]);


    mainApp.config(['$httpProvider',function ($httpProvider) {
        $httpProvider.interceptors.push('TokenInterceptor');
    }]);

    mainApp.config(function(toastrConfig) {
        angular.extend(toastrConfig, {
            allowHtml: false,
            closeButton: true,
            closeHtml: '<button>&times;</button>',
            containerId: 'toast-container',
            extendedTimeOut: 2000,
            iconClasses: {
                error: 'toast-error',
                info: 'toast-info',
                success: 'toast-success',
                warning: 'toast-warning'
            },
            maxOpened: 0,
            messageClass: 'toast-message',
            newestOnTop: true,
            onHidden: null,
            onShown: null,
            positionClass: 'toast-top-full-width',
            preventDuplicates: false,
            progressBar: false,
            tapToDismiss: true,
            target: 'body',
            templates: {
                toast: 'directives/toast/toast.html',
                progressbar: 'directives/progressbar/progressbar.html'
            },
            timeOut: 5000,
            titleClass: 'toast-title',
            toastClass: 'toast'
        });
    });


    mainApp.config(['$routeProvider',
        function($routeProvider) {

            $routeProvider.
                when('/login', {
                    templateUrl: 'partials/login',
                    controller: 'LoginCtrl',
                    controllerAs: 'vm',
                    access: { requiredLogin: false }
                }).
                when('/register', {
                    templateUrl: 'partials/register',
                    controller: 'RegistrationCtrl',
                    controllerAs: 'vm',
                    access: { requiredLogin: false }
                }).
                when('/home', {
                    templateUrl: 'partials/auth/home',
                    controller: 'HomeCtrl',
                    controllerAs: 'vm',
                    resolve: {
                        data : function(Resolver,ResourceService){
                            return Resolver([ResourceService.getPeople(true)])
                        }
                    },
                    access: { requiredLogin: true }
                }).
                when('/person/:id', {
                    templateUrl: 'partials/auth/person',
                    controller: 'PersonCtrl',
                    controllerAs: 'vm',
                    access: { requiredLogin: true }
                }).
                when('/shots/:id', {
                    templateUrl: 'partials/auth/thing',
                    controller: 'ThingCtrl',
                    controllerAs: 'vm',
                    access: { requiredLogin: true }
                }).
                otherwise({
                    redirectTo: '/home' // login
                });
        }

    ]);


    mainApp.run(['$rootScope','$location','AuthenticationService',function($rootScope, $location, AuthenticationService) {
        $rootScope.$on("$routeChangeStart", function(event, nextRoute, currentRoute) {
            /*
            if (nextRoute.access===undefined) {
                $location.path("/login");
            }else if (nextRoute.access.requiredLogin && !AuthenticationService.isLogged()) {
                $location.path("/login");
            }else if (AuthenticationService.isLogged() && !nextRoute.access.requiredLogin) {
                $location.path("/home");
            }*/
        });
    }]);

    mainApp.filter('cut', function () {
        return function (value, wordwise, max, tail) {
            if (!value) return '';

            max = parseInt(max, 10);
            if (!max) return value;
            if (value.length <= max) return value;

            value = value.substr(0, max);
            if (wordwise) {
                var lastspace = value.lastIndexOf(' ');
                if (lastspace != -1) {
                    value = value.substr(0, lastspace);
                }
            }

            return value + (tail || ' …');
        };
    });

    mainApp.filter('formatDate', function () {
        return function (value) {
            if (!value) return '';

            return moment(value).format("YYYY-MM-DD HH:mm:ss");

        };
    });


    return mainApp;


});




