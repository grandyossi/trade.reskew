'use strict';
/**
 * module-private : Server.Utils lib */
const utilz = require('./Server.Utilz.js');
const Url = require('url');
/**
 * Class to represent a query performed via http request
 * Instantiation is made using node's `request.url` value */
class HttpMessage {
    /**
     * Constructor
     * @param prmUrl {String} The as-is request.url (see: http.IncomingMessage)
     * @see Node's Class http.IncomingMessage */
    constructor(prmUrl) {
        //Notice :
        //2nd argument is true -> 
        //extract the parameters from the query-string
        this._parsedReq = Object.freeze(Url.parse(prmUrl, true));//TO_DEV : no rt err...
        this._pathName = String(this._parsedReq.pathname.slice(1));
    }
    /**
     * Immutable JSON-like object
     * This `{ Property : Value }` style object is the result of
     * parsing the Query-String object */
    get contents() {
        return Object.freeze(this._parsedReq.query);
    }
    /**
     * Immutable String
     * It represents the destination-route of this messgae */
    get Pathname() {
        return Object.freeze(this._pathName);
    }
}

/**
 * ANY resource returned by this `Resource Controller` */
function ResourceResponse() {
    Object.defineProperties(this, {
        /**
         * MIME type */
        'contentType': {
            value: 'application/json',
            writable: true
        },
        'encoding': {
            value: 'utf8',//set to `undefined` once binary
            writable: true
        },
        /**
         * THE contents of this response */
        'content': {
            value: undefined,
            writable: true
        },
        /**
         * Whether this is a textual response */
        'getIsText': {
            value: function () {
                return !!this.encoding;
            }
        }
    });
}

exports.ResourceResponse = ResourceResponse;

const Fs = require('fs');
/**
 * Files Resource Controller (module-private) */
const _FRC = new class {
    constructor() {
        //response for hack attempt
        Object.defineProperties(this, {
            '_res': {
                value: new Map()
            },
            '_hackRsp': {
                value: (function () {
                    const ret = new ResourceResponse();
                    ret.contentType = 'text/html';
                    ret.content = 'Why so Hackious?';
                    return ret;
                })()
            }
        });
    }
    /**
     * File Resource
     * @param prmPath {String} Pathname from client http query 
     * @returns {LoadedFile} as a Promise */
    getPromise(prmPath) {
        return new Promise((resolve, reject) => {
            if (prmPath.endsWith('json') || prmPath.startsWith('server/')) {
                utilz.toLog('_FRC::getPromise:Hack^*^', prmPath);
                //@TO_R : 
                //HTML1527: DOCTYPE expected.Consider adding a valid HTML5 doctype: "<!DOCTYPE html>".
                resolve(this._hackRsp);//Basic Hacking...
                return;
            }
            const path = Object.freeze(
                        (prmPath == '') ? './view/reskew.html' : './' + prmPath);
            utilz.toLog('_FRC::getPromise:Path', path);
            let ret = this._res.get(path);//path already in map?
            if (ret == undefined) {//TO_DEV *3* : clear path from MAP -> enable a view-file update
                this._isResourceAccessRead(path)
                .then(() => {
                    return this._getFile(path);
                })
                .then((aLoadedFile) => {
                    this._res.set(path, aLoadedFile);//new map entry (Key = path)
                    utilz.toLog('_FRC::getPromise:Loaded', '1st');
                    resolve(aLoadedFile);
                })
                .catch((e) => {
                    reject(e);
                });
            } else {
                utilz.toLog('_FRC::getPromise:Read', 'Memory');
                resolve(ret);//ret is a LoadedFile instance
            }
        });
    }
    /**
     * Read Access Verification
     * @param prmPath {String} Pathname
     * @returns {Promise} Never throws */
    _isResourceAccessRead(prmPath) {
        return new Promise((resolve, reject) => {
            try {
                Fs.accessSync(prmPath, Fs.R_OK);
            } catch (e) {
                reject(e);
            }
            resolve();
        });
    }
    /**
     * Read 
     * @param prmPath {String} Pathname
     * @returns {ResourceResponse} as a Promise */
    _getFile(prmPath) {
        //TO_DEV : pictures / other NON utf8...
        return new Promise((resolve, reject) => {
            const _obj = new ResourceResponse();
            if (prmPath.endsWith('html'))
                _obj.contentType = 'text/html';
            else if (prmPath.endsWith('css'))
                _obj.contentType = 'text/css';
            else if (prmPath.endsWith('js'))//IE8-- = 'text/javascript'
                _obj.contentType = 'application/javascript';
            else if (prmPath.endsWith('ico')) {
                _obj.contentType = 'image/x-icon';
                _obj.encoding = undefined;
            }
            try {
                //encoding option specified -> returns a string
                //otherwise -> 
                //returns a BUFFER (has`byteLength` property)
                _obj.content = Fs.readFileSync(prmPath, _obj.encoding);
                resolve(_obj);
            } catch (e) {
                reject(e);
            }
        });
    }
};


//=========================     DB      =========================
//===============================================================

/**
 * Database (Model) Resources */
const _DBRC = new class {
    constructor() {
        Object.defineProperty(this, '_db', {
            value: Object.freeze(require('./Server.DB.Driver').driver)
        });
    }
    /** Get Document[s]
     * @param prmMsg {HttpMessage}
     * @returns {ResourceResponse} as a Promise */
    getPromise(prmMsg) {//TO_DEV *1* - GET from addressbar ***********
        /** @see {ResourceResponse} */
        let retObj = new ResourceResponse();
        if (prmMsg.contents.crud == 'r') {
            utilz.toLog('_DBRC::getPromise',
                        'read : ' + prmMsg.contents.document);
            return new Promise((resolve, reject) => {
                this._db.getDocs[prmMsg.contents.document]
                (prmMsg.contents)
                .then((prmDocs) => {
                    retObj.content = JSON.stringify(prmDocs);
                    resolve(retObj);
                })
                .catch((err) => {
                    retObj.content = `{ "error": "${err}" }`;
                    resolve(retObj);
                });
            });
        }
        return new Promise((resolve, reject) => {
            retObj.content = '{ "error": "Not Implemented" }';
            resolve(retObj);
        });
    }
}

//================================================================

/**
 * Resource Controller Service */
exports.ResourceController = class {
    /** Handles the Requested Url
     * @param prmReqUrl {String} The requested url (req.url)
     * @returns {ResourceResponse} as Promise */
    static getRequestedUrlPromise(prmReqUrl) {
        const msg = new HttpMessage(prmReqUrl);
        if (msg.Pathname == 'db') { //_DBRC = Database Resource
            utilz.toLog('RC::getRequestedUrlPromise', '_DBRC');
            return _DBRC.getPromise(msg);
        } else //_FRC = File Resource
            utilz.toLog('RC::getRequestedUrlPromise', '_FRC');
            return _FRC.getPromise(msg.Pathname);
    }
};
