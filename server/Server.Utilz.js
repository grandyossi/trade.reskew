'use strict';
/*
    FMI:
    process.argv[]      <- Project Properties/`Script arguments`
    process.env.port    <-
    __dirname
*/

/**
 * IIFE - Utility Object */
module.exports = (() => {
    const _cfg = Object.freeze(require('./server.json'));
    //const dt = new Date("2017 02 02 09:45");
    //const dtTT = dt.getTime();
    return Object.freeze({
        Test: class {
            constructor() {
                this.isOk = true;//2016-10-21 : new Test() ok
            }
        },
        /**
         * Configuration Object - Has `Server` and `DB` Properties */
        configuration: _cfg,
        /**
         * Log to nodeJS server's console */
        toLog: Object.freeze(
                (_cfg.server.isLogOn)
                ? (pmFn, pmTxt) => { console.log(`${pmFn} -> ${pmTxt}`); }
                : () => { })
        //TO_DEV : numeric log level : 0 = file, 1 = console
    });
})();

module.exports.toLog('Server.Utilz', 'Loaded from : ' + __dirname);
