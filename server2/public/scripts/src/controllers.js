define(['angular'], function (angular) {
    'use strict';

    var mainAppControllers = angular.module('mainAppControllers', []);
    mainAppControllers.controller('NavCtrl', ['$location', 'localStorageService', 'AuthenticationService', NavCtrl]);
    mainAppControllers.controller('LoginCtrl', ['$location', 'ResourceService' ,'CryptoJSService', 'localStorageService', 'toastr' ,LoginCtrl]);
    mainAppControllers.controller('RegistrationCtrl', ['ResourceService', 'CryptoJSService', 'toastr', RegistrationCtrl]);
    mainAppControllers.controller('HomeCtrl', ['ResourceService', 'data', 'toastr', HomeCtrl]);
    mainAppControllers.controller('PersonCtrl', ['ResourceService', 'toastr', '$location', PersonCtrl]);
    mainAppControllers.controller('ThingCtrl', ['ResourceService', 'toastr', '$location', 'Lightbox', ThingCtrl]);
    mainAppControllers.controller('ProvaCtrl', [ProvaCtrl]);

    function ProvaCtrl() {
        var vm = this;
        vm.user = "";
    }

    ProvaCtrl.prototype.printHello = function()
    {
        var vm = this;
        return "Hello World "+vm.user;
    };


    function NavCtrl($location, localStorageService, AuthenticationService)
    {
        var vm = this;
        vm.$location = $location;
        vm.localStorageService = localStorageService;
        vm.isAuthenticated = AuthenticationService.isLogged()
    }

    NavCtrl.prototype.logout = function ()
    {
        var vm = this;
        vm.localStorageService.clearAll();
        vm.$location.path("/login");
    };



    function LoginCtrl ($location, ResourceService, CryptoJS, localStorageService, toastr)
    {
        var vm = this;
        vm.$location = $location;
        vm.ResourceService = ResourceService;
        vm.CryptoJS = CryptoJS;
        vm.localStorageService = localStorageService;
        vm.toastr = toastr;

        vm.failed_login = "";
    }

    LoginCtrl.prototype.submit = function()
    {
        var vm = this;
        var salt = vm.username;
        var enc_password = CryptoJS.PBKDF2(vm.password, salt, { keySize: 256/32 });

        var user = {"username": vm.username, "password": enc_password.toString()};

        if(vm.username!==undefined || vm.password !==undefined){

            vm.ResourceService.login(user).then(function(data){
                vm.localStorageService.set("auth_token",data.auth_token);
                vm.$location.path("/home");
            },function(data, status) {
                if(status===401){
                    vm.toastr.error('Wrong username and/or password!');
                }else{
                    vm.toastr.error(data);
                }
            });

        }else{
            noty({text: 'Username and password are mandatory!',  timeout: 2000, type: 'error'});
        }
    };

    function RegistrationCtrl (ResourceService, CryptoJS, toastr)
    {
        var vm = this;
        vm.ResourceService = ResourceService;
        vm.CryptoJS = CryptoJS;
        vm.toastr = toastr;
    }

    RegistrationCtrl.prototype.signup = function()
    {
        var vm = this;
        var salt = vm.username;

        var enc_password = CryptoJS.PBKDF2(vm.password, salt, { keySize: 256/32 });
        var enc_check_password = CryptoJS.PBKDF2(vm.check_password, salt, { keySize: 256/32 });

        var user = {"username": vm.username, "password": enc_password.toString(), "check_password" : enc_check_password.toString() };

        if(vm.username!==undefined || vm.password !==undefined || vm.check_password !==undefined){
            if(vm.password !== vm.check_password){
                vm.toastr.warning('password and check_password must be the same!');
            }else{
                vm.ResourceService.signup(user).then(function(){
                    vm.toastr.success('User successfully registered!');
                    vm.username = null;
                    vm.password = null;
                    vm.check_password = null;
                },function(data) {
                    vm.toastr.error(data.message);
                });
            }
        }else{
            noty({text: 'Username and password are mandatory!',  timeout: 2000, type: 'warning'});
        }
    };


    function HomeCtrl(ResourceService, data, toastr)
    {
        var vm = this;
        vm.ResourceService = ResourceService;
        vm.data = data;
        vm.toastr = toastr;
        console.log("DATA", data);
        vm.people = data[0].result;
        //vm.things = data[1].things;
    }

    HomeCtrl.prototype.updatePerson = function(index, modify)
    {
        var vm = this;
        var person = vm.people[index];

        if(modify){
            vm.people[index].modify=true;
        }else{
            vm.ResourceService.updatePerson(person).then(function(){
                vm.people[index].modify=false;
                vm.toastr.success("Person successfully updated!");
            },function(data, status) {
                if(status!==401){
                    vm.toastr.error(data);
                }
            });
        }
    };

    HomeCtrl.prototype.updateThing = function(index, modify)
    {
        var vm = this;
        var thing = vm.things[index];

        if(modify){
            vm.things[index].modify=true;
        }else{

            vm.ResourceService.updateThing(thing).then(function(){
                vm.things[index].modify=false;
                vm.toastr.success("Thing successfully updated!");
            },function(data, status) {
                if(status!==401){
                    vm.toastr.error(data);
                }
            });
        }
    };

    HomeCtrl.prototype.deleteThing = function(index)
    {
        var vm = this;
        var thing = vm.things[index];

        vm.ResourceService.deleteThing(thing).then(function(){
            vm.things.splice(index, 1);
            vm.toastr.success("Thing successfully deleted!");
        },function(data, status) {
            if(status!==401){
                vm.toastr.error(data);
            }
        });
    };

    HomeCtrl.prototype.deletePerson = function(index)
    {
        var vm = this;
        var person = vm.people[index];

        vm.ResourceService.deletePerson(person).then(function(){
            vm.people.splice(index, 1);
            vm.toastr.success("Person successfully deleted!");
        },function(data, status) {
            if(status!==401){
                vm.toastr.error(data);
            }
        });
    };

    function PersonCtrl(ResourceService, toastr, $location) {
        var vm = this;
        vm.person = null;
        vm.ResourceService = ResourceService;
        vm.toastr = toastr;
        vm.dateFrom = new Date(new Date().getTime() - 86400 * 1000 * 7);
        vm.popupFrom = {opened:false};
        vm.dateTo = new Date(new Date().getTime() + 86400 * 1000);
        vm.popupTo = {opened:false};
        vm.altInputFormats = ['M!/d!/yyyy'];
        vm.userId = $location.url().split("/")[2];

        vm.tasks = [];
        vm.aggregate = false;

        vm.openFrom = function(){
            vm.popupFrom.opened = true;
        }

        vm.openTo = function(){
            vm.popupTo.opened = true;
        }

        vm.search = function() {
            vm.ResourceService.getTasks(vm.userId, vm.dateFrom, vm.dateTo, vm.aggregate).then(function(data){
                vm.tasks = data.result;
            });
        }

        vm.search();

    }

    function ThingCtrl(ResourceService, toastr, $location, Lightbox)
    {
        var vm = this;
        vm.thing = null;
        vm.ResourceService = ResourceService;
        vm.toastr = toastr;

        vm.session = $location.url().split("/")[2];
        vm.shots = [];

        vm.search = function() {
            vm.ResourceService.getShots(vm.session).then(function(data){
                vm.shots = data.result;
                vm.shots.forEach(function(i){
                    i.url = "api/shot?path=" + i.path;
                    i.thumbUrl = "api/shot?path=" + i.thumb_path;
                    i.caption = i.shot_at;
                })
            });
        }
        vm.openLightboxModal = function (index) {
            Lightbox.openModal(vm.shots, index);
        };

        vm.search();
    }


    return mainAppControllers;

});