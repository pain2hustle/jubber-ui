# Copy-paste Jubber

Copy `assets/jubber.webp`, `jubber.css`, and `jubber.js` into your project, then add:

```html
<link rel="stylesheet" href="/jubber.css">

<button class="jubber-ui" data-jubber type="button" aria-label="Open Jubber assistant">
  <img class="jubber-ui__visual" src="/assets/jubber.webp" alt="" width="160" height="160" draggable="false">
  <span class="jubber-ui__tip">I'm Jubber · Click me</span>
</button>

<script src="/jubber.js"></script>
```

Attach your own chat-opening function to the button without changing the motion code:

```js
document.querySelector('[data-jubber]').addEventListener('click', openYourChat);
```
