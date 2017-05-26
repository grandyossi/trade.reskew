/**
 * Login Module as IIFE
 * TO_DEV : 2016-12-01 - Add 3rd iife parameter `reskewJS` */
(function (window, angular, jsApp) {
    //TO_LEARN : 
    //"... strict mode applies to entire scripts
    //or to individual functions ..."
    'use strict';

    Object.defineProperty(jsApp.state, 'setLoggedIn', {
        value: function (prmOLogin) {
            jsApp.dom.divNgApp.classList.remove('spa_inactive');
            jsApp.dom.divNgApp.classList.add('spa_active');
            if (prmOLogin == undefined)
                return;//NO loginObject <-> NOT invoked after login
            jsApp.dom.divLogin.classList.remove('spa_active');
            jsApp.dom.divLogin.classList.add('spa_inactive');
        }
    });

    //
    //TO_THINK : 2016-12-02 - add `ng` as dependency
    const reskewLogin =
    angular.module('reskewLogin', []);//reskewDOMStorage

    reskewLogin
    .controller('loginController',
     ['$rootScope', '$scope', '$http', 'domStorageService',
     function ($rootScope, $scope, $http, domStoreSvc) {
        Object.defineProperty($scope, 'broadcastLoginSuccessful', {
            value: function (prmDscr) {
                //console.log(
                //    '$rootScope::broadcastLoginSuccessful ('
                //    + prmDscr + ')');
                $rootScope.$broadcast('LoginSuccessful', prmDscr);
            }
        });
        Object.defineProperty($scope, 'isStoreLocal', {
            value: true,
            writable: true
        });
        Object.defineProperty($scope, 'errElem', {
            value: null,
            writable: true
        });
        Object.defineProperty($scope, 'onLoginAttempt', {
            value: function () {
                if (this.errElem) {
                    this.errElem.title = '';
                    this.errElem.classList.remove('err_invalid');
                    this.errElem = null;
                }
                function _getInvalidInput() {
                /*
                http://docs.angularjs.org/api/ng/type/ngModel.NgModelController
                [*]
                Elements attributted `ng-model` & `ng-[any-validation]`
                results `NgModelController` getting into action
                (from `$validate()` documentation):
                "If the validity... invalid,
                    the model will be set to undefined"
                [*]
                Meaning, i.e, once `$scope.email` fails validation ->
                ($scope.email == undefined) is true,
                although not `really` undefined */
                    if ($scope.loginEmail == undefined)
                        return jsApp.dom.loginEmail;
                    else if ($scope.loginPwd == undefined)
                        return jsApp.dom.loginPwd;
                    //MUST use `$scope` NOT `this`
                }
                this.errElem = _getInvalidInput();
                if (this.errElem) {
                    this.errElem.title = 'Value is too short / long';
                    this.errElem.classList.add('err_invalid');
                    this.errElem.focus();
                } else {
                    //TO_DEV *5* : SERVICE for login <-> `XpectService`
                    $http.post(//POST:
                        '/db?crud=r&document=login&email=' +
                        String(this.loginEmail).toLowerCase() +
                        '&pwd=' + this.loginPwd)
                    .then(function (res) {
                        //MUST use `$scope` NOT `this` 
                        //<-> within`then`
                        if (res.data.error != undefined) {
                            jsApp.state.setError(res.data.error);
                            return;
                        }
                        //OK = NO error
                        domStoreSvc.init($scope.isStoreLocal);
                        domStoreSvc.set(res.data);
                        $scope.broadcastLoginSuccessful('$http.post');
                        jsApp.state.setLoggedIn(true);
                    })
                    .catch(function (err) {
                        alert(err);//TO_DEV : output to divErr
                    });
                }
            }
        });
    }])
    .directive('reskewLoginForm',
    ['domStorageService', function (domStoreSvc) {
        return {
            restrict: 'E',
            //controller: 'loginController',
            templateUrl: '/view/modules/loginForm.html',
            link: function (scope, elem, attrz) {
                //invoked once the DOM is updated -
                //by containing (loaded) a clone of the template[Url]
                Object.defineProperty(jsApp.dom, 'divLogin', {
                    value: document.getElementById('divLogin')
                });
                Object.defineProperty(jsApp.dom, 'loginEmail', {
                    value: document.getElementById('loginEmail')
                });
                Object.defineProperty(jsApp.dom, 'loginPwd', {
                    value: document.getElementById('loginPwd')
                });
                Object.defineProperty(jsApp.dom, 'bnLogin', {
                    value: document.getElementById('bnLogin')
                });
                if (!domStoreSvc.getStorage()) {
                    jsApp.dom.divLogin.classList.remove('spa_inactive');
                    jsApp.dom.divLogin.classList.add('spa_active');
                    //jsApp.dom.divLogin.style.display = 'block';
                    //setAttribute('class', 'tempShow');
                    jsApp.dom.loginEmail.focus();
                } else {
                    scope.broadcastLoginSuccessful('DOMStorage');
                    jsApp.state.setLoggedIn();
                }
            }
        };
    }]);
})(window, window.angular, window.reskewJS);
