const DOUBLE_BARREL = /\w+-\w*/;

install();

function install() {
  const observer = new MutationObserver(transformBangs);
  observer.observe(document.documentElement, {
    subtree: true,
    childList: true,
    characterData: true /* we are interested in bang nodes (which start as comments) */
  });
  findBangs(transformBang); 
}

function transformBangs(...args) {
  console.log('transform all', args);
}

function transformBang(current) {
  const [name, data] = getBangDetails(current);
  // console.log(name, data, current);

  // replace the bang node (comment) with its actual custom element node
  const actualElement = createElement(name, data);
  current.parentElement.replaceChild(actualElement, current);
}

function findBangs(callback, root = document.documentElement) {
  const iterator = document.createTreeWalker(root, NodeFilter.SHOW_COMMENT, {
    acceptNode(node) {
      const [name] = getBangDetails(node);
      if ( name.match(DOUBLE_BARREL) ) {
        return NodeFilter.FILTER_ACCEPT;
      }
    }
  });

  const replacements = [];

  while (true) {
    const current = iterator.nextNode();
    if ( ! current ) break;

    replacements.push(() => transformBang(current));
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

export function use(name) {
  self.customElements.whenDefined(name).then(obj => console.log(name, 'defined', obj));
  self.customElements.define(name, class extends HTMLElement {
    constructor() {
      super();
      console.log(name, 'constructed');
    }

    connectedCallback() {
      console.log(name, 'connected');
    }
  });
}

