(function (window, angular) {
    'use strict';//2016-12-02/03
    //Notice: `null` returned once a key not found in storage

    //{
    //  keys{}   //not static, since instance passed as service
    //  init()
    //  getStorage()
    //  _getStore()     **
    //  get()
    //  set()
    //}2016-12-13

    /** Class : Manage DOM storage (as an Angular service) */
    function DOMStorage() {
        Object.defineProperties(this, {
            'keys': {
                __proto__: null,
                value: Object.freeze({
                    $k: 'reskew',
                    login: 'login',
                    actuality: 'actuality',
                    exchange: 'exchange',
                    asset: 'asset',
                }),
                enumerable: true
            },
            'getStorage': {//RELEVANT app store
                value: function () {
                    //Notice : Can't rely on `$scope.isStoreLocal`
                    //since it is being RESET on page refresh
                    if (localStorage.getItem(this.keys.$k))
                        return localStorage;
                    else if (sessionStorage.getItem(this.keys.$k))
                        return sessionStorage;
                    return undefined;
                }
            },
            'init': {//storage init - ONLY after login (see: prmIsLocal)
                value: function (prmIsLocal) {//prm is set @ frmLogin
                    if (this.getStorage()) return;//was already set
                    const store = (prmIsLocal)
                                  ? localStorage : sessionStorage;
                    store.setItem(this.keys.$k, this.keys.$k);
                    store.setItem(this.keys.actuality, '&history=HD');
                    store.setItem(this.keys.exchange, 'TASE');
                    store.setItem(this.keys.asset, 'TA25');//----------
                }
            },
            '_getStore': {//SAFE wrapper. TO_DEV *2* : make private
                value: function () {
                    //if the storage is not yet defined ->
                    //return a NOOP object (avoid rt exceptions ...)
                    const ret = this.getStorage();
                    return (ret)
                        ? ret
                        : Object.freeze({
                            getItem: function () { return undefined; },
                            setItem: function () { }
                        });
                }
            },
            'get': {
                value: function (prmK) {//get value by key
                    return this._getStore().getItem(prmK);
                }
            },
            'set': {//invoked only after login doc returned as post resp
                value: function (prmDbObj) {
                    const s = this._getStore();
                    s.setItem(this.keys.login, prmDbObj._id);
                    const p = prmDbObj.preferences;//preferences
                    if (p.actuality)
                        s.setItem(this.keys.actuality, p.actuality);
                    if (p.exchange)
                        s.setItem(this.keys.exchange, p.exchange);
                    if (p.asset)
                        s.setItem(this.keys.asset, p.asset);
                }
            }
        });
    }

    angular.module('reskewDOMStorage', [])
    .service('domStorageService', [DOMStorage]);
})(window, window.angular);