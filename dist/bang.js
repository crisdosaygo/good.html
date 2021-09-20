/*
 * ATTENTION: The "eval" devtool has been used (maybe by default in mode: "development").
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
/******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ "./src/bang.js":
/*!*********************!*\
  !*** ./src/bang.js ***!
  \*********************/
/***/ ((__unused_webpack_module, __unused_webpack_exports, __webpack_require__) => {

eval("{\n  // constants, classes, config and state\n    const DEBUG = false;\n    const LEGACY = false;\n    const MOBILE = isMobile();\n    const DOUBLE_BARREL = /\\w+-\\w*/; // note that this matches triple- and higher barrels, too\n    const F = _FUNC; \n    const FUNC_CALL = /\\);?$/;\n    const CONFIG = {\n      htmlFile: 'markup.html',\n      scriptFile: 'script.js',\n      styleFile: 'style.css',\n      bangKey: '_bang_key',\n      componentsPath: './components',\n      allowUnset: false,\n      unsetPlaceholder: '',\n      EVENTS: `error load click pointerdown pointerup pointermove mousedown mouseup \n        mousemove touchstart touchend touchmove touchcancel dblclick dragstart dragend \n        dragmove drag mouseover mouseout focus blur focusin focusout scroll\n      `.split(/\\s+/g).filter(s => s.length).map(e => `on${e}`),\n      delayFirstPaintUntilLoaded: true,\n      noHandlerPassthrough: false\n    };\n    const STATE = new Map();\n    const CACHE = new Map();\n    const Started = new Set();\n    const TRANSFORMING = new WeakSet();\n    const Dependents = new Map();\n    const Counts = {\n      started: 0,\n      finished: 0\n    };\n    let systemKeys = 1;\n    let _c$;\n\n    const BangBase = (name) => class Base extends HTMLElement {\n      static #activeAttrs = ['state']; // we listen for changes to these attributes only\n      static get observedAttributes() {\n        return Array.from(Base.#activeAttrs);\n      }\n      #name = name;\n\n      constructor() {\n        super();\n        DEBUG && say('log',name, 'constructed');\n        this.print();\n      }\n\n      // BANG! API methods\n      print() {\n        Counts.started++;\n        this.prepareVisibility();\n        const state = this.handleAttrs(this.attributes, {originals: true});\n        return this.printShadow(state);\n      }\n\n      prepareVisibility() {\n        this.classList.add('bang-el');\n        this.classList.remove('bang-styled');\n        // this is like an onerror event for stylesheet's \n          // we do this because we want to display elements if they have no stylesheet defined\n          // becuase it's reasonabgle to want to not include a stylesheet with your custom element\n        fetchStyle(name).catch(err => this.setVisible());\n      }\n\n      setVisible() {\n        this.classList.add('bang-styled');\n      }\n\n      // Web Components methods\n      attributeChangedCallback(name, oldValue, value) {\n        // setting the state attribute casues the custom element to re-render\n        if ( name === 'state' && !isUnset(oldValue) ) {\n          DEBUG && say('log',`Changing state, so calling print.`, oldValue, value, this);\n          this.print();\n        }\n      }\n\n      connectedCallback() {\n        DEBUG && say('log',name, 'connected');\n      }\n\n      // private methods\n      handleAttrs(attrs, {node, originals} = {}) {\n        let state;\n\n        if ( ! node ) node = this;\n\n        for( let {name,value} of attrs ) {\n          if ( isUnset(value) ) continue;\n\n          if ( name === 'state' ) {\n            const stateKey = value; \n            const stateObject = STATE.get(stateKey);\n            \n            if ( isUnset(stateObject) ) {\n              throw new TypeError(`\n                <${name}> constructor passed state key ${stateKey} which is unset. It must be set.\n              `);\n            }\n            \n            state = stateObject;\n            \n            if ( originals ) {\n              let acquirers = Dependents.get(stateKey);\n              if ( ! acquirers ) {\n                acquirers = new Set();\n                Dependents.set(stateKey, acquirers);\n              }\n              acquirers.add(node);\n            }\n          } else if ( originals ) { // set event handlers to custom element class instance methods\n            if ( ! name.startsWith('on') ) continue;\n            value = value.trim();\n            if ( ! value ) continue;\n\n            const path = node === this ? 'this.' : 'this.getRootNode().host.';\n            if ( value.startsWith(path) ) continue;\n            const ender = value.match(FUNC_CALL) ? '' : '(event)';\n            node.setAttribute(name, `${path}${value}${ender}`);\n          }\n        }\n\n        return state;\n      }\n\n      printShadow(state) {\n        return fetchMarkup(this.#name, this).then(async markup => {\n          const cooked = await cook.call(this, markup, state);\n          if ( LEGACY ) {\n            const nodes = toDOM(cooked);\n            // attributes on each node in the shadom DOM that has an even handler or state\n            const listening = nodes.querySelectorAll(CONFIG.EVENTS.map(e => `[${e}]`).join(', '));\n            listening.forEach(node => this.handleAttrs(node.attributes, {node, originals: true}));\n            DEBUG && say('log',nodes, cooked, state);\n            const shadow = this.shadowRoot || this.attachShadow({mode:'open'});\n            shadow.replaceChildren(nodes);\n          } else if ( !this.shadowRoot ) {\n            const shadow = this.attachShadow({mode:'open'});\n            cooked.to(shadow, 'insert');\n            const listening = shadow.querySelectorAll(CONFIG.EVENTS.map(e => `[${e}]`).join(', '));\n            listening.forEach(node => this.handleAttrs(node.attributes, {node, originals: true}));\n          }\n        })\n        .catch(err => DEBUG && say('warn',err))\n        .finally(() => Counts.finished++);\n      }\n    };\n\n    class StateKey extends String {\n      constructor (keyNumber) {\n        if ( keyNumber == undefined ) super(`system-key:${systemKeys++}`); \n        else super(`client-key:${keyNumber}`);\n      }\n    }\n\n  install();\n\n  // API\n    async function use(name) {\n      let component;\n      await fetchScript(name)\n        .then(script => { // if there's a script that extends base, evaluate it to be component\n          const Base = BangBase(name);\n          const Compose = `(function () { ${Base.toString()}; return ${script}; }())`;\n          try {\n            component = eval(Compose);\n          } catch(e) {\n            DEBUG && say('warn',e, Compose, component)\n          }\n        }).catch(() => {  // otherwise if there is no such extension script, just use the Base class\n          component = BangBase(name);\n        });\n      \n      self.customElements.define(name, component);\n      DEBUG && self.customElements.whenDefined(name).then(obj => say('log',name, 'defined', obj));\n    }\n\n    function bangfig(newConfig = {}) {\n      Object.assign(CONFIG, newConfig);\n    }\n\n    function setState(key, state, rerenderAll = false) {\n      STATE.set(key, state);\n      STATE.set(state, key);\n\n      if ( document.body && rerenderAll ) { // re-render all very simply\n        // we need to remove styled because it will need to load after we set the innerHTML\n        Array.from(document.querySelectorAll(':not(body).bang-styled'))\n          .forEach(node => node.classList.remove('bang-styled'));\n        \n        const HTML = document.body.innerHTML;\n        document.body.innerHTML = '';\n        document.body.innerHTML = HTML;\n      } else { // re-render only those components depending on that key\n        const acquirers = Dependents.get(key);\n        if ( acquirers ) acquirers.forEach(host => host.print());\n      }\n    }\n\n    function cloneState(key) {\n      if ( STATE.has(key) ) return JSON.parse(JSON.stringify(STATE.get(key)));\n      else {\n        throw new TypeError(`State store does not have the key ${key}`);\n      }\n    }\n\n    async function loaded() {\n      const loadCheck = () => {\n        const nonZeroCount = Counts.started > 0; \n        const finishedWhatWeStarted = Counts.finished === Counts.started;\n        return nonZeroCount && finishedWhatWeStarted;\n      };\n      return becomesTrue(loadCheck);\n    }\n\n    async function bangLoaded() {\n      const loadCheck = () => {\n        const c_defined = typeof _c$ === \"function\";\n        return c_defined;\n      };\n      return becomesTrue(loadCheck);\n    }\n\n  // helpers\n    async function install() {\n      Object.assign(globalThis, {\n        use, setState, cloneState, loaded, sleep, bangfig, bangLoaded,\n        ...( DEBUG ? { STATE, CACHE, TRANSFORMING, Started, BangBase } : {})\n      });\n\n      const module = await __webpack_require__.e(/*! import() */ \"src_vv_vanillaview_js\").then(__webpack_require__.bind(__webpack_require__, /*! ./vv/vanillaview.js */ \"./src/vv/vanillaview.js\"));\n      const {s} = module;\n      const That = {STATE,CONFIG,StateKey}; \n      _c$ = s.bind(That);\n      That._c$ = _c$;\n\n      if ( CONFIG.delayFirstPaintUntilLoaded ) {\n        becomesTrue(() => document.body).then(() => document.body.classList.add('bang-el'));\n      }\n\n      const observer = new MutationObserver(transformBangs);\n      /* we are interested in bang nodes (which start as comments) */\n      observer.observe(document.documentElement, {subtree: true, childList: true, characterData: true}); \n      findBangs(transformBang); \n      \n      loaded().then(() => document.body.classList.add('bang-styled'));\n    }\n\n    async function fetchMarkup(name, comp) {\n      // cache first\n        // we make any subsequent calls for name wait for the first call to complete\n        // otherwise we create many in parallel without benefitting from caching\n\n      const key = `markup:${name}`;\n\n      if ( Started.has(key) ) {\n        if ( ! CACHE.has(key) ) await becomesTrue(() => CACHE.has(key));\n      } else Started.add(key);\n\n      const styleKey = `style${name}`;\n      const baseUrl = `${CONFIG.componentsPath}/${name}`;\n      if ( CACHE.has(key) ) {\n        const markup = CACHE.get(key);\n        if ( CACHE.get(styleKey) instanceof Error ) comp.setVisible();\n        \n        // if there is an error style and we are still includig that link\n        // we generate and cache the markup again to omit such a link element\n        if ( CACHE.get(styleKey) instanceof Error && markup.includes(`href=${baseUrl}/${CONFIG.styleFile}`) ) {\n          // then we need to set the cache for markup again and remove the link to the stylesheet which failed \n        } else {\n          comp.setVisible();\n          return markup;\n        }\n      }\n      \n      const markupUrl = `${baseUrl}/${CONFIG.htmlFile}`;\n      let resp;\n      const markupText = await fetch(markupUrl).then(async r => { \n        let text = '';\n        if ( r.ok ) text = await r.text();\n        else text = `<slot></slot>`;        // if no markup is given we just insert all content within the custom element\n      \n        if ( CACHE.get(styleKey) instanceof Error ) { \n          resp = text; \n          comp.setVisible();\n        } else {\n          // inlining styles for increase speed */\n            // we setVisible (add bang-styled) straight away because the inline styles block the markup\n            // so no FOUC while stylesheet link is loading, like previously: resp = `\n            // <link rel=stylesheet href=${baseUrl}/${CONFIG.styleFile} onload=setVisible>${text}`;\n          resp = `<style>${await fetchStyle(name).catch(e => '')}</style>${text}`;\n          comp.setVisible();\n        }\n        \n        return resp;\n      }).finally(async () => CACHE.set(key, await resp));\n      return markupText;\n    }\n\n    async function fetchFile(name, file) {\n      const key = `${file}:${name}`;\n\n      if ( Started.has(key) ) {\n        if ( ! CACHE.has(key) ) await becomesTrue(() => CACHE.has(key));\n      } else Started.add(key);\n\n      if ( CACHE.has(key) ) return CACHE.get(key);\n\n      const url = `${CONFIG.componentsPath}/${name}/${file}`;\n      let resp;\n      const fileText = await fetch(url).then(r => { \n        if ( r.ok ) {\n          resp = r.text();\n          return resp;\n        } \n        resp = new TypeError(`Fetch error: ${url}, ${r.statusText}`);\n        throw resp;\n      }).finally(async () => CACHE.set(key, await resp));\n      \n      return fileText;\n    }\n\n    async function fetchStyle(name) {\n      return fetchFile(name, CONFIG.styleFile);\n    }\n\n    async function fetchScript(name) {\n      return fetchFile(name, CONFIG.scriptFile);\n    }\n\n    // search and transform each added subtree\n    function transformBangs(records) {\n      records.forEach(record => {\n        DEBUG && say('log',record);\n        const {addedNodes} = record;\n        if ( !addedNodes ) return;\n        addedNodes.forEach(node => findBangs(transformBang, node));\n      });\n    }\n\n    function transformBang(current) {\n      DEBUG && say('log',{transformBang},{current});\n      const [name, data] = getBangDetails(current);\n      DEBUG && say('log',{name, data});\n\n      // replace the bang node (comment) with its actual custom element node\n      const actualElement = createElement(name, data);\n      current.parentElement.replaceChild(actualElement, current);\n    }\n\n    function findBangs(callback, root = document.documentElement) {\n      const Acceptor = {\n        acceptNode(node) {\n          if ( node.nodeType !== Node.COMMENT_NODE ) return NodeFilter.FILTER_SKIP;\n          const [name] = getBangDetails(node); \n          if ( name.match(DOUBLE_BARREL) ) return NodeFilter.FILTER_ACCEPT;\n          else return NodeFilter.FILTER_REJECT;\n        }\n      };\n      const iterator = document.createTreeWalker(root, NodeFilter.SHOW_COMMENT, Acceptor);\n      const replacements = [];\n\n      // handle root node\n        // it's a special case because it will be present in the iteration even if\n        // the NodeFilter would filter it out if it were not the root\n      let current = iterator.currentNode;\n\n      if ( Acceptor.acceptNode(current) === NodeFilter.FILTER_ACCEPT ) {\n        if ( !TRANSFORMING.has(current) ) {\n          TRANSFORMING.add(current);\n          const target = current;\n          replacements.push(() => transformBang(target));\n        }\n      }\n\n      // handle any descendents\n        while (true) {\n          current = iterator.nextNode();\n          if ( ! current ) break;\n\n          if ( !TRANSFORMING.has(current) ) {\n            TRANSFORMING.add(current);\n            const target = current;\n            replacements.push(() => transformBang(target));\n          }\n        }\n\n      while(replacements.length) replacements.pop()();\n    }\n\n    function getBangDetails(node) {\n      const text = node.textContent.trim();\n      const [name, ...data] = text.split(/[\\s\\t]/g);\n      return [name, data.join(' ')];\n    }\n\n    async function process(x, state) {\n      if ( typeof x === 'string' ) return x;\n      else \n\n      if ( typeof x === 'number' ) return x+'';\n      else\n\n      if ( typeof x === 'boolean' ) return x+'';\n      else\n\n      if ( x instanceof Date ) return x+'';\n      else\n\n      if ( isUnset(x) ) {\n        if ( CONFIG.allowUnset ) return CONFIG.unsetPlaceholder || '';\n        else {\n          throw new TypeError(`Value cannot be unset, was: ${x}`);\n        }\n      }\n      else\n\n      if ( x instanceof Promise ) return await x.catch(err => err+'');\n      else\n\n      if ( x instanceof Element ) return x.outerHTML;\n      else\n\n      if ( x instanceof Node ) return x.textContent;\n      else\n\n      if ( isIterable(x) ) {\n        // if an Array or iterable is given then\n        // its values are recursively processed via this same function\n        return (await Promise.all(\n          (\n            await Promise.all(Array.from(x)).catch(e => err+'')\n          ).map(v => process(v, state))\n        )).join(' ');\n      }\n      else\n\n      if ( Object.getPrototypeOf(x).constructor.name === 'AsyncFunction' ) return await x(state);\n      else\n\n      if ( x instanceof Function ) return x(state);\n      else // it's an object, of some type \n\n      {\n        // State store     \n          /* so we assume an object is state and save it */\n          /* to the global state store */\n          /* which is two-sides so we can find a key */\n          /* given an object. This avoid duplicates */\n        let stateKey;\n\n        // own keys\n          // an object can specify it's own state key\n          // to provide a single logical identity for a piece of state that may\n          // be represented by many objects\n\n        if ( Object.prototype.hasOwnProperty.call(x, CONFIG.bangKey) ) {\n          stateKey = new StateKey(x[CONFIG.bangKey])+'';\n          // in that case, replace the previously saved object with the same logical identity\n          const oldX = STATE.get(stateKey);\n          STATE.delete(oldX);\n\n          STATE.set(stateKey, x);\n          STATE.set(x, stateKey);\n        } \n\n        else  /* or the system can come up with a state key */\n\n        {\n          if ( STATE.has(x) ) stateKey = STATE.get(x);\n          else {\n            stateKey = new StateKey()+'';\n            STATE.set(stateKey, x);\n            STATE.set(x, stateKey);\n          }\n        }\n\n        stateKey += '';\n        DEBUG && say('log',{stateKey});\n        return stateKey;\n      }\n    }\n\n    async function cook(markup, state) {\n      let cooked = '';\n      try {\n        if ( !Object.prototype.hasOwnProperty.call(state, '_self') ) {\n          Object.defineProperty(state, '_self', {\n            get: () => state\n          });\n        }\n        DEBUG && say('log','_self', state._self);\n      } catch(e) {\n        DEBUG && say('warn',\n          `Cannot add '_self' self-reference property to state. \n            This enables a component to inspect the top-level state object it is passed.`\n        );\n      }\n      try {\n        with(state) {\n          cooked = await eval(\"(async function () { return await _FUNC`${{state}}\"+markup+\"`; }())\");  \n        }\n        DEBUG && console.log({cooked});\n        return cooked;\n      } catch(error) {\n        say('error', 'Template error', {markup, state, error});\n        throw error;\n      }\n    }\n\n    async function _FUNC(strings, ...vals) {\n      const s = Array.from(strings);\n      const ret =  await _c$(s, ...vals);\n      return ret;\n    }\n\n    async function old_FUNC(strings, ...vals) {\n      const s = Array.from(strings);\n      let SystemCall = false;\n      let state;\n      let str = '';\n\n      DEBUG && say('log',s.join('${}'));\n\n      if ( s[0].length === 0 && vals[0].state ) {\n        // by convention (see how we construct the template that we tag with FUNC)\n        // the first value is the state object when our system calls it\n        SystemCall = true;\n      }\n\n      // resolve all the values now if it's a SystemCall of _FUNC\n      if ( SystemCall ) {\n        const {state} = vals.shift();\n        s.shift();\n        vals = await Promise.all(vals.map(v => process(v, state)));\n        DEBUG && say('log','System _FUNC call: ' + vals.join(', '));\n\n        while(s.length) {\n          str += s.shift();\n          if ( vals.length ) {\n            str += vals.shift();\n          }\n        }\n        return str;\n      } \n\n      else \n\n      // otherwise resolve them when we have access to the top-level state\n        // this is effectively just a little bit of magic that lets us \"overload\"\n        // the method signature of F\n\n      return async state => {\n        vals = await Promise.all(vals.map(v => process(v, state)));\n        DEBUG && say('log','in-template _FUNC call:' + vals.join(', '));\n\n        while(s.length) {\n          str += s.shift();\n          if ( vals.length ) str += vals.shift();\n        }\n\n        return str;\n      };\n    }\n\n    function createElement(name, data) {\n      const df = document.createDocumentFragment();\n      const container = document.createElement('div');\n      df.appendChild(container);\n      container.insertAdjacentHTML(`afterbegin`, `<${name} ${data}></${name}>`);\n      return container.firstElementChild;\n    }\n\n    function toDOM(str) {\n      const f = (new DOMParser).parseFromString(\n          `<template>${str}</template>`,\n          \"text/html\"\n        ).head.firstElementChild.content;\n      f.normalize();\n      return f;\n    }\n\n    async function becomesTrue(check = () => true) {\n      return new Promise(async res => {\n        while(true) {\n          await sleep(47);\n          if ( check() ) break;\n        }\n        res();\n      });\n    }\n\n    async function sleep(ms) {\n      return new Promise(res => setTimeout(res, ms));\n    }\n\n    function isIterable(y) {\n      if ( y === null ) return false;\n      return y[Symbol.iterator] instanceof Function;\n    }\n\n    function isUnset(x) {\n      return x === undefined || x === null;\n    }\n\n    function say(mode, ...stuff) {\n      DEBUG && MOBILE && alert(`${mode}: ${stuff.join('\\n')}`);\n      DEBUG && console[mode](...stuff);\n    }\n\n    function isMobile() {\n\t\t\tlet check = false;\n\t\t\t(function(a){if(/(android|bb\\d+|meego).+mobile|avantgo|bada\\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\\-(n|u)|c55\\/|capi|ccwa|cdm\\-|cell|chtm|cldc|cmd\\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\\-s|devi|dica|dmob|do(c|p)o|ds(12|\\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\\-|_)|g1 u|g560|gene|gf\\-5|g\\-mo|go(\\.w|od)|gr(ad|un)|haie|hcit|hd\\-(m|p|t)|hei\\-|hi(pt|ta)|hp( i|ip)|hs\\-c|ht(c(\\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\\-(20|go|ma)|i230|iac( |\\-|\\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\\/)|klon|kpt |kwc\\-|kyo(c|k)|le(no|xi)|lg( g|\\/(k|l|u)|50|54|\\-[a-w])|libw|lynx|m1\\-w|m3ga|m50\\/|ma(te|ui|xo)|mc(01|21|ca)|m\\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\\-2|po(ck|rt|se)|prox|psio|pt\\-g|qa\\-a|qc(07|12|21|32|60|\\-[2-7]|i\\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\\-|oo|p\\-)|sdk\\/|se(c(\\-|0|1)|47|mc|nd|ri)|sgh\\-|shar|sie(\\-|m)|sk\\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\\-|v\\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\\-|tdg\\-|tel(i|m)|tim\\-|t\\-mo|to(pl|sh)|ts(70|m\\-|m3|m5)|tx\\-9|up(\\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\\-|your|zeto|zte\\-/i.test(a.substr(0,4))) check = true;})(navigator.userAgent||navigator.vendor||window.opera);\n\t\t\treturn check;\n    }\n}\n\n\n//# sourceURL=webpack://bang.html/./src/bang.js?");

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = __webpack_modules__;
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/ensure chunk */
/******/ 	(() => {
/******/ 		__webpack_require__.f = {};
/******/ 		// This file contains only the entry chunk.
/******/ 		// The chunk loading function for additional chunks
/******/ 		__webpack_require__.e = (chunkId) => {
/******/ 			return Promise.all(Object.keys(__webpack_require__.f).reduce((promises, key) => {
/******/ 				__webpack_require__.f[key](chunkId, promises);
/******/ 				return promises;
/******/ 			}, []));
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/get javascript chunk filename */
/******/ 	(() => {
/******/ 		// This function allow to reference async chunks
/******/ 		__webpack_require__.u = (chunkId) => {
/******/ 			// return url for filenames based on template
/******/ 			return "" + chunkId + ".bang.js";
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/global */
/******/ 	(() => {
/******/ 		__webpack_require__.g = (function() {
/******/ 			if (typeof globalThis === 'object') return globalThis;
/******/ 			try {
/******/ 				return this || new Function('return this')();
/******/ 			} catch (e) {
/******/ 				if (typeof window === 'object') return window;
/******/ 			}
/******/ 		})();
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/load script */
/******/ 	(() => {
/******/ 		var inProgress = {};
/******/ 		var dataWebpackPrefix = "bang.html:";
/******/ 		// loadScript function to load a script via script tag
/******/ 		__webpack_require__.l = (url, done, key, chunkId) => {
/******/ 			if(inProgress[url]) { inProgress[url].push(done); return; }
/******/ 			var script, needAttach;
/******/ 			if(key !== undefined) {
/******/ 				var scripts = document.getElementsByTagName("script");
/******/ 				for(var i = 0; i < scripts.length; i++) {
/******/ 					var s = scripts[i];
/******/ 					if(s.getAttribute("src") == url || s.getAttribute("data-webpack") == dataWebpackPrefix + key) { script = s; break; }
/******/ 				}
/******/ 			}
/******/ 			if(!script) {
/******/ 				needAttach = true;
/******/ 				script = document.createElement('script');
/******/ 		
/******/ 				script.charset = 'utf-8';
/******/ 				script.timeout = 120;
/******/ 				if (__webpack_require__.nc) {
/******/ 					script.setAttribute("nonce", __webpack_require__.nc);
/******/ 				}
/******/ 				script.setAttribute("data-webpack", dataWebpackPrefix + key);
/******/ 				script.src = url;
/******/ 			}
/******/ 			inProgress[url] = [done];
/******/ 			var onScriptComplete = (prev, event) => {
/******/ 				// avoid mem leaks in IE.
/******/ 				script.onerror = script.onload = null;
/******/ 				clearTimeout(timeout);
/******/ 				var doneFns = inProgress[url];
/******/ 				delete inProgress[url];
/******/ 				script.parentNode && script.parentNode.removeChild(script);
/******/ 				doneFns && doneFns.forEach((fn) => (fn(event)));
/******/ 				if(prev) return prev(event);
/******/ 			}
/******/ 			;
/******/ 			var timeout = setTimeout(onScriptComplete.bind(null, undefined, { type: 'timeout', target: script }), 120000);
/******/ 			script.onerror = onScriptComplete.bind(null, script.onerror);
/******/ 			script.onload = onScriptComplete.bind(null, script.onload);
/******/ 			needAttach && document.head.appendChild(script);
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/publicPath */
/******/ 	(() => {
/******/ 		var scriptUrl;
/******/ 		if (__webpack_require__.g.importScripts) scriptUrl = __webpack_require__.g.location + "";
/******/ 		var document = __webpack_require__.g.document;
/******/ 		if (!scriptUrl && document) {
/******/ 			if (document.currentScript)
/******/ 				scriptUrl = document.currentScript.src
/******/ 			if (!scriptUrl) {
/******/ 				var scripts = document.getElementsByTagName("script");
/******/ 				if(scripts.length) scriptUrl = scripts[scripts.length - 1].src
/******/ 			}
/******/ 		}
/******/ 		// When supporting browsers where an automatic publicPath is not supported you must specify an output.publicPath manually via configuration
/******/ 		// or pass an empty string ("") and set the __webpack_public_path__ variable from your code to use your own logic.
/******/ 		if (!scriptUrl) throw new Error("Automatic publicPath is not supported in this browser");
/******/ 		scriptUrl = scriptUrl.replace(/#.*$/, "").replace(/\?.*$/, "").replace(/\/[^\/]+$/, "/");
/******/ 		__webpack_require__.p = scriptUrl;
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/jsonp chunk loading */
/******/ 	(() => {
/******/ 		// no baseURI
/******/ 		
/******/ 		// object to store loaded and loading chunks
/******/ 		// undefined = chunk not loaded, null = chunk preloaded/prefetched
/******/ 		// [resolve, reject, Promise] = chunk loading, 0 = chunk loaded
/******/ 		var installedChunks = {
/******/ 			"main": 0
/******/ 		};
/******/ 		
/******/ 		__webpack_require__.f.j = (chunkId, promises) => {
/******/ 				// JSONP chunk loading for javascript
/******/ 				var installedChunkData = __webpack_require__.o(installedChunks, chunkId) ? installedChunks[chunkId] : undefined;
/******/ 				if(installedChunkData !== 0) { // 0 means "already installed".
/******/ 		
/******/ 					// a Promise means "currently loading".
/******/ 					if(installedChunkData) {
/******/ 						promises.push(installedChunkData[2]);
/******/ 					} else {
/******/ 						if(true) { // all chunks have JS
/******/ 							// setup Promise in chunk cache
/******/ 							var promise = new Promise((resolve, reject) => (installedChunkData = installedChunks[chunkId] = [resolve, reject]));
/******/ 							promises.push(installedChunkData[2] = promise);
/******/ 		
/******/ 							// start chunk loading
/******/ 							var url = __webpack_require__.p + __webpack_require__.u(chunkId);
/******/ 							// create error before stack unwound to get useful stacktrace later
/******/ 							var error = new Error();
/******/ 							var loadingEnded = (event) => {
/******/ 								if(__webpack_require__.o(installedChunks, chunkId)) {
/******/ 									installedChunkData = installedChunks[chunkId];
/******/ 									if(installedChunkData !== 0) installedChunks[chunkId] = undefined;
/******/ 									if(installedChunkData) {
/******/ 										var errorType = event && (event.type === 'load' ? 'missing' : event.type);
/******/ 										var realSrc = event && event.target && event.target.src;
/******/ 										error.message = 'Loading chunk ' + chunkId + ' failed.\n(' + errorType + ': ' + realSrc + ')';
/******/ 										error.name = 'ChunkLoadError';
/******/ 										error.type = errorType;
/******/ 										error.request = realSrc;
/******/ 										installedChunkData[1](error);
/******/ 									}
/******/ 								}
/******/ 							};
/******/ 							__webpack_require__.l(url, loadingEnded, "chunk-" + chunkId, chunkId);
/******/ 						} else installedChunks[chunkId] = 0;
/******/ 					}
/******/ 				}
/******/ 		};
/******/ 		
/******/ 		// no prefetching
/******/ 		
/******/ 		// no preloaded
/******/ 		
/******/ 		// no HMR
/******/ 		
/******/ 		// no HMR manifest
/******/ 		
/******/ 		// no on chunks loaded
/******/ 		
/******/ 		// install a JSONP callback for chunk loading
/******/ 		var webpackJsonpCallback = (parentChunkLoadingFunction, data) => {
/******/ 			var [chunkIds, moreModules, runtime] = data;
/******/ 			// add "moreModules" to the modules object,
/******/ 			// then flag all "chunkIds" as loaded and fire callback
/******/ 			var moduleId, chunkId, i = 0;
/******/ 			if(chunkIds.some((id) => (installedChunks[id] !== 0))) {
/******/ 				for(moduleId in moreModules) {
/******/ 					if(__webpack_require__.o(moreModules, moduleId)) {
/******/ 						__webpack_require__.m[moduleId] = moreModules[moduleId];
/******/ 					}
/******/ 				}
/******/ 				if(runtime) var result = runtime(__webpack_require__);
/******/ 			}
/******/ 			if(parentChunkLoadingFunction) parentChunkLoadingFunction(data);
/******/ 			for(;i < chunkIds.length; i++) {
/******/ 				chunkId = chunkIds[i];
/******/ 				if(__webpack_require__.o(installedChunks, chunkId) && installedChunks[chunkId]) {
/******/ 					installedChunks[chunkId][0]();
/******/ 				}
/******/ 				installedChunks[chunkIds[i]] = 0;
/******/ 			}
/******/ 		
/******/ 		}
/******/ 		
/******/ 		var chunkLoadingGlobal = globalThis["webpackChunkbang_html"] = globalThis["webpackChunkbang_html"] || [];
/******/ 		chunkLoadingGlobal.forEach(webpackJsonpCallback.bind(null, 0));
/******/ 		chunkLoadingGlobal.push = webpackJsonpCallback.bind(null, chunkLoadingGlobal.push.bind(chunkLoadingGlobal));
/******/ 	})();
/******/ 	
/************************************************************************/
/******/ 	
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	// This entry module can't be inlined because the eval devtool is used.
/******/ 	var __webpack_exports__ = __webpack_require__("./src/bang.js");
/******/ 	
/******/ })()
;