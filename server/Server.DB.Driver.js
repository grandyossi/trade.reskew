'use strict';
//TO_DEV : Object.definePropery(exports, 'driver', { ... })

/** WRAPPER for mongoDB node.js official driver */
const mongoNJS = (function () {
    const _driver = Object.freeze(require('mongodb'));
    return Object.freeze({
        /** mongoDB node.js official driver */
        driver: _driver,
        /** ObjectID related functionality */
        objectID: Object.freeze({
            /** NEW objectID from any value (usually numeric) */
            from: function (prmAny) {
                return new _driver.ObjectID(prmAny);
            },
            /** objectID validity check */
            isValid: function (prmAny) {
                return _driver.ObjectID.isValid(prmAny);
            }
        })//TESTED : MUST also freeze specific members
    });
})();//TO_DEV *1* : remove redundant `_wrapper`


function getCollectionName(prmJson) {
    const sufx =
        (prmJson.document === 'xdate' ||
         prmJson.document === 'xpect' ||
         prmJson.document === 'xpoint') ? '-Xpect' : '';
    return  prmJson.exchange
            + '_'
            + prmJson.asset
            + sufx;
}

/** Query the db for documents having `xdate` property */
class ActualityQuery {
    //2016-12-02
    /**
     * Enumeration */
    get XdateKind() {
        const dtNow = new Date();
        return Object.freeze({
            /**
             * History Disabled - Only relevant / actual documents */
            HD: { $gt: dtNow },
            /**
             * History Enabled - Include historical documents */
            HE: { $exists: true },
            /**
             * History Only */
            HO: { $lt: dtNow }
        });
    }

    /**
     * @param prmJson object posted via http request
     * @see HttpMessage.contents (Server.RC.js) */
    constructor(prmJson) {
        //e  this.__proto__ = null;
        Object.defineProperties(this, {
            'collectionName': {//NON enumerable property
                value: getCollectionName(prmJson)
            },
            'xdate': {
                __proto__: null,
                //obj[key] : js object is a map
                value: this.XdateKind[prmJson.history],
                enumerable: true
            }
        });
    }
}



/** Type : Xpect / Xtend Query
 * @param prmJson {Object} posted object */
function XpectQuery(prmJson) {
    //T_DEV *3* : remove all o.defprop...
    Object.defineProperties(this, {
        'rank': {
            value: { $exists: true },
            enumerable: true
        },
        'login': {
            value: mongoNJS.objectID.from(prmJson.login),
            enumerable: true
        }
    });
    let xt = true, xp = true;
    try {
        if (prmJson.xtend == 'D') xt = false;
        else if (prmJson.xtend == 'O') xp = false;
        if (xt != xp)
            Object.defineProperty(this, '$and', {
                value: [ { xpect: { $exists: xp } },
                         { xtend: { $exists: xt } } ],
                enumerable: true
            });
    } catch (e) { }
    //when BOTH true -> `rank` is enough to trace the relevant docs
}
//Static : Set the returned array to an object, fitted for the view
Object.defineProperty(XpectQuery, 'getViewFitted', {
    value: function (prmArr) {
        const ret = {
            //defaultName: null,
            xpect_namesArr: [],
            xtend_namesArr: [],
            xpect: {},
            xtend: {}
        };
        let nx, nt, n;//NAME holders : nx - for xtend, nt - for xtend
        let i = 0;//, xMap = new Map(), tMap = new Map();
        prmArr.forEach(function (elem) {
            nx = undefined; nt = undefined;//reset
            if (elem.xpect) {
                nx = elem.xpect.toString();//TO_READ : stringify """"
                ret.xpect_namesArr.push(elem.xpect);
                delete elem.xpect;//current name property
                //xMap.set(nx, elem);
            } else {
                nt = elem.xtend.toString();
                ret.xtend_namesArr.push(elem.xtend);
                delete elem.xtend;
                //tMap.set(nt, elem);
            }
            //valid objectId <-> temp name (not yet set by end-user)
            n = mongoNJS.objectID.isValid((nx) ? nx : nt);
            Object.defineProperty(elem, 'isNameValid', {
                value: !n,//A valid objectId IS INVALID name
                enumerable: true
            });
            //if (0 == i++ && nx)
            //    ret.defaultName = nx;
                //Object.defineProperty(ret, 'defaultName', {
                //    value: nx,
                //    enumerable: true//MUST be enumerable for reply
                //});
            Object.defineProperty((nx) ? ret.xpect : ret.xtend,
                (nx) ? nx : nt,
                { value: elem, enumerable: true });//val: (nx) ? xMap : tMap
        });
        return Object.freeze(ret);//DO_DEV *4* : ?should freeze?
    }
});//STATIC


function XpointQuery() {
}//TO_DEV
Object.defineProperty(XpointQuery, 'getViewFitted', {
    value: function (prmArr, prmLoginId) {
        const ret = {};
        let dt, i = 0;
        prmArr.forEach(function (elem) {
            //stringify is meant to be used on objects (i.e { x: val }),
            //while here used on string value, thus redundant ""
            dt = JSON.stringify(elem.xdate)
                .replace('\"', '').replace('\"', '');//NOT ok : new RegExp('\"', 'g');
            Object.defineProperty(ret, dt, {
                ___proto__: null,
                value: elem[prmLoginId],//{ `loginId`: { } }
                enumerable: true
            });
            ++i;
        });
        ret.length = i;
        return Object.freeze(ret);
    }
});//STATIC

/**
 * trade.reskew - Specific MongoDB `Driver` */
exports.driver = Object.freeze((function () {
    const _utilz = require('./Server.Utilz.js');
    /**
     * NodeJS MongoDB driver */
    const _driver_mongoNJS = Object.freeze(require('mongodb'));
    /**
     * Driver Configuration */
    const _cfg = (function () {
        const _cfg = _utilz.configuration.db;
        //MongoDB connection URI
        _cfg.mongoURI = 'mongodb://'
            + _cfg.loginU + ':' + _cfg.loginP +
            '@' + _cfg.ip + ':' + _cfg.port +
            '/' + _cfg.name + (_cfg.isProduction ? '' : '_dev');
        //http://mongodb.github.io/node-mongodb-native/2.1/reference/connecting/connection-settings/
        _cfg.mongoConnectOptions = {
            autoReconnect: false,
            reconnectTries: 1,
            connectTimeoutMS: 2000,
            socketTimeoutMS: 2000
        };
        return Object.freeze(_cfg);
    })();//CFG
    /**
     * Wrapping basic mongoDB's node.js driver functionalities */
    const _wrapper = Object.freeze({
        /**
         * @returns {String} A valid MongoDB ObjectID */
        getObjectID: function (prmNumericVal) {
            return new _driver_mongoNJS.ObjectID(prmNumericVal);
        },
        /**
         * @param prmId {Object} To be verified
         * @returns {boolean} Whether value is a valid OID */
        isObjectIDvalid: function (prmId) {
            return _driver_mongoNJS.ObjectID.isValid(prmId);
        },
        /**
         * Performs a DB connection.
         * @param prmIsTest {boolean} Optional. true when a test is required 
         * @returns {Promise} A connection. Boolean on test */
        getConnection: function (prmIsTest) {
            return new Promise((resolve, reject) => {
                const _isTest = !!prmIsTest;
                _utilz.toLog(
                    'Server.DB.Driver::getConnection',
                    'Test = ' + _isTest);
                _driver_mongoNJS.MongoClient.connect(
                                _cfg.mongoURI,
                                _cfg.mongoConnectOptions)
                .then((dbConn) => {
                    _utilz.toLog('Connection', 'OK');
                    if (_isTest) {
                        dbConn.close();
                        dbConn = null;
                        resolve(true);
                    } else
                        resolve(dbConn);
                })
                .catch((err) => {
                    _utilz.toLog('Error', err.stack);
                    reject(err);
                });
            })
        }
    });//WRAPPER

    /** This server's `Driver` */
    return Object.freeze({
        /** Login Attempt: Retrieve login related document */
        getDocs: Object.freeze({
            login: function (prmJson) {
                _utilz.toLog('Server.DB.Driver::getDocs', 'login');
                return new Promise((resolve, reject) => {
                    const _query = Object.freeze({
                        email: prmJson.email
                    });
                    const _projection = Object.freeze({
                        __rem: 0,
                        email: 0/*
                        _id: 0  Fetch _id -> user identification */
                    });
                    let _dbConn = null;
                    _utilz.toLog('Login : ', _query.email);
                    _wrapper.getConnection()
                    .then((dbConn) => {
                        _dbConn = dbConn;
                        //http://mongodb.github.io/node-mongodb-native/2.1/api/Collection.html#findOne
                        //Notice: `findOne` returns a `Promise`,
                        //unlike `find` which returns a `Cursor`
                        return  dbConn.collection('login')
                                .findOne(_query, _projection);
                    })
                    .then((found) => {
                        _dbConn.close();
                        _dbConn = null;
                        let _err = 'Not a registered Email';
                        if (!found) {
                            _utilz.toLog('Error', _err);
                            reject(_err);
                        } else {
                            if (found.password == prmJson.pwd) {
                                //delete property <-> 
                                //never respond the password
                                delete found.password;
                                _utilz.toLog(_query.email, 'OK');
                                resolve(found);
                            } else {
                                _err = 'Password Mismatch';
                                _utilz.toLog('Error', _err);
                                reject(_err);
                            }
                        }
                    })
                    .catch((err) => {
                        _utilz.toLog('Error', 'DB conn...');
                        reject(err);
                    });
                });
            },
            xdate: function (prmJson) {
                _utilz.toLog('Server.DB.Driver::getDocs', 'xdate');
                return new Promise((resolve, reject) => {
                    const qDate = new ActualityQuery(prmJson);
                    qDate.week = { $exists: true };
                    _utilz.toLog('Collection', qDate.collectionName);
                    let dbConn = null;
                    _wrapper.getConnection()
                    .then((conn) => {
                        dbConn = conn;
                        const proj = {
                            _id: 0,
                            __rem: 0
                        };//History Disabled -> 
                        //sort ASC : most relevant xdate - on top
                        //when enabled -> 
                        //sord DSC : most recent historical - on top
                        const zort = (prmJson.history == 'HD')
                                     ? { xdate: 1 } : { xdate: -1 }
                        //Notice: `toArray` returns a `Promise`
                        const found =
                              conn.collection(qDate.collectionName)
                              .find(qDate, proj);
                        //TO_READ : ? works ONLY by using `found` var ?
                        return found.sort(zort).toArray();
                    })
                    .then((arr) => {
                        dbConn.close();
                        dbConn = null;
                        _utilz.toLog('Array Size', arr.length);
                        resolve(arr);
                    })
                    .catch((err) => {
                        _utilz.toLog('Error', 'DB Conn...');
                        reject(err);
                    });
                });
            },
            xpect: function (prmJson) {
                _utilz.toLog('Server.DB.Driver::getDocs', 'xpect');
                return new Promise((resolve, reject) => {
                    const col = getCollectionName(prmJson);
                    _utilz.toLog('Collection', col);
                    let dbConn = null;
                    _wrapper.getConnection()
                    .then((conn) => {
                        dbConn = conn;
                        const proj = { _id: 0, login: 0, __rem: 0 };
                        //T_DEV *4* : NO rem production db
                        //T_DEV *2* : limit length
                        const found =
                              conn.collection(col)
                              .find(new XpectQuery(prmJson), proj);
                        return found.sort({ rank: 1 }).toArray();
                    })
                    .then((arr) => {
                        dbConn.close();
                        dbConn = null;
                        _utilz.toLog('Array Size', arr.length);
                        resolve(XpectQuery.getViewFitted(arr));
                    })
                    .catch((err) => {
                        _utilz.toLog('Error', 'DB Conn...');
                        reject(err);
                    });//TO_READ *1* : https://docs.angularjs.org/api/ng/service/$q#the-promise-api
                    //.finally(() => {
                    //    _utilz.toLog('finally 1', '...');
                    //}, () => {
                    //    _utilz.toLog('finally 2', '...');
                    //});
                });
            },
            xpoint: function (prmJson) {
                return new Promise((resolve, reject) => {
                    const qFind = new ActualityQuery(prmJson);
                    qFind['' + prmJson.login] = { $exists: true };
                    _utilz.toLog('Collection', qFind.collectionName);
                    let dbConn = null;
                    _wrapper.getConnection()
                    .then((conn) => {
                        dbConn = conn;
                        const proj = {
                            _id: 0,
                            login: 0,
                            __rem: 0//T_DEV *4* : NO rem production db
                        };//T_DEV *2* : limit length + sort by rank
                        const found =
                              conn.collection(qFind.collectionName)
                              .find(qFind, proj);
                        return found.toArray();
                    })
                    .then((arr) => {
                        dbConn.close();
                        dbConn = null;
                        _utilz.toLog('Array Size', arr.length);
                        resolve(
                        XpointQuery.getViewFitted(arr, prmJson.login));
                    })
                    .catch((err) => {
                        _utilz.toLog('Error', 'DB Conn...');
                        reject(err);
                    });
                });
            }
        })
    });
})());
