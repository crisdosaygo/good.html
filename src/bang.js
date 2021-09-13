const DOUBLE_BARREL = /\w+-\w*/;
const FUNC_CALL = /\);?$/;
const BK = '_bang_key';
const DEBUG = false;
const CONFIG = {
  componentsPath: './components',
  allowUnset: false
};
const TRANSFORMING = new WeakSet();
const STATE = new Map();
let systemKeys = 1;

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

const EVENTS = [
  'error',
  'load',
  'click',
  'pointerdown',
  'pointerup',
  'pointermove',
  'mousedown',
  'mouseup',
  'mousemove',
  'touchstart',
  'touchend',
  'touchmove',
  'touchcancel',
  'dblclick',
  'dragstart',
  'dragend',
  'dragmove',
  'drag',
  'mouseover',
  'mouseout',
  'focus',
  'blur',
  'focusin',
  'focusout',
  'scroll',
];
const BangBase = (name) => class Base extends HTMLElement {
  constructor(state) {
    super();
    DEBUG && console.log(name, 'constructed');
    this.classList.add('bang-el');
    // this is like an onerror event for stylesheet's 
      // we do this because we want to display elements if they have no stylesheet defined
      // becuase it's reasonabgle to want to not include a stylesheet with your custom element
    fetchStyle(name).catch(err => this.setVisible());

    // get any markup and insert into the shadow DOM
    fetchMarkup(name)
      .then(async markup => {
        const cooked = await cook.call(this, markup, state);
        const nodes = toDOM(cooked);
        const selector = EVENTS.map(e => `[on${e}]`).join(', ');
        const listening = nodes.querySelectorAll(selector);
        for( const node of listening ) {
          const {attributes:attrs} = node;
          for( let {name,value} of attrs ) {
            if ( ! name.startsWith('on') ) continue;
            value = value.trim();
            if ( ! value ) continue;
            const ender = value.match(FUNC_CALL) ? '' : '(event)';
            node.setAttribute(name, `this.getRootNode().host.${value}${ender}`);
          }
        }
        // not necessary
          /**
            // reparse
            const container = document.createElement('div');
            container.appendChild(nodes);
            const clearNodes = toDOM(container.innerHTML);
          **/
        const shadow = this.attachShadow({mode:'open'});
        shadow.append(nodes);
      }).catch(err => DEBUG && console.warn(err));
    const {attributes:attrs} = this;
    for( let {name,value} of attrs ) {
      if ( ! name.startsWith('on') ) continue;
      value = value.trim();
      if ( ! value ) continue;
      const ender = value.match(FUNC_CALL) ? '' : '(event)';
      this.setAttribute(name, `this.${value}${ender}`);
    }
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

install();

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
}

function setState(key, state) {
  console.info(`Implement set state`);
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

async function fetchMarkup(name) {
  const baseUrl = `${CONFIG.componentsPath}/${name}`;
  const markupUrl = `${baseUrl}/markup.html`;
  const markupText = await fetch(markupUrl).then(async r => { 
    let text = '';
    if ( r.ok ) {
      text = await r.text();
    } else {
      // if no markup is given we just insert all content within the custom element
      text = `<slot></slot>`;
    }
    return `<link 
      rel=stylesheet 
      href=${baseUrl}/style.css 
      onload=setVisible>${
      text
    }`;
  });
  return markupText;
}

async function fetchScript(name) {
  const url = `${CONFIG.componentsPath}/${name}/script.js`;
  const scriptText = await fetch(url).then(r => { 
    if ( r.ok ) {
      return r.text();
    } 
    throw new TypeError(`Fetch error: ${url}, ${r.statusText}`);
  });
  return scriptText;
}

async function fetchStyle(name) {
  const url = `${CONFIG.componentsPath}/${name}/style.css`;
  const styleText = await fetch(url).then(r => { 
    if ( r.ok ) {
      return r.text();
    } 
    throw new TypeError(`Fetch error: ${url}, ${r.statusText}`);
  });
  DEBUG && console.log({name,styleText});
  return styleText;
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

async function process(x, state) {
  if ( typeof x === 'string' ) {
    return x;
  }

  else 

  if ( typeof x === 'number' ) {
    return x+'';
  }

  else

  if ( typeof x === 'boolean' ) {
    return x+'';
  }

  else

  if ( x === undefined || x === null ) {
    if ( CONFIG.allowUnset ) {
      return CONFIG.unsetPlaceholder || '';
    } else {
      throw new TypeError(`Value cannot be unset, was: ${x}`);
    }
  }

  else

  if ( x instanceof Promise ) {
    return await x.catch(err => err+'');
  } 

  else

  if ( x instanceof Element ) {
    return x.outerHTML;
  }

  else

  if ( x instanceof Node ) {
    return x.textContent;
  }

  else

  if ( isIterable(x) ) {
    // these promises must return primitive types that can be stringified
    return (await Promise.all(Array.from(x)).catch(e => err+'')).join('\n');
  }

  else


  if ( Object.getPrototypeOf(x).constructor.name === 'AsyncFunction' ) {
    return await x(state);
  }

  else

  if ( x instanceof Function ) {
    return x(state);
  }

  else  /* it's an object, of some type */

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

    if ( Object.prototype.hasOwnProperty.call(x, BK) ) {
      stateKey = new StateKey(x[BK]);
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
        stateKey = new StateKey();
        STATE.set(stateKey, x);
        STATE.set(x, stateKey);
      }
    }

    stateKey += '';

    DEBUG && console.log({stateKey});

    return stateKey;
  }
}

function isIterable(y) {
  if ( y === null ) {
    return false;
  }

  return y[Symbol.iterator] instanceof Function;
}

