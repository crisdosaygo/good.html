<p align=center>
  <img width=80% 
       src=https://github.com/i5ik/bang/raw/main/.github/BANG!%20logo%20tomato-whitesmoke%20(1).png
       src=https://github.com/i5ik/bang/raw/main/.github/BANG!%20logo%20mediumseagreen-mincream.png
  >
</p>

# *BANG!* *A custom element library for the new age.*

### Introducing: self-closing custom elements 

**[Void tags](https://developer.mozilla.org/en-US/docs/Glossary/Empty_element)** have *finally* come to the custom-element ecosystem! *With a **BANG!***

***BANG!*** makes it easy to define and use self-closing web components in your app.

```js
<!custom-element>
<div>
  <!custom-el2 />
</div>
```
These special self-closing custom elements are known as **bang-tags** (*web components with a **bang!***)

They are ***valid*** HTML comment tags that **BANG!** converts into valid [Web Components](https://developer.mozilla.org/en-US/docs/Web/Web_Components) when inserted.

Like HTML void tags, when you use **bang! tags** you can omit the self-closing slash `/>`. So, `<!custom-el2>` is also a valid void self-closing tag. 

Just don't omit the bang (!) because that's how we signal it's a self-closing void tag.

### regular tags

**BANG!** also makes it easy to define and use regular custom elements:

```js
<custom-el>
  <my-humps></my-humps>
</custom-el>
```

We've added a few special features to make it super productive to write markup using ***BANG!***. Read on to discover how ***BANG!*** makes using Custom Elements more productive. 

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

Follow along with the below steps to learn how to create your very own greeter component.

### 1. Get it on NPM:

Install the **BANG!** NPM package: 

```sh
$ npm i --save bang.html
```

We'll also be using [serve](https://npmjs.com/package/serve) for development, so get that too:

```sh
$ npm i --save-dev serve
```

### 2. Make your directory structure:

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

### 3. Use a custom element.

Copy the below into your `public/index.html` file:

```js
<!DOCTYPE html>
<script type=application/javascript src=https://unpkg.com/bang.html></script>
<link rel=stylesheet href=https://unpkg.com/bang.html/style.css>
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

### 4. Add markup

First we're going to add some **templated markup** to the `markup.html` files of the two components we'll use.

Go ahead and paste the following HTML into `public/components/warm-greeter/markup.html`:

```js
<h1>Hello ${name}</h1>
<p>We are very pleased to meet you <greet-count state=${greetCounts}>happy</greet-count> times</p>
<button onclick=Regreet>Regreet!</button>
```

And also add the following markup to `public/components/greet-count/markup.html`:

```js
<span class=count>${value}</span>
<slot></slot>
```

You'll notice that the markup contains the sequences `${...}` above. These sequences are **template replacement slots** which are how you display your  components variables and state. 

These are different to [Web Components slot elements](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/slot) which you can also see we use. The differences are that **web component slot elements** pull in content you put between the start and end tags of your component, but **template replacement slots** pull in variables and state from the component itself. 

You'll learn more about component variables and state in the next step of this tutorial.

### 5. Make some variable and state

Go back to your `public/index.html` file and change the code in the script tag to this:

```js
<script>
  use('warm-greeter');
  setState('MyState', {
    name: 'Uncle Bob',
    greetCounts: {
      value: 1
    }
  });
</script>
```

Now visit your development server in your browser and you should be able to see your greeter taking shape, display a greeting to Uncle Bob, a count and a button. 

If you open up the DevTools Elements tag and inspect the warm-greeter tag you probably noticed that it has a Shadow Root that is now hosting some content.

### 5. Make it interactive

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

### Slots and variables

You'll notice in the examples above that we used both `<slot></slot>` elements and variables. In BANG! **slot** elements function just like they do in regular Web Components, so if you know how to use them there, you know how to use them in BANG. If you don't, you can read up on [information about slot elements here](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/slot).

You also saw that we used a *new syntax* for templating called **template replacement slots**. This is not part of web standard, and is in fact a convenient syntax for display variables and state in your components. It's quite different to `<slot></slot>` elements, so read on to find out more.

In order to use

# HTML MARKUP ***With a BANG!***
