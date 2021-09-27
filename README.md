<p align=center>
  <img width=80% 
    src=https://github.com/i5ik/bang/raw/main/.github/BANG!%20logo%20tomato-whitesmoke%20(1).png
    src=https://github.com/i5ik/bang/raw/main/.github/BANG!%20logo%20mediumseagreen-mincream.png
  >
</p>

This is ***BANG!***:

`my-el/markup.html`
```jsx
  <i-am-a-custom-element state=thisIsAStateKey
    onclick=functionNameOnCustomElementClass>
  >
    <!im-another-custom-element
      ontouchstart=funcOnMyClassOrMyParents
      oncompositionend=anotherHandlerFunc
      ondrag=noteTheShortSyntax
      state=${aStateObject}
    />
    <p>${paragraphTextInScope}</p>
  </i-am-a-custom-element>
```

`index.html`:
```html
<script src=//unpkg.com/bang.html></script>
<script>
  use('my-el');
  use('i-am-a-custom-element');
  use('im-another-custom-element');

  setState('thisIsAStateKey', {
    aStateObject: {},
    paragraphTextInScope: `Lorem ipsum, just kidding. I speak English, not Latin. Har har har.`
  });
</script>
<!my-el>
```

That is all. 

For more, [read the intro](INTRO.md).
------------------------------------------------------------------

