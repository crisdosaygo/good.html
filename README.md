<p align=center>
  <img width=80% 
    src=https://github.com/i5ik/bang/raw/main/.github/BANG!%20logo%20tomato-whitesmoke%20(1).png
    src=https://github.com/i5ik/bang/raw/main/.github/BANG!%20logo%20mediumseagreen-mincream.png
  >
</p>

# *BANG!* *A custom element library for the new age.* ![npm](https://img.shields.io/npm/v/bang.html?color=turquoise) ![npm](https://img.shields.io/npm/dt/bang.html) 

***BANG!*** makes your UI work easy, and your syntax beautiful, by bringing smoother templating, async slots and [empty elements](https://developer.mozilla.org/en-US/docs/Glossary/Empty_element) (*a.k.a void elements / "self-closing tags"*) to **Web Components**.

## Introducing: self-closing tags for Web Components

**Void tags** have *finally* come to custom-elements&mdash;*with a **BANG!***

***BANG!*** is your library of choice for self-closing tags with Web Components:

```js
<!app-header />
<div>
  <!app-content />
</div>
```
These self-closing tags are known as **bang-tags** (*web components with a **bang!***)

They're actually just ***valid*** HTML comments that **BANG!** converts into valid [Web Components](https://developer.mozilla.org/en-US/docs/Web/Web_Components).
 
Like HTML [void tags](https://developer.mozilla.org/en-US/docs/Glossary/Empty_element), when you use **bang! tags** you can omit the self-closing slash `/>`. So, `<!custom-el2>` is also a valid void self-closing tag. 

## Regular tags

**BANG!** also makes it easy to define and use regular custom elements:

```js
<custom-el>
  <my-humps></my-humps>
</custom-el>
```

## More Goodies

Apart from self-closing tags, ***BANG!*** has numerous other special features that make it super productive for building interfaces***BANG!***. Read on to discover how ***BANG!*** makes UI work more productive. 

You can jump in right away and get it on NPM: https://www.npmjs.com/package/bang.html

------

***The problem of self-closing tags in HTML has been solved. Hoo-ray!***

<p align=center>
  <img width=80% 
       src=https://github.com/i5ik/bang/raw/main/.github/BANG!%20logo%20mediumseagreen-mincream.png
  >
</p>

------

## Get started in 5 simple steps

For this mini-tutorial we'll be building a simple greeter component:

```js
<!warm-greeter />
```

Follow along with the below steps to learn how to create your very own greeter component. Or just [jump straight to a work demo](https://i5ik.github.io/BANG/) if you prefer to have something to play with.

First, to get you setup for the tutorial, install the **BANG!** package from NPM: 

```sh
$ npm i --save bang.html
```

And since we'll also be using [serve](https://npmjs.com/package/serve) to run a static development server, install that, too, using:

```sh
$ npm i --save-dev serve
```

Now, onto the tutorial!

### Step 1: Make your directory structure:

```
project
│   README.md
│   package.json   
│
└───public
│   │   index.html
│   │
│   └───components
│       │   config.js (optional)
│       │  
|       └───warm-greeter
|       |   │   markup.html (optional)
│       |   │   style.css (optional)
|       |   |   script.js (optional)
|       └───greet-count
|           │   markup.html (optional)
│           │   style.css (optional)
|           |   script.js (optional)
│   
...
```

Note that each component lives in sub-folder under the components directory. Serve the components directory from your site root at `/components`. 

Each component is defined by 3 files, all optional:

- markup.html: the shadow DOM content
- style.css: the scoped styles applied. Note that [standard Web Components CSS pseudo-classes](https://developer.mozilla.org/en-US/docs/Web/Web_Components#:~:text=built-in%20element.-,CSS%20pseudo-classes,-Pseudo-classes%20relating) work here. 
- script.js: the class extension extending the default base class. You'll learn about the default base class of the component in a second.

### Step 2: Use a custom element.

Copy the below into your `public/index.html` file:

```html
<!DOCTYPE html>
<script type=application/javascript src=https://unpkg.com/bang.html></script>
<link rel=stylesheet href=https://unpkg.com/bang.html/src/style.css>
<script>
  use('warm-greeter');
</script>
<!warm-greeter>
```

Start your development server:

```sh
$ npx serve -p 8080 public/
```

Now visit your server in a web browser. You should just see a blank page. Open DevTools and see that:

```js
<!warm-greeter />
```

has become:

```js
<warm-greeter></warm-greeter>
```

A valid Web Component, that you defined using a void self-closing tag. 

Now let's flesh out your component and show some markup and styles by adding some content to the component directory.

### Step 3: Add markup

First we're going to add some **templated markup** to the `markup.html` files of the two components we'll use.

Go ahead and paste the following HTML into `public/components/warm-greeter/markup.html`:

```html
<h1>Hello ${name}</h1>
<p>We are very pleased to meet you <greet-count state=${greetCounts}>happy</greet-count> times</p>
<button onclick=Regreet>Regreet!</button>
```

And also add the following markup to `public/components/greet-count/markup.html`:

```html
<span class=count>${value}</span>
<slot></slot>
```

You'll notice that the markup contains the sequences `${...}` above. These sequences are **template replacement slots** which are how you display your  components variables and state. 

These are different to [Web Components slot elements](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/slot) which you can also see we use. The differences are that **web component slot elements** pull in content you put between the start and end tags of your component, but **template replacement slots** pull in variables and state from the component itself. 

You'll learn more about component variables and state in the next step of this tutorial.

### Step 4: Make some variable and state

Go back to your `public/index.html` file and change the code in the `<script>` tag and the greeter as follows.

Update the `<script>` tag content to this:

```js
  use('warm-greeter');
  use('greet-count');
  setState('MyState', {
    name: 'Uncle Bob',
    greetCounts: {
      value: 1
    }
  });
```

And change this:

```js
<!warm-greeter />
```

To this:

```js
<!warm-greeter state=MyState />
```

Now reload the development page in your browser and you should be able to see your greeter taking shape, display a greeting to Uncle Bob, a count and a button. 

If you open up the DevTools Elements tag and inspect the warm-greeter tag you probably noticed that it has a Shadow Root that is now hosting some content.

### Step 5: Make it interactive

In this step, you'll add an event handler to the **warm-greeter** component so it will do something when the button is clicked.

To do that, you'll be extending the default base class for the **warm-greeter** component, by adding some methods to its script file. 

So, go ahead, and open up 'public/components/warm-greeter/script.js' and add the following content:

```js
class Component extends Base {
  Regreet(clickEvent) {
    const newState = cloneState('MyState');
    newState.greetCounts.value += 1;
    setState('MyState', newState);
  }
}
```

Make sure you save that file, then reload the development page in your web browser. 

This time, when you click the button, you'll see something happen. 

A new message will appear, telling you that: "We are very pleased to meet you 2 happy times."

That's the end of this mini-tutorial, so **congratulations!!* You've done really well, and you're ready to start writing components on your own and learning more. 

If you read on you'll discover more about some details you saw in the tutorial. 

-----------------

## Slots and variables

You'll notice in the examples above that we used both `<slot></slot>` elements and variables. In BANG! **slot** elements function just like they do in regular Web Components, so if you know how to use them there, you know how to use them in BANG. If you don't, you can read up on [information about slot elements here](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/slot).

You also saw that we used a *new syntax* for templating called **template replacement slots**. This is not part of web standard, and is in fact a convenient syntax for display variables and state in your components. It's quite different to `<slot></slot>` elements, so read on to find out more.

In order to have your component display variables form an object, you need to do 3 things:

1. Assign that state object a string key, it's **state key**, and save it in the object store using `setState(<key: string>, <value: object>)`;
2. Pass that **state key** to the component by setting its `state` attribute; and
3. Reference **properties** from that state object using **template replacement slot** syntax

Let's run through an example to tease out the details of these 3 steps:

### 1. Save the state to the store

In a script you would write: 

```js
setState('MyState', {
  deviceFormat: 'mobile',
  screen: {
    width: 420
  }
});
```

You can now access the state object using the key `MyStae`.

### 2. Pass state to components

In a markup file for a component (or in the top-level HTML file for your app you would write):

```js
<!test-el state=MyState />
```

### 3. Template the properties

In a markup file for your component, you could then write:

```html
<div class="big-banner ${deviceFormat}">
  <img src=wide-cat.png width=${screen.width*0.75}px
</div>
```

-----------------------

## The `state=` attribute, nested objects and template replacement slots

You probably noticed above that you didn't need to refer to the parent object when using the **template replacement slot** syntax. This is because you can simply use the property name inside the markup of the component you pass the state to. If you need to access the outer state object, you can do that via the special `_self` property. 

Also what if you want pass **nested objects** in your state object to be the `state=` properties of a sub-component? 

For example, in the tutorial we created a **warm-greeter** component that incorporated a sub-component, **greet-count** like so:

```html
<h1>Hello ${name}</h1>
<p>
  We are very pleased to meet you 
  <greet-count state=${greetCounts}>happy</greet-count> times
</p>
<button onclick=Regreet>Regreet!</button>
```

You might have noticed that the `state=` property of the **greet-count** component is not passed by string key, but instead passed a *nested object* using our standard **template replacement slot** syntax. Despite this, **greet-count** behaves as if it had been passed a **state-key**.

So what's going on?

This is the expected behavior. You *can pass state directly to your sub-components using **template replacement slots*** in any component markup filebut not in a top-level HTML file (because **template replacement slots are not processed there, only in component markup). 

So in the above example from the tutorial **greet-count** behaves the same as if you explicitly saved that nested object to the state store using a string **state-key** then passed it by key to your component using the `state=` property. 

Instead of having to write that extra step, ***BANG!*** detects the nested object and saves it to the store for you, and passes to new components as they are created, without you having to worry about the details.

----------------------

## Async templating

***BANG!*** can also accept state properties that are functions, async functions and Promises. In these cases, here's what happens:

- Promise: ***BANG!*** awaits the Promise to resolve, then templates in the value returned by the resolved Promise.
- Async Function: ***BANG!*** executes the async function and awaits the result, then templates in the value.
- Function: ***BANG!*** executes the function and templates in the result.

---------------

## More information

***BANG!*** is new, and it might take you some time to learn.

These documents, and ***BANG!*** itself are a work in progress.

Plans may change, but right now, some aims for the future are:

- re-render function in the base class
- improve documentation
- add minimal DOM diffing using [vanillaview](https://github.com/i5ik/vanillaview) granular DOM updator function technology
- add **state-queries** with automatic data binding, to fully decouple state objects from components, and decouple components from each other, and enables dependent components to be automatically re-rendered when data they use in the store changes.

-----------------

# Q&A 

### Why use *BANG!* and not just a `<custom-self-closing-tag />` or a single `<custom-tag>`? 

When the HTML parser [encounters a self-closing slash in a non-void element, it acts as if the slash isn't there](https://html.spec.whatwg.org/multipage/parsing.html#parse-error-non-void-html-element-start-tag-with-trailing-solidus), in effect opening the tag, and wrapping any subsequent content up to the next valid closing tag for that element, inside that open tag. This is not what you intend when you try to use a self-closing tag.

Similarly, when the HTML parser encounters a single `<custom-tag>` it opens it, and so subsequent tags will be placed inside that open tag.

### What are some gotchas or syntax I need to beware of?

#### `use(<name: string>)`

If you don't call `use` with the name of the component (*the name of its directory*) then your component will not be a custom element, and will just be a regular HTML tag. 

Don't forget to always `use` all components, even nested components in your script.

#### Self-closing syntax

***BANG!*** is design to be pretty intuitive and smooth with the syntax, so most things work as you expect. But there are still some things that may catch you out if you forget. 

So:

- don't omit the bang (**!**) because that's how we signal it's not a normal tag; and
- don't start any comment with a double-barrelled word, because that's how we signal it's a self-closing tag, not a comment. 

#### Component classes

Also, regarding extending classes it doesn't matter what you call your component class (you can call it `Component` or anything you like) but you do need to extend it from the `Base` class and use the exact name `Base` like so:

```js
class MyComponent extends Base {
 /* ... */
}
```

#### Top-level element

You need to include a `<body>` tag in your top-level HTML document, or another displayable tag, and put your self-closing tags *after* that displayable tag, otherwise they will end up `<head>` tag of the document, and not be displayed.

#### Config

You can configure the following properties:

```js
{
  htmlFile: 'markup.html',
  scriptFile: 'script.js',
  styleFile: 'style.css',
  bangKey: '_bang_key',
  componentsPath: './components',
  allowUnset: false,
  unsetPlaceholder: '',
  EVENTS: `error load click pointerdown pointerup pointermove mousedown mouseup 
    mousemove touchstart touchend touchmove touchcancel dblclick dragstart dragend 
    dragmove drag mouseover mouseout focus blur focusin focusout scroll
  `.split(/\s+/g).filter(s => s.length)
}
```

To override the above defaults, pass in a new config object, like so:

```js
bangfig({
  markupFile: 'html.html`,
  componentsPath: `coco`
});
```

#### Programmatic state-keys

You can set a specific state key for a nested object to override the autogenerated key by setting the CONFIG.bangKey property name (by default `_bang_key`) on the nested object. For example:

```js
setState(`S1`, {
  nester: {
    _bang_key: `happy1`,
    prop1: 'okay ;p ;) xx`
  }
});
```

Then later:

```js
const nestedState = cloneState(`happy1`);
```

Or

```js
<some-guy state=happy1></some-guy>
```

--------

## Contributions

Contributions are very welcome. No CLA needed. No license restrictions. Just get-in, muck-in and get involved! :P ;) xx 

If you want to, of course. :P ;) xx

---

# HTML ***but with a BANG!***

<p align=center>
  <img width=80% 
    src=https://github.com/i5ik/bang/raw/main/.github/BANG!%20logo%20tomato-whitesmoke%20(1).png
    src=https://github.com/i5ik/bang/raw/main/.github/BANG!%20logo%20mediumseagreen-mincream.png
  >
</p>
