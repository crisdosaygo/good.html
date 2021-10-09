(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
  typeof define === 'function' && define.amd ? define(['exports'], factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory((global.vv = global.vv || {}, global.vv.bang = {})));
})(this, (function (exports) {
  // eslint directives
    /* eslint-disable no-empty */
  // vanillaview.js
    // imports
      const CODE = Math.random().toFixed(18);

    // backwards compatible alias
      const skip = markup;
      const attrskip = attrmarkup;
      const NULLFUNC          = () => void 0;
      /* eslint-disable no-useless-escape */
      const KEYMATCH          = /(?:<!\-\-)?(key0.\d+)(?:\-\->)?/gm;
      /* eslint-enable no-useless-escape */
      const ATTRMATCH         = /\w+=/;
      const JOINER            = '<link rel=join>';
      const KEYLEN            = 20;
      const XSS               = () => `Possible XSS / object forgery attack detected. ` +
                                `Object code could not be verified.`;
      const OBJ               = () => `Object values not allowed here.`;
      const UNSET             = () => `Unset values not allowed here.`;
      const INSERT            = () => `Error inserting template into DOM. ` +
        `Position must be one of: ` +
        `replace, beforebegin, afterbegin, beforeend, innerhtml, afterend`;
      const NOTFOUND          = loc => `Error inserting template into DOM. ` +
        `Location ${loc} was not found in the document.`;
      const MOVE              = new class {
        beforeend   (frag,elem) { elem.appendChild(frag); }
        beforebegin (frag,elem) { elem.parentNode.insertBefore(frag,elem); }
        afterend    (frag,elem) { elem.parentNode.insertBefore(frag,elem.nextSibling); }
        replace     (frag,elem) { elem.parentNode.replaceChild(frag,elem); }
        afterbegin  (frag,elem) { elem.insertBefore(frag,elem.firstChild); }
        innerhtml   (frag,elem) { elem.replaceChildren(); elem.appendChild(frag); }
        insert      (frag,node) { node.replaceChildren(frag); }
      };
      const REMOVE_MAP        = new Map();
      const DIV               = document.createElement('div');
      const POS               = 'beforeend';
      const EMPTY = '';
      const {stringify:_STR} = JSON;
      const JS = o => _STR(o, null, EMPTY);

    // logging
      globalThis.onerror = (...v) => (console.log(v, v[0]+EMPTY, v[4] && v[4].message, v[4] && v[4].stack), true);

    // type functions
      const isKey             = v => !!v && (typeof v.key === 'string' || typeof v.key === 'number') && Object.getOwnPropertyNames(v).length <= 2;

    // cache 
      const cache = {};
      // deux

    // main exports 
      Object.assign(s,{attrskip,skip,attrmarkup,markup,guardEmptyHandlers,die});
      Object.assign(globalThis, {vanillaview: {c, s}}); 

      async function s(p,...v) {
        const that = this;
        let SystemCall = false;
        let state;

        if ( p[0].length === 0 && v[0].state ) {
          // by convention (see how we construct the template that we tag with FUNC)
          // the first value is the state object when our system calls it
          SystemCall = true;
        }

        if ( SystemCall ) {
          ({state} = v.shift());
          p.shift();
          v = await Promise.all(v.map(val => process(that, val, state)));
          const xyz = vanillaview(p,v);
          //xyz[Symbol.for('BANG-VV')] = true;
          return xyz;
        } else {
          const laterFunc = async state => {
            v = await Promise.all(v.map(val => process(that, val, state)));
            const xyz = vanillaview(p,v);
            //xyz[Symbol.for('BANG-VV')] = true;
            return xyz;
          };
          //laterFunc[Symbol.for('BANG-VV')] = true;
          return laterFunc;
        }
      }

      function c(p,...v) {
        return vanillaview(p,v, {useCache:false});
      }

    // main function (TODO: should we refactor?)
      function vanillaview(p,v,{useCache:useCache=true}={}) {
        const retVal = {};
        let instance, cacheKey;

        v = v.map(guardAndTransformVal);

        if ( useCache ) {
          (instance = (v.find(isKey) || {}));
          cacheKey = p.join(JOINER);
          const {cached,firstCall} = isCached(cacheKey,v,instance);
         
          if ( ! firstCall ) {
            cached.update(v);
            return cached;
          } else {
            retVal.oldVals = Array.from(v);
          }
        } else {
          retVal.oldVals = Array.from(v);
        }
        
        // compile the template into an updater

        p = [...p]; 
        const vmap = {};
        const V = v.map(replaceValWithKeyAndOmitInstanceKey(vmap));
        const externals = [];
        let str = EMPTY;

        while( p.length > 1 ) str += p.shift() + V.shift();
        str += p.shift();

        const frag = toDOM(str);
        const walker = document.createTreeWalker(frag, NodeFilter.SHOW_ALL);

        do {
          makeUpdaters({walker,vmap,externals});
        } while(walker.nextNode())

        Object.assign(retVal, {
          externals,
          v:Object.values(vmap),
          cacheKey,
          instance,
          to,
          update,
          code:CODE,
          nodes:Array.from(frag.childNodes)
        });

        if ( useCache ) {
          if ( instance.key !== undefined ) {
            cache[cacheKey].instances[instance.key] = retVal;
          } else {
            cache[cacheKey] = retVal;
          }
          retVal.nodes.forEach(node => {
            REMOVE_MAP.set(node, {ck:cacheKey, ik: instance.key+EMPTY});
          });
        }

        return retVal;
      }

    // bang integration functions (modified from bang versions)
      async function process(that, x, state) {
        if ( typeof x === 'string' ) return x;
        else 

        if ( typeof x === 'number' ) return x+EMPTY;
        else

        if ( typeof x === 'boolean' ) return x+EMPTY;
        else

        if ( x instanceof Date ) return x+EMPTY;
        else

        if ( isUnset(x) ) {
          if ( that.CONFIG.allowUnset ) return that.CONFIG.unsetPlaceholder || EMPTY;
          else {
            throw new TypeError(`Value cannot be unset, was: ${x}`);
          }
        }
        else

        if ( x instanceof Promise ) return await process(that, await x.catch(err => err+EMPTY), state);
        else

        if ( x instanceof Element ) return x.outerHTML;
        else

        if ( x instanceof Node ) return x.textContent;

        const isVVArray   = Array.isArray(x) && (x.length === 0 || Array.isArray(x[0].nodes));

        if ( isIterable(x) && ! isVVArray ) {
          // if an Array or iterable is given then
          // its values are recursively processed via this same function
          return process(that, (await Promise.all(
            (
              await Promise.all(Array.from(x)).catch(e => e+EMPTY)
            ).map(v => process(that, v, state))
          )), state);
        }


        const isVVK = isKey(x);
        const isVV      = x.code === CODE && Array.isArray(x.nodes);
        const isMAO = x.code === CODE && typeof x.str === "string";
        if ( isVVArray || isVVK || isMAO || isVV ) {
          return isVVArray ? join(x) : x; // let vanillaview guardAndTransformVal handle
        }

        else 

        if ( Object.getPrototypeOf(x).constructor.name === 'AsyncFunction' ) {
          return await process(that, await x(state), state);
        }
        else

        if ( x instanceof Function ) return x(state);
        else // it's an object, of some type 

        {
          // State store     
            /* so we assume an object is state and save it */
            /* to the global state store */
            /* which is two-sides so we can find a key */
            /* given an object. This avoid duplicates */
          let stateKey;

          // own keys
            // an object can specify it's own state key
            // to provide a single logical identity for a piece of state that may
            // be represented by many objects

          if ( Object.prototype.hasOwnProperty.call(x, that.CONFIG.bangKey) ) {
            stateKey = new that.StateKey(x[that.CONFIG.bangKey])+EMPTY;
            // in that case, replace the previously saved object with the same logical identity
            const oldX = that.STATE.get(stateKey);
            that.STATE.delete(oldX);

            that.STATE.set(stateKey, x);
            that.STATE.set(x, stateKey);
          } 

          else  /* or the system can come up with a state key */

          {
            const jsx = JS(x);
            if ( that.STATE.has(x) ) {
              stateKey = that.STATE.get(x);
              const lastXJSON = that.STATE.get(stateKey+'.json.last');
              if ( jsx !== lastXJSON ) {
                that.STATE.delete(lastXJSON); 
                if ( stateKey.startsWith('system-key') ) {
                  that.STATE.delete(stateKey);
                  stateKey = new that.StateKey()+EMPTY;
                }
                that.STATE.set(stateKey, x);
                that.STATE.set(x, stateKey);
              }
            } else {
              stateKey = new that.StateKey()+EMPTY;
              that.STATE.set(stateKey, x);
              that.STATE.set(x, stateKey);
            }
            that.STATE.set(jsx, stateKey+'.json.last');
            that.STATE.set(stateKey+'.json.last', jsx);
          }

          stateKey += EMPTY;
          return stateKey;
        }
      }

      function isIterable(y) {
        if ( y === null ) return false;
        return y[Symbol.iterator] instanceof Function;
      }

      function isUnset(x) {
        return x === undefined || x === null;
      }

    // to function
      function to(location, options) {
        const position = (options || 'replace').toLocaleLowerCase();
        const frag = document.createDocumentFragment();
        this.nodes.forEach(n => frag.appendChild(n));
        const isNode = location instanceof Node;
        const elem = isNode ? location : document.querySelector(location);
        try {
          MOVE[position](frag,elem);
        } catch(e) {
          switch(e.constructor && e.constructor.name) {
            case "DOMException":      die({error: INSERT()});             break;
            case "TypeError":         die({error: NOTFOUND(location)});   break; 
            default:                  throw e;
          }
        }
        while(this.externals.length) {
          this.externals.shift()();
        }
      }

    // update functions
      function makeUpdaters({walker,vmap,externals}) {
        const node = walker.currentNode;
        switch( node.nodeType ) {
          case Node.ELEMENT_NODE:
            handleElement({node,vmap,externals}); break;
          case Node.COMMENT_NODE:
          case Node.TEXT_NODE:
            handleNode({node,vmap,externals}); break;
        }
      }

      function handleNode({node,vmap,externals}) {
        const lengths = [];
        const text = node.nodeValue; 
        let result = KEYMATCH.exec(text);
        while ( result ) {
          const {index} = result;
          const key = result[1];
          const val = vmap[key];
          const replacer = makeNodeUpdater({node,index,lengths,val});
          externals.push(() => replacer(val.val));
          val.replacers.push( replacer );
          result = KEYMATCH.exec(text);
        }
      }

      // node functions
        function makeNodeUpdater(nodeState) {
          const {node} = nodeState;
          const scope = Object.assign({}, nodeState, {
            oldVal: {length: KEYLEN},
            oldNodes: [node],
            lastAnchor: node,
          });
          return (newVal) => {
            if ( scope.oldVal == newVal ) return;
            scope.val.val = newVal;
            switch(getType(newVal)) {
              case "vanillaviewobject":
                handleMarkupInNode(newVal, scope); break;
              default:
                handleTextInNode(newVal, scope); break;
            }
          };
        }

        function handleMarkupInNode(newVal, state) {
          let {oldNodes,lastAnchor} = state;
          if ( newVal.nodes.length ) {
            if ( sameOrder(oldNodes,newVal.nodes) ) ; else {
              {
                const insertable = [];
                Array.from(newVal.nodes).forEach(node => {
                  const inserted = document.contains(node.ownerDocument);
                  if ( ! inserted ) {
                    insertable.push(node);
                  } else {
                    while( insertable.length ) {
                      const insertee = insertable.shift();
                      node.parentNode.insertBefore(insertee, node);
                    }
                  }
                });
                while ( insertable.length ) {
                  const insertee = insertable.shift();
                  lastAnchor.parentNode.insertBefore(insertee,lastAnchor);
                }
                state.lastAnchor = newVal.nodes[newVal.nodes.length-1];
              }
            }
          } else {
            const placeholderNode = summonPlaceholder(lastAnchor);
            lastAnchor.parentNode.insertBefore(placeholderNode,lastAnchor.nextSibling);
            state.lastAnchor = placeholderNode;
          }
          // MARK: Unbond event might be relevant here.
          // if nodes are not included we can just remove them
          const dn = diffNodes(oldNodes,newVal.nodes);
          if ( dn.size ) {
            const f = document.createDocumentFragment();
            const killSet = new Set();
            dn.forEach(n => {
              f.appendChild(n);
              if ( n.linkedCustomElement ) {
                f.appendChild(n.linkedCustomElement);
              }
              if ( n.nodeType === Node.COMMENT_NODE && n.textContent.match(/key\d+/) ) return;
              const kill = REMOVE_MAP.get(n);
              killSet.add(JS(kill));
            });
            killSet.forEach(kill => {
              const {ck: cacheKey, ik: instanceKey} = JSON.parse(kill);
              if ( cacheKey && instanceKey ) {
                cache[cacheKey].instances[instanceKey] = null;
              } else if ( cacheKey ) {
                cache[cacheKey] = null;
              }
            });
          }
          state.oldNodes = newVal.nodes || [lastAnchor];
          while ( newVal.externals.length ) {
            const func = newVal.externals.shift();
            func();
          } 
        }

        function sameOrder(nodesA, nodesB) {
          if ( nodesA.length != nodesB.length ) return false;

          return Array.from(nodesA).every((an,i) => an == nodesB[i]);
        }

        function handleTextInNode(newVal, state) {
          let {oldVal, index, val, lengths, node} = state;

          const valIndex = val.vi;
          const originalLengthBefore = Object.keys(lengths.slice(0,valIndex)).length*KEYLEN;
          const lengthBefore = lengths.slice(0,valIndex).reduce((sum,x) => sum + x, 0);
          const value = node.nodeValue;

          lengths[valIndex] = newVal.length;

          const correction = lengthBefore-originalLengthBefore;
          const before = value.slice(0,index+correction);
          const after = value.slice(index+correction+oldVal.length);

          const newValue = before + newVal + after;

          node.nodeValue = newValue;

          if ( node.linkedCustomElement && newValue !== oldVal ) {
            updateLinkedCustomElement(node);
          }

          state.oldVal = newVal;
        }

      // element attribute functions
        function updateLinkedCustomElement(node) {
          const lce = node.linkedCustomElement;
          const span = toDOM(`<span ${node.textContent}></span>`).firstChild;
          const toRemove = new Set(
            getAttributes(lce)
              .filter(({name}) => !name.startsWith('on'))
              .map(({name}) => name)
          );
          getAttributes(span).forEach(({name, value}) => {
            if ( name === lce.localName ) return; // i.e., it's the bang tag name
            if ( name.startsWith('on') ) return; // we don't handle event handlers here, that's in bang
            lce.setAttribute(name, value);
            toRemove.delete(name);
          });
          toRemove.forEach(name => lce.removeAttribute(name));
        }

        function handleElement({node,vmap,externals}) {
          getAttributes(node).forEach(({name,value} = {}) => {
            const attrState = {node, vmap, externals, name, lengths: []};

            KEYMATCH.lastIndex = 0;
            let result = KEYMATCH.exec(name);
            while( result ) {
              prepareAttributeUpdater(result, attrState, {updateName:true});
              result = KEYMATCH.exec(name);
            }

            KEYMATCH.lastIndex = 0;
            result = KEYMATCH.exec(value);
            while( result ) {
              prepareAttributeUpdater(result, attrState, {updateName:false});
              result = KEYMATCH.exec(value);
            }
          });
        }

        function prepareAttributeUpdater(result, attrState, {updateName}) {
          const {index, input} = result;
          const scope = Object.assign({}, attrState, {
            index, input, updateName, 
            val: attrState.vmap[result[1]],
            oldVal: {length: KEYLEN},
            oldName: attrState.name,
          });

          let replacer;
          if ( updateName ) {
            replacer = makeAttributeNameUpdater(scope);
          } else {
            replacer = makeAttributeValueUpdater(scope);
          }

          scope.externals.push(() => replacer(scope.val.val));
          scope.val.replacers.push( replacer );
        }

        // FIXME: needs to support multiple replacements just like value
        // QUESTION: why is the variable oldName so required here, why can't we call it oldVal?
        // if we do it breaks, WHY?
        function makeAttributeNameUpdater(scope) {
          let {oldName,node,val} = scope;
          return (newVal) => {
            if ( oldName == newVal ) return;
            val.val = newVal;
            const attr = node.hasAttribute(oldName) ? oldName : EMPTY;
            if ( attr !== newVal ) {
              if ( attr ) {
                node.removeAttribute(oldName);
                node[oldName] = undefined;
              }
              if ( newVal ) {
                newVal = newVal.trim();

                let name = newVal, value = undefined;

                if( ATTRMATCH.test(newVal) ) {
                  const assignmentIndex = newVal.indexOf('='); 
                  ([name,value] = [newVal.slice(0,assignmentIndex), newVal.slice(assignmentIndex+1)]);
                }

                reliablySetAttribute(node, name, value);
              }
              oldName = newVal;
            }
          };
        }

        function makeAttributeValueUpdater(scope) {
          const updater = (newVal) => {
            if ( scope.oldVal == newVal ) return;
            scope.val.val = newVal;
            switch(getType(newVal)) {
              case "funcarray":       updateAttrWithFuncarrayValue(newVal, scope); break;
              case "function":        updateAttrWithFunctionValue(newVal, scope); break;
              case "handlers":        updateAttrWithHandlersValue(newVal, scope); break;
              case "vanillaviewobject": 
                newVal = nodesToStr(newVal.nodes); 
                updateAttrWithTextValue(newVal, scope); break;
              /* eslint-disable no-fallthrough */
              case "markupattrobject":  // deliberate fall through
                newVal = newVal.str;
              default:                
                updateAttrWithTextValue(newVal, scope); break;
              /* eslint-enable no-fallthrough */
            }
          };
          // call it the first time so it loads well
          // and we elide out the key placeholders here
          updater(scope.val.val);
          return updater;
        }

    // helpers
      function getAttributes(node) {
        if ( ! node.hasAttribute ) return [];

        // for parity with classList.add (which trims whitespace)
          // otherwise once the classList manipulation happens
          // our indexes for replacement will be off
        if ( node.hasAttribute('class') ) {
          node.setAttribute('class', formatClassListValue(node.getAttribute('class')));
        }
        return Array.from(node.attributes);
        /*
        if ( !! node.attributes && Number.isInteger(node.attributes.length) ) return Array.from(node.attributes);
        const attrs = [];
        for ( const name of node ) {
          if ( node.hasAttribute(name) ) {
            attrs.push({name, value:node.getAttribute(name)});
          }
        }
        return attrs;
        */
      }

      function updateAttrWithFunctionValue(newVal, scope) {
        let {oldVal,node,name,externals} = scope;
        if ( name !== 'bond' ) {
          let flags = {};
          if ( name.includes(':') ) {
            ([name, ...flags] = name.split(':'));
            flags = flags.reduce((O,f) => {
              O[f] = true;
              return O;
            }, {});
          }
          if ( oldVal ) {
            node.removeEventListener(name, oldVal, flags);
          }
          node.addEventListener(name, newVal, flags); 
          reliablySetAttribute(node, name, EMPTY);
        } else {
          if ( oldVal ) {
            const index = externals.indexOf(oldVal);
            if ( index >= 0 ) {
              externals.splice(index,1);
            }
          }
          externals.push(() => newVal(node)); 
        }
        scope.oldVal = newVal;
      }

      function updateAttrWithFuncarrayValue(newVal, scope) {
        let {oldVal,node,name,externals} = scope;
        if ( oldVal && ! Array.isArray(oldVal) ) {
          oldVal = [oldVal]; 
        }
        if ( name !== 'bond' ) {
          let flags = {};
          if ( name.includes(':') ) {
            ([name, ...flags] = name.split(':'));
            flags = flags.reduce((O,f) => {
              O[f] = true;
              return O;
            }, {});
          }
          if ( oldVal ) {
            oldVal.forEach(of => node.removeEventListener(name, of, flags));
          }
          newVal.forEach(f => node.addEventListener(name, f, flags));
        } else {
          if ( oldVal ) {
            oldVal.forEach(of => {
              const index = externals.indexOf(of);
              if ( index >= 0 ) {
                externals.splice(index,1);
              }
            });
          }
          newVal.forEach(f => externals.push(() => f(node)));
        }
        scope.oldVal = newVal;
      }

      function updateAttrWithHandlersValue(newVal, scope) {
        let {oldVal,node,externals,} = scope;
        if ( !!oldVal && typeof oldVal === 'object'  ) {
          Object.entries(oldVal).forEach(([eventName,funcVal]) => {
            if ( eventName !== 'bond' ) {
              let flags = {};
              if ( eventName.includes(':') ) {
                ([eventName, ...flags] = eventName.split(':'));
                flags = flags.reduce((O,f) => {
                  O[f] = true;
                  return O;
                }, {});
              }
              console.log(eventName, funcVal, flags);
              node.removeEventListener(eventName, funcVal, flags); 
            } else {
              const index = externals.indexOf(funcVal);
              if ( index >= 0 ) {
                externals.splice(index,1);
              }
            }
          });
        }
        Object.entries(newVal).forEach(([eventName,funcVal]) => {
          if ( eventName !== 'bond' ) {
            let flags = {};
            if ( eventName.includes(':') ) {
              ([eventName, ...flags] = eventName.split(':'));
              flags = flags.reduce((O,f) => {
                O[f] = true;
                return O;
              }, {});
            }
            node.addEventListener(eventName, funcVal, flags); 
          } else {
            externals.push(() => funcVal(node)); 
          }
        });
        scope.oldVal = newVal;
      }

      function updateAttrWithTextValue(newVal, scope) {
        let {oldVal,node,index,name,val,lengths,oldAttrVal} = scope;

        let attr = node.getAttribute(name);

        let newAttrValue;

        if ( oldAttrVal === oldVal ) {
          // if we are setting old val to be the whole attribute value
          // then we can just splice it in by setting it easily
          newAttrValue = newVal;
        } else {
          // otherwise we need to carefully calculate everything
          let zeroWidthCorrection = 0;
          const valIndex = val.vi;
          const originalLengthBefore = Object.keys(lengths.slice(0,valIndex)).length*KEYLEN;
            
          // we need to trim newVal to have parity with classlist add
            // the reason we have zeroWidthCorrection = -1
            // is because the classList is a set of non-zero width tokens
            // separated by spaces
            // when we have a zero width token, we have two adjacent spaces
            // which, by virtue of our other requirement, gets replaced by a single space
            // effectively elliding out our replacement location
            // in order to keep our replacement location in tact
            // we need to compensate for the loss of a token slot (effectively a token + a space)
            // and having a -1 correction effectively does this.
          if ( name == "class" ) {
            newVal = newVal.trim();
            if ( newVal.length == 0 ) {
              zeroWidthCorrection = -1;
            }
            scope.val.val = newVal;
          }
          lengths[valIndex] = newVal.length + zeroWidthCorrection;
          const lengthBefore = lengths.slice(0,valIndex).reduce((sum,x) => sum + x, 0);

          const correction = lengthBefore-originalLengthBefore;
          const before = attr.slice(0,index+correction);
          const after = attr.slice(index+correction+oldVal.length);
          
          if ( name == "class" ) {
            const spacer = oldVal.length == 0 ? ' ' : EMPTY;
            newAttrValue = before + spacer + newVal + spacer + after;
          } else {
            newAttrValue = before + newVal + after;
          }
        }

        if ( attr !== newAttrValue ) {
          reliablySetAttribute(node, name, newAttrValue);
        }

        scope.oldVal = newVal;
        scope.oldAttrVal = newAttrValue;
      }

      function reliablySetAttribute(node, name, value ) {
        if (  name == "class" ) {
          value = formatClassListValue(value);
        }

        try {
          node.setAttribute(name,isUnset(value) ? name : value);
        } catch(e) {
        }

        // if you set style like this is fucks it up
        if ( name in node && name !== 'style' ) {
          try {
            node[name] = isUnset(value) ? true : value;
          } catch(e) {
          }
        }
      }

      function getType(val) {
        const to = typeof val;
        const type = to === 'function' ? 'function' :
          val.code === CODE && Array.isArray(val.nodes) ? 'vanillaviewobject' : 
          val.code === CODE && typeof val.str === 'string' ? 'markupattrobject' :
          Array.isArray(val) && (val.length === 0 || (
            val[0].code === CODE && Array.isArray(val[0].nodes) 
          )) ? 'vanillaviewarray' : 
          Array.isArray(val) && (val.length === 0 || (
            typeof val[0] === 'function'
          )) ? 'funcarray' : 
          to === 'object' ? 'handlers' : 
          'default'
        ;
        return type;
      }

      function summonPlaceholder(sibling) {
        let ph = [...sibling.parentNode.childNodes].find(
          node => node.isConnected && 
            node.nodeType == Node.COMMENT_NODE && 
            node.nodeValue == 'vanillaview_placeholder' 
          );
        if ( ! ph ) {
          ph = toDOM(`<!--vanillaview_placeholder-->`).firstChild;
        }
        return ph;
      }

      // cache helpers
        // FIXME: function needs refactor
        function isCached(cacheKey,v,instance) {
          let firstCall;
          let cached = cache[cacheKey];
          if ( cached == undefined ) {
            cached = cache[cacheKey] = {};
            if ( instance.key !== undefined ) {
              cached.instances = {};
              cached = cached.instances[instance.key] = {};
            }
            firstCall = true;
          } else {
            if ( instance.key !== undefined ) {
              if ( ! cached.instances ) {
                cached.instances = {};
                firstCall = true;
              } else {
                cached = cached.instances[instance.key];
                if ( ! cached ) {
                  firstCall = true;
                } else {
                  if ( instance.kill === true ) {
                    cached = cache[cacheKey]; 
                    if ( cached && cached.instances ) {
                      cached.instances[instance.key] = null;
                    }
                    cached = null;
                    firstCall = true;
                  } else {
                    firstCall = false;
                  }
                }
              }
            } else {
              firstCall = false;
            }
          }
          //console.log({cached,firstCall,instance});
          return {cached,firstCall};
        }

      // Markup helpers
        // Returns an object that VanillaView treats as markup,
        // even tho it is NOT a VanillaView Object (defined with R/X/$)
        // And even tho it is in the location of a template value replacement
        // Which would normally be the treated as String
        function markup(str) {
          str = isUnset(str) ? EMPTY : str; 
          const frag = toDOM(str);
          const retVal = {
            type: 'MarkupObject',
            code:CODE,
            nodes:Array.from(frag.childNodes),
            externals: []
          };
          return retVal;
        }

        // Returns an object that VanillaView treats, again, as markup
        // But this time markup that is OKAY to have within a quoted attribute
        function attrmarkup(str) {
          str = isUnset(str) ? EMPTY : str; 
          str = str.replace(/"/g,'&quot;');
          const retVal = {
            type: 'MarkupAttrObject',
            code: CODE,
            str
          };
          return retVal;
        }

        function guardEmptyHandlers(val) {
          if ( Array.isArray(val) ) {
            if ( val.length == 0 ) {
              return [NULLFUNC]
            } 
            return val;
          } else {
            if ( isUnset(val) ) {
              return NULLFUNC;
            }
          }
        }

      // other helpers
        function formatClassListValue(value) {
          value = value.trim();
          value = value.replace(/\s+/g, ' ');
          return value;
        }

        function replaceValWithKeyAndOmitInstanceKey(vmap) {
          return (val,vi) => {
            // omit instance key
            if ( isKey(val) ) {
              return EMPTY;
            }
            const key = 'key'+Math.random().toFixed(15);
            let k = key;
            if ( val.code === CODE && Array.isArray(val.nodes) ) {
              k = `<!--${k}-->`;
            }
            vmap[key] = {vi,val,replacers:[]};
            return k;
          };
        }

        function toDOM(str) {
          DIV.replaceChildren();
          DIV.insertAdjacentHTML(POS, `<template>${str}</template>`);
          return DIV.firstElementChild.content;
        }

        function guardAndTransformVal(v) {
          const isVVArray   = Array.isArray(v) && (v.length === 0 || Array.isArray(v[0].nodes));
          const isNotSet         = isUnset(v);
          const isForgery = v.code !== CODE && Array.isArray(v.nodes);
          const isObject        = typeof v === 'object';

          if ( isVVArray )      return join(v); 
          if ( isKey(v) )           return v;
          if ( v.code === CODE )    return v;

          if ( isNotSet )            die({error: UNSET()});
          if ( isForgery )          die({error: XSS()});

          if ( isObject ) die({error: OBJ()});

          return v+EMPTY;
        }

        function join(os) {
          const externals = [];
          const bigNodes = [];
          const v = [];
          const oldVals = [];
          for( const o of os ) {
            //v.push(...o.v); 
            //oldVals.push(...o.oldVals);
            externals.push(...o.externals);
            bigNodes.push(...o.nodes);
          }
          const retVal = {v,code:CODE,oldVals,nodes:bigNodes,to,update,externals};
          return retVal;
        }

        function nodesToStr(nodes) {
          const frag = document.createDocumentFragment();
          nodes.forEach(n => frag.appendChild(n.cloneNode(true)));
          const container = document.createElement('body');
          container.appendChild(frag);
          return container.innerHTML;
        }

        function diffNodes(last,next) {
          last = new Set(last);
          next = new Set(next);
          return new Set([...last].filter(n => !next.has(n)));
        }

        function update(newVals) {
          const updateable = this.v.filter(({vi}) => didChange(newVals[vi], this.oldVals[vi]));
          updateable.forEach(({vi,replacers}) => replacers.forEach(f => f(newVals[vi])));
          this.oldVals = Array.from(newVals);
        }

        function didChange(oldVal, newVal) {
          const [oldType, newType] = [oldVal, newVal].map(getType); 
          let ret;
          if ( oldType != newType ) {
            ret =  true;
          } else {
            switch(oldType) {
              case "vanillaviewobject":
                // the vanillaview object is returned by a view function
                // which has already called its updaters and checked its slot values
                // to determine and show changes
                // except in the case of a list of nodes
                ret = true;
                break;
              /* eslint-disable no-fallthrough */
              case "funcarray":
              case "function":
                // hard to equate even if same str value as scope could be diff
                ret = true;
                break;
              case "vanillaviewarray":
                // need to do array dif so don't do here
                ret = true;
                break;
              case "markupattrobject":
                // need to check multiple things
                ret = true;
                break;
              default:
                ret = JS(oldVal) !== JS(newVal);
                break;
              /* eslint-enable no-fallthrough */
            }
          }

          return ret;
        }

    // reporting and error helpers 
      function die(msg,err) {
        msg.stack = (new Error()).stack.split(/\s*\n\s*/g);
        throw JS(msg);
      }

  exports.c = c;
  exports.s = s;

  Object.defineProperty(exports, '__esModule', { value: true });

}));
/* eslint-disable no-setter-return, no-with, no-constant-condition, no-async-promise-executor */
(function () {
  // constants, classes, config and state
    const DEBUG = false;
    const PIPELINE_REQUESTS = true;
    const RANDOM_SLEEP_ON_FIRST_PRINT = true;
    const RESPONSIVE_MEDIATION = true;
    const OPTIMIZE = true;
    const GET_ONLY = true;
    const MOBILE = isMobile();
    const GC_TIMEOUT = 10000;
    const EMPTY = '';
    const {stringify:_STR} = JSON;
    const JS = o => _STR(o, null, EMPTY);
    const LIGHTHOUSE = navigator.userAgent.includes("Chrome-Lighthouse");
    const DOUBLE_BARREL = /^\w+-(?:\w+-?)*$/; // note that this matches triple- and higher barrels, too
    const POS = 'beforeend';
    const LOCAL_PATH = 'this.';
    const PARENT_PATH = 'this.getRootNode().host.';
    const ONE_HIGHER = 'getRootNode().host.';
    const CALL_WITH_EVENT = '(event)';
    const F = _FUNC; 
    const FUNC_CALL = /\);?$/;
    const MirrorNode = Symbol.for('[[MN]]');
    const DIV = document.createElement('div');
    const path = location.pathname;
    const CONFIG = {
      htmlFile: 'markup.html',
      scriptFile: 'script.js',
      styleFile: 'style.css',
      bangKey: '_bang_key',
      componentsPath: `${path}${path.endsWith('/') ? EMPTY : '/'}components`,
      allowUnset: false,
      unsetPlaceholder: EMPTY,
      EVENTS: `error load click pointerdown pointerup pointermove mousedown mouseup 
        mousemove touchstart touchend touchmove touchcancel dblclick dragstart dragend 
        dragmove drag mouseover mouseout focus blur focusin focusout scroll
        input change compositionstart compositionend text paste beforepast select cut copy
        contextmenu
      `.split(/\s+/g).filter(s => s.length).map(e => `[on${e}]`).join(','),
      delayFirstPaintUntilLoaded: false,
      capBangRatioAtUnity: false,
      noHandlerPassthrough: false
    }
    const History = [];
    const STATE = new Map();
    const CACHE = new Map();
    const Waiters = new Map();
    const Started = new Set();
    const TRANSFORMING = new WeakSet();
    const Dependents = new Map();
    const MAX_CONCURRENT_REQUESTS = 5;
    const RequestPipeLine = new Map();
    const RequestWaiting = [];
    class Counter {
      started = 0;
      finished = 0;
    }
    const Counts = new Counter;
    const LoadChecker = countsChecker(Counts);
    const Finished = () => Counts.finished++;
    const SHADOW_OPTS = {mode:'open'};
    const OBSERVE_OPTS = {subtree: true, childList: true, characterData: true};
    const INSERT = 'insert';
    const ALL_DEPS = {allDependents: true};
    let RequestId = 0;
    let hindex = 0;
    let observer; // global mutation observer
    let systemKeys = 1;
    let _c$;

    const BangBase = (name) => class Base extends HTMLElement {
      static #activeAttrs = ['state']; // we listen for changes to these attributes only
      static get observedAttributes() {
        return Array.from(Base.#activeAttrs);
      }
      #name = name;
      #dependents = [];

      constructor({task: task = () => void 0} = {}) {
        super();
        this.counts = new Counter;
        this.cookMarkup = async (markup, state) => {
          const cooked = await cook.call(this, markup, state);
          if ( !this.shadowRoot ) {
            const shadow = this.attachShadow(SHADOW_OPTS);
            observer.observe(shadow, OBSERVE_OPTS);
            await cooked.to(shadow, INSERT);
            const listening = shadow.querySelectorAll(CONFIG.EVENTS);
            listening.forEach(node => this.handleAttrs(node.attributes, {node, originals: true}));
            
            // add dependents
            const deps = await findBangs(transformBang, shadow, ALL_DEPS);
            this.#dependents = deps.map(node => node.untilLoaded());
          }
        }
        this.markLoaded = async () => {
          if ( ! this.loaded ) {
            this.counts.finished++;
            const loaded = await this.untilLoaded();
            if ( loaded ) {
              this.loaded = loaded;
              this.setVisible();
              if ( ! this.isLazy ) {
                setTimeout(Finished, 0);
              }
            } else {
              // right now this never happens
            }
          }
        }
        this.checkLoad = countsChecker(this.counts);
        this.loadKey = Math.random().toString(36);

        if ( this.hasAttribute('lazy') ) {
          this.isLazy = true;
          if ( this.hasAttribute('super') ) {
            this.superLazy = true;
            loaded().then(() => sleep(400*Math.random()).then(() => this.print().then(task)));
          } else {
            if ( RANDOM_SLEEP_ON_FIRST_PRINT ) {
              sleep(160*Math.random()).then(() => this.print().then(task));
            } else {
              this.print().then(task);
            }
          }
        } else {
          this.print().then(task);
        }
      }

      get name() {
        return this.#name;
      }

      // BANG! API methods
      async print() {
        if ( !this.alreadyPrinted ) {
          this.prepareVisibility();
        }
        const state = this.handleAttrs(this.attributes);
        if ( OPTIMIZE ) {
          const nextState = JS(state);
          if ( this.alreadyPrinted && this.lastState === nextState ) {
            return;
          }
          this.lastState = nextState;
        }
        return this.printShadow(state)
      }

      update() {
        if ( this.fastUpdate ) {
          return this.fastUpdate();
        } else {
          return this.print();
        }
      }

      prepareVisibility() {
        this.alreadyPrinted = true;
        this.classList.add('bang-el');
        this.counts.started++;
        if ( !this.isLazy ) {
          Counts.started++;
        }
        this.classList.remove('bang-styled');
        // we prefetch the style
        fetchStyle(name).catch(err => {
          say('warn', err);
        });
      }

      async untilLoaded() {
        const myDependentsLoaded = (await Promise.all(this.#dependents)).every(loaded => loaded);
        const myContentLoaded = await becomesTrue(this.checkLoad, this.loadKey);
        return myContentLoaded && myDependentsLoaded;
      }

      updateIfChanged(state) {
        const {didChange} = stateChanged(state);
        if ( didChange ) {
          const views = getViews(state);
          const newKey = updateState(state);
          views.forEach(view => view.setAttribute('state', newKey));
        }
      }

      setVisible() {
        this.classList.add('bang-styled');
      }

      get state() {
        const key = this.getAttribute('state');
        return cloneState(key);
      }

      set state(newValue) {
        const key = this.getAttribute('state');
        if ( key.startsWith('system-key:') ) {
          return this.updateIfChanged(this.state);
        }
        return setState(key, newValue);
      }

      // Web Components methods
      attributeChangedCallback(name, oldValue) {
        if ( name === 'state' && !isUnset(oldValue) ) {
          this.update();
        }
      }

      connectedCallback() {
        say('log',name, 'connected');
        this.handleAttrs(this.attributes, {originals: true});
      }

      // private methods
      handleAttrs(attrs, {node, originals} = {}) {
        let state = {};

        if ( ! node ) node = this;

        // we can optimize this method more, we only get attrs if originals == true
        // otherwise we just get and process the single 'state' attr 
        // this is a lot more performant
        for( let {name,value} of attrs ) {
          if ( isUnset(value) ) continue;
          if ( name === 'state' ) {
            const stateKey = value.trim(); 
            const stateObject = cloneState(stateKey);
            
            if ( isUnset(stateObject) ) {
              console.warn(node);
              self.STATE = STATE;
              console.warn(new ReferenceError(`
                <${node.localName}> constructor passed state key ${stateKey} which is unset. It must be set.
              `));
              break;
            }
            
            state = stateObject;

            if ( originals ) {
              let acquirers = Dependents.get(stateKey);
              if ( ! acquirers ) {
                acquirers = new Set();
                Dependents.set(stateKey, acquirers);
              }
              acquirers.add(node);
            } else break;
          } else if ( originals ) { // set event handlers to custom element class instance methods
            if ( ! name.startsWith('on') ) continue;
            value = value.trim();
            if ( ! value ) continue;

            // Perf note:
              // Local and Parent are just optimizations to avoid if we can the
              // getAncestor function call, which saves us a couple seconds in large documents
            const Local = node[value] instanceof Function;
            const Parent = node.getRootNode()?.host?.[value] instanceof Function;
            const path = Local ? LOCAL_PATH :
              Parent ? PARENT_PATH : 
              getAncestor(node.getRootNode()?.host?.getRootNode?.()?.host, value)
            ;

            if ( !path || value.startsWith(path) ) continue;

            // Conditional logic explained:
              // don't add a function call bracket if
              // 1. it already has one
              // 2. the reference is not a function
            const ender = value.match(FUNC_CALL) ? EMPTY : CALL_WITH_EVENT;
            node.setAttribute(name, `${path}${value}${ender}`);
          }
        }

        return state;
      }

      printShadow(state) {
        return fetchMarkup(this.#name).then(markup => this.cookMarkup(markup, state))
        .catch(err => DEBUG && say('warn!',err))
        .finally(this.markLoaded);
      }
    };

    class StateKey extends String {
      constructor (keyNumber) {
        if ( keyNumber == undefined ) super(`system-key:${systemKeys+=2}`); 
        else super(`client-key:${keyNumber}`);
      }
    }

  install();

  // API
    async function use(name) {
      let component;
      await fetchScript(name)
        .then(script => { // if there's a script that extends base, evaluate it to be component
          const Base = BangBase(name);
          const Compose = `(function () { ${Base.toString()}; return ${script}; }())`;
          try {
            component = eval(Compose);
          } catch(e) {
            say('warn!',e, Compose, component)
          }
        }).catch(err => {  // otherwise if there is no such extension script, just use the Base class
          DEBUG && say('log!', err);
          component = BangBase(name);
        });
      
      self.customElements.define(name, component);
    }
    
    // run a map of a list of work with configurable breaks in between
    // to let the main thread breathe at the same time 
    async function schedule(list, func, {
          batchSize: batchSize = 1,
          yieldTime: yieldTime = 30,
          strictSerial: strictSerial = true,
          useFrame: useFrame = false
        } = {}) {
      // note list can be async iterable
      const results = [];
      let i = 0;
      let currentBatch = 0;
      for await ( const item of list ) {
        let result;
        if ( strictSerial ) {
          result = await func(item, i);
        } else {
          result = func(item, i);
        }
        results.push(result);

        if ( RESPONSIVE_MEDIATION ) {
          i++;
          currentBatch++;
          if ( currentBatch < batchSize ) continue;
          currentBatch = 0;

          if ( useFrame ) {
            await nextFrame();
          } else if ( yieldTime > -1 ) {
            await sleep(yieldTime);
          }
        }
      }
      return results;
    }

    function undoState(key, transform = x => x) {
      while( hindex > 0 ) {
        hindex -= 1;
        if ( History[hindex].name === key ) {
          setState(key, transform(History[hindex].value));
          return true;
        }
      }
      return false;
    }

    function redoState(key, transform = x => x) {
      while( hindex < History.length - 1 ) {
        hindex += 1;
        if ( History[hindex].name === key ) {
          setState(key, transform(History[hindex].value));
          return true;
        }
      }
      return false;
    }

    function bangFig(newConfig = {}) {
      Object.assign(CONFIG, newConfig);
    }

    function runCode(context, str) {
      with(context) {
        return eval(str); 
      }
    }

    function stateChanged(obj) {
      const key = STATE.get(obj);
      const oStateJSON = STATE.get(key+'.json.last');
      const stateJSON = JS(obj);
      return {key, didChange: oStateJSON !== stateJSON, stateJSON, oStateJSON};
    }

    function updateState(state, key) {
      key = key || STATE.get(state);
      if ( ! key ) {
        console.warn('no key for state', state);
        throw new ReferenceError(`Key must exist to update state.`);
      }
      const oKey = key;
      const oStateJSON = STATE.get(key+'.json.last');
      const stateJSON = JS(state);
      STATE.delete(oStateJSON);
      STATE.set(key, state);
      if ( key.startsWith('system-key:') ) {
        STATE.delete(key);
        STATE.delete(key+'.json.last');
        key = new StateKey()+'';
        STATE.set(key, state);
        STATE.set(state, key);
      }
      STATE.set(key+'.json.last', stateJSON);
      STATE.set(stateJSON, key+'.json.last');
      const views = Dependents.get(oKey);
      Dependents.set(key, views);
      return key;
    }

    function getViews(obj) {
      const key = STATE.get(obj);
      const acquirers = Dependents.get(key);
      if ( acquirers ) {
        return Array.from(acquirers);
      } else {
        console.warn('No acquirers for key');
        return [];
      }
    }

    function setState(key, state, {
      rerender: rerender = true, 
      save: save = false
    } = {}) {
      const jss = JS(state);
      let lk = key+'.json.last';
      if ( GET_ONLY ) {
        if ( !STATE.has(key) ) {
          STATE.set(key, state);
          STATE.set(state, key);
          STATE.set(jss,lk);
          STATE.set(lk,jss);
        } else {
          const oStateJSON = STATE.get(lk);
          /*if ( stateChanged(oState).didChange ) {*/
          if ( oStateJSON !== jss ) {
            key = updateState(state, key);
          }
        }
      } else {
        STATE.set(key, state);
        STATE.set(state, key);
        STATE.set(jss,lk);
        STATE.set(lk,jss);
      }

      if ( save ) {
        hindex = Math.min(hindex+1, History.length);
        History.splice(hindex, 0, {name: key, value: clone(state)});
      }

      if ( rerender ) { // re-render only those components depending on that key
        const acquirers = Dependents.get(key);
        if ( acquirers ) acquirers.forEach(host => host.print());
      }
      
      return true;
    }

    function patchState(key, state) {
      return setState(key, state, {rerender: false});
    }

    function cloneState(key, getOnly = GET_ONLY) {
      if ( getOnly ) return STATE.get(key);
      if ( STATE.has(key) ) return clone(STATE.get(key));
      else {
        throw new ReferenceError(`State store does not have the key ${key}`);
      }
    }

    function countsChecker(counts) {
      return () => counts.started > 0 && counts.finished >= counts.started;
    }

    async function loaded() {
      return becomesTrue(LoadChecker);
    }

    async function bangLoaded() {
      return becomesTrue(bangLoadedCheck);
    }

    function bangLoadedCheck() {
      const c_defined = typeof _c$ === "function";
      return c_defined;
    }

  // network pipelining (for performance)
    async function pipeLinedFetch(...args) {
      if ( !PIPELINE_REQUESTS ) return fetch(...args);
      const key = nextRequestId();
      const result = {args, started: new Date};
      let pr;
      if ( RequestPipeLine.size < MAX_CONCURRENT_REQUESTS ) {
        pr = fetch(...args).catch(err => (say('log', err), err));
        result.pr = pr;
        RequestPipeLine.set(key, result);
        const complete = r => {
          const result = RequestPipeLine.get(key);
          result.finished = new Date;
          result.duration = result.finished - result.started;
          RequestPipeLine.delete(key); 
          if ( RequestWaiting.length && RequestPipeLine.size < MAX_CONCURRENT_REQUESTS ) {
            const result = RequestWaiting.shift();
            const req = fetch(...result.args);
            req.then(complete).then(r => (result.resolve(r), r)).catch(e => (result.reject(e), e));
            RequestPipeLine.set(key, result);
          }
          return r;
        };
        pr.then(complete);
      } else {
        let resolve, reject;
        pr = new Promise((res,rej) => (resolve = res, reject = rej));
        result.resolve = resolve;
        result.reject = reject;
        RequestWaiting.push(result);
      }
      return pr;
    }

    function nextRequestId() {
      return `${RequestId++}${Math.random().toString(36)}`;
    }

  // helpers
    async function install() {
      Object.assign(globalThis, {
        F,
        use, setState, patchState, cloneState, loaded, 
        sleep, bangFig, bangLoaded, isMobile, trace,
        undoState, redoState, stateChanged, getViews, updateState,
        isUnset,  EMPTY, 
        dateString,
        runCode, schedule,
        ...( DEBUG ? { STATE, CACHE, TRANSFORMING, Started, BangBase } : {})
      });

      const module = globalThis.vanillaview || (await import('./vv/vanillaview.js'));
      const {s} = module;
      const That = {STATE,CONFIG,StateKey,JS}; 
      _c$ = s.bind(That);
      That._c$ = _c$;

      if ( CONFIG.delayFirstPaintUntilLoaded ) {
        becomesTrue(() => document.body).then(() => document.body.classList.add('bang-el'));
      }

      observer = new MutationObserver(transformBangs);
      /* we are interested in bang nodes (which start as comments) */
      observer.observe(document, OBSERVE_OPTS);
      await findBangs(transformBang); 
      
      loaded().then(() => document.body.classList.add('bang-styled'));
    }

    async function fetchMarkup(name) {
      // cache first
        // we make any subsequent calls for name wait for the first call to complete
        // otherwise we create many in parallel without benefitting from caching

      const key = `markup:${name}`;

      if ( Started.has(key) ) {
        if ( ! CACHE.has(key) ) await cacheHasKey(key);
      } else Started.add(key);

      const styleKey = `style${name}`;
      const baseUrl = `${CONFIG.componentsPath}/${name}`;
      if ( CACHE.has(key) ) {
        const markup = CACHE.get(key);
        if ( CACHE.get(styleKey) instanceof Error ) { 
          /*comp && comp.setVisible(); */
        }
        
        // if there is an error style and we are still includig that link
        // we generate and cache the markup again to omit such a link element
        if ( CACHE.get(styleKey) instanceof Error && markup.includes(`href=${baseUrl}/${CONFIG.styleFile}`) ) {
          // then we need to set the cache for markup again and remove the link to the stylesheet which failed 
        } else {
          /* comp && comp.setVisible(); */
          return markup;
        }
      }
      
      const markupUrl = `${baseUrl}/${CONFIG.htmlFile}`;
      let resp;
      const markupText = await pipeLinedFetch(markupUrl).then(async r => { 
        let text = EMPTY;
        if ( r.ok ) text = await r.text();
        else text = `<slot></slot>`;        // if no markup is given we just insert all content within the custom element
      
        if ( CACHE.get(styleKey) instanceof Error ) { 
          resp = `<style>
            ${await fetchFile(EMPTY, CONFIG.styleFile).catch(err => `/* ${err+EMPTY} */`).then(e => {
              if ( e instanceof Error ) return `/* no ${name}/${CONFIG.styleFile} defined */`;
              return e;
            })}
          </style>${text}` 
        } else {
          // inlining styles for increase speed */
          resp = `<style>
            ${await fetchFile(EMPTY, CONFIG.styleFile).catch(err => `/* ${err+EMPTY} */`).then(e => {
              if ( e instanceof Error ) return `/* no ${name}/${CONFIG.styleFile} defined */`;
              return e;
            })}
            ${await fetchStyle(name).then(e => {
              if ( e instanceof Error ) return `/* no ${name}/${CONFIG.styleFile} defined */`;
              return e;
            })}
          </style>${text}`;
        }
        
        return resp;
      }).finally(async () => CACHE.set(key, await resp));
      return markupText;
    }

    async function fetchFile(name, file) {
      const key = `${file}:${name}`;

      if ( Started.has(key) ) {
        if ( ! CACHE.has(key) ) await cacheHasKey(key);
      } else Started.add(key);

      if ( CACHE.has(key) ) return CACHE.get(key);

      const url = `${CONFIG.componentsPath}/${name ? name + '/' : EMPTY}${file}`;
      let resp;
      const fileText = await pipeLinedFetch(url).then(r => { 
        if ( r.ok ) {
          resp = r.text();
          return resp;
        } 
        resp = new ReferenceError(`Fetch error: ${url}, ${r.statusText}`);
        throw resp;
      })
      .finally(async () => CACHE.set(key, await resp));
      
      return fileText;
    }

    async function fetchStyle(name) {
      return fetchFile(name, CONFIG.styleFile);
    }

    async function fetchScript(name) {
      return fetchFile(name, CONFIG.scriptFile);
    }

    // search and transform each added subtree
    async function transformBangs(records) {
      for( const record of records ) {
        for( const node of record.addedNodes ) {
          await findBangs(transformBang, node);
        }
      }
    }

    function transformBang(current) {
      const [name, data] = getBangDetails(current);

      // replace the bang node (comment) with its actual custom element node
      const actualElement = createElement(name, data);
      current.linkedCustomElement = actualElement;
      actualElement[MirrorNode] = current;
      current.parentNode.replaceChild(actualElement, current);
    }

    async function findBangs(callback, root = document.documentElement, {
          allDependents: allDependents = false,
          batchSize: batchSize = 100,
          yieldTime: yieldTime = 0,
          useFrame: useFrame = true
        } = {}) {
      if ( root.noFindBang ) return allDependents ? [] : void 0;
      const found = allDependents ? 
        node => node.nodeType === Node.COMMENT_NODE || 
          node.nodeType === Node.ELEMENT_NODE 
        :
        node => node.nodeType === Node.COMMENT_NODE
      ;
      const Filter = allDependents ? 
        NodeFilter.SHOW_COMMENT | NodeFilter.SHOW_ELEMENT
        :
        NodeFilter.SHOW_COMMENT
      ;
      const Details = allDependents ? 
        getNodeDetails  
        :
        getBangDetails
      ;
      const Return = allDependents ? NodeFilter.FILTER_SKIP : NodeFilter.FILTER_REJECT;
      const Acceptor = {
        acceptNode(node) {
          if ( found(node) ) {
            const [name] = Details(node); 
            if ( name.match(DOUBLE_BARREL) ) return NodeFilter.FILTER_ACCEPT;
            else return Return; 
          } else if ( isDocument(node) ) {
            return NodeFilter.FILTER_ACCEPT;
          } else return NodeFilter.FILTER_SKIP;
        }
      };
      const iterator = document.createTreeWalker(root, Filter, Acceptor);
      const replacements = [];
      const dependents = [];

      // handle root node
        // Note:
          // it's a special case because it will be present in the iteration even if
          // the NodeFilter would filter it out if it were not the root
        let current = iterator.currentNode;

        // Note:
          // we need isBangTag here because a node that doesn't pass 
          // Acceptor.accept will stop show up as the first currentNode
          // in a tree iterator
        if ( isBangTag(current) ) {
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

          // Note:
            // a small optimization is replace isBangTag by the following check
            // we don't need isBangTag here because it's already passed the 
            // equivalent check in Acceptor.acceptNode
          if ( current.nodeType === Node.COMMENT_NODE ) {
            if ( !TRANSFORMING.has(current) ) {
              TRANSFORMING.add(current);
              const target = current;
              replacements.push(() => transformBang(target));
            }
          }
          dependents.push(current);
        }

      let i = 0;
      while(replacements.length) {
        replacements.pop()();
        if ( RESPONSIVE_MEDIATION && allDependents ) {
          i++;
          if ( i < batchSize ) continue;
          i = 0;
          if ( useFrame ) {
            await nextFrame();
          } else {
            await sleep(yieldTime);
          }
        }
      }

      if ( allDependents ) {
        return dependents
          .map(actualElement)
          .filter(el => el && !el.hasAttribute('lazy'));
      } else return;
    }

    function actualElement(node) {
      const el = node.nodeType === Node.COMMENT_NODE ? 
        node.linkedCustomElement 
        : 
        node 
      ;
      //console.log(node, el);
      return el;
    }

    function getAncestor(node, value) {
      if ( node ) {
        const currentPath = [PARENT_PATH + ONE_HIGHER];
        while( node ) {
          if ( node[value] instanceof Function ) return currentPath.join(EMPTY);
          node = node.getRootNode().host;
          currentPath.push( 'getRootNode().host.' );
        }
      }
      return null;
    }

    function isBangTag(node) {
      return node.nodeType === Node.COMMENT_NODE && getBangDetails(node)[0].match(DOUBLE_BARREL);
    }

    function isDocument(node) {
      return node.nodeType === Node.DOCUMENT_FRAGMENT_NODE ||
        node.nodeType === Node.DOCUMENT_NODE
      ;
    }

    function getBangDetails(node) {
      const text = node.textContent.trim();
      const [name, ...data] = text.split(/[\s\t]/g);
      return [name.trim(), data.join(' ')];
    }

    function getNodeDetails(node) {
      switch(node.nodeType) {
        case Node.COMMENT_NODE:
          return getBangDetails(node);
        case Node.ELEMENT_NODE:
          return [node.localName];
      }
    }

    async function cook(markup, state) {
      let cooked = EMPTY;
      try {
        if ( !state._self ) {
          Object.defineProperty(state, '_self', {value: state});
        }
      } catch(e) {
        say('warn!',
          `Cannot add '_self' self-reference property to state. 
            This enables a component to inspect the top-level state object it is passed.`
        );
      }
      try {
        with(state) {
          cooked = await eval("(async function () { return await _FUNC`${{state}}"+markup+"`; }())");  
        }
        return cooked;
      } catch(error) {
        say('error!', 'Template error', {markup, state, error});
        throw error;
      }
    }

    async function _FUNC(strings, ...vals) {
      const s = Array.from(strings);
      const ret =  await _c$(s, ...vals);
      return ret;
    }

    function createElement(name, data) {
      return toDOM(`<${name} ${data}></${name}>`).firstElementChild;
    }

    function toDOM(str) {
      DIV.replaceChildren();
      DIV.insertAdjacentHTML(POS, `<template>${str}</template>`);
      return DIV.firstElementChild.content;
    }

    async function becomesTrue(check, key) {
      const WaitKey = key || check;
      let waiters = Waiters.get(WaitKey);

      if ( ! waiters ) {
        waiters = _becomesTrue(check).then(checkResult => {
          setTimeout(() => Waiters.delete(WaitKey), GC_TIMEOUT);
          return checkResult; 
        });
        Waiters.set(WaitKey, waiters);
      }
      const pr = new Promise(resolve => waiters.then(resolve));
      return pr;
    }

    async function _becomesTrue(check) {
      return new Promise(async res => {
        while(true) {
          await nextFrame();
          if ( check() ) break;
        }
        res(true);
      });
    }

    // this is to optimize using becomesTrue so we don't start a new timer
    // for every becomesTrue function call (in the case of the cache check, anyway)
    // we can use this pattern to apply to other becomesTrue calls like loaded
    async function cacheHasKey(key) {
      const cacheKey = `cache:${key}`;
      const funcKey = `checkFunc:${key}`;
      let checkFunc = Waiters.get(funcKey);
      if ( ! checkFunc ) {
        checkFunc = () => CACHE.has(key);
        Waiters.set(funcKey,checkFunc);
      }
      return becomesTrue(checkFunc, cacheKey);
    }

    async function sleep(ms) {
      return new Promise(res => setTimeout(res, ms));
    }
    
    async function nextFrame() {
      return new Promise(res => requestAnimationFrame(res));
    }

    function isUnset(x) {
      return x === undefined || x === null;
    }

    function say(mode, ...stuff) {
      (DEBUG || mode === 'error' || mode.endsWith('!')) && MOBILE && !LIGHTHOUSE && alert(`${mode}: ${stuff.join('\n')}`);
      (DEBUG || mode === 'error' || mode.endsWith('!')) && console[mode.replace('!',EMPTY)](...stuff);
    }

    function isMobile() {
      const toMatch = [
        /Android/i,
        /webOS/i,
        /iPhone/i,
        /iPad/i,
        /iPod/i,
        /BlackBerry/i,
        /Windows Phone/i
      ];

      return toMatch.some((toMatchItem) => {
        return navigator.userAgent.match(toMatchItem);
      });
    }
  
    function trace(msg = EMPTY) {
      const tracer = new Error('Trace');
      console.log(msg, 'Call stack', tracer.stack);
    }

    function dateString(date) {
      const offset = date.getTimezoneOffset()
      date = new Date(date.getTime() - (offset*60*1000))
      return date.toISOString().split('T')[0];
    }

    function clone(o) {
      return JSON.parse(JS(o));
    }
}());


