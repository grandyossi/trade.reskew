(function (window, angular) {
    'use strict';

    angular.module('reskewMenuXpoint', [])
    .directive('rsqMenuXpoint', 
    ['$compile',
     'OptionKind', 'optionsService', 'Option',
     function ($compile, Kind, optSvc, Option) {
        return {
            restrict: 'E',
            //https://docs.angularjs.org/api/ng/service/$compile/#-require-
            require: '^rsqXpoint',//not using ?^
            scope: {
                //TO_READ *1* : click event on parent ->
                //MUST scope X/Y, or else NO `clearedMenu` $digest
                //eventX: '@',
                //eventY: '@',
                base: '<',
                current: '<',
                vix: '<',
                amount: '<'
            },
            link://on post-link event
            function ($scope, element, attrz, controller/*xpoint*/) {
                //double, around the spot
                const _optz =
                    optSvc.getOptionsAroundPoint($scope.current);
                Object.defineProperties(_optz, {
                    'single': { value://varying single (clicks on +/-)
                        new Option($scope.current,
                                   _optz[Kind.Call].strike)
                    },
                    'set': { value:
                        function (prmV) {
                            if (prmV > 0)
                                this.single.setRaise();
                            else
                                this.single.setLower();
                            //no $digest <-> no ng-click
                            document
                            .getElementById('rsqTdSingleStrike')
                            .innerHTML = this.single.strike;
                            const _o = document.getElementById(
                                       'rsqTdSingleKind');
                            _o.innerHTML = this.single.kind;
                            _o.title = this.single.getTitle();
                        }
                    },
                    'showDouble': { value:
                        function () {
                            $scope.pricingCtrl.onRequired(
                                            this[Kind.Call],
                                            this[Kind.Put]);
                        }
                    },
                    'showSingle': { value:
                        function () {
                            $scope.pricingCtrl.onRequired(this.single);
                        }
                    }
                });
                //
                window.rsqPricez = _optz;//workaround ng-click's digest
                //
                Object.defineProperties($scope, {
                    'element': { value: element },
                    //TO_DEV *1* : xpoint ctrl usage : modify xpoint
                    'controller': { value: controller },
                    'pricing': { value: _optz }
                });
                element.on('$destroy', function () {
                    //console.log('DED Mnu');
                    if (window.rsqPricez.single.isEqual(_optz.single)) {
                        delete window.rsqPricez;//no other menu / RACE
                        //console.log('DELL');
                    }
                    $scope.$destroy();//shared with `rsqXpricing`
                });
                //TO_READ *0* : angular always digest on element create
                //-> ? already been compiled (entire dom tree exists) ?
                //? so digest velues ? :
                $scope.$digest();
            },
            template:
            '<div id="menu_xpoint" class="floater_point">\
              <table>\
              <tbody align="center">\
                <tr><td class="clickable_ex" colspan="3" \
                        title="C&P @ {{current}}" \
                        onclick="rsqPricez.showDouble()" >\
                        C & P</td></tr>\
                <tr">\
                    <td class="clickable_ex" onclick=\
                        "rsqPricez.set(-1)">-</td>\
                    <td id="rsqTdSingleKind" class="clickable_ex" \
                        title="{{pricing.single.getTitle()}}" \
                        onclick="rsqPricez.showSingle()">\
                        {{pricing.single.kind}}</td>\
                    <td class="clickable_ex" onclick=\
                        "rsqPricez.set(1)">+</td>\
               </tr>\
               <tr><td id="rsqTdSingleStrike" colspan="3">\
                    {{pricing.single.strike}}</td></tr>\
              </tbody>\
              </table>\
                <rsq-xpricing></rsq-xpricing>\
             </div>'
            //OK : {{controller.what_ever()}}

            //TO_READ *0* : $destroy
            //https://www.bennadel.com/blog/2706-always-trigger-the-destroy-event-before-removing-elements-in-angularjs-directives.htm
        };
    }]);
})(window, window.angular);