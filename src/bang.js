// constants, classes, config and state
  const DEBUG = false;
  const DOUBLE_BARREL = /\w+-\w*/;
  const FUNC_CALL = /\);?$/;
  const CONFIG = {
    bangKey: '_bang_key',
    componentsPath: './components',
    allowUnset: false,
    EVENTS: `error load click pointerdown pointerup pointermove mousedown mouseup 
      mousemove touchstart touchend touchmove touchcancel dblclick dragstart dragend 
      dragmove drag mouseover mouseout focus blur focusin focusout scroll
    `.split(/\s+/g).filter(s => s.length)
  };
  const STATE = new Map();
  const CACHE = new Map();
  const Started = new Set();
  const TRANSFORMING = new WeakSet();
  const Counts = {
    started: 0,
    finished: 0
  };
  let systemKeys = 1;
  const BangBase = (name) => class Base extends HTMLElement {
    constructor() {
      Counts.started++;
      let state;

      super();
      DEBUG && console.log(name, 'constructed');
      this.classList.add('bang-el');
      // this is like an onerror event for stylesheet's 
        // we do this because we want to display elements if they have no stylesheet defined
        // becuase it's reasonabgle to want to not include a stylesheet with your custom element
      fetchStyle(name).catch(err => this.setVisible());

      const {attributes:attrs} = this;
      for( let {name,value} of attrs ) {
        if ( name === 'state' ) {
          const stateKey = value; 
          const stateObject = STATE.get(stateKey);
          if ( isUnset(stateObject) ) {
            throw new TypeError(`
              <${name}> constructor passed state key ${stateKey} which is unset.
              It must be set.
            `);
          }
          state = stateObject;
        } else {
          // set event handlers to custom element class instance methods
          if ( ! name.startsWith('on') ) continue;
          value = value.trim();
          if ( ! value ) continue;
          if ( value.startsWith('this') ) continue;
          const ender = value.match(FUNC_CALL) ? '' : '(event)';
          this.setAttribute(name, `this.${value}${ender}`);
        }
      }

      // get any markup and insert into the shadow DOM
      fetchMarkup(name, this)
        .then(async markup => {
          const cooked = await cook.call(this, markup, state);
          const nodes = toDOM(cooked);
          const selector = CONFIG.EVENTS.map(e => `[on${e}]`).join(', ');
          const listening = nodes.querySelectorAll(selector);
          for( const node of listening ) {
            const {attributes:attrs} = node;
            for( let {name,value} of attrs ) {
              if ( ! name.startsWith('on') ) continue;
              value = value.trim();
              if ( ! value ) continue;
              if ( value.startsWith('this.getRootNode().host') ) continue;
              const ender = value.match(FUNC_CALL) ? '' : '(event)';
              node.setAttribute(name, `this.getRootNode().host.${value}${ender}`);
            }
          }
          const shadow = this.attachShadow({mode:'open'});
          shadow.append(nodes);
        }).catch(
          err => DEBUG && console.warn(err)
        ).finally(() => Counts.finished++);
    }

    connectedCallback() {
      DEBUG && console.log(name, 'connected');
    }

    attributeChangedCallback(...args) {
      console.log(`attrs`, this, ...args);
    }

    setVisible() {
      this.classList.add('bang-styled');
    }
  };
  class StateKey extends String {
    constructor (keyNumber) {
      if ( keyNumber == undefined ) {
        super(`system-key:${systemKeys++}`); 
      } else {
        super(`client-key:${keyNumber}`);
      }
      return this;
    }
  }

install();

// API
  function install() {
    const observer = new MutationObserver(transformBangs);
    observer.observe(document.documentElement, {
      subtree: true,
      childList: true,
      characterData: true /* we are interested in bang nodes (which start as comments) */
    });
    findBangs(transformBang); 
    self.use = use;
    self.BangBase = BangBase;
    self.setState = setState;
    self.STATE = STATE;
    self.loaded = loaded;
    self.sleep = sleep;
    self.Counts = Counts;
    self.CACHE = CACHE;
  }

  async function use(name) {
    let component;
    self.customElements.whenDefined(name).then(obj => DEBUG && console.log(name, 'defined', obj));

    await fetchScript(name)
      .then(script => {
        const Base = BangBase(name);
        const Compose = `(function () { ${Base.toString()}; return ${script}; }())`;
        const Component = eval(Compose);
        component = Component;
      }).catch(() => {
        const Base = BangBase(name);
        component = Base;
      });

    // pre-fetch to prevent FOUC
    //await fetchStyle(name);

    // define it
    self.customElements.define(name, component);
  }

  function setState(key, state) {
    STATE.set(key, state);
    STATE.set(state, key);
    if ( document.body ) {
      // we need to remove styled because it will reload after we blit the HTML
      Array.from(document.querySelectorAll('.bang-styled')).forEach(node => {
        node.classList.remove('bang-styled');
      });
      const HTML = document.body.innerHTML;
      document.body.innerHTML = '';
      document.body.innerHTML = HTML;
    }
  }

  async function loaded() {
    const loadCheck = () => {
      const nonZeroCount = Counts.started > 0; 
      const finishedWhatWeStarted = Counts.finished === Counts.started;
      return nonZeroCount && finishedWhatWeStarted;
    };
    return becomesTrue(loadCheck);
  }

// helpers
  async function fetchMarkup(name, comp) {
    // cache first
      // we make any subsequent calls for name wait for the first call to complete
      // otherwise we create many in sync
      // note that this disables hot realoding on server side from client 
      // requires page reload or cache flush

    const key = `markup${name}`;

    if ( Started.has(key) ) {
      if ( ! CACHE.has(key) ) {
        await becomesTrue(() => CACHE.has(key));
      }
    } else {
      Started.add(key);
    }

    const styleKey = `style${name}`;
    const baseUrl = `${CONFIG.componentsPath}/${name}`;
    if ( CACHE.has(key) ) {
      const markup = CACHE.get(key);
      if ( CACHE.get(styleKey) instanceof Error ) {
        comp.setVisible();
      }
      
      // if there is an error style and we are still includig that link
      // we generate and cache the markup again to omit such a link element
      if ( CACHE.get(styleKey) instanceof Error &&
           markup.includes(`href=${baseUrl}/style.css`) ) {
        // then we need to set the cache for markup again and remove the link to the 
        // stylesheet which failed 
      } else {
        comp.setVisible();
        return markup;
      }
    }
    const markupUrl = `${baseUrl}/markup.html`;
    let resp;
    const markupText = await fetch(markupUrl).then(async r => { 
      let text = '';
      if ( r.ok ) {
        text = await r.text();
      } else {
        // if no markup is given we just insert all content within the custom element
        text = `<slot></slot>`;
      }
      if ( CACHE.get(styleKey) instanceof Error ) { 
        resp = text; 
        comp.setVisible();
      } else {
        // inlining styles for increase speed */
          // we setVisible (add bang-styled) straight away because the inline styles block the markup
          // so no FOUC while stylesheet link is loading, like previously:
          // resp = `<link rel=stylesheet href=${baseUrl}/style.css onload=setVisible>${text}`;
        resp = `<style>${await fetchStyle(name).catch(e => '')}</style>${text}`;
        comp.setVisible();
      }
      return resp;
    }).finally(async () => CACHE.set(key, await resp));
    return markupText;
  }

  async function fetchScript(name) {
    const key = `script${name}`;

    if ( Started.has(key) ) {
      if ( ! CACHE.has(key) ) {
        await becomesTrue(() => CACHE.has(key));
      }
    } else {
      Started.add(key);
    }

    if ( CACHE.has(key) ) {
      return CACHE.get(key);
    }

    const url = `${CONFIG.componentsPath}/${name}/script.js`;
    let resp;
    const scriptText = await fetch(url).then(r => { 
      if ( r.ok ) {
        resp = r.text();
        return resp;
      } 
      resp = new TypeError(`Fetch error: ${url}, ${r.statusText}`);
      throw resp;
    }).finally(async () => CACHE.set(key, await resp));
    return scriptText;
  }

  async function fetchStyle(name) {
    const key = `style${name}`;

    if ( Started.has(key) ) {
      if ( ! CACHE.has(key) ) {
        await becomesTrue(() => CACHE.has(key));
      }
    } else {
      Started.add(key);
    }

    if ( CACHE.has(key) ) {
      return CACHE.get(key);
    }
    const url = `${CONFIG.componentsPath}/${name}/style.css`;
    let resp;
    const styleText = await fetch(url).then(r => { 
      if ( r.ok ) {
        resp = r.text();
        return resp;
      } 
      resp = new TypeError(`Fetch error: ${url}, ${r.statusText}`);
      throw resp;
    }).finally(async () => CACHE.set(key, await resp));
    DEBUG && console.log({name,styleText});
    return styleText;
  }


  function transformBangs(records) {
    records.forEach(record => {
      const {addedNodes} = record;
      DEBUG && console.log(record);

      if ( !addedNodes ) return;

      for( const node of addedNodes ) {
        // search and transform each added subtree
        findBangs(transformBang, node);  
      }
    });
  }

  function transformBang(current) {
    DEBUG && console.log({transformBang},{current});
    const [name, data] = getBangDetails(current);
    DEBUG && console.log({name, data});

    // replace the bang node (comment) with its actual custom element node
    const actualElement = createElement(name, data);
    current.parentElement.replaceChild(actualElement, current);
    //TRANSFORMING.delete(current);
  }

  function findBangs(callback, root = document.documentElement) {
    const Acceptor = {
      acceptNode(node) {
        if ( node.nodeType !== Node.COMMENT_NODE ) {
          return NodeFilter.FILTER_SKIP;
        }
        const [name] = getBangDetails(node);
        if ( name.match(DOUBLE_BARREL) ) {
          return NodeFilter.FILTER_ACCEPT;
        } else {
          return NodeFilter.FILTER_REJECT;
        }
      }
    };
    const iterator = document.createTreeWalker(root, NodeFilter.SHOW_COMMENT, Acceptor);

    const replacements = [];

    // handle root node
      // it's a special case because it will be present in the iteration even if
      // the NodeFilter would filter it out if it were not the root
    let current = iterator.currentNode;

    if ( Acceptor.acceptNode(current) === NodeFilter.FILTER_ACCEPT ) {
      if ( !TRANSFORMING.has(current) ) {
        TRANSFORMING.add(current);
        const target = current;
        replacements.push(() => transformBang(target));
      }
    }

    // handle any descendents
      while (true) {
        current = iterator.nextNode();
        if ( ! current ) break;

        if ( !TRANSFORMING.has(current) ) {
          TRANSFORMING.add(current);
          const target = current;
          replacements.push(() => transformBang(target));
        }
      }

    while(replacements.length) {
      replacements.pop()();
    }
  }

  function getBangDetails(node) {
    const text = node.textContent.trim();
    const [name, ...data] = text.split(/[\s\t]/g);
    return [name, data.join(' ')];
  }

  async function process(x, state) {
    if ( typeof x === 'string' ) return x;
    else 

    if ( typeof x === 'number' ) return x+'';
    else

    if ( typeof x === 'boolean' ) return x+'';
    else

    if ( isUnset(x) ) {
      if ( CONFIG.allowUnset ) {
        return CONFIG.unsetPlaceholder || '';
      } else {
        throw new TypeError(`Value cannot be unset, was: ${x}`);
      }
    }
    else

    if ( x instanceof Promise ) return await x.catch(err => err+'');
    else

    if ( x instanceof Element ) return x.outerHTML;
    else

    if ( x instanceof Node ) return x.textContent;
    else

    if ( isIterable(x) ) {
      // if an Array or iterable is given then Promises therein
      // must return primitive types that can be stringified
      return (await Promise.all(Array.from(x)).catch(e => err+'')).join('\n');
    }
    else

    if ( Object.getPrototypeOf(x).constructor.name === 'AsyncFunction' ) return await x(state);
    else

    if ( x instanceof Function ) return x(state);
    else // it's an object, of some type 

    {
      // State store
        // note about garbage collection and memory:
          // in anything but a simple replacement of an object with the same identity
          // the application must handle its own garbage collection of STATE items
          // this is not a weak map

        /* so we assume it's state and save it */
        /* to the global state store */
        /* which is two-sides so we can find a key */
        /* given an object. This avoid duplicates */
        /* so: */

      let stateKey;

      // own keys
        // an object can specify it's own state key
        // to provide a single logical identity for a piece of state that may
        // be represented by many objects

      if ( Object.prototype.hasOwnProperty.call(x, CONFIG.bangKey) ) {
        stateKey = new StateKey(x[CONFIG.bangKey])+'';
        // in that case, replace the previously saved object with the same logical identity
        const oldX = STATE.get(stateKey);
        STATE.delete(oldX);

        STATE.set(stateKey, x);
        STATE.set(x, stateKey);
      } 

      else  /* or the system can come up with a state key */

      {
        if ( STATE.has(x) ) {
          stateKey = STATE.get(x);
        } else {
          stateKey = new StateKey()+'';
          STATE.set(stateKey, x);
          STATE.set(x, stateKey);
        }
      }

      stateKey += '';

      DEBUG && console.log({stateKey});

      return stateKey;
    }
  }

  async function cook(markup, state = {var1: 'hiiii', sub: {moreState:'hello'}}) {
    let cooked = '';
    try {
      state._self = state;
    } catch(e) {
      DEBUG && console.warn(
        `Cannot add '_self' self-reference property to state. 
          This enables a component to inspect the top-level state object it is passed.`
      );
    }
    try {
      with(state) {
        cooked = await eval("(async function () { return await FUNC`${state}"+markup+"`; }())");  
      }
      return cooked;
    } catch(error) {
      console.error('Template error', {markup, state, error});
      throw error;
    }
  }

  async function FUNC(strings, ...vals) {
    const s = Array.from(strings);
    let str = '';

    // by convention (see how we construct the template that we tag with FUNC)
    const state = vals.shift();
    s.shift();

    vals = await Promise.all(vals.map(v => process(v, state)));

    while(s.length) {
      str += s.shift();
      if ( vals.length ) {
        str += vals.shift();
      }
    }

    return str;
  }

  function createElement(name, data) {
    const df = document.createDocumentFragment();
    const container = document.createElement('div');
    df.appendChild(container);
    container.insertAdjacentHTML(`afterbegin`, `
      <${name} ${data}></${name}>
    `);
    const element = container.firstElementChild;
    return element;
  }

  function toDOM(str) {
    const f = (new DOMParser).parseFromString(
        `<template>${str}</template>`,"text/html"
      ).head.firstElementChild.content;
    f.normalize();
    return f;
  }

  async function becomesTrue(check = () => true) {
    const waiter = new Promise(async res => {
      while(true) {
        await sleep(47);
        if ( check() ) {
          break;
        }
      }
      res();
    });

    return waiter;
  }

  async function sleep(ms) {
    return new Promise(res => setTimeout(res, ms));
  }

  function isIterable(y) {
    if ( y === null ) {
      return false;
    }

    return y[Symbol.iterator] instanceof Function;
  }

  function isUnset(x) {
    return x === undefined || x === null;
  }
