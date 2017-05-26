(function (window, angular) {
    'use strict';

    angular.module('reskewXpect', [])
    .controller('xpectController',
     ['$scope', '$compile', 'ReskewBaseIdentifiers', 'XpectKind',
     function ($scope, $compile, BaseIDz, Kind) {
         /** `Xtend.xpoints` : a container of objects hashes,
          * which reference actual model xpoints.
          * These points are fundamental for this `Xtend` */
         const _getModelXpoints = function () {
             const _r = {};
             //traverse hashes:
             Object.keys($scope.model.xpoints).forEach(
                 function (pt) {//A point MAY be missing
                     let _v = 0;
                     try {
                         //value = xpoints[?xdate?][?xpect?][?xpoint?]
                         _v =
                             $scope.xpointModel
                             [$scope[BaseIDz.Xdate]]
                             [$scope.model.xpoints[pt][BaseIDz.Xpect]]
                             [$scope.model.xpoints[pt][BaseIDz.Xpoint]];
                     } catch (e) { }
                     Object.defineProperty(_r, pt, { value: _v });
                 });
             return _r;
         };
         //------------
         //--- init ---
         this.$onInit = function () {
             //
             const _k = !$scope.xpointModel ? Kind.Xpect : Kind.Xtend;
             //
             //controllerAs -> this -> $scope.controller:
             Object.defineProperties(this, {
                 'kind': { value: _k },
                 'domId': { value:
                     'tbl' + _k.title + '_' + $scope.name
                 },
                 'view': { value:
                     _k == Kind.Xpect
                         ? $scope.model.xpointNames
                         : $scope.model.view
                 },
                 'getXpointDomId': { value:
                     function (prmN, prmO) {//this.kind || prmO === undef
                         prmO = !prmO ? {} : prmO;
                         return (
                             (prmO.vix ? 'V' : '')
                             + 'tdXpoint_'
                             + (this.kind == Kind.Xpect
                                 ? prmN.replace('+', 'p')
                                   .replace('-', 'm')
                                 : (prmO.point + '_' + (prmN + 1))));
                     }
                 }
             });
             //
             Object.defineProperties($scope, {
                 'xpointMenu': { value: null, writable: true },
                 'onXpointMenu': { value: 
                     /** child scope : `onMenuShown */
                     function (prmId) {
                         if ($scope.xpointMenu)
                             $scope.$broadcast('clearXpointMenu',
                                               $scope.xpointMenu);
                             //TO_MEM *0* : why no need to digest
                             //$scope.$digest();
                         $scope.xpointMenu = prmId;
                     }
                 },
                 'setWatchTdElem': { value: 
                     function (prmN, prmO) {
                         const _id =
                             $scope
                             .controller.getXpointDomId(prmN, prmO);
                         const _w = _id + 'Loaded';
                         const _uw = 'unwatch' + _w;
                         Object.defineProperty($scope, _w, {
                             value: function () {
                                 return document.getElementById(_id);
                             }
                         });
                         Object.defineProperty($scope, _uw, { value:
                             $scope.$watch(_w + '()',
                             function (prmC) {
                                 if (!prmC) return;//no elem yet...
                                 //console.log('Y : ' + prmC.id);
                                 $scope[_uw]();//unwatch ok
                                 if (_k == Kind.Xpect) {//fun with _k
                                     const _elem =
                                     angular.element(
                                     '<rsq-xpoint name="'
                                     + prmN + '" \
                                     about="' +
                                     $scope.model.xpointNames[prmN]
                                     + '" base="'
                                     + $scope.points[prmN] + '" \
                                     on-menu-shown=\
                                     "onXpointMenu(prmId)">\
                                     </rsq-xpoint>'
                                     );//2017-01-15 : 
                                     //compile after append (test ok)
                                     angular.element(prmC)
                                     .append(_elem);
                                     $compile(_elem)($scope);
                                     return;
                                 }// -> `Xtend` code from here ->
                                 if (!$scope.pointsBase[prmO.point])
                                     return;//ZERO @ _getModelXpoints
                                 angular.element(prmC)
                                 .append(
                                     $compile(
                                     (prmC.id.search('V') == 0)
                                     ?
                                     '<rsq-xpoint \
                                     index="'
                                     + prmN + '" \
                                     base="' +
                                     $scope.pointsBase[prmO.point]
                                     + '" vix="' +
                                     $scope.model.view[prmN].vix
                                     + '" amount="' +
                                     $scope.model.view[prmN].amount
                                     + '" on-menu-shown=\
                                        "onXpointMenu(prmId)">\
                                     </rsq-xpoint>'
                                     :
                                     '<rsq-xpoint \
                                     name="'
                                     + $scope.model
                                       .xpoints[prmO.point]
                                               [BaseIDz.Xpoint]
                                     + '" about="'
                                     +  ($scope.model
                                         .xpoints[prmO.point]
                                                 [BaseIDz.Xpect]
                                            + " : "
                                        + $scope.model
                                          .xpoints[prmO.point]
                                                  [BaseIDz.Xpoint])
                                     + '" base="'
                                     + $scope.pointsBase[prmO.point]
                                     + '" on-menu-shown=\
                                     "onXpointMenu(prmId)">\
                                     </rsq-xpoint>'
                                     )($scope));
                             })//watch elem @ dom
                         });
                     }
                 }
             });
             //
             if (this.kind == Kind.Xpect && !$scope.points)
                 return;//NO CONTROLLER view model : NO points @ date?
             if ($scope.points) {//`Xpect`
                 //available points @ date -> compile when *possible
                 const _names = Object.keys($scope.model.xpointNames);
                 _names.forEach(function (pt) {
                     $scope.setWatchTdElem(pt);//*possible : elem @ dom
                 });
             } else {//`Xtend`
                 Object.defineProperty($scope, 'pointsBase', {
                     value: _getModelXpoints()
                 });
                 let _i = 0;
                 //model.view -> ARR of { point:,?vix:,?amount: }
                 $scope.model.view.forEach(function (oPt) {
                     $scope.setWatchTdElem(_i++, oPt);
                 });
             }
         };// --- init ---
     }
    ])
    .directive('rsqXpect', function () {
        return {
            restrict: 'E',
            scope: {
                name: '<',
                model: '<',
                xdate: '<',
                points: '<',
                //`Xtend` only
                xpointModel: '<'
            },
            link:
            function ($scope, elem) {
                Object.defineProperties($scope, {
                    'element': { value: elem }
                });
                elem.on('$destroy', function () {
                    //console.log('DED DOM : ' + $scope.domId);
                    $scope.$destroy();
                });
            },
            controller: 'xpectController',
            controllerAs: 'controller',
            template:
            '<div class="floater">\
                <table id="{{controller.domId}}">\
                    <thead><tr><th align="left" colspan="3">\
                               {{controller.kind.title}}: \
                               {{model.isNameValid ? name : "Unnamed"}}\
                               </th></tr>\
                           <tr><th align="left" colspan="3">\
                                    Rank: {{model.rank}}</th></tr>\
                           <tr><th align="left" colspan="4">\
                               {{model.about}}</th></tr></thead>\
                    <tbody align="left"><tr>\
                        <td ng-repeat="(k, t) in controller.view" \
                            id="{{controller.getXpointDomId(k, t)}}" \
                            width="60px">\
                        </td></tr></tbody>\
                </table>\
            \</div>'
        };
    });
})(window, window.angular);