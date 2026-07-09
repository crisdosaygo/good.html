<p align=center>
  <img width=80% src=https://github.com/crisdosyago/good.html/raw/main/.github/BANG%21%20logo%20mediumseagreen-mincream.png>
  <img width=80% src=https://user-images.githubusercontent.com/22254235/135863650-a0a44bbd-414e-4606-aaf4-64e43f5abcc9.PNG>
</p>

# GOOD (BANG!)

![npm](https://img.shields.io/npm/v/bang.html?color=turquoise) ![npm](https://img.shields.io/npm/dt/bang.html)

**The web already has a component model, a template language, and a renderer. GOOD wires them together and gets out of the way.**

GOOD is a zero-dependency Web Components framework where a component is three plain files — `markup.html`, `style.css`, `script.js` — and an update is a surgical write to the exact text node or attribute that changed. No build step. No JSX. No VDOM. No transpiler. View source works. Copy-paste works. It's ~25 KB gzipped (~98 KB of unminified, readable source, in two files), and the `dependencies` field in package.json is empty.

Here is an entire interactive component:

```html
<!-- index.html -->
<!doctype html>
<script src=bang.js></script>
<script>
  bangFig({componentsPath: './components', useComponentBundle: false});
  use('my-counter');
  setState('ctr', {count: 0});
</script>
<!my-counter state=ctr />
```

```html
<!-- components/my-counter/markup.html -->
<button onclick=Increment>Count</button>
<output>${count}</output>
```

```js
// components/my-counter/script.js
class Counter extends Base {
  Increment() {
    const {state} = this;
    state.count++;
    this.state = state;
  }
}
```

Serve the folder, open the page, click the button. That's the whole loop — and it's not a demo mode, it's the framework. (Full steps in [Quick start](#quick-start).)

> [!NOTE]
> GOOD is the project name. The npm package is `bang.html`. The runtime API is `use`, `setState`, `bangFig`, and friends.

## Design

- **Self-closing Web Components.** `<!my-card />` is a *bang tag* — a valid HTML comment node that GOOD upgrades into a real Custom Element. HTML parses `<my-card />` as an *open* tag and silently swallows what follows; bang tags fix that at the syntax level, because comments are the one thing HTML always parses exactly as written.
- **Granular DOM updates, no VDOM.** Templates compile to live DOM once, with a keyed slot at every `${...}` and a dedicated updater closure per slot. A state change runs only the updaters whose values changed, and each writes only its own text span, attribute range, or list segment. No reconcile pass, because there's no tree copy to reconcile.
- **Async templating.** Put a `Promise` in a `${...}` slot and it renders when it resolves. `<p>${fetch('/motd').then(r => r.text())}</p>` is legal and idiomatic.
- **Components are files, not modules.** `markup.html` + `style.css` + `script.js`, each optional, fetched and wired automatically. Your component library is a folder you can read in an afternoon.
- **Shadow DOM for scoping, not dogma.** Styles are scoped per component the platform way; updates go directly to the nodes they own rather than diffing shadow trees.
- **Handlers resolve up the component tree.** `onclick=Increment` dereferences against the component class — or any ancestor host, walking up through shadow roots. Shared behavior without threading callbacks down as props.
- **Lazy by attribute.** `<!sg-cells lazy state=cells2 />` defers below-the-fold components; `super lazy` defers harder. Load priority lives in markup, not bundler config.

## How it works

1. **Bang tags** are comment nodes. A tree walk finds `<!name ... />` comments, registers a Custom Element for `name`, and links the comment to the element that replaces it.
2. **Cooking.** A component's `markup.html` is evaluated as a tagged template with its state in scope — that's why `${count}` works bare, with no `this.` or `props.` prefix.
3. **Compile once, update forever.** The template engine (vanillaview) builds DOM with a unique key at each interpolation, then hands back per-slot updaters. Re-renders call updaters for changed slots only; unchanged DOM is never touched.
4. **Handler names, not handler props.** Functions interpolated in component markup are lifted onto the host as generated methods; markup refers to handlers by name, and names resolve up the shadow-host chain at bind time.

## Where it's used

- **Built to build BrowserBox.** GOOD wasn't extracted from a product as an afterthought — it was created in 2018, in the months leading up to [BrowserBox](https://github.com/BrowserBox/BrowserBox) itself, as the foundation for a commercial remote browser. The entire BrowserBox front end — tabs, modals, omnibox, file dialogs, clipboard, streaming frame display — is GOOD components, shipped to paying customers for years.
- **[The complete 7GUIs benchmark](https://crisdosyago.github.io/good.html/7guis/)** — counter, temperature converter, flight booker, timer, CRUD, circle drawer with undo/redo, and a **live formula spreadsheet**. Every component is a few small files of plain HTML/CSS/JS: [`docs/components/`](docs/components/).
- **Provenance.** Designed and written independently by one person, starting in 2018, and published on npm under a few names since (the current package, `bang.html`, dates to 2021). The whole runtime is two human-readable source files; the framework can be audited in a sitting.

## Quick start

```sh
npm i bang.html
mkdir -p myapp/components/my-counter && cd myapp
cp ../node_modules/bang.html/src/bang.js .
cp -r ../node_modules/bang.html/src/vv .
```

Create the three files from the example at the top of this README (`index.html`, `components/my-counter/markup.html`, `components/my-counter/script.js`), then:

```sh
python3 -m http.server 8080   # or any static server
```

Open http://localhost:8080 — working component, no build step. (`bang.js` loads its update engine from a `vv/` folder beside your page, which is why it's copied rather than hotlinked — self-hosting your framework is the point anyway.)

## Component anatomy

```
components/
  my-counter/
    markup.html   — template; state properties in scope inside ${...}
    style.css     — scoped to the component via Shadow DOM
    script.js     — class extending Base; methods are your event handlers
```

All three files are optional. A component can be markup-only, style-only, or logic-only.

## State

State is stored by key and referenced by components with `state=`:

```js
setState('MyState', {
  name: 'Uncle Bob',
  greetCounts: {value: 1}
});
```

```html
<!warm-greeter state=MyState />
```

Inside `markup.html`, state properties are directly in scope:

```html
<h1>Hello ${name}</h1>
<p>We are very pleased to meet you <greet-count state=${greetCounts}>happy</greet-count> times</p>
```

Nested objects passed through `${...}` become component state automatically. Updates are symmetric: mutate, then `this.state = state` (or `setState(key, obj)`) — only dependent slots re-render.

## Tradeoffs

Chosen deliberately; know them before you adopt:

- **CSP: requires `'unsafe-eval'`.** Templates are cooked with state in scope via `eval`/`with`, and named handlers bind via `new Function`. That's what buys bare `${count}` with no compiler — but it means strict-CSP environments need an exception. If you can't grant one, this isn't your framework.
- **Shadow DOM is mandatory.** Style scoping assumes it. Global-stylesheet-first designs will fight it.
- **No SSR.** GOOD renders in the browser, by design. If you need server rendering or hydration, look elsewhere.
- **No TypeScript types (yet).** The source is plain JS; there are no shipped `.d.ts` files.
- **String-keyed global state store.** Simple and inspectable, but it's a shared namespace — large apps need naming discipline.
- **Ecosystem of one.** Designed, built, and maintained by one author, with fixes driven by real production use in BrowserBox. That cuts both ways: coherent vision, small bus factor.

## Comparison

| Framework | Primary abstraction | Component format | Build step | Shadow DOM | Rendering model |
| --- | --- | --- | --- | --- | --- |
| GOOD (BANG!) | Custom Elements + bang tags | `markup.html` + `style.css` + `script.js` | **None** | Yes (scoped styles) | Direct DOM updates (no VDOM) |
| React | Components | JSX | Yes | No | VDOM reconcile |
| Vue | Components | SFC or JSX | Usually | No | VDOM + compiler |
| Svelte | Components | SFC | Yes | No | Compile-time DOM updates |
| Lit | Custom Elements | JS template literals | Optional | Yes | Template render + update |
| Solid | Components | JSX | Yes | No | Fine-grained reactive DOM |

No benchmark theater — the claim is architectural: GOOD does the least work per update the DOM allows, with the least machinery between you and the page.

## FAQ

**How is this different from Lit?** Both build on Custom Elements, tagged templates, and Shadow DOM, and both can skip the build step. The differences are in what a component *is*: in GOOD it's static HTML/CSS/JS files fetched at runtime (not a JS class with decorators and template getters), state lives in a store and is lexically in scope inside templates (not reactive class properties), handlers are referenced by name and resolve up the host chain, and bang tags give you self-closing custom elements in plain HTML. Lit is excellent engineering; GOOD makes different bets — files over modules, HTML over JS, scope over props.

**Why bang tags instead of `<my-tag />`?** HTML parses self-closing non-void tags as *open* tags — you never get a true empty element, and everything after it gets silently reparented inside. Comment nodes parse exactly as written, so GOOD uses them as component tags and upgrades them. Correct by construction.

**How do I attach events?** Define a method on your component class and reference it by name in `onclick=` (or any standard DOM event). It resolves against the component — or any ancestor component up the shadow chain.

**What is required in a component?** Nothing. Any of `markup.html`, `style.css`, and `script.js` can be omitted.

**Do I need a bundler for production?** No. Serve the files. A single-file build script exists if you want one artifact, but it's an optimization, not a requirement.

## Docs and examples

- [INTRO.md](INTRO.md) — the full guided tour, from bang tags to slots
- [7GUIs live](https://crisdosyago.github.io/good.html/7guis/) · [source](docs/components/)
- [Cells spreadsheet (WIP)](https://crisdosyago.github.io/good.html/cellophane/)
- [Counter](https://crisdosyago.github.io/good.html/ctr/)

## Contributing

Issues and PRs are welcome. Keep patches focused and link a demo or reproduction where you can.

## License

MIT. Build things.
