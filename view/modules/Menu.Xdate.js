(function (window, angular) {
    'use strict';


    angular.module('reskewMenuXdate', [])
    .constant('XdateMonths', Object.freeze({
        '0': 'JAN',
        '1': 'FEB',
        '2': 'MAR',
        '3': 'APR',
        '4': 'MAY',
        '5': 'JUN',
        '6': 'JUL',
        '7': 'AUG',
        '8': 'SEP',
        '9': 'OCT',
        '10': 'NOV',
        '11': 'DEC' })) 
    .controller('menuXdateController',
     ['$scope', 'SelectedClass', function ($scope, clsChk) {
         //
         this.$onInit = function () {
             Object.defineProperties($scope, {
                 'idPrefix': { value: 'menu_xdate__' },
                 'getElement': { value:
                     function (prmI) {
                         return document.getElementById(
                                        $scope.idPrefix
                                        + $scope.model[prmI].xdate);
                     }
                 },
                 'unwatchDrawn': { value:
                     $scope.$watch('getElement(0)',
                         function (prmC, prmV) {
                             if (prmC) {
                                 $scope.unwatchDrawn();
                                 $scope.onSelect(0);
                             }
                     })
                 },
                 'selected': { value: null, writable: true },
                 'onSelect': { value:
                     function (prmI) {
                         if ($scope.selected !== null) {
                             if ($scope.selected === prmI)
                                 return;
                             $scope.getElement($scope.selected)
                             .classList.remove(clsChk);
                         }
                         $scope.selected = prmI;
                         $scope.getElement($scope.selected)
                         .classList.add(clsChk);
                         $scope.notify({
                             prmS: $scope.model[prmI].xdate
                         });
                     }
                 }//,
                 //'toDestroy': { value:
                 //    function () {
                 //        $scope.element.remove();//jqLite elem-wrapped
                 //    }
                 //}
             });
         }
    }])
    .directive('rsqMenuXdate',
     ['XdateMonths', function (xMonz) {
        return {
            restrict: 'E',
            scope: {
                model: '<',
                notify: '&'
            },//TO_DO *2* : destroy watch
            link:
            function ($scope, elem) {
                //`$interval` invokes $digest ($interval <-> setInterval)
                //const _iid = setInterval(function () {
                //    //console.log('interval');
                //    const _d = $scope.getElement(0);
                //    if (_d) {
                //        $scope.onSelect(_d);
                //        clearInterval(_iid);
                //        //$interval.cancel(_iid);
                //    }
                //}, 20);
                //
                //https://docs.angularjs.org/guide/directive/#creating-a-directive-that-manipulates-the-dom
                //... special events that AngularJS emits ... `$destroy`
                //NOTICE: `on` != `$on`
                //elem.on('$destroy', function () {//same as $scope.$on
                //});
                //elem.on('click', function (prmEvnt) {
                //    $scope.onSelect(prmEvnt.target);
                //});//avoid `ng-click` ($digest cycle)
                //
                Object.defineProperties($scope, {
                    'splitter': { value: 'T' },
                    'element': { value: elem },
                    'getXdateLI': { value:
                        /** @param prmXStr {String} Representation
                         * @param prmW {Number} Week number */
                        function (prmXStr, prmW) {
                            const xd = new Date(prmXStr);
                            //console.log('drawn : xdate <li>');
                            return (xMonz['' + xd.getMonth()]
                                    + ' '
                                    + xd.getFullYear()
                                    + (prmW ? ' W' + prmW : ''));
                        }//ternary requires parens within concat
                    }
                });
                //
                elem.on('$destroy', function () {
                    $scope.$destroy();
                });
            },
            controller: 'menuXdateController',
            template://(i, o) in model <-> (index, object) in array
            '<ul class="ul_basic">\
                <li ng-repeat="(i, o) in model" \
                    id="{{idPrefix + o.xdate}}" \
                    title="{{o.xdate.split(splitter)[0]}}" \
                    ng-click="onSelect(i)">\
                {{getXdateLI(o.xdate, o.week)}}</li>\
            </ul>'
        };
    }]);
})(window, window.angular);