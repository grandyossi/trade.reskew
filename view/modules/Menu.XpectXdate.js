/**
 * 
 */
(function (window, angular) {
    'use strict';

    //TO_DEV *0* : $('#first').val() -> test via $element('#id')

                    //TO_READ : javascript `atomic` single-thread :
                    //handles flow via queue (ARRAY)
                    //TO_MEM (tested): 
                    //CLASS (ES6) static prop< -> same as for FUNCTION

    function getUTC(pDt) {
        const ret = new Date(pDt);
        //?                         x - y > 0 ?
        ret.setMinutes(ret.getMinutes() - ret.getTimezoneOffset());
        return ret;
    }

    function getDaysDiff(pStart, pEnd) {
        const ms = 24 * 60 * 60 * 1000;
        return (getUTC(pEnd) - getUTC(pStart)) / ms;
    }


    Object.defineProperty(window, 'XpectXdateDocsNotifications', {
        value: function () { }
    });
    //issue : promise's then has no `this`
    //TO_DEV *1* : angular.bind `this`
    //workaround : a global-dom-access object
    //window.XpectXdateDocsNotifications = function () { };

    //retrieve a watchable dom element
    //window.XpectXdateDocsNotifications.getFor = function (prmX) {
    //    try {
    //        return document.getElementById(prmX + 'Docs');
    //    } catch (e) { return undefined; }
    //};


    //this module (within iife) default notifier is a dom element
    window.XpectXdateDocsNotifications.getElement = function () {
        try {
            return document.getElementById('rsqMenuXpectXdateDocs');
        } catch (e) { return undefined; }
    };



    const ReskewBaseIdentifiers = Object.seal({
        Xdate: 'xdate',
        Xpect: 'xpect',
        Xtend: 'xtend',
        Xpoint: 'xpoint'
    });



    function XdateKindDescriptor(prmN) {
        const _getQS = function (prmN) {//the relevant POST QueryString
            switch (prmN) {
                case 'actual': return '&history=HD';
                case 'expired': return '&history=HO';
                case 'any': return '&history=HE';
                default: return '';
            }
        };
        Object.defineProperties(this, {
            'name': { value: prmN },
            'qs': { value: _getQS(prmN) }
        });
    }



    const XdateKind = Object.seal({
        /** principal id-string for `Xdate` */
        BASE_ID: ReskewBaseIdentifiers.Xdate,
        /** Non-expired only */
        Actual: new XdateKindDescriptor('actual'),
        /** Expired (historical) only */
        Expired: new XdateKindDescriptor('expired'),
        /** Any existing db record / document */
        Any: new XdateKindDescriptor('any'),
        getIsValid: function (prmK) {
            if (!prmK) return false;
            switch (prmK) {
                case XdateKind.Actual:
                case XdateKind.Expired:
                case XdateKind.Any:
                    return true;
                default: return false;
            }
        }
    });


    /** Xdate Documents Service */
    function XdateDocuments(prmHttp, prmStoreSvc) {
        Object.defineProperties(XdateDocuments, {
            'notifier': { value: null, writable: true },
            'baseQS': { value: '/db?crud=r&document=xdate' },
            'setQeury': { value:
                function (prmSvc, prmK, prmAzz, prmEx) {//Svc = StoreSvc
                    XdateDocuments.query = {
                        model: XdateKind.BASE_ID,
                        actuality: prmK ? prmK.qs : undefined,
                        exchange: prmEx,
                        asset: prmAzz
                    };//STATIC property <-> NO THIS @ `post.then`
                    XdateDocuments.query.string =
                        XdateDocuments.baseQS
                        + (prmK ?
                           prmK.qs : prmSvc.get(prmSvc.keys.actuality))
                        + '&exchange=' +
                          (prmEx ?
                           prmEx : prmSvc.get(prmSvc.keys.exchange))
                        + '&asset=' +
                          (prmAzz ?
                           prmAzz : prmSvc.get(prmSvc.keys.asset));
                }
            }
        });
        Object.defineProperties(this, {
            'http': { value: prmHttp },
            'store': { value: prmStoreSvc },
            'postRequest': { value:
                function (prmNotif, prmK, prmAzz, prmEx) {
                    if (XdateDocuments.notifier) return {};
                    XdateDocuments.notifier = prmNotif;
                    XdateDocuments.setQeury(
                        this.store, prmK, prmAzz, prmEx);
                    this.http
                    .post(XdateDocuments.query.string)
                    .then(function (prmRes) {//*******************
                        //T_READ *1* : why NO `this` @ promise.then ->
                        //emit = me + up  ,  broadcast = me + down
                        XdateDocuments.notifier.rsqData = {
                            query: angular.copy(XdateDocuments.query),
                            docs: prmRes.data
                        };//attach prop to dom-elem (as for any js obj)
                        XdateDocuments.notifier = null;
                    })
                    .catch(function (prmE) {
                        XdateDocuments.notifier.rsqData = {
                            query: angular.copy(XdateDocuments.query),
                            error: prmE
                        };
                        XdateDocuments.notifier = null;
                    });
                }
            }
        });
    }//XdateDocuments service


    function XpectKindDescriptor(prmN) {
        const _getQS = function (prmN) {//the relevant POST QueryString
            switch (prmN) {
                case ReskewBaseIdentifiers.Xpect:
                    return '&document=xpect&xtend=D';
                case ReskewBaseIdentifiers.Xtend:
                    return '&document=xpect&xtend=O';
                case 'any': return '&document=xpect&xtend=E';
                default: return '';
            }
        };
        Object.defineProperties(this, {//construct the returned `new`
            'name': { value: prmN },
            'title': { value: prmN.replace('x', 'X') },
            'qs': { value: _getQS(prmN) }
        });
    }


    //TO_MEM *0*
    /** This is not a type (`instanceof` requires `function`!) */
    const XpectKind = Object.seal({
        /** principal id-string for `Xpect` */
        BASE_ID: ReskewBaseIdentifiers.Xpect,
        /** `Xpect` instances only */
        Xpect: new XpectKindDescriptor(ReskewBaseIdentifiers.Xpect),
        /** `Xpect`s with extended-features only */
        Xtend: new XpectKindDescriptor(ReskewBaseIdentifiers.Xtend),
        /** `Xpect` or `Xtent` instances */
        Any: new XpectKindDescriptor('any'),
        getIsValid: function (prmK) {
            if (!prmK) return false;
            switch (prmK) {
                case XpectKind.Xpect:
                case XpectKind.Xtend:
                    return true;
                default: return false;
            }
        }
    });


    /** Xpect Documents Service */
    function XpectDocuments(prmHttp, prmStoreSvc) {
        Object.defineProperties(XpectDocuments, {
            'notifier': { value: null, writable: true },
            'baseQS': { value: '/db?crud=r' },
            'setQeury': { value:
                function (prmSvc, prmK, prmAzz, prmEx) {//Svc = StoreSvc
                    XpectDocuments.query = {
                        model: XpectKind.BASE_ID,
                        kind: prmK,
                        exchange: prmEx,
                        asset: prmAzz
                    };//STATIC property <-> NO THIS @ `post.then`
                    XpectDocuments.query.string =
                        XpectDocuments.baseQS
                        + '&login=' + prmSvc.get(prmSvc.keys.login)
                        + (prmK ?
                           prmK.qs : XpectKind.Any.qs)
                        + '&exchange=' +
                          (prmEx ?
                           prmEx : prmSvc.get(prmSvc.keys.exchange))
                        + '&asset=' +
                          (prmAzz ?
                           prmAzz : prmSvc.get(prmSvc.keys.asset));
                }
            }
        });
        Object.defineProperties(this, {
            'http': { value: prmHttp },
            'store': { value: prmStoreSvc },
            /** Post http query */
            'postRequest': { value:
                function (prmNotif, prmKind, prmAzz, prmEx) {
                    if (XpectDocuments.notifier) return {};
                    XpectDocuments.notifier = prmNotif;
                    XpectDocuments.setQeury(
                        this.store, prmKind, prmAzz, prmEx);
                    this.http
                    .post(XpectDocuments.query.string)
                    .then(function (prmRes) {
                        XpectDocuments.notifier.rsqData = {
                            query: angular.copy(XpectDocuments.query),
                            docs: prmRes.data
                        };
                        XpectDocuments.notifier = null;
                    })
                    .catch(function (prmE) {
                        XpectDocuments.notifier.rsqData = {
                            query: angular.copy(XpectDocuments.query),
                            error: prmE
                        };
                        XpectDocuments.notifier = null;
                    });
                }
            }
        });
    }//XpectDocuments service


    const XpointKind = Object.seal({
        /** principal id-string for `Xpoint` */
        BASE_ID: ReskewBaseIdentifiers.Xpoint
    });


    /** Xpoint Documents Service */
    function XpointDocuments(prmHttp, prmStoreSvc) {
        Object.defineProperties(XpointDocuments, {
            'notifier': { value: null, writable: true },
            'baseQS': { value: '/db?crud=r&document=xpoint' },
            'setQeury': { value:
                function (prmSvc, prmEx, prmAzz, prmAct) {
                    XpointDocuments.query = {
                        model: XpointKind.BASE_ID,
                        actuality: prmAct,
                        exchange: prmEx,
                        asset: prmAzz
                    };//STATIC property <-> NO THIS @ `post.then`
                    XpointDocuments.query.string =
                        XpointDocuments.baseQS
                        + '&login=' + prmSvc.get(prmSvc.keys.login)
                        + (prmAct ?
                           prmAct : prmSvc.get(prmSvc.keys.actuality))
                        + '&exchange=' +
                          (prmEx ?
                           prmEx : prmSvc.get(prmSvc.keys.exchange))
                        + '&asset=' +
                          (prmAzz ?
                           prmAzz : prmSvc.get(prmSvc.keys.asset));
                }
            }
        });//angular svc <-> 1 instance : static prop definded ONCE!
        //
        Object.defineProperties(this, {
            'http': { value: prmHttp },
            'store': { value: prmStoreSvc },
            /** Post http query */
            'postRequest': { value: 
                function (prmNotif, prmAct, prmAzz, prmEx) {
                    //TO_DO *2* : postpone once svc is busy    --------
                    if (XpointDocuments.notifier) return {};// --------
                    XpointDocuments.notifier = prmNotif;
                    XpointDocuments.setQeury(
                                    this.store, prmEx, prmAzz, prmAct);
                    this.http
                    .post(XpointDocuments.query.string)
                    .then(function (prmRes) {
                        XpointDocuments.notifier.rsqData = {
                            query: angular.copy(XpointDocuments.query),
                            docs: prmRes.data
                        };
                        XpointDocuments.notifier = null;
                    })
                    .catch(function (prmE) {
                        XpointDocuments.notifier.rsqData = {
                            query: angular.copy(XpointDocuments.query),
                            error: prmE
                        };
                        XpointDocuments.notifier = null;
                    });
                }
            }
        });
    }//XpointDocuments Service



    angular.module('reskewMenuXpectXdate', [])
    .constant('ReskewBaseIdentifiers', ReskewBaseIdentifiers)
    .constant('XdateKind', XdateKind)
    .constant('XpectKind', XpectKind)
    .constant('XpointKind', XpointKind)
    .constant('SelectedClass', 'ul_basic_checked')
    .service('xdateDocsService',
             ['$http', 'domStorageService', XdateDocuments])
    .service('xpectDocsService',
             ['$http', 'domStorageService', XpectDocuments])
    .service('xpointDocsService',
             ['$http', 'domStorageService', XpointDocuments])
    .controller('menuXpectXdateController',
    ['$scope', '$http', '$compile',
     'domStorageService', 'xdateDocsService',
     'xpectDocsService', 'xpointDocsService',
     'ReskewBaseIdentifiers',
     function ($scope, $http, $compile,
               storeSvc, xdtSvc, xpctSvc, xpntSvc, ID/*short name*/) {
         //
         // --- 1st ---
         this.$onInit = function () {
             const _sel = {};
             Object.defineProperty(_sel, ID.Xdate, {
                 value: null,
                 writable: true
             });
             Object.defineProperty(_sel, 'kind', {//ReskewBaseIdentifiers
                value: null,
                writable: true
             });
             Object.defineProperty(_sel, 'name', {
                 value: null,
                 writable: true
             });
             Object.defineProperty(_sel, 'clear', {
                 value: null,
                 writable: true
             });
             Object.defineProperties($scope, {
                 'unwatchDataEvents': { value: null, writable: true },
                 'dataEventsNotifier': {
                     value: XpectXdateDocsNotifications.getElement()
                 },
                 'dataEventsCount': { value: 0, writable: true },
                 'onData': { value:
                     function () {
                         return $scope.dataEventsNotifier.rsqData;
                     }
                 },
                 'model': { value: {}, writable: true },
                 'selected': { value: Object.seal(_sel) },
                 'unwatchSelected': { value:
                     $scope.$watch(
                        'selected.kind + "|" +\
                        selected.name + "|" +\
                        selected.' + ID.Xdate,
                     function (prmC, prmP) {
                         if (prmC != prmP) {
                             if ($scope.selected.kind
                                 &&
                                 $scope.selected[ID.Xdate]) {
                                 if ($scope.specificView)
                                     $scope.specificView.remove();
                                 //
                                 $scope.specificView = $compile(
                                 '<rsq-xpect \
                                 name="selected.name" \
                                 xdate="selected.xdate" \
                                 model="model.xpect[selected.kind][selected.name]" '
                                 + ($scope.selected.kind == ID.Xpect
                                    ? 'points="model.xpoint[selected.xdate][selected.name]">'
                                    : 'xpoint-model="model.xpoint">')
                                 + '</rsq-xpect>'
                                 )($scope);//.$new(true)
                                 $scope.element.find('div')
                                     .append($scope.specificView);
                                 //console.log(
                                 //    'Menu State : ' + prmC);
                             }
                         }
                    })
                 },
                 'onMenuXdate': { value:
                     /** invoked from child scope via '&' binding.
                         an invocation <-> actual state change */
                     function (prmS) {
                         //console.log('Menu.Xdate : selected ' + prmS);
                         $scope.selected[ID.Xdate] = prmS;
                     }
                 },
                 'onMenuXpect': { value: 
                     /** invoked from child scope via '&' binding.
                         an invocation <-> actual state change (guaranteed) */
                     function (prmK, prmS) {
                         //console.log('Menu.' + prmK +
                         //            ' : selected ' + prmS);
                         //A. set unselected as null
                         const _u = (prmK == ID.Xpect)
                                    ? ID.Xtend
                                    : ID.Xpect;
                         $scope.selected.kind = prmK;
                         //B. set the selection
                         $scope.selected.name = prmS;
                         //C. notify relevant watcher to clear itself
                         $scope.selected.clear = _u;
                     }
                 },
                 //when `selected` state is valid -> compile view elem
                 'specificView': { value: null, writable: true },
                 'onDataWatchRequired': { value:
                     function () {
                         //TO_DO *1* : ? should remove existing elemz ?
                         //? `selected` reset ? 
                         $scope.unwatchDataEvents =
                            $scope.$watch('onData()',
                            function (prmC, prmP) {//C[urrent], P[revious]
                                if (!prmC) return;
                                //console.log('$digest : onData');
                                if (!prmC.error) {
                                    //TO_DO *2* : empty data? len = 0?
                                    $scope.model[prmC.query.model] =
                                        prmC.docs;
                                    if (++$scope.dataEventsCount == 3) {
                                        $scope.unwatchDataEvents();
                                        $scope.dataEventsCount = 0;
                                        $scope.element.find('div')
                                        .append(
                                            $compile(
                                                '<rsq-menu-xdate \
                                                model="model.xdate" \
                                                notify="onMenuXdate(prmS)">\
                                                </rsq-menu-xdate><hr>\
                                                <rsq-menu-xpect \
                                                kind="xpect" \
                                                model-ex="model.xpect.xpect" \
                                                model="model.xpect.xpect_namesArr" \
                                                notify="onMenuXpect(prmK, prmS)" \
                                                clear="selected.clear">\
                                                </rsq-menu-xpect><hr>\
                                                <rsq-menu-xpect \
                                                kind="xtend" \
                                                model-ex="model.xpect.xtend" \
                                                model="model.xpect.xtend_namesArr" \
                                                notify="onMenuXpect(prmK, prmS)" \
                                                clear="selected.clear">\
                                                </rsq-menu-xpect>'
                                            )($scope));
                                    }
                                } else {//post returned error
                                }
                             }
                         );
                     }
                 }
             });
         };//==== init ====
         //
         $scope.$on('LoginSuccessful', function (prmEvnt, prmDscr) {
             $scope.onDataWatchRequired();
             xdtSvc.postRequest($scope.dataEventsNotifier);
             xpctSvc.postRequest($scope.dataEventsNotifier);
             xpntSvc.postRequest($scope.dataEventsNotifier);
         });
     }
    ])
    .directive('rsqMenuXpectXdate', function () {
        //NAMES list container of both `Xpect` and `Xtend`.
        //the user clicks on the desireable object 
        return {
            restrict: 'E',
            scope: {
            },
            // --- 2nd ---
            link: function ($scope, elem) {//no attrz
                Object.defineProperties($scope, {
                    'element': { value: elem }
                });
            },
            controller: 'menuXpectXdateController',
            template:
            '<div>\
             <input type="hidden" id="rsqMenuXpectXdateDocs"/>\
             </div>'
        };
    });
})(window, window.angular);