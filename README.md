<p align=center>
  <img width=80% 
    src=https://github.com/i5ik/bang/raw/main/.github/BANG!%20logo%20mediumseagreen-mincream.png
  >
</p>

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

For more, [read the intro](INTRO.md).
------------------------------------------------------------------

