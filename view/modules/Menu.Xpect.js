(function (window, angular) {
    'use strict';


    angular.module('reskewMenuXpect', [])
    .controller('menuXpectController', 
     ['$scope',
      'ReskewBaseIdentifiers', 'SelectedClass',
      function ($scope, BaseIDz, clsChk) {
         //
         this.$onInit = function () {
             Object.defineProperties($scope, {
                 'idPrefix': { value: 'menu_' + $scope.kind + '__' },
                 'getElement': { value:
                     function (prmI) {//prmName <-> 
                         return document.getElementById(
                                         $scope.idPrefix 
                                         + $scope.model[prmI]);
                     }
                 },
                 'unwatchDrawn': { value: //$watch() ret val
                     $scope.$watch('getElement(0)',
                         function (prmC, prmP) {
                             if (prmC) {
                                 $scope.unwatchDrawn();
                                 $scope.element.on('$destroy',
                                     function () {
                                         $scope.unwatchClear();
                                         $scope.$destroy();
                                     });
                                 //console.log(
                                 //    'Menu.'
                                 //    + $scope.kind + ' : drawn');
                                 if ($scope.kind == BaseIDz.Xtend)
                                     return;
                                 //top ranked `xpect` is the default:
                                 //model (arr) SORTED by RANK (#1 > #2)
                                 $scope.onSelect(0);
                             }
                         })
                 },
                 'selected': { value: null, writable: true },
                 'onSelect': { value:
                     function (prmI) {
                         if ($scope.selected !== null) {
                             if ($scope.selected == prmI)
                                 return;
                             $scope.getElement($scope.selected)
                             .classList.remove(clsChk);
                         }
                         $scope.selected = prmI;
                         $scope.getElement($scope.selected)
                         .classList.add(clsChk);
                         $scope.notify({
                             prmK: $scope.kind,
                             prmS: $scope.model[prmI]
                         });
                     }
                 },
                 'unwatchClear': { value: 
                     $scope.$watch('clear',
                         function (prmC, prmP) {
                             if (prmC == $scope.kind) {
                                 if ($scope.selected !== null) {
                                     $scope.getElement($scope.selected)
                                     .classList.remove(clsChk);
                                     $scope.selected = null;
                                 }
                                 //console.log('$digest - Menu.'
                                 //            + $scope.kind + ' : onClear');
                             }
                         })
                 }
             });
             //
         }// --- INIT ---
     }])
    .directive('rsqMenuXpect', function () {
        return {
            restrict: 'E',
            scope: {
                //string
                kind: '@',
                //names arr, sorted by rank
                model: '<',
                //model with extra (full) data
                modelEx: '<',
                notify: '&',
                clear: '<'
            },//TO_DO *2* : destroy watch
            link:
            function ($scope, elem) {
                Object.defineProperties($scope, {
                    'element': { value: elem },
                });
            },
            controller: 'menuXpectController',
            template://(i, n) in arr <-> (i[ndex], n[ame]) in array
            '<ul class="ul_basic">\
                <li ng-repeat="(i, n) in model" id="{{idPrefix + n}}" \
                    title="{{modelEx[n].about}}" \
                    ng-click="onSelect(i)">\
                {{modelEx[n].isNameValid ? n : "Unnamed"}}</li>\
            </ul>'
            //
            //http://stackoverflow.com/questions/38381808/how-to-stop-digest-cycle-manually-in-angularjs
        };
    });
})(window, window.angular);