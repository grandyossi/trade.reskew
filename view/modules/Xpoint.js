(function (window, angular) { 'use strict';

    const XpointKind = Object.freeze({
        Actual: 'actual',
        Calculated: 'calculated'
    });

    /** @param prmV the decimal value (number or string)
     * @param prmNoDot whether to drop the point (not a real round) */
    const getXpointValueViewFitted = function (prmV, prmRound) {
        prmRound = !!prmRound;
        //'.' is escaped for regex
        const _f = ('' + prmV).search('\\.');//_f > 0 once dot found
        return ((_f > 0)
                ? (1 * prmV).toPrecision(_f + (prmRound ? 0 : 1))
                : prmV);//parseFloat().toPrecision(n)
        //new Intl.NumberFormat
        //https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/NumberFormat
        //developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Text_formatting/#Date_and_time_formatting
        //const _opt = {
        //    maximumFractionDigits: 1
        //};
    }


    angular.module('reskewXpoint', [])
    .constant('XpointKind', XpointKind)
    .constant('getXpointValueViewFitted', getXpointValueViewFitted)
    .controller('xpointController',
     ['$scope', '$compile',
      'ReskewBaseIdentifiers',
     function ($scope, $compile,
               BaseID) {
         //2017-01-15 : works ok, even without `controllerAs`
         //const _ctrl = this;
         //
         Object.defineProperties(this, {
             'domID': { value:
                 BaseID.Xpoint + '_'
                 + (!$scope.vix
                    ? $scope.name.replace('+', 'p').replace('-', 'm')
                    : $scope.base)
                 + '_'
                 + (!$scope.vix
                    ? $scope.base
                    : $scope.index)
             },
             'kind': { value:
                 $scope.vix ? XpointKind.Calculated : XpointKind.Actual
             },
             //TO_DEV *3* : getPoint/Base() <-> scope values change
             'point': {
                 value: $scope.vix
                        ? $scope.base * (1 + $scope.vix * $scope.amount)
                        : ($scope.base ? $scope.base : 'x')
             },
             'base': { value: $scope.base ? $scope.base : 0 },
             'getViewValue': { value:
                 function () {
                     return getXpointValueViewFitted(this.point);
                 }
             },
             'getDomTitle': { value:
                 function () {
                     return ((!$scope.base ? 'Missing : ' : '') +
                         (!$scope.vix
                         ?
                         ($scope.name + ' (' + $scope.about + ')')
                         :
                         (' @ VIX ' + ($scope.vix * 100) + ' (' +
                         ($scope.amount * 100) + '%)')));
                 }
             },
             'getDomClass': { value:
                 function () {
                     return ($scope.vix ? "clickable_ex"
                             : ($scope.base ? "clickable" : "missing"));
                 }
             }
         });
         //
         this.$onInit = function () {
             Object.defineProperties($scope, {
                 'menuTemplate': {//base="{{point}}"
                     value: angular.element(
                                '<rsq-menu-xpoint \
                                  base="controller.base" \
                                  current="controller.point" \
                                  vix="vix" amount="amount">\
                                 </rsq-menu-xpoint>')
                 },
                 'menuElement': { value: null, writable: true },
                 'unwatchLink': { value: //usage : avoid code in link fn
                     $scope.$watch('element',
                     function (element) {//2nd param ignored
                         if (!element) return;//not yet...
                         $scope.unwatchLink();//link done!
                         //console.log('xpoint : element linked');
                         if (!$scope.base) return;//base value missing
                         //
                         element.on('$destroy',
                         function () {
                             $scope.$destroy();
                             //console.log('DED Elem : ' + $scope.controller.domID);
                         });
                         element.on('click',
                         function (event) {
                             if ($scope.menuElement)
                                 return;
                             //TO_MEM *0* :
                             //http://stackoverflow.com/questions/21854814/angular-compile-with-required-controller
                             //https://jsfiddle.net/qq4gqn6t/11/
                             //
                             //https://docs.angularjs.org/api/ng/service/$compile/#usage
                             //... it is either the original element,
                             //or the clone of the element
                             //ONCE `cloneAttachFn` IS provided!
                             $compile($scope.menuTemplate)
                             ($scope,
                              function (prmCloned, prmScope) {
                                  $scope.menuElement = prmCloned;
                                  element.append(prmCloned);
                              },
                              {
                              transcludeControllers: {
                                  rsqXpoint: {
                                      instance: $scope.controller
                                  }
                              }});
                              //NOT $scope.$new() 
                              //<-> directive creates new isolated
                             //
                             $scope.onMenuShown({
                                 prmId: $scope.controller.domID
                             });
                             //console.log('KLK');
                         });
                         //console.log('xpoint : element');
                     })//watch
                 }
             });
         };// --- init ---
         $scope.$on('clearXpointMenu', function (prmEvnt, prmId) {
             if ($scope.controller.domID == prmId) {
                 $scope.menuElement.remove();
                 $scope.menuElement = null;
                 //console.log('Menu removed : ' + prmId);
             }
         });
     }
    ])
    .directive('rsqXpoint', function () {
        return {
            restrict: 'E',
            scope: {
                //name & about only for `Xpect`
                name: '@',
                about: '@',
                base: '<',
                onMenuShown: '&',
                //`Xtend` point properties:
                index: '<',
                vix: '<',
                amount: '<'
            },
            link://post-link
            function ($scope, elem) {
                Object.defineProperties($scope, {
                    'element': { value: elem }
                });
            },
            controller: 'xpointController',
            controllerAs: 'controller',//-> $scope.controller
            template:
            '<span id="{{controller.domID}}" \
                   class="{{controller.getDomClass()}}" \
                   title="{{controller.getDomTitle()}}">\
                          {{controller.getViewValue()}}<span>'
        };
    });
})(window, window.angular);