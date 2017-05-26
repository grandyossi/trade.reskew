'use strict';
/** NodeJS Server object as IIFE */
const nodeModule = Object.freeze((() => {
    const _utilz = require('./Server.Utilz.js');
    const _resources = require('./Server.RC.js').ResourceController;
    const _http = require('http');
    //
    return {
        port: _utilz.configuration.server.port,
        server: _http.createServer((req, res) => {
            _resources.getRequestedUrlPromise(req.url)
            .then((loadedRes) => {
                _utilz.toLog('Server::onRequest', 'To respond 200');
                const len = (loadedRes.getIsText())
                            ? Buffer.byteLength(loadedRes.content)
                            : loadedRes.content.byteLength;
                _utilz.toLog('Server::onRequest', 'Content Bytes : ' + len);
                res.writeHead(200, {
                    'Content-Type': loadedRes.contentType,
                    'Content-Length': len
                });
                res.end(loadedRes.content);
                _utilz.toLog('Server::onRequest', 'End : ' + res.finished);
            })
            .catch((e) => {
                e = (e.message) ? e.message : e;
                _utilz.toLog('Server::onRequest', 'To respond 404 : ' + e);
                res.writeHead(404, {'Content-Type': 'text/html'});
                res.end(e);
                _utilz.toLog('Server::onRequest', 'End : ' + res.finished);
            });
        })
    };
})());

nodeModule.server.listen(nodeModule.port);