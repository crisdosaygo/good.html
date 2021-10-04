<p align=center>
  <img width=80% 
    src=https://github.com/i5ik/bang/raw/main/.github/BANG!%20logo%20mediumseagreen-mincream.png
  >
</p>

***BANG!*** is a view library that prints custom elements, so you get style encapsulation, and component-powered reusability baked-in. It also has minimal DOM diffing, JavaScript templating syntax, zero dependences and needs to transpiler. Built with the power of the web, in 

This is ***BANG!***, making a component:

[`components/sg-counter/markup.html`](https://github.com/i5ik/_____/blob/main/docs/7guis/components/sg-counter/markup.html)
```jsx
<sg-frame state=${_self}> 
  <button id=counter onclick=Increment>Count</button>
  <label for=counter>${count}</label>
</sg-frame>
```

[`components/sg-counter/script.js`](https://github.com/i5ik/_____/blob/main/docs/7guis/components/sg-counter/script.js):
```jsx
class Counter extends Base {
  Increment() {
    const {state} = this;
    state.count++;
    this.state = state;
  }
}
```

[`components/sg-counter/style.css`](https://github.com/i5ik/_____/blob/main/docs/7guis/components/sg-counter/style.css):
```css
label {
  min-width: 4.5ch;
  display: inline-block;
  text-align: right;
}
```

This is ***BANG!***, using a component:

`index.html`:
```html
<link rel=stylesheet href=components/style.css>
<script src=//unpkg.com/bang.html></script>
<script>
  use('sg-frame');
  use('sg-counter');
</script>
<!sg-counter lazy state=ctr />
```

You need to fill out the `sg-frame` component. But that is all.


This is ***BANG!***

For more, [read the intro](INTRO.md). But here's a quick overview of features:

- Minimal DOM diffs (lists, keyed components, attribute names, attribute values, text values) with no absolutely VDOM overhead, instead we use granular DOM-based updator functions.
- JavaScript templating syntax. Forget a DSL, or "pseudo-code" with its own quirks and weird edge-cases, just use JavaScript to `${template}` in all the ``${values.map(v => F`<!my-item state=${v}>`)}`` you need.
- Custom Elements. Simply put `use('my-item');` in your JavaScript, and fill out any of the `markup.html`, `style.css`, and `script.js` files in the `./components/my-item/` directory, that your `my-item` component needs.
- Keyed components, with optional keys. Just supply a key to create an instance component that can have many different instantiations in the DOM, or no key to get a singleton component. Both of these are pinned to their DOM location and will automatically be updated when you update relevant state.
- Re-rendering only the changes when you `setState`. You can also use the `this.state = ` convenience setter within a component that uses string key as the value of its `state=` attribute.
- Simple, low learning curve. Uses the HTML, JavaScript and CSS you already know, just provides some enhancements. No DSLs or transpilers required.
- `lazy` and `super lazy` loading options, initiated by those attributes on your component. Lazy components do not delay the load of any ancestor components, and super lazy components only begin loading after the rest of the page has finished loading first.
- Async value resolution in templates. You can plop async values right into your templates, even lists of async values, arbitrarily nested, and ***BANG!*** will resolve them all.


------------------------------------------------------------------

