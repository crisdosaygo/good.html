const DOUBLE_BARREL = /\w+-\w*/;
const DEBUG = false;
const CONFIG = {
  componentsPath: './components'
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
    const target = current;
    replacements.push(() => transformBang(target));
  }

  // handle any descendents
    while (true) {
      current = iterator.nextNode();
      if ( ! current ) break;

      const target = current;
      replacements.push(() => transformBang(target));
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
  const url = `${CONFIG.componentsPath}/${name}/markup.html`;
  const markupText = await fetch(url).then(r => { 
    if ( r.ok ) {
      return r.text();
    } 
    throw new TypeError(`Fetch error: ${url}, ${r.statusText}`);
  });
  return markupText;
}

function use(name) {
  self.customElements.whenDefined(name).then(obj => DEBUG && console.log(name, 'defined', obj));
  self.customElements.define(name, class extends HTMLElement {
    constructor(state) {
      super();
      DEBUG && console.log(name, 'constructed');
      fetchMarkup(name)
        .then(markup => {
          const cooked = cook.call(this, markup, state);
          const nodes = toDOM(cooked);
          const shadow = this.attachShadow({mode:'open'});
          shadow.append(nodes);
        }).catch(err => console.warn(err));
    }

    connectedCallback() {
      DEBUG && console.log(name, 'connected');
    }
  });
}

function cook(markup, state = {var1: 'hiiii'}) {
  let cooked = '';
  try {
    with(state) {
      cooked = eval("(function () { return `"+markup+"`; }())");  
    }
    return cooked;
  } catch(error) {
    console.error('Template error', {markup, state, error});
    throw error;
  }
}
