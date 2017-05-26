/**
 * reskewJS : THE basic application functionality.
 * It is a global object <-> Set as a `window` propery
 * (like `alert`) */
Object.defineProperty(window, 'reskewJS', {
    value: (function () { 'use strict';
        //The returned container object
        const _ret_container = {};
        const _dom = {};
        Object.defineProperty(_dom, 'divNgApp', {
            value: document.getElementById('divNgApp')
        });
        Object.defineProperty(_dom, 'divErr', {
            value: document.getElementById('divErr')
        });
        //results, i.e : reskewJS.dom.divErr
        Object.defineProperty(_ret_container, 'dom', {
            value: _dom
        });
        //CSS related State : DOMTokenList / classList
        function _getCssState() {
            const _isCL = _dom.divErr.classList instanceof DOMTokenList;
            return Object.freeze({
                domTokenList: _isCL,
                isError: !_isCL,
                asString: 'JavaScript : DOMTokenList = ' + _isCL
            });
        }
        //DOM Storage = Web Storage API
        function _getWebStorageState() {
            //LONG code -> 
            //shorter @ `_getCssState`
            let _ret = {};
            function _get(prmS) {
                let _retE = 'no browser support';
                try {
                    //A. Verify `window` object has the desired property
                    const store = window[prmS];//<-> window.prmS
                    _retE = 'disabled';
                    //B. Verify feature is enabled - 
                    //By set & remove Key- Value
                    store.setItem('k', 'v');
                    store.removeItem('k');
                    _retE = 'ok';
                } catch (e) { }
                return _retE;
            }
            //developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/defineProperty
            Object.defineProperty(_ret, 'local', {
                value: _get('localStorage'),
                enumerable: true
            });
            Object.defineProperty(_ret, 'session', {
                value: _get('sessionStorage'),
                enumerable: true
            });
            Object.defineProperty(_ret, 'isError', {
                value: (_ret.local != 'ok' || _ret.session != 'ok')
                    ? true : false,
                enumerable: true
            });
            Object.defineProperty(_ret, 'asString', {
                value: 'DOM Storage : Session = '
                + _ret.session + ', Local = '
                + _ret.local
            });
            return _ret;//Notice: enumerable, needed for JSON.strigify
        }
        //4 `Web Components` (2 of which verified here):
        //HTML Templates, Shadow DOM, Custom Elements, HTML Imports
        function _getWebComponentsState() {
            //<link> is mostly valid (css)
            //import feature is not always enabled
            const _imp = 'import' in document.createElement('link');
            const _tmp = !(document.createElement('template')
                instanceof HTMLUnknownElement);
            return Object.freeze({
                import: _imp,
                template: _tmp,
                isError: (!_imp || !_tmp)
            });
        }
        //Properies of `scriptStatus` container-object
        //Each Property is a javascript related application dependency
        const _status_propz = {};
        Object.defineProperty(_status_propz, 'css', {
            value: _getCssState()
        });
        Object.defineProperty(_status_propz, 'webStorage', {
            value: _getWebStorageState()
        });
        Object.defineProperty(_status_propz, 'webComponents', {
            value: _getWebComponentsState()
        });
        //setting the `scriptStatus` container-object
        Object.defineProperty(_ret_container, 'scriptStatus', {
            value: _status_propz
        });
        return _ret_container;
    })()
});

//Application Flow - prior to Angular being loaded
Object.defineProperty(reskewJS, 'state', {
    value: {}
});

Object.defineProperty(reskewJS.state, 'loadScript', {
    value: function (prmStep) {
        //TO_READ : 
        //https://developer.mozilla.org/en-US/docs/Web/Events/DOMContentLoaded
        const _script = document.createElement('script');
        switch (prmStep) {
            case 0:/* REM: was case 1. Disabled by setting case 0*/
                _script.setAttribute('src',
                        '/view/reskewJS.login.js');
                _script.setAttribute('onload',
                        'reskewJS.state.loadScript()');
                //_script.onload = this.loadScript(2);
                //_script.src = ;
                break;
            case 1:
                _script.setAttribute('src',
                        '/node_modules/angular/angular.min.js');
                _script.setAttribute('onload',
                        'reskewJS.state.loadScript(2)');
                break;
            case 2:
                _script.setAttribute('src',
                    '/view/modules/DOMStorage.js');
                _script.setAttribute('onload',
                    'reskewJS.state.loadScript(3)');
                break;
            case 3:
                _script.setAttribute('src',
                    '/view/modules/Login.js');
                _script.setAttribute('onload',
                    'reskewJS.state.loadScript(4)');
                break;
            case 4:
                _script.setAttribute('src',
                    '/view/modules/Menu.Xdate.js');
                _script.setAttribute('onload',
                    'reskewJS.state.loadScript(5)');
                break;
            case 5:
                _script.setAttribute('src',
                    '/view/modules/Menu.Xpect.js');
                _script.setAttribute('onload',
                    'reskewJS.state.loadScript(6)');
                break;
            case 6:
                _script.setAttribute('src',
                    '/view/modules/Menu.XpectXdate.js');
                _script.setAttribute('onload',
                    'reskewJS.state.loadScript(7)');
                break;
            case 7:
                _script.setAttribute('src',
                    '/view/modules/Xpect.js');
                _script.setAttribute('onload',
                    'reskewJS.state.loadScript(8)');
                break;
            case 8:
                _script.setAttribute('src',
                    '/view/modules/Xpoint.js');
                _script.setAttribute('onload',
                    'reskewJS.state.loadScript(9)');
                break;
            case 9:
                _script.setAttribute('src',
                    '/view/modules/Menu.Xpoint.js');
                _script.setAttribute('onload',
                    'reskewJS.state.loadScript(10)');
                break;
            case 10:
                _script.setAttribute('src',
                    '/view/modules/Xpricing.js');
                _script.setAttribute('onload',
                    'reskewJS.state.loadScript(11)');
                break;
            case 11:
                //THE reskewApplication : container of all modules
                _script.src = '/view/modules/Application.js';
        }
        document.body.appendChild(_script);
    }
});

Object.defineProperty(reskewJS.state, 'setError', {
    value: function (prmTxt) {
        reskewJS.dom.bnLogin.classList.add('simple_hide');
        reskewJS.dom.divErr.style.display = 'block';
        //innerText -> 'OK' + '\n' 
        reskewJS.dom.divErr.firstElementChild.innerText = prmTxt;
        //divErr is displayed - until user clicks the document
        document.onclick = function () {
            document.onclick = '';//remove any event lisenner
            setTimeout(function () {
                reskewJS.dom.divErr.style.display = 'none';
                reskewJS.dom.bnLogin.classList.remove('simple_hide');
                reskewJS.dom.divErr.firstElementChild.innerText = '';
            }, 500);
        };
    }
});

//AngularJS : Disabled DOM Storage -> exception (IEv11.545: 2016-10-16)
//No `webStorage` related err -> include angular
if (reskewJS.scriptStatus.webStorage.isError
    ||
    reskewJS.scriptStatus.css.isError)
    reskewJS.state.setError(
        reskewJS.scriptStatus.webStorage.asString + '\n' +
        reskewJS.scriptStatus.css.asString);
else
    reskewJS.state.loadScript(1);//invokes scripts loading chain
