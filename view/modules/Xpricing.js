(function (window, angular) { 'use strict';

    //False-Preference map : keys are values NOT to be displayed
    //i.e { 'x': 0, 'y': 0, 'z': 0 }
    //where 'x' is an integer


    /** Simple Percentage Range - `Around-The-100%-And-Beyond` */
    function PriceRange() {
        Object.defineProperties(this, {
            'get': { value:
                function (prmFalsePrefMap) {
                    prmFalsePrefMap = (prmFalsePrefMap)
                        ? prmFalsePrefMap : {};
                    const ret = [];
                    for (let i = 260; i > 0; i -= 5) {
                        switch (i) {
                            case 35:
                                ret.push(38.2); break;
                            case 60:
                                ret.push(61.8); break;
                            case 125:
                                ret.push(127.2); break;
                            case 160:
                                ret.push(161.8); break;
                            case 260:
                                ret.push(261.8); break;
                        }
                        //MIGHT be defined as 0 
                        //-> MUST BE undefined to be included
                        if (prmFalsePrefMap['' + i] === undefined)
                            ret.push(i);//LAST, since it is reversed
                    }//for
                    ret.push(1);//1% = the basics ( x% = x * 1% )
                    return Object.freeze(ret);
                }
            }
        });
        Object.defineProperties(PriceRange, {
            //A single disabled-range object
            'getDisabledRangeMap': { value:
                function (prmL, prmH) {
                    try {
                        const ret = {};
                        for (let i = prmL; i <= prmH; i += 5) {
                            Object.defineProperty(ret, '' + i, {
                                value: 0,
                                enumerable: true
                            });
                        }
                        return Object.seal(ret);
                    } catch (e) { return {}; }
                }
            },
            //Join multiple ranges into one
            'getJoinedDisabledRangeMap': { value:
                function () {
                    try {
                        let ret = {};
                        for (let i = 0; i < arguments.length; ++i) {
                            ret = angular.extend(ret, arguments[i]);
                        }
                        return Object.seal(ret);
                    } catch (e) { return {}; }
                }
            }
        });
    }

    //TO_DEV : DerivativeStyle : Euro / US 

    /**
     * Most basic derivative kinds. `Option` kinds, actually */
    const OptionKind = Object.freeze({
        Call: 'C',
        Put: 'P',
        getFromSpotGap: function (prmSpotPoint, prmStrike) {
            if (!prmSpotPoint || !prmStrike)
                return undefined;
            try {
                prmSpotPoint *= 1;
                prmStrike *= 1;
            } catch (e) { return undefined; }
            if (prmStrike > prmSpotPoint)
                return OptionKind.Put;
            else
                return OptionKind.Call;
        },
        isValid: function (prmS) {
            if (!prmS) return false;
            switch (prmS) {
                case OptionKind.Call:
                case OptionKind.Put:
                    return true;
            }
            return false;
        }
    });


    function Option(prmSpotPoint, prmStrike, prmMultiply) {
        const _k = OptionKind.getFromSpotGap(prmSpotPoint, prmStrike);
        prmMultiply = prmMultiply ? prmMultiply : 100;//TO_DEV *1* : mult / gap
        if (!_k) {
            prmSpotPoint = 0;
            prmStrike = 0;
        }
        Object.defineProperties(this, {
            'spot': { value: prmSpotPoint },
            'kind': {
                value: _k, enumerable: true, writable: true
            },
            'multiplier': { value: prmMultiply },
            'getMultiplierSign': { value:
                function () {
                    return (!this.kind) ? 0
                            : (this.kind === OptionKind.Call) ? 1 : -1;
                }
            },
            'strike': {
                value: prmStrike, enumerable: true, writable: true
            },
            'getIntrinsicValue': { value:
                function () {
                    return this.multiplier * this.getMultiplierSign()
                           * (prmSpotPoint - prmStrike);
                }
            },
            'getTitle': { value:
                function () {
                    return (
                        this.kind + '-' + this.strike +
                        ' @ ' + this.spot
                    );
                }
            },
            'isEqual': { value:
                function (prmO) {
                    prmO = prmO ? prmO : {};
                        if (this.spot == prmO.spot)
                            if (this.kind == prmO.kind)
                                if (this.strike == prmO.strike)
                                    return true;
                    //
                    return false;
                }
            },
            'setRaise': { value:
                function (prmGap) {
                    prmGap = prmGap
                             ? prmGap : OptionsService.defaultStrikeGap;
                    const _k = OptionKind.getFromSpotGap(
                                            this.spot,
                                            this.strike + prmGap);
                    if (!_k) return;
                    this.strike += prmGap;
                    this.kind = _k;
                }
            },
            'setLower': { value:
                function (prmGap) {
                    prmGap = prmGap
                             ? prmGap : OptionsService.defaultStrikeGap;
                    const _k = OptionKind.getFromSpotGap(
                                            this.spot,
                                            this.strike - prmGap);
                    if (!_k) return;
                    this.strike -= prmGap;
                    this.kind = _k;
                }
            }
        });
    }


    const OptionsService = (function () {
        const _defGap = 10;//TO_DEV *1*
        return Object.freeze({
            defaultStrikeGap: _defGap,
            getOptionsAroundPoint: function (prmSpotPoint, prmGap) {
                try {//not verifying 5 or 10 modulu...
                    //gap between strikes (i.e 10 : 1450 - 1460)
                    prmGap = prmGap ? prmGap : _defGap;
                    const _base =
                        prmGap * Math.floor(prmSpotPoint / prmGap);
                    const _ret = {};
                    //obj[OptionKind.Call]
                    Object.defineProperty(_ret, OptionKind.Call, {
                        value: new Option(prmSpotPoint, _base),
                        enumerable: true
                    });
                    //obj[OptionKind.Put]
                    Object.defineProperty(_ret, OptionKind.Put, {
                        value: new Option(prmSpotPoint, _base + prmGap),
                        enumerable: true
                    });
                    return _ret;
                } catch (e) { return undefined; }
            }
        });
    })();


    angular.module('reskewXpricing', [])
    .constant('OptionKind', OptionKind)
    .constant('Option', Option)
    .constant('optionsService', OptionsService/*not `real` ng-svc...*/)
    .service('priceRangeService', [PriceRange])
    .controller('xpricingController',
     ['$scope', '$compile', 'priceRangeService',
      function ($scope, $compile, prcRng) {
          //==== INIT ====
          this.$onInit = function () {
              $scope.$on('$destroy', function () {
                  //this.tableElements = { length: 0 };
                  //console.log('Menu.Xpoint : $scope & CTRL = DED');
              });
              //console.log('CTRL INIT');
              Object.defineProperties(this, {
                  'tableElements': { value: { length: 0 /*+hashez*/ } },
                  'range': { value:
                      prcRng.get(
                          //TO_DEV *3* : from prefz
                          PriceRange
                              .getJoinedDisabledRangeMap({
                                  '30': 0, '40': 0, '55': 0,
                                  '65': 0, '70': 0, '85': 0,
                                  '105': 0, '115': 0
                              },
                              PriceRange
                                  .getDisabledRangeMap(120, 260)
                              ))
                  },
                  'onRequired': { value:
                      function (/*? MAX 2 argz ?*/) {//prmO is either C or P
                          if (arguments.length == 0) return;
                          for (let i = 0; i < arguments.length; ++i) {
                              let _key = '' + arguments[i].kind +
                                         arguments[i].strike;
                              if (!this.tableElements[_key]) {
                                  this.tableElements[_key] = true;
                                  this.tableElements.length++;
                                  this.element.append(
                                      $compile(
                                      '<rsq-xpricing-table \
                                      kind="'
                                      + arguments[i].kind +'" \
                                      strike="'
                                      + arguments[i].strike + '" \
                                      spot="' + arguments[i].spot + '" \
                                      multiplier="'
                                      + arguments[i].multiplier + '" \
                                      sign="'
                                      + arguments[i].getMultiplierSign()
                                      + '"></rsq-xpricing-table>'
                                      )($scope.$new(false)));
                                  this.element.css({
                                      visibility:
                                      'visible',
                                      width:
                                      (90 +
                                      this.tableElements.length * 70)
                                      + 'px'
                                  });//wrapped by angular -> digest!
                              }
                          }
                      }
                  }
              });
          };// ==== INIT ====
    }])
    .directive('rsqXpricing',
     ['getXpointValueViewFitted',
     function (getViewVal) {
         return {
             restrict: 'E',
             controller: 'xpricingController',
             controllerAs: 'pricingCtrl',//notice in ng-repeat
             link://on post-link event
             function ($scope, element) {
                 Object.defineProperty($scope.pricingCtrl, 'element', {
                     value: element.find('div')
                 });
                 //NO isolated scope <-> 
                 //DO NOT watch element.on / $scope.$on destroy
             },
             template://td style="padding-right: 30px;"
             '<div id="divRsqXpricing" class="xpricing_container">\
                <table class="xpricing_base">\
                    <thead><tr><th id="thRsqXpricing">% Price</th></tr>\
                    </thead>\
                    <tbody>\
                    <tr ng-repeat="i in pricingCtrl.range">\
                        <td>\
                            {{i}}</td></tr>\
                    </tbody></table></div>'
         };
    }])
    .directive('rsqXpricingTable', function () {
          return {
              restrict: 'E',
              transclude: true,
              link://on post-link event ====================
              function ($scope, element, attrz) {
                  //                                ========
                  Object.defineProperties($scope, {
                      //NO attr-scope dependZ
                      'spot': { value: attrz.spot * 1 },
                      'multiplier': { value: attrz.multiplier * 1 },
                      'kind': { value: attrz.kind },
                      'sign': { value: attrz.sign * 1 },//TO_DEV *1* : ? redundant ?
                      'strike': { value: attrz.strike * 1 }
                  });
                  //
                  //console.log(
                  //    'link to tbl. Counter : '
                  //    + $scope.pricingCtrl.tableElements.length);
                  //
                  Object.defineProperties($scope.pricingTableCtrl, {
                      'domId': { value:
                          'tblXpricing_'
                          + $scope.pricingCtrl.tableElements.length
                          + '_' + $scope.spot + '_' 
                          + $scope.kind + $scope.strike
                      },
                      'getPrice': { value:
                          function (prmWholePcnt) {
                              //prmWholePcnt = N (i.e 38.2)
                              return Math.round(
                                  prmWholePcnt / 100 * $scope.multiplier
                                  * $scope.sign
                                  * ($scope.spot - $scope.strike)
                              );
                          }
                      }
                  });
                  element.on('$destroy', function () {
                      //console.log('DED Tbl');
                      //? redundant ? good practice ?
                      delete $scope.pricingCtrl.tableElements[
                                    '' + $scope.kind + $scope.strike];
                      $scope.$destroy();
                  });
                  //
                  $scope.$digest();
                  //const _iid = setInterval(function (zkope) {
                  //    console.log('Table link : interval');
                  //    zkope.$digest();
                  //    clearInterval(_iid);
                  //}, 20, $scope);
              },
              controller: function () { },
              controllerAs: 'pricingTableCtrl',
              template:
              '<table id="{{pricingTableCtrl.domId}}" \
                class="xpricing">\
                    <thead><tr><th>{{kind}} {{strike}}</th></tr>\
                    </thead><tbody>\
              <tr ng-repeat="i in pricingCtrl.range">\
                <td>{{pricingTableCtrl.getPrice(i).toLocaleString()}}\
                </td></tr>\
              </tbody></table>'
          };
     });
})(window, window.angular);