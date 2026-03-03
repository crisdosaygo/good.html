<p align=center>
  <img width=80% src=https://github.com/crisdosyago/good.html/raw/main/.github/BANG%21%20logo%20mediumseagreen-mincream.png>
  <img width=80% src=https://user-images.githubusercontent.com/22254235/135863650-a0a44bbd-414e-4606-aaf4-64e43f5abcc9.PNG>
</p>

# GOOD (BANG!)

![npm](https://img.shields.io/npm/v/bang.html?color=turquoise) ![npm](https://img.shields.io/npm/dt/bang.html)

GOOD is a zero-dependency Web Components UI framework that favors real HTML, real CSS, and real DOM updates. It pairs custom elements with minimal granular DOM patching, async templating, and file-based components so you can build UI with no build step and no JSX.

> [!NOTE]
> GOOD is the project name. The published package is `bang.html` on npm, and the runtime global API is `use`, `setState`, and friends.

> [!IMPORTANT]
> Bang tags are valid HTML comment nodes that GOOD upgrades into Custom Elements. Example: `<!my-card />` becomes `<my-card></my-card>`.

> [!TIP]
> Use `lazy` and `super` on components to load heavy or below-the-fold UI without blocking page load. Example: `<sg-table super lazy state=cells2></sg-table>` from the 7GUIs demo.

## Why GOOD

- File-based components: `components/name/markup.html`, `style.css`, and `script.js` are optional and auto-wired.
- Granular DOM updates: no VDOM, no Shadow DOM diffing. Updates hit only the text, attributes, and list segments that changed.
- Custom element ergonomics: declarative `use('my-thing')` with scoped Shadow DOM styles and optional script hooks.
- Async templating: Promises and async functions can render inline with `${...}` and resolve automatically.
- Incremental load: `lazy` and `super` attributes prioritize critical UI first.

## Demos

- 7GUIs: https://crisdosyago.github.io/good.html/7guis/
- Cells spreadsheet (WIP): https://crisdosyago.github.io/good.html/cellophane/
- Simple counter: https://crisdosyago.github.io/good.html/ctr/

## Quick start

### CDN

```html
<!doctype html>
<script src=https://unpkg.com/bang.html></script>
<link rel=stylesheet href=https://unpkg.com/bang.html/src/style.css>
<script>
  use('sg-counter');
  setState('ctr', {count: 0});
</script>
<!sg-counter state=ctr />
```

### npm

```sh
npm i --save bang.html
```

## Component anatomy

Each component lives in `components/<name>/` and can define any of the files below.

```
components/
  sg-counter/
    markup.html
    style.css
    script.js
```

Example pulled from the 7GUIs components:

`docs/components/sg-counter/markup.html`
```html
<sg-frame state=${_self}>
  <button id=counter onclick=Increment>Count</button>
  <label for=counter>${count}</label>
</sg-frame>
```

`docs/components/sg-counter/script.js`
```js
class Counter extends Base {
  Increment() {
    const {state} = this;
    state.count++;
    this.state = state;
  }
}
```

`docs/components/sg-counter/style.css`
```css
label {
  min-width: 4.5ch;
  display: inline-block;
  text-align: right;
}
```

## State and templating

State is stored by key and referenced by components using `state=`.

```js
setState('MyState', {
  name: 'Uncle Bob',
  greetCounts: {value: 1}
});
```

```html
<!warm-greeter state=MyState />
```

Within `markup.html`, state properties are in scope for `${...}` slots:

```html
<h1>Hello ${name}</h1>
<p>We are very pleased to meet you <greet-count state=${greetCounts}>happy</greet-count> times</p>
```

Nested objects passed through `${...}` become component state automatically, just like a named state key.

## Granular updates (no VDOM)

GOOD uses the vanillaview update engine for direct DOM patching. Lists, text nodes, and attribute values are updated in place. This is real DOM work, not a VDOM reconcile, and the update engine does not rely on Shadow DOM diffing. Components still render into Shadow DOM for style scoping, but updates are granular and direct.

## Lazy and super lazy loading

Add `lazy` to avoid blocking parent render. Add `super` for even later scheduling.

```html
<!sg-cells lazy state=cells2 />
<sg-table super lazy state=cells2></sg-table>
```

## Docs and examples

- Docs landing page: `docs/index.html`
- 7GUIs app: `docs/7guis/index.html`
- 7GUIs components source: `docs/components/`

If you want a bigger real app, see `../BrowserBox-public/src/public/voodoo/src/`.

## Comparison (no benchmarks)

| Framework | Primary abstraction | Component format | Build step | Shadow DOM | Rendering model |
| --- | --- | --- | --- | --- | --- |
| GOOD (BANG!) | Custom Elements + bang tags | `markup.html` + `style.css` + `script.js` | Optional | Yes (scoped styles) | Direct DOM updates (no VDOM) |
| React | Components | JSX | Yes | No | VDOM reconcile |
| Vue | Components | SFC or JSX | Usually | No | VDOM + compiler |
| Svelte | Components | SFC | Yes | No | Compile-time DOM updates |
| Lit | Custom Elements | JS template literals | Optional | Yes | Template render + update |
| Solid | Components | JSX | Yes | No | Fine-grained reactive DOM |

## FAQ (short)

**Why bang tags instead of `<my-tag />`?** HTML parses self-closing non-void tags as open tags, so you do not get a true empty element. Bang tags sidestep this by using a comment node and upgrading it to a Custom Element.

**How do I attach events?** Define a method on your component class and reference it by name in `onclick=` (or any standard DOM event).

**What is required in a component?** Nothing. Any of `markup.html`, `style.css`, and `script.js` can be omitted.

## Contributing

Issues and PRs are welcome. Keep patches focused and feel free to link to a demo or reproduction.
