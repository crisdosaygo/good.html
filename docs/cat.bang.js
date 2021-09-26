(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
  typeof define === 'function' && define.amd ? define(['exports'], factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory((global.vv = global.vv || {}, global.vv.bang = {})));
})(this, (function (exports) {
  // common for all r submodules
    const CODE              = ''+Math.random();

  const BROWSER_SIDE      = (() => {try{ return self.DOMParser && true; } catch(e) { return false; }})();

    const BuiltIns = [
      Symbol, Boolean, Number, String, Object, Set, Map, WeakMap, WeakSet,
      Uint8Array, Uint16Array, Uint32Array, Float32Array, Float64Array,
      Int8Array, Int16Array, Int32Array, 
      Uint8ClampedArray, 
      ...(BROWSER_SIDE ? [
        Node,NodeList,Element,HTMLElement, Blob, ArrayBuffer,
        FileList, Text, HTMLDocument, Document, DocumentFragment,
        Error, File, Event, EventTarget, URL
      /* eslint-disable no-undef */
      ] : [ Buffer ])
      /* eslint-enable no-undef */
    ];
    const SEALED_DEFAULT = true;
    const isNone = instance => instance == null || instance == undefined;

    const typeCache = new Map();

    T.def = def;
    T.check = check;
    T.sub = sub;
    T.verify = verify$1;
    T.validate = validate;
    T.partialMatch = partialMatch;
    T.defEnum = defEnum;
    T.defSub = defSub;
    T.defTuple = defTuple;
    T.defCollection = defCollection;
    T.defOr = defOr;
    T.option = option;
    T.defOption = defOption;
    T.maybe = maybe;
    T.guard = guard;
    T.errors = errors;

    T[Symbol.for('jtype-system.typeCache')] = typeCache;

    defineSpecials();
    mapBuiltins();

    function T(parts, ...vals) {
      const cooked = vals.reduce((prev,cur,i) => prev+cur+parts[i+1], parts[0]);
      const typeName = cooked;
      if ( !typeCache.has(typeName) ) throw new TypeError(`Cannot use type ${typeName} before it is defined.`);
      return typeCache.get(typeName).type;
    }

    function partialMatch(type, instance) {
      return validate(type, instance, {partial:true});
    }

    function validate(type, instance, {partial: partial = false} = {}) {
      guardType(type);
      guardExists(type);
      const typeName = type.name;

      const {spec,kind,help,verify,verifiers,sealed} = typeCache.get(typeName);

      const specKeyPaths = spec ? allKeyPaths(spec).sort() : [];
      const specKeyPathSet = new Set(specKeyPaths);

      const bigErrors = [];

      switch(kind) {
        case "def": {
          let allValid = true;
          if ( spec ) {
            const keyPaths = partial ? allKeyPaths(instance, specKeyPathSet) : specKeyPaths;
            allValid = !isNone(instance) && keyPaths.every(kp => {
              // Allow lookup errors if the type match for the key path can include None

              const {resolved, errors:lookupErrors} = lookup(instance,kp,() => checkTypeMatch(lookup(spec,kp).resolved, T`None`));
              bigErrors.push(...lookupErrors);

              if ( lookupErrors.length ) return false;

              const keyType = lookup(spec,kp).resolved;
              if ( !keyType || !(keyType instanceof Type) ) {
                bigErrors.push({
                  error: `Key path '${kp}' is not present in the spec for type '${typeName}'`
                });
                return false;
              }

              const {valid, errors: validationErrors} = validate(keyType, resolved);
              bigErrors.push(...validationErrors);

              return valid;
            });
          }
          let verified = true;
          if ( partial && ! spec && !!verify ) {
            throw new TypeError(`Type checking with option 'partial' is not a valid option for types that` + 
              ` only use a verify function but have no spec`);
          } else if ( verify ) {
            try {
              verified = verify(instance);
              if ( ! verified ) {
                if ( verifiers ) {
                  throw {
                    error:`Type ${typeName} value '${JSON.stringify(instance)}' violated at least 1 verify function in:\n${
                    verifiers.map(f => '\t'+(f.help||'') + ' ('+f.verify.toString()+')').join('\n')
                  }`
                  };
                } else if ( type.isSumType ) {
                  throw {
                    error: `Value '${JSON.stringify(instance)}' did not match any of: ${[...type.types.keys()].map(t => t.name)}`,
                    verify, verifiers
                  }
                } else {
                  let helpMsg = '';
                  if ( help ) {
                    helpMsg = `Help: ${help}. `;
                  }
                  throw {error:`${helpMsg}Type ${typeName} Value '${JSON.stringify(instance)}' violated verify function in: ${verify.toString()}`};
                }
              }
            } catch(e) {
              bigErrors.push(e);
              verified = false;
            }
          }
          let sealValid = true;
          if ( !!sealed && !! spec ) {
            const type_key_paths = specKeyPaths;
            const all_key_paths = allKeyPaths(instance, specKeyPathSet).sort();
            sealValid  = all_key_paths.join(',') == type_key_paths.join(',');
            if ( ! sealValid ) {
              if ( all_key_paths.length < type_key_paths.length ) {
                sealValid = true;
              } else {
                const errorKeys = [];
                const tkp = new Set(type_key_paths); 
                for( const k of all_key_paths ) {
                  if ( ! tkp.has(k) ) {
                    errorKeys.push({
                      error: `Key path '${k}' is not in the spec for type ${typeName}`
                    });
                  }
                }
                if ( errorKeys.length ) {
                  bigErrors.push(...errorKeys);
                }
              }
            }
          }
          return {valid: allValid && verified && sealValid, errors: bigErrors, partial}
        } case "defCollection": {
          const {valid:containerValid, errors:containerErrors} = validate(spec.container, instance);
          let membersValid = true;
          let verified = true;

          bigErrors.push(...containerErrors);
          if ( partial ) {
            throw new TypeError(`Type checking with option 'partial' is not a valid option for Collection types`);
          } else {
            if ( containerValid ) {
               membersValid= [...instance].every(member => {
                const {valid, errors} = validate(spec.member, member);
                bigErrors.push(...errors);
                return valid;
              });
            }
            if ( verify ) {
              try {
                verified = verify(instance);
              } catch(e) {
                bigErrors.push(e);
                verified = false;
              }
            }
          }
            
          return {valid:containerValid && membersValid && verified, errors:bigErrors};
        } default: {
          throw new TypeError(`Checking for type kind ${kind} is not yet implemented.`);
        }
      }
    }

    function check(...args) {
      return validate(...args).valid;
    }

    function lookup(obj, keyPath, canBeNone) {
      if ( isNone(obj) ) throw new TypeError(`Lookup requires a non-unset object.`);

      if ( !keyPath ) throw new TypeError(`keyPath must not be empty`);


      const keys = keyPath.split(/\./g);
      const pathComplete = [];
      const errors = [];

      let resolved = obj;

      while(keys.length) {
        const nextKey = keys.shift();
        resolved = resolved[nextKey];
        pathComplete.push(nextKey);
        if ( (resolved === null || resolved === undefined) ) {
          if ( keys.length ) {
            errors.push({
              error: 
                `Lookup on key path '${keyPath}' failed at '` + 
                pathComplete.join('.') +
                `' when ${resolved} was found at '${nextKey}'.` 
            });
          } else if ( !!canBeNone && canBeNone() ) {
            resolved = undefined;
          } else {
            errors.push({
              error: 
                `Resolution on key path '${keyPath}' failed` + 
                `when ${resolved} was found at '${nextKey}' and the Type of this` +
                `key's value cannot be None.`
            });
          }
          break;
        }
      }
      return {resolved,errors};
    }

    function checkTypeMatch(typeA, typeB) {
      guardType(typeA);
      guardExists(typeA);
      guardType(typeB);
      guardExists(typeB);

      if ( typeA === typeB ) {
        return true;
      } else if ( typeA.isSumType && typeA.types.has(typeB) ) {
        return true;
      } else if ( typeB.isSumType && typeB.types.has(typeA) ) {
        return true;
      } else if ( typeA.name.startsWith('?') && typeB == T`None` ) {
        return true;
      } else if ( typeB.name.startsWith('?') && typeA == T`None` ) {
        return true;
      }

      if ( typeA.name.startsWith('>') || typeB.name.startsWith('>') ) {
        console.error(new Error(`Check type match has not been implemented for derived//sub types yet.`));
      }

      return false;
    }

    function option(type) {
      return T`?${type.name}`;
    }

    function sub(type) {
      return T`>${type.name}`;
    }

    function defSub(type, spec, {verify: verify = undefined, help:help = ''} = {}, name = '') {
      guardType(type);
      guardExists(type);

      let verifiers;

      if ( ! verify ) {
        verify = () => true;
      } 

      if ( type.native ) {
        verifiers = [ {help,verify} ];
        verify = i => i instanceof type.native;
        const helpMsg = `Needs to be of type ${type.native.name}. ${help||''}`;
        verifiers.push({help:helpMsg,verify});
      }

      const newType = def(`${name}>${type.name}`, spec, {verify,help, verifiers});
      return newType;
    }

    function defEnum(name, ...values) {
      if ( !name ) throw new TypeError(`Type must be named.`); 
      guardRedefinition(name);
      
      const valueSet = new Set(values);
      const verify = i => valueSet.has(i);
      const help = `Value of Enum type ${name} must be one of ${values.join(',')}`;

      return def(name, null, {verify,help});
    }

    function exists(name) {
      return typeCache.has(name);
    }

    function guardRedefinition(name) {
      if ( exists(name) ) throw new TypeError(`Type ${name} cannot be redefined.`);
    }

    function allKeyPaths(o, specKeyPaths) {
      const isTypeSpec = ! specKeyPaths;
      const keyPaths = new Set();
      return recurseObject(o, keyPaths, '');

      function recurseObject(o, keyPathSet, lastLevel = '') {
        if ( isUnset$1(o) ) return [];
        const levelKeys = Object.getOwnPropertyNames(o); 
        const keyPaths = levelKeys
          .map(k => lastLevel + (lastLevel.length ? '.' : '') + k);
        levelKeys.forEach((k,i) => {
          const v = o[k];
          if ( isTypeSpec ) {
            if ( v instanceof Type ) {
              keyPathSet.add(keyPaths[i]);
            } else if ( typeof v == "object" ) {
              if ( ! Array.isArray(v) ) {
                recurseObject(v, keyPathSet, keyPaths[i]);
              } else {
                throw new TypeError(`We don't support Types that use Arrays as structure, just yet.`); 
              }
            } else {
              throw new TypeError(`Spec cannot contain leaf values that are not valid Types`);
            }
          } else {
            if ( specKeyPaths.has(keyPaths[i]) ) {
              keyPathSet.add(keyPaths[i]); 
            } else if ( typeof v == "object" ) {
              if ( k === '_self' ) ; else if ( ! Array.isArray(v) ) {
                recurseObject(v, keyPathSet, keyPaths[i]);
              } else {
                v.forEach((item,index) => recurseObject(item, keyPathSet, keyPaths[i] + '.' + index));
                //throw new TypeError(`We don't support Instances that use Arrays as structure, just yet.`); 
              }
            } else {
              //console.warn("Spec has no such key",  keyPaths[i]);
              keyPathSet.add(keyPaths[i]);
            }
          }
        });
        return [...keyPathSet];
      }
    }

    function defOption(type) {
      guardType(type);
      const typeName = type.name;
      return T.def(`?${typeName}`, null, {verify: i => isUnset$1(i) || T.check(type,i)});
    }

    function maybe(type) {
      try {
        return defOption(type);
      } catch(e) {
        // console.log(`Option Type ${type.name} already declared.`, e);
      }
      return T`?${type.name}`;
    }

    function verify$1(...args) { return check(...args); }

    function defCollection(name, {container, member}, {sealed: sealed = SEALED_DEFAULT, verify: verify = undefined} = {}) {
      if ( !name ) throw new TypeError(`Type must be named.`); 
      if ( !container || !member ) throw new TypeError(`Type must be specified.`);
      guardRedefinition(name);

      const kind = 'defCollection';
      const t = new Type(name);
      const spec = {kind, spec: { container, member}, verify, sealed, type: t};
      typeCache.set(name, spec);
      return t;
    }

    function defTuple(name, {pattern}) {
      if ( !name ) throw new TypeError(`Type must be named.`); 
      if ( !pattern ) throw new TypeError(`Type must be specified.`);
      const kind = 'def';
      const specObj = {};
      pattern.forEach((type,key) => specObj[key] = type);
      const t = new Type(name);
      const spec = {kind, spec: specObj, type:t};
      typeCache.set(name, spec);
      return t;
    }

    function Type(name, mods = {}) {
      if ( ! new.target ) throw new TypeError(`Type with new only.`);
      Object.defineProperty(this,'name', {get: () => name});
      this.typeName = name;

      if ( mods.types ) {
        const {types} = mods;
        const typeSet = new Set(types);
        Object.defineProperty(this,'isSumType', {get: () => true});
        Object.defineProperty(this,'types', {get: () => typeSet});
      }

      if ( mods.native ) {
        const {native} = mods;
        Object.defineProperty(this,'native', {get: () => native});
      }
    }

    Type.prototype.toString = function () {
      return `${this.typeName} Type`;
    };

    function def(name, spec, {help:help = '', verify:verify = undefined, sealed:sealed = undefined, types:types = undefined, verifiers:verifiers = undefined, native:native = undefined} = {}) {
      if ( !name ) throw new TypeError(`Type must be named.`); 
      guardRedefinition(name);

      if ( name.startsWith('?') ) {
        if ( spec ) {
          throw new TypeError(`Option type can not have a spec.`);
        } 

        if ( ! verify(null) ) {
          throw new TypeError(`Option type must be OK to be unset.`);
        }
      }

      const kind = 'def';
      if ( sealed === undefined ) {
        sealed = true;
      }
      const t = new Type(name, {types, native});
      const cache = {spec,kind,help,verify,verifiers,sealed,types,native,type:t};
      typeCache.set(name, cache);
      return t;
    }

    function defOr(name, ...types) {
      return T.def(name, null, {types, verify: i => types.some(t => check(t,i))});
    }

    function guard(type, instance) {
      guardType(type);
      guardExists(type);
      const {valid, errors} = validate(type, instance);
      if ( ! valid ) throw new TypeError(`Type ${type} requested, but item is not of that type: ${errors.join(', ')}`);
    }

    function guardType(t) {
      //console.log(t);
      if ( !(t instanceof Type) ) throw new TypeError(`Type must be a valid Type object.`);
    }

    function guardExists(t) {
      const name = originalName(t);
      if ( ! exists(name) ) throw new TypeError(`Type must exist. Type ${name} has not been defined.`);
    }

    function errors(...args) {
      return validate(...args).errors;
    }

    function mapBuiltins() {
      BuiltIns.forEach(t => def(originalName(t), null, {native: t, verify: i => originalName(i.constructor) === originalName(t)}));  
      BuiltIns.forEach(t => defSub(T`${originalName(t)}`));  
    }

    function defineSpecials() {
      T.def(`Any`, null, {verify: () => true});
      T.def(`Some`, null, {verify: i => !isUnset$1(i)});
      T.def(`None`, null, {verify: i => isUnset$1(i)});
      T.def(`Function`, null, {verify: i => i instanceof Function});
      T.def(`Integer`, null, {verify: i => Number.isInteger(i)});
      T.def(`Array`, null, {verify: i => Array.isArray(i)});
      T.def(`Iterable`, null, {verify: i => i[Symbol.iterator] instanceof Function});
    }

    function isUnset$1(i) {
      return i === null || i === undefined;
    }

    function originalName(t) {
      if (!!t && t.name) {
        return t.name;
      } 
      const oName = Object.prototype.toString.call(t).replace(/\[object |\]/g, '');
      if ( oName.endsWith('Constructor') ) {
        return oName.replace(/Constructor$/,'');
      }
      return oName;
    }

  // types

    // Both SSR and Browser

      T.defOr('KeyValue', T`String`, T`Number`);

      T.def('Key', {
        key: T`KeyValue`,
        kill: T.defOption(T`Boolean`)
      });

      const THandlers = T.def('Handlers', null, {verify: i => {
        const validObject = T.check(T`Object`, i);

        if ( ! validObject ) return false;

        const eventNames = Object.keys(i);
        const handlerFuncs = Object.values(i);
        const validNames = eventNames.every(name => T.check(T`String`, name));
        const validFuncs = handlerFuncs.every(func => T.check(T`Function`, func));
        const valid = validNames && validFuncs;

        return valid;
      }});

      T.defCollection('FuncArray', {
        container: T`Array`,
        member: T`Function`
      });

      T.def('EmptyArray', null, {verify: i => Array.isArray(i) && i.length == 0});

      T.def('MarkupObject', {
        type: T`String`,
        code: T`String`,
        nodes: T`Array`,
        externals: T`Array`,
      }, {verify: v => v.type == 'MarkupObject' && v.code == CODE});

      T.def('MarkupAttrObject', {
        type: T`String`,
        code: T`String`,
        str: T`String`
      }, {verify: v => v.type == 'MarkupAttrObject' && v.code == CODE});

    // Browser side

      T.def('VanillaViewLikeObject', {
        instance: T.maybe(T`Key`),
        cacheKey: T.maybe(T`String`),
        code: T`String`,
        externals: T`Array`,
        nodes: T`Array`,
        to: T`Function`,
        update: T`Function`,
        v: T`Array`,
        oldVals: T`Array`
      });

      T.def('VanillaViewObject', {
        instance: T.maybe(T`Key`),
        cacheKey: T.maybe(T`String`),
        code: T`String`,
        externals: T`Array`,
        nodes: T`Array`,
        to: T`Function`,
        update: T`Function`,
        v: T`Array`,
        oldVals: T`Array`
      }, {verify: v => verify(v)});

      T.def('BangObject', null, {
        verify: v => v[Symbol.for('BANG-VV')]
      });

      T.defOr('Component', T`VanillaViewObject`, T`BangObject`);

      T.defCollection('VanillaViewArray', {
        container: T`Array`,
        member: T`Component`,
      });

    // SSR

      T.def('SVanillaViewObject', {
        str: T`String`,
        handlers: THandlers
      });

      T.defCollection('SVanillaViewArray', {
        container: T`Array`,
        member: T`SVanillaViewObject`
      });


    // verify function 
      function verify(v) {
        return CODE === v.code;
      }

  // vanillaview.js

    // backwards compatible alias
      const skip = markup;
      const attrskip = attrmarkup;
      const NULLFUNC          = () => void 0;
      /* eslint-disable no-useless-escape */
      const KEYMATCH          = /(?:<!\-\-)?(key\d+)(?:\-\->)?/gm;
      /* eslint-enable no-useless-escape */
      const ATTRMATCH         = /\w+=/;
      const KEYLEN            = 20;
      const XSS               = () => `Possible XSS / object forgery attack detected. ` +
                                `Object code could not be verified.`;
      const OBJ               = () => `Object values not allowed here.`;
      const KEY               = v => `'key' property must be a string. Was: ${v.key}`;
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
        innerhtml   (frag,elem) { elem.innerHTML = ''; elem.appendChild(frag); }
        insert      (frag,node) { node.replaceChildren(frag); }
      };
      const REMOVE_MAP = new Map();

    // logging
      globalThis.onerror = (...v) => (console.log(v, v[0]+'', v[4] && v[4].message, v[4] && v[4].stack), true);

    // type functions
      const isKey             = v => T.check(T`Key`, v); 
      const isHandlers        = v => T.check(T`Handlers`, v);

    // cache 
      const cache = {};
      // deux

    // main exports 
      Object.assign(s,{say,attrskip,skip,attrmarkup,markup,guardEmptyHandlers,die});

      Object.assign(globalThis, {vanillaview: {c, s, T}}); 

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
          say('log','System VV_FUNC call: ' + v.join(', '));
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
          console.log('async laterFunc', laterFunc);
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
          cacheKey = p.join('<link rel=join>');
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
        let str = '';

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
          nodes:[...frag.childNodes]
        });

        if ( useCache ) {
          if ( instance.key !== undefined ) {
            cache[cacheKey].instances[instance.key] = retVal;
          } else {
            cache[cacheKey] = retVal;
          }
          retVal.nodes.forEach(node => {
            REMOVE_MAP.set(node, JSON.stringify({cacheKey, instanceKey: instance.key+''}));
          });
        }

        return retVal;
      }

    // bang integration functions (modified from bang versions)
      async function process(that, x, state) {
        if ( typeof x === 'string' ) return x;
        else 

        if ( typeof x === 'number' ) return x+'';
        else

        if ( typeof x === 'boolean' ) return x+'';
        else

        if ( x instanceof Date ) return x+'';
        else

        if ( isUnset(x) ) {
          if ( that.CONFIG.allowUnset ) return that.CONFIG.unsetPlaceholder || '';
          else {
            throw new TypeError(`Value cannot be unset, was: ${x}`);
          }
        }
        else

        if ( x instanceof Promise ) return await process(that, await x.catch(err => err+''), state);
        else

        if ( x instanceof Element ) return x.outerHTML;
        else

        if ( x instanceof Node ) return x.textContent;

        const isVVArray   = T.check(T`VanillaViewArray`, x);

        if ( isIterable(x) && ! isVVArray ) {
          // if an Array or iterable is given then
          // its values are recursively processed via this same function
          return process(that, (await Promise.all(
            (
              await Promise.all(Array.from(x)).catch(e => err+'')
            ).map(v => process(that, v, state))
          )), state);
        }


        const isVVK = isKey(x);
        const isMO    = T.check(T`MarkupObject`, x);
        const isMAO = T.check(T`MarkupAttrObject`, x);
        const isVV      = T.check(T`Component`, x);
        if ( isVVArray || isVVK || isMO || isMAO || isVV ) {
          console.log('vv', x, {isVVArray, isVVK, isMO, isMAO, isVV});
          return isVVArray ? join(x) : x; // let vanillaview guardAndTransformVal handle
        }

        else 

        if ( Object.getPrototypeOf(x).constructor.name === 'AsyncFunction' ) {
          console.log('asyncfunc', x);
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
            stateKey = new that.StateKey(x[that.CONFIG.bangKey])+'';
            // in that case, replace the previously saved object with the same logical identity
            const oldX = that.STATE.get(stateKey);
            that.STATE.delete(oldX);

            that.STATE.set(stateKey, x);
            that.STATE.set(x, stateKey);
          } 

          else  /* or the system can come up with a state key */

          {
            if ( that.STATE.has(x) ) {
              stateKey = that.STATE.get(x);
              const lastXJSON = that.STATE.get(stateKey+'.json.last');
              if ( JSON.stringify(x) !== lastXJSON ) {
                that.STATE.delete(lastXJSON); 
                if ( stateKey.startsWith('system-key') ) {
                  that.STATE.delete(stateKey);
                  stateKey = new that.StateKey()+'';
                }
                that.STATE.set(stateKey, x);
                that.STATE.set(x, stateKey);
              }
            } else {
              stateKey = new that.StateKey()+'';
              that.STATE.set(stateKey, x);
              that.STATE.set(x, stateKey);
            }
            that.STATE.set(JSON.stringify(x), stateKey+'.json.last');
            that.STATE.set(stateKey+'.json.last', JSON.stringify(x));
          }

          stateKey += '';
          say('log');
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
          console.log({location,options,e,elem,isNode});
          console.warn(e);
          switch(e.constructor && e.constructor.name) {
            case "DOMException":      die({error: INSERT()},e);             break;
            case "TypeError":         die({error: NOTFOUND(location)},e);   break; 
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
              case "markupobject": 
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
                console.log('\n');
                Array.from(newVal.nodes).forEach(node => {
                  const inserted = document.contains(node.ownerDocument);
                  if ( ! inserted ) {
                    console.dirxml('not yet inserted', node);
                    insertable.push(node);
                  } else {
                    console.dirxml('already inserted', node, `${insertable.length} to insert before`);
                    while( insertable.length ) {
                      const insertee = insertable.shift();
                      node.parentNode.insertBefore(insertee, node);
                    }
                  }
                });
                console.log('\n');
                while ( insertable.length ) {
                  const insertee = insertable.shift();
                  console.log({insertee, lastAnchor, oldNodes});
                  lastAnchor.parentNode.insertBefore(insertee,lastAnchor);
                }
                console.log('Inserts done');
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
              if ( n.nodeType === Node.COMMENT_NODE && n.textContent.match(/key\d+/) ) return;
              const kill = REMOVE_MAP.get(n);
              killSet.add(kill);
            });
            killSet.forEach(kill => {
              const {cacheKey, instanceKey} = JSON.parse(kill);
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

          if ( node.linkedCustomElement && newValue.match(/state[\s\S]*=/gm) ) {
            console.log('Updating linked customElement', node, newVal, node.linkedCustomElement);
            node.linkedCustomElement.setAttribute('state', newVal);
          }

          state.oldVal = newVal;
        }

      // element attribute functions
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
            const attr = node.hasAttribute(oldName) ? oldName : '';
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
              case "markupobject":     
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
        if ( !! node.attributes && Number.isInteger(node.attributes.length) ) return Array.from(node.attributes);
        const attrs = [];
        for ( const name of node ) {
          if ( node.hasAttribute(name) ) {
            attrs.push({name, value:node.getAttribute(name)});
          }
        }
        return attrs;
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
          reliablySetAttribute(node, name, '');
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
        if ( !!oldVal && T.check(T`Handlers`, oldVal) ) {
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
        let {oldVal,node,index,name,val,lengths} = scope;
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
        let attr = node.getAttribute(name);

        const lengthBefore = lengths.slice(0,valIndex).reduce((sum,x) => sum + x, 0);

        const correction = lengthBefore-originalLengthBefore;
        const before = attr.slice(0,index+correction);
        const after = attr.slice(index+correction+oldVal.length);

        let newAttrValue;
        
        if ( name == "class" ) {
          const spacer = oldVal.length == 0 ? ' ' : '';
          newAttrValue = before + spacer + newVal + spacer + after;
        } else {
          newAttrValue = before + newVal + after;
        }

        if ( name === 'style' ) {
          console.log('style attribute', {newAttrValue, before, newVal, after});
        }

        console.log(JSON.stringify({
          newVal,
          valIndex,
          lengths,
          attr,
          lengthBefore,
          originalLengthBefore,
          correction,
          before,
          after,
          newAttrValue
        }, null, 2));

        reliablySetAttribute(node, name, newAttrValue);

        scope.oldVal = newVal;
      }

      function reliablySetAttribute(node, name, value ) {
        if (  name == "class" ) {
          value = formatClassListValue(value);
        }

        try {
          node.setAttribute(name,isUnset(value) ? name : value);
        } catch(e) {
          console.warn(e);
        }

        // if you set style like this is fucks it up
        if ( name !== 'style' ) {
          try {
            node[name] = isUnset(value) ? true : value;
          } catch(e) {
            console.warn(e);
          }
        }
      }

      function getType(val) {
        const type = T.check(T`Function`, val) ? 'function' :
          T.check(T`Handlers`, val) ? 'handlers' : 
          T.check(T`VanillaViewObject`, val) ? 'vanillaviewobject' : 
          T.check(T`MarkupObject`, val) ? 'markupobject' :
          T.check(T`MarkupAttrObject`, val) ? 'markupattrobject' :
          T.check(T`VanillaViewArray`, val) ? 'vanillaviewarray' : 
          T.check(T`FuncArray`, val) ? 'funcarray' : 
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
          str = T.check(T`None`, str) ? '' : str; 
          const frag = toDOM(str);
          const retVal = {
            type: 'MarkupObject',
            code:CODE,
            nodes:[...frag.childNodes],
            externals: []
          };
          return retVal;
        }

        // Returns an object that VanillaView treats, again, as markup
        // But this time markup that is OKAY to have within a quoted attribute
        function attrmarkup(str) {
          str = T.check(T`None`, str) ? '' : str; 
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
            if ( T.check(T`None`, val) ) {
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
            if ( T.check(T`Key`, val) ) {
              return '';
            }
            const key = ('key'+Math.random()).replace('.','').padEnd(KEYLEN,'0').slice(0,KEYLEN);
            let k = key;
            if ( T.check(T`VanillaViewObject`, val) || T.check(T`MarkupObject`, val) ) {
              k = `<!--${k}-->`;
            }
            vmap[key.trim()] = {vi,val,replacers:[]};
            return k;
          };
        }

        function toDOM(str) {
          const templateEl = (new DOMParser).parseFromString(
            `<template>${str}</template>`,"text/html"
          ).head.firstElementChild;
          let f;
          if ( templateEl instanceof HTMLTemplateElement ) { 
            f = templateEl.content;
            f.normalize();
            return f;
          } else {
            throw new TypeError(`Could not find template element after parsing string to DOM:\n=START=\n${str}\n=END=`);
          }
        }

        function guardAndTransformVal(v) {
          const isFunc          = T.check(T`Function`, v);
          const isUnset         = T.check(T`None`, v);
          const isObject        = T.check(T`Object`, v);
          const isVanillaViewArray   = T.check(T`VanillaViewArray`, v);
          const isFuncArray     = T.check(T`FuncArray`, v);
          const isMarkupObject    = T.check(T`MarkupObject`, v);
          const isMarkupAttrObject= T.check(T`MarkupAttrObject`, v);
          const isVanillaView        = T.check(T`VanillaViewObject`, v);
          const isForgery       = T.check(T`VanillaViewLikeObject`, v)  && !isVanillaView; 

          if ( isFunc )             return v;
          if ( isVanillaView )           return v;
          if ( isKey(v) )           return v;
          if ( isHandlers(v) )      return v;
          if ( isVanillaViewArray )      return join(v); 
          if ( isFuncArray )        return v;
          if ( isMarkupObject )     return v;
          if ( isMarkupAttrObject)  return v;

          if ( isUnset )            die({error: UNSET()});
          if ( isForgery )          die({error: XSS()});

          if ( isObject )       {
            if ( Object.keys(v).join(',') === "key" ) {
              die({error: KEY(v)});    
            } else die({error: OBJ()});
          }

          return v+'';
        }

        function join(os) {
          const externals = [];
          const bigNodes = [];
          const v = [];
          const oldVals = [];
          os.forEach(o => {
            //v.push(...o.v); 
            //oldVals.push(...o.oldVals);
            externals.push(...o.externals);
            bigNodes.push(...o.nodes);
          });
          console.log({oldVals,v});
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
          console.log({updateable, oldVals:this.oldVals, newVals});
          updateable.forEach(({vi,replacers}) => replacers.forEach(f => f(newVals[vi])));
          this.oldVals = Array.from(newVals);
        }

        function didChange(oldVal, newVal) {
          console.log({oldVal,newVal});
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
              case "markupobject":
                // need to check multiple things
                ret = true;
                break;
              default:
                ret = JSON.stringify(oldVal) !== JSON.stringify(newVal);
                break;
              /* eslint-enable no-fallthrough */
            }
          }

          console.log({ret});
          return ret;
        }

    // reporting and error helpers 
      function die(msg,err) {
        if (err) console.warn(err);
        msg.stack = ((err) || new Error()).stack.split(/\s*\n\s*/g);
        throw JSON.stringify(msg,null,2);
      }

      function say(msg) {
        {
          console.log(JSON.stringify(msg,showNodes,2));
          console.info('.');
        }
      }

      function showNodes(k,v) {
        let out = v;
        if ( T.check(T`>Node`, v) ) {
          out = `<${v.nodeName.toLowerCase()} ${
          !v.attributes ? '' : [...v.attributes].map(({name,value}) => `${name}='${value}'`).join(' ')}>${
          v.nodeValue || (v.children && v.children.length <= 1 ? v.innerText : '')}`;
        } else if ( typeof v === "function" ) {
          return `${v.name || 'anon'}() { ... }`
        }
        return out;
      }

  exports.c = c;
  exports.s = s;

  Object.defineProperty(exports, '__esModule', { value: true });

}));
{
  // constants, classes, config and state
    const DEBUG = true;
    const OPTIMIZE = true;
    const GET_ONLY = true;
    const LEGACY = false;
    const MOBILE = isMobile();
    const DOUBLE_BARREL = /\w+-\w*/; // note that this matches triple- and higher barrels, too
    const F = _FUNC; 
    const FUNC_CALL = /\);?$/;
    const path = location.pathname;
    const CONFIG = {
      htmlFile: 'markup.html',
      scriptFile: 'script.js',
      styleFile: 'style.css',
      bangKey: '_bang_key',
      componentsPath: `${path}${path.endsWith('/') ? '' : '/'}components`,
      allowUnset: false,
      unsetPlaceholder: '',
      EVENTS: `error load click pointerdown pointerup pointermove mousedown mouseup 
        mousemove touchstart touchend touchmove touchcancel dblclick dragstart dragend 
        dragmove drag mouseover mouseout focus blur focusin focusout scroll
        input change compositionstart compositionend text paste beforepast select cut copy
        contextmenu
      `.split(/\s+/g).filter(s => s.length).map(e => `on${e}`),
      delayFirstPaintUntilLoaded: true,
      noHandlerPassthrough: false
    };
    const History = [];
    const STATE = new Map();
    const CACHE = new Map();
    const Started = new Set();
    const TRANSFORMING = new WeakSet();
    const Dependents = new Map();
    const Counts = {
      started: 0,
      finished: 0
    };
    const OBSERVE_OPTS = {subtree: true, childList: true, characterData: true};
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

      constructor({task: task = () => void 0} = {}) {
        super();
        DEBUG && say('log',name, 'constructed');
        this.print().then(task);
      }

      get name() {
        return this.#name;
      }

      // BANG! API methods
      async print() {
        Counts.started++;
        if ( !this.alreadyPrinted ) {
          this.prepareVisibility();
        }
        const state = this.handleAttrs(this.attributes);
        if ( OPTIMIZE ) {
          const nextState = JSON.stringify(state);
          if ( this.alreadyPrinted && this.lastState === nextState ) {
            DEBUG && console.log(this, 'state no change, returning');
            return;
          }
          this.lastState = nextState;
        }
        return this.printShadow(state).then(() => this.alreadyPrinted = true);
      }

      connectedCallback() {
        say('log',name, 'connected');
        // attributes must be assigned on connection so we can search for
        // references to parents
        this.handleAttrs(this.attributes, {originals: true});
      }

      prepareVisibility() {
        this.classList.add('bang-el');
        this.classList.remove('bang-styled');
        // this is like an onerror event for stylesheet's 
          // we do this because we want to display elements if they have no stylesheet defined
          // becuase it's reasonabgle to want to not include a stylesheet with your custom element
        fetchStyle(name).catch(err => this.setVisible());
      }

      setVisible() {
        this.classList.add('bang-styled');
      }

      // Web Components methods
      attributeChangedCallback(name, oldValue, value) {
        // setting the state attribute casues the custom element to re-render
        if ( name === 'state' && !isUnset(oldValue) ) {
          if ( STATE.get(oldValue+'.json.last') !== JSON.stringify(STATE.get(value)) ) {
            DEBUG && say('log',`Changing state, so calling print.`, oldValue, value, this);
            this.print();
          }
        }
      }

      // private methods
      handleAttrs(attrs, {node, originals} = {}) {
        let state = {};

        if ( ! node ) node = this;

        for( let {name,value} of attrs ) {
          if ( isUnset(value) ) continue;
          if ( name === 'state' ) {
            const stateKey = value; 
            const stateObject = cloneState(stateKey);
            
            if ( isUnset(stateObject) ) {
              throw new TypeError(`
                <${name}> constructor passed state key ${stateKey} which is unset. It must be set.
              `);
            }
            
            state = stateObject;
            
            if ( originals ) {
              let acquirers = Dependents.get(stateKey);
              if ( ! acquirers ) {
                acquirers = new Set();
                Dependents.set(stateKey, acquirers);
              }
              acquirers.add(node);
              DEBUG && console.log({acquirers, Dependents});
            }
          } else if ( originals ) { // set event handlers to custom element class instance methods
            if ( ! name.startsWith('on') ) continue;
            value = value.trim();
            if ( ! value ) continue;

            const Local = () => node[value];
            const Parent = () => node.getRootNode().host[value];
            const path = Local() ? 'this.' 
              : Parent() ? 'this.getRootNode().host.' 
              : null;
            if ( ! path ) continue;

            if ( value.startsWith(path) ) continue;
            // Conditional logic explained:
              // don't add a function call bracket if
              // 1. it already has one
              // 2. the reference is not a function
            const ender = ( 
              value.match(FUNC_CALL) || 
              !(typeof Local() === "function" || typeof Parent() === "function")
            ) ? '' : '(event)';
            node.setAttribute(name, `${path}${value}${ender}`);
          }
        }

        return state;
      }

      printShadow(state) {
        return fetchMarkup(this.#name, this).then(async markup => {
          const cooked = await cook.call(this, markup, state);
          DEBUG && console.log(cooked);
          if ( LEGACY ) {
            const nodes = toDOM(cooked);
            // attributes on each node in the shadom DOM that has an even handler or state
            const listening = nodes.querySelectorAll(CONFIG.EVENTS.map(e => `[${e}]`).join(', '));
            listening.forEach(node => this.handleAttrs(node.attributes, {node, originals: true}));
            DEBUG && say('log',nodes, cooked, state);
            if ( this.shadowRoot ) {
              this.shadowRoot.replaceChildren(nodes);
            } else {
              const shadow = this.attachShadow({mode:'open'});
              console.log({observer});
              observer.observe(shadow, OBSERVE_OPTS);
              shadow.replaceChildren(nodes);
            }
          } else {
            if ( this.shadowRoot ) {
              //this.shadowRoot.replaceChildren(nodes);
            } else {
              const shadow = this.attachShadow({mode:'open'});
              //console.log({observer});
              observer.observe(shadow, OBSERVE_OPTS);
              cooked.to(shadow, 'insert');
              const listening = shadow.querySelectorAll(CONFIG.EVENTS.map(e => `[${e}]`).join(', '));
              listening.forEach(node => this.handleAttrs(node.attributes, {node, originals: true}));
            }
          }
        })
        .catch(err => DEBUG && say('warn',err))
        .finally(() => Counts.finished++);
      }
    };

    class StateKey extends String {
      constructor (keyNumber) {
        if ( keyNumber == undefined ) super(`system-key:${systemKeys++}`); 
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
            DEBUG && say('warn',e, Compose, component)
          }
        }).catch(() => {  // otherwise if there is no such extension script, just use the Base class
          component = BangBase(name);
        });
      
      self.customElements.define(name, component);
      DEBUG && self.customElements.whenDefined(name).then(obj => say('log',name, 'defined', obj));
    }

    function undoState(key, transform = x => x) {
      while( hindex > 0 ) {
        hindex -= 1;
        if ( History[hindex].name === key ) {
          setState(key, transform(History[hindex].value));
          DEBUG && console.log('Undo state to', History[hindex], hindex, History);
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
          DEBUG && console.log('Redo state to', History[hindex], hindex, History);
          return true;
        }
      }
      return false;
    }

    function bangfig(newConfig = {}) {
      Object.assign(CONFIG, newConfig);
    }

    function setState(key, state, {
      rerender: rerender = true, 
      save: save = false
    } = {}) {
      if ( GET_ONLY ) {
        if ( !STATE.has(key) ) {
          STATE.set(key, state);
          STATE.set(state, key);
          DEBUG && console.log('Setting stringified state', state, key);
          STATE.set(JSON.stringify(state), key+'.json.last');
          STATE.set(key+'.json.last',JSON.stringify(state));
        } else {
          DEBUG && console.log('Updating state', key);
          const oState = STATE.get(key);
          const oStateJSON = STATE.get(key+'.json.last');
          if ( JSON.stringify(state) !== oStateJSON ) {
            DEBUG && console.log('State really changed. Will update', key);
            Object.assign(oState, state);
            STATE.delete(oStateJSON);
            if ( key.startsWith('system-key:') ) {
              STATE.delete(key);
              STATE.delete(key+'.json.last');
              key = new StateKey();
              STATE.set(key, oState);
              STATE.set(oState, key);
            }
            const stateJSONLast = JSON.stringify(oState);
            STATE.set(key+'.json.last', stateJSONLast);
            STATE.set(stateJSONLast, key+'.json.last');
          }
        }
      } else {
        STATE.set(key, state);
        STATE.set(state, key);
        STATE.set(JSON.stringify(state), key+'.json.last');
        STATE.set(key+'.json.last',JSON.stringify(state));
      }

      if ( save ) {
        hindex = Math.min(hindex+1, History.length);
        History.splice(hindex, 0, {name: key, value: clone(state)});
        DEBUG && console.log('set state history add', hindex, History.length-1, History);
      }

      if ( rerender ) { // re-render only those components depending on that key
        const acquirers = Dependents.get(key);
        DEBUG && console.log({acquirers, Dependents});
        if ( acquirers ) acquirers.forEach(host => host.print());
      }
    }

    function patchState(key, state) {
      return setState(key, state, {rerender: false});
    }

    function cloneState(key, getOnly = GET_ONLY) {
      if ( getOnly ) return STATE.get(key);
      if ( STATE.has(key) ) return clone(STATE.get(key));
      else {
        throw new TypeError(`State store does not have the key ${key}`);
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

    async function bangLoaded() {
      const loadCheck = () => {
        const c_defined = typeof _c$ === "function";
        return c_defined;
      };
      return becomesTrue(loadCheck);
    }

  // helpers
    async function install() {
      Object.assign(globalThis, {
        use, setState, patchState, cloneState, loaded, 
        sleep, bangfig, bangLoaded, isMobile, trace,
        undoState, redoState,
        dateString,
        ...( DEBUG ? { STATE, CACHE, TRANSFORMING, Started, BangBase } : {})
      });

      const module = globalThis.vanillaview || (await import('./vv/vanillaview.js'));
      const {s} = module;
      const That = {STATE,CONFIG,StateKey}; 
      _c$ = s.bind(That);
      That._c$ = _c$;

      if ( CONFIG.delayFirstPaintUntilLoaded ) {
        becomesTrue(() => document.body).then(() => document.body.classList.add('bang-el'));
      }

      observer = new MutationObserver(transformBangs);
      /* we are interested in bang nodes (which start as comments) */
      observer.observe(document, OBSERVE_OPTS);
      findBangs(transformBang); 
      
      loaded().then(() => document.body.classList.add('bang-styled'));
    }

    async function fetchMarkup(name, comp) {
      // cache first
        // we make any subsequent calls for name wait for the first call to complete
        // otherwise we create many in parallel without benefitting from caching

      const key = `markup:${name}`;

      if ( Started.has(key) ) {
        if ( ! CACHE.has(key) ) await becomesTrue(() => CACHE.has(key));
      } else Started.add(key);

      const styleKey = `style${name}`;
      const baseUrl = `${CONFIG.componentsPath}/${name}`;
      if ( CACHE.has(key) ) {
        const markup = CACHE.get(key);
        if ( CACHE.get(styleKey) instanceof Error ) comp.setVisible();
        
        // if there is an error style and we are still includig that link
        // we generate and cache the markup again to omit such a link element
        if ( CACHE.get(styleKey) instanceof Error && markup.includes(`href=${baseUrl}/${CONFIG.styleFile}`) ) {
          // then we need to set the cache for markup again and remove the link to the stylesheet which failed 
        } else {
          comp.setVisible();
          return markup;
        }
      }
      
      const markupUrl = `${baseUrl}/${CONFIG.htmlFile}`;
      let resp;
      const markupText = await fetch(markupUrl).then(async r => { 
        let text = '';
        if ( r.ok ) text = await r.text();
        else text = `<slot></slot>`;        // if no markup is given we just insert all content within the custom element
      
        if ( CACHE.get(styleKey) instanceof Error ) { 
          resp = `<style>
            @import url('${CONFIG.componentsPath}/style.css');
          </style>${text}` 
          comp.setVisible();
        } else {
          // inlining styles for increase speed */
            // we setVisible (add bang-styled) straight away because the inline styles block the markup
            // so no FOUC while stylesheet link is loading, like previously: resp = `
            // <link rel=stylesheet href=${baseUrl}/${CONFIG.styleFile} onload=setVisible>${text}`;
          resp = `<style>
            @import url('${CONFIG.componentsPath}/style.css');
            ${await fetchStyle(name).then(e => {
              if ( e instanceof Error ) return `/* no ${name}/style.css defined */`;
              return e;
            })}
          </style>${text}`;
          comp.setVisible();
        }
        
        return resp;
      }).finally(async () => CACHE.set(key, await resp));
      return markupText;
    }

    async function fetchFile(name, file) {
      const key = `${file}:${name}`;

      if ( Started.has(key) ) {
        if ( ! CACHE.has(key) ) await becomesTrue(() => CACHE.has(key));
      } else Started.add(key);

      if ( CACHE.has(key) ) return CACHE.get(key);

      const url = `${CONFIG.componentsPath}/${name}/${file}`;
      let resp;
      const fileText = await fetch(url).then(r => { 
        if ( r.ok ) {
          resp = r.text();
          return resp;
        } 
        resp = new TypeError(`Fetch error: ${url}, ${r.statusText}`);
        throw resp;
      }).finally(async () => CACHE.set(key, await resp));
      
      return fileText;
    }

    async function fetchStyle(name) {
      return fetchFile(name, CONFIG.styleFile);
    }

    async function fetchScript(name) {
      return fetchFile(name, CONFIG.scriptFile);
    }

    // search and transform each added subtree
    function transformBangs(records) {
      records.forEach(record => {
        DEBUG && say('log',record);
        const {addedNodes} = record;
        if ( !addedNodes ) return;
        addedNodes.forEach(node => findBangs(transformBang, node));
      });
    }

    function transformBang(current) {
      DEBUG && say('log',{transformBang},{current});
      const [name, data] = getBangDetails(current);
      DEBUG && say('log',{name, data});

      // replace the bang node (comment) with its actual custom element node
      const actualElement = createElement(name, data);
      current.linkedCustomElement = actualElement;
      current.parentNode.replaceChild(actualElement, current);
    }

    function findBangs(callback, root = document.documentElement) {
      const Acceptor = {
        acceptNode(node) {
          if ( node.nodeType !== Node.COMMENT_NODE ) return NodeFilter.FILTER_SKIP;
          const [name] = getBangDetails(node); 
          if ( name.match(DOUBLE_BARREL) ) return NodeFilter.FILTER_ACCEPT;
          else return NodeFilter.FILTER_REJECT;
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

      while(replacements.length) replacements.pop()();
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

      if ( x instanceof Date ) return x+'';
      else

      if ( isUnset(x) ) {
        if ( CONFIG.allowUnset ) return CONFIG.unsetPlaceholder || '';
        else {
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
        // if an Array or iterable is given then
        // its values are recursively processed via this same function
        return (await Promise.all(
          (
            await Promise.all(Array.from(x)).catch(e => err+'')
          ).map(v => process(v, state))
        )).join(' ');
      }
      else

      if ( Object.getPrototypeOf(x).constructor.name === 'AsyncFunction' ) return await x(state);
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

        if ( Object.prototype.hasOwnProperty.call(x, CONFIG.bangKey) ) {
          stateKey = new StateKey(x[CONFIG.bangKey])+'';
          // in that case, replace the previously saved object with the same logical identity
          const oldX = STATE.get(stateKey);
          if ( JSON.stringify(oldX) !== JSON.stringify(x) ) {
            STATE.delete(oldX);

            STATE.set(stateKey, x);
            STATE.set(x, stateKey);
            STATE.set(JSON.stringify(x), stateKey+'.json.last');
            STATE.set(stateKey+'.json.last',JSON.stringify(x));
          }
        } 

        else  /* or the system can come up with a state key */

        {
          if ( STATE.has(JSON.stringify(x)) ) stateKey = STATE.get(JSON.stringify(x));
          else {
            stateKey = new StateKey()+'';
            STATE.set(stateKey, x);
            STATE.set(x, stateKey);
            STATE.set(JSON.stringify(x), stateKey+'.json.last');
            STATE.set(stateKey+'.json.last',JSON.stringify(x));
          }
        }

        stateKey += '';
        DEBUG && say('log',{stateKey});
        return stateKey;
      }
    }

    async function cook(markup, state) {
      const that = this;
      let cooked = '';
      try {
        if ( !Object.prototype.hasOwnProperty.call(state, '_self') ) {
          Object.defineProperty(state, '_self', {
            get: () => state
          });
        }
        DEBUG && say('log','_self', state._self);
      } catch(e) {
        DEBUG && say('warn',
          `Cannot add '_self' self-reference property to state. 
            This enables a component to inspect the top-level state object it is passed.`
        );
      }
      try {
        with(state) {
          cooked = await eval("(async function () { return await _FUNC`${{state}}"+markup+"`; }())");  
        }
        DEBUG && console.log({cooked});
        return cooked;
      } catch(error) {
        say('error', 'Template error', {markup, state, error});
        throw error;
      }
    }

    async function _FUNC(strings, ...vals) {
      const s = Array.from(strings);
      //console.log(strings, vals);
      const ret =  await _c$(s, ...vals);
      return ret;
    }

    async function old_FUNC(strings, ...vals) {
      const s = Array.from(strings);
      let SystemCall = false;
      let state;
      let str = '';

      DEBUG && say('log',s.join('${}'));

      if ( s[0].length === 0 && vals[0].state ) {
        // by convention (see how we construct the template that we tag with FUNC)
        // the first value is the state object when our system calls it
        SystemCall = true;
      }

      // resolve all the values now if it's a SystemCall of _FUNC
      if ( SystemCall ) {
        const {state} = vals.shift();
        s.shift();
        vals = await Promise.all(vals.map(v => process(v, state)));
        DEBUG && say('log','System _FUNC call: ' + vals.join(', '));

        while(s.length) {
          str += s.shift();
          if ( vals.length ) {
            str += vals.shift();
          }
        }
        return str;
      } 

      else 

      // otherwise resolve them when we have access to the top-level state
        // this is effectively just a little bit of magic that lets us "overload"
        // the method signature of F

      return async state => {
        vals = await Promise.all(vals.map(v => process(v, state)));
        DEBUG && say('log','in-template _FUNC call:' + vals.join(', '));

        while(s.length) {
          str += s.shift();
          if ( vals.length ) str += vals.shift();
        }

        return str;
      };
    }

    function createElement(name, data) {
      const df = document.createDocumentFragment();
      const container = document.createElement('div');
      df.appendChild(container);
      container.insertAdjacentHTML(`afterbegin`, `<${name} ${data}></${name}>`);
      return container.firstElementChild;
    }

    function toDOM(str) {
      const f = (new DOMParser).parseFromString(
          `<template>${str}</template>`,
          "text/html"
        ).head.firstElementChild.content;
      f.normalize();
      return f;
    }

    async function becomesTrue(check = () => true) {
      return new Promise(async res => {
        while(true) {
          await sleep(47);
          if ( check() ) break;
        }
        res();
      });
    }

    async function sleep(ms) {
      return new Promise(res => setTimeout(res, ms));
    }

    function isIterable(y) {
      if ( y === null ) return false;
      return y[Symbol.iterator] instanceof Function;
    }

    function isUnset(x) {
      return x === undefined || x === null;
    }

    function say(mode, ...stuff) {
      (DEBUG || mode === 'error' || mode.endsWith('!')) && MOBILE && alert(`${mode}: ${stuff.join('\n')}`);
      (DEBUG || mode === 'error' || mode.endsWith('!')) && console[mode.replace('!','')](...stuff);
    }

    function isMobile() {
			let check = false;
			(function(a){if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0,4))) check = true;})(navigator.userAgent||navigator.vendor||window.opera);
			return check;
    }
  
    function trace(msg = '') {
			const tracer = new Error('Trace');
			console.log(msg, 'Call stack', tracer.stack);
    }

    function dateString(date) {
			const offset = date.getTimezoneOffset()
			date = new Date(date.getTime() - (offset*60*1000))
			return date.toISOString().split('T')[0];
    }

    function clone(o) {
      return JSON.parse(JSON.stringify(o));
    }
}


