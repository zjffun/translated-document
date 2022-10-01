<h1 align="center">
    <img width="100" height="111" src="https://github.com/jsdom/jsdom/raw/master/logo.svg" alt=""><br>
    jsdom
</h1>

jsdom是一个纯粹由 javascript 实现的一系列 web标准，特别是 WHATWG 组织制定的[DOM](https://dom.spec.whatwg.org/)和 [HTML](https://html.spec.whatwg.org/multipage/) 标准，用于在 nodejs 中使用。大体上来说，该项目的目标是模拟足够的Web浏览器子集，以便用于测试和挖掘真实世界的Web应用程序。

最新版本的 jsdom 运行环境需要 node.js v6或者更高的版本。（jsdom v10以下版本在 nodejs v4以下仍然可用，但是我们已经不支持维护了）

v10版本的 jsdom 拥有全新的 API(如下所述).旧的 API 现在仍然支持;[详细的参照文档](https://github.com/jsdom/jsdom/blob/master/lib/old-api.md)

## 基本用法
```js
const jsdom = require("jsdom");
const { JSDOM } = jsdom;
```
为了使用 jsdom，主要用到jsdom主模块的一个命名导出的 `jsdom` 构造函数。往构造器传递一个字符串，将会得到一个 jsdom 构造实例对象，这个对象有很多实用的属性，特别是 `window` 对象:
```js
const dom = new JSDOM(`<!DOCTYPE html><p>Hello world</p>`);
console.log(dom.window.document.querySelector("p").textContent); // "Hello world"
```
(请注意，jsdom会像浏览器一样解析您传递的HTML，包括隐含的`<html>`，`<head>`和`<body>`标记)

生成的对象是JSDOM类的一个实例，其中包括 `window` 对象在内的许多有用的属性和方法。一般来说，它可以用来从“外部”对jsdom进行操作，而这些操作对于普通DOM API来说是不可能的。对于不需要任何功能的简单场景，我们推荐使用类似的编码模式

```js
const { window } = new JSDOM(`...`);
// or even
const { document } = (new JSDOM(`...`)).window;
```

下面是关于JSDOM类所能做的一切的完整文档，在“JSDOM对象API”部分。

## 定制 jsdom

JSDOM构造函数接受第二个参数，可以用以下方式定制您的jsdom。

### 简单选项
```js
const dom = new JSDOM(``, {
  url: "https://example.org/",
  referrer: "https://example.com/",
  contentType: "text/html",
  userAgent: "Mellblomenator/9000",
  includeNodeLocations: true
});
```

- `url` 设置的值可以通过`window.location`，`document.URL`和`document.documentURI`来返回，并会影响文档中相关URL的解析以及获取子资源时使用的同源限制和referrer。默认值为`"about:blank"`。
- `referrer` 仅仅影响`document.referrer`的值。默认没有引用（即为空字符串）。
- `contentType` 影响`document.contentType`的值，是按照HTML解析文档还是 XML来解析。它的值如果不是`text/html`或[`XML mime type`](https://html.spec.whatwg.org/multipage/infrastructure.html#xml-mime-type) 值的话将会抛出异常。默认值为`"text/html"`。
- `userAgent` 影响`navigator.userAgent`的值以及请求子资源时发送的`User-Agent`头。默认值为`Mozilla / 5.0（$ {process.platform}）AppleWebKit / 537.36（KHTML，如Gecko）jsdom / $ {jsdomVersion}`。
- includeNodeLocations 保留由HTML解析器生成的位置信息，允许您使用`nodeLocation()`方法（如下所述）检索它。
它还能确保在`<script>`元素内运行的代码的异常堆栈跟踪中报告的行号是正确的。
默认值为`false`以提供最佳性能，并且不能与XML内容类型一起使用，因为我们的XML解析器不支持位置信息。

**请注意**，`url` 和```referrer```在使用之前已经被规范化了，例如
如果你传入`"https:example.com"`，jsdom会自动规范化解释为`"https://example.com/"`。
如果你传递了一个不可解析的URL，该调用将抛出错误。
（URL根据[URL标准](http://url.spec.whatwg.org/)进行分析和序列化。）


### 执行脚本

jsdom最强大的功能是它可以在jsdom中执行脚本。这些脚本可以修改页面的内容并访问jsdom实现的所有Web平台API。

但是，这在处理不可信内容时也非常危险。
jsdom沙箱并不是万无一失的，在DOM的`<script>`内部运行的代码如果足够深入，就可以访问Node.js环境，从而访问您的计算机。
因此，默认情况下，执行嵌入在HTML中的脚本的功能是禁用的：

```js
const dom = new JSDOM(`<body>
  <script>document.body.appendChild(document.createElement("hr"));</script>
</body>`);

// 脚本默认将不能执行:
dom.window.document.body.children.length === 1;
```

要在页面内启用脚本，可以使用`runScripts:"dangerously"`选项：
```js
const dom = new JSDOM(`<body>
  <script>document.body.appendChild(document.createElement("hr"));</script>
</body>`, { runScripts: "dangerously" });

// 脚本将执行并修改 DOM:
dom.window.document.body.children.length === 2;
```

我们再次强调只有在提供给jsdom的代码是你已知道是安全的代码时方可使用它。如果您运行了任意用户提供的或Internet上的不可信的Node.js代码，可能会危及您的计算机。

假如你想通过`<script src="">`来执行外部脚本，你需要确保已经加载了它们。为此，请添加选项`resources:"usable"` [如下所述](https://github.com/jsdom/jsdom#loading-subresources)。

**请注意**，除非`runScripts`设置为`"dangerously"`，否则事件处理程序属性（如`<div onclick =“”>`）也将不起作用。（但是，事件处理函数属性，比如`div.onclick = ...`，将无视`runScripts`参数 并且会起作用）

如果您只是试图从“外部”执行脚本，而不是通过`<script>`元素（和内联事件处理程序）从内部运行“，则可以使用`runScripts: "outside-only"`选项，该选项会启用`window.eval`：

```js
const window = (new JSDOM(``, { runScripts: "outside-only" })).window;

window.eval(`document.body.innerHTML = "<p>Hello, world!</p>";`);
window.document.body.children.length === 1;
```
由于性能原因，默认情况下会关闭此功能，但可以安全启用。

**请注意**，我们强烈建议不要试图通过将jsdom和Node全局环境混合在一起（例如，通过执行global.window = dom.window）来“执行脚本”，然后在Node全局环境中执行脚本或测试代码。相反，您应该像对待浏览器一样对待jsdom，并使用`window.eval`或`runScripts: "dangerously"`来运行需要访问jsdom环境内的DOM的所有脚本和测试。例如，这可能需要创建一个browserify包作为`<script>`元素执行 - 就像在浏览器中一样。

最后，对于高级用例，您可以使用dom.runVMScript（脚本）方法，如下所述。

### 假装成一个视觉浏览器
jsdom没有渲染可视内容的能力，并且默认情况下会像无头浏览器一样工作。它通过API（如document.hidden）向网页提供提示，表明其内容不可见。

当`pretendToBeVisual`选项设置为true时，jsdom会假装它正在呈现并显示内容。它是这样做的：
- 更改`document.hidden`以返回false而不是true
- 更改`document.visibilityState`以返回“visible”而不是“prerender”
- 启用`window.requestAnimationFrame()` 和`window.cancelAnimationFrame()`方法，否则不存在

```js
const window = (new JSDOM(``, { pretendToBeVisual: true })).window;

window.requestAnimationFrame(timestamp => {
  console.log(timestamp > 0);
});
```

**请注意**，jsdom仍然[不做任何布局或渲染](https://github.com/jsdom/jsdom#unimplemented-parts-of-the-web-platform)，因此这实际上只是假装为可视化，而不是实现真正的可视化Web浏览器将实现的部分。

### 加载子资源

默认情况下，jsdom不会加载任何子资源，如脚本，样式表，图像或iframe。如果您希望jsdom加载这些资源，则可以传递`resources: "usable"`选项，该选项将加载所有可用资源。资源列表如下：
-  frame 和 iframe,通过 `<frame>` 和 `<iframe>`实现
-  样式，通过`<link rel="stylesheet">`
-  脚本，通过`<script>`,但是前提是`runScripts: "dangerously"`设置了
-  图片，通过`<img>`,但是前提是[`canvas`](https://www.npmjs.com/package/canvas)(或者 [`canvas-prebuilt`](https://npmjs.org/package/canvas-prebuilt)) npm  包已安装

未来，我们计划通过此选项提供更多的资源加载定制，但现在只提供的两种模式：`'default'`和 `'usable'`。

### 虚拟控制台

像网页浏览器一样，jsdom也具有“控制台”的概念。通过在文档内执行的脚本以及来自jsdom本身实现的信息和记录会从页面直接发送过来。我们将用户可控制的控制台称为“虚拟控制台”，以便将其与Node.js console API和页面内部的window.console API区分开来。

默认情况下，JSDOM构造函数将返回一个具有虚拟控制台的实例，该虚拟控制台将其所有输出转发到Node.js控制台。为了创建自己的虚拟控制台并将其传递给jsdom，可以通过执行下面代码来覆盖此默认值
```js
const virtualConsole = new jsdom.VirtualConsole();
const dom = new JSDOM(``, { virtualConsole });
```
这样的代码将创建一个没有任何行为的虚拟控制台。您可以为所有可能的控制台方法添加事件侦听器来为其提供行为：
```js
virtualConsole.on("error", () => { ... });
virtualConsole.on("warn", () => { ... });
virtualConsole.on("info", () => { ... });
virtualConsole.on("dir", () => { ... });
// ... etc. See https://console.spec.whatwg.org/#logging
```

（**请注意**，最好在调用 `new JSDOM()`之前设置这些事件侦听器，因为在解析期间可能会发生错误或控制台调用脚本错误。）

如果你只是想将虚拟控制台输出重定向到另一个控制台，比如默认的Node.js，你可以这样做
```js
virtualConsole.sendTo(console);
```

还有一个特殊的事件，`"jsdomError"`，它的触发将通过错误对象来记录jsdom本身的错误。这与错误消息在Web浏览器控制台中的显示方式类似，即使它们不是由console.error输出的。到目前为止，错误会按照下面的方式输出：

- 加载或解析子资源时出错（脚本，样式表，frames和iframe）
- 不是由`window onerror`事件处理程序处理的脚本执行错误，它将会返回true或调用event.preventDefault()
- 由于调用jsdom没有实现的方法而导致的错误，例如window.alert，兼容性的 web 浏览器都实现了这些方法

如果您使用`sendTo(c)`将错误发送给c，则默认情况下，它将使用来自`"jsdomError"`事件的信息调用console.error。如果您希望保持事件与方法调用的严格的一对一映射，并且可能自己处理`"jsdomError"`，那么您可以执行
```js
virtualConsole.sendTo(c, { omitJSDOMErrors: true });
```

### Cookie jars(存储Cookie的容器)
像网页浏览器一样，jsdom也具有cookie jar的概念，存储HTTP cookie 。在文档的同一个域上一个URL，并且没有标记为`HTTP only`的cookies,可以通过`document.cookie` API来访问。此外，Cookie jar中的所有cookie都会影响子资源的http加载。

默认情况下，JSDOM构造函数将返回一个带有空cookie的实例。要创建自己的cookie jar并将其传递给jsdom，可以通过以下代码来覆盖默认值

```js
const cookieJar = new jsdom.CookieJar(store, options);
const dom = new JSDOM(``, { cookieJar });
```

如果您想要在多个jsdoms中共享同一个cookie jar，或者提前使用特定的值来填充cookie jar，这将非常有用。

Cookie jar包由[tough-cookie](https://www.npmjs.com/package/tough-cookie)包提供的。`jsdom.CookieJar`构造函数是`tough-cookie cookie jar`的子类，并且默认设置了`looseMode：true`选项，因为它[更符合浏览器的行为方式](https://github.com/whatwg/html/issues/804)。如果您想自己使用`tough-cookie`的方法和类，则可以使用`jsdom.toughCookie`模块导出来访问使用jsdom打包的`tough-cookie`模块实例。

### 在解析之前进行干预

jsdom允许您在很早的时候介入创建jsdom：**创建Window和Document对象之后，但在解析任何HTML并使用节点填充文档之前**：
```js
const dom = new JSDOM(`<p>Hello</p>`, {
  beforeParse(window) {
    window.document.childNodes.length === 0;
    window.someCoolAPI = () => { /* ... */ };
  }
});
```
如果您希望以某种方式修改环境，这尤其有用，例如添加jsdom不支持的Web API的填充程序。

## JSDOM object API
一旦你构建了一个JSDOM对象，它将具有以下有用的功能：

### Properties
`window`属性: `window`对象的key 从`Window` 对象检索而来
`virtualConsole`和`cookieJar`：可以传入或者使用默认值

### 通过`serialize()`序列化document
```js
const dom = new JSDOM(`<!DOCTYPE html>hello`);

dom.serialize() === "<!DOCTYPE html><html><head></head><body>hello</body></html>";

// Contrast with:
dom.window.document.documentElement.outerHTML === "<html><head></head><body>hello</body></html>";
```

### 通过`nodeLocation(node)`获取 dom 节点的源位置信息
`nodeLocation()`方法将查找DOM节点在源文档中的位置，并返回节点的[parse5位置信息](https://www.npmjs.com/package/parse5#options-locationinfo)：
```js
const dom = new JSDOM(
  `<p>Hello
    <img src="foo.jpg">
  </p>`,
  { includeNodeLocations: true }
);

const document = dom.window.document;
const bodyEl = document.body; // implicitly created
const pEl = document.querySelector("p");
const textNode = pEl.firstChild;
const imgEl = document.querySelector("img");

console.log(dom.nodeLocation(bodyEl));   // null; it's not in the source
console.log(dom.nodeLocation(pEl));      // { startOffset: 0, endOffset: 39, startTag: ..., endTag: ... }
console.log(dom.nodeLocation(textNode)); // { startOffset: 3, endOffset: 13 }
console.log(dom.nodeLocation(imgEl));    // { startOffset: 13, endOffset: 32 }
```
**请注意**，只有您设置了`includeNodeLocations`选项才能使用此功能;由于性能原因，节点位置默认为关闭。


### 使用`runVMScript(script)`运行vm创建的脚本

Node.js的内置vm模块允许您创建`Script`实例，这些脚本实例可以提前编译，然后在给定的“VM上下文”上运行多次。在这个场景背后，jsdom `Window`是一个确定的VM上下文。要访问此功能，请使用`runVMScript()`方法：

```js
const { Script } = require("vm");

const dom = new JSDOM(``, { runScripts: "outside-only" });
const s = new Script(`
  if (!this.ran) {
    this.ran = 0;
  }

  ++this.ran;
`);

dom.runVMScript(s);
dom.runVMScript(s);
dom.runVMScript(s);

dom.window.ran === 3;
```

这是高级功能，除非您有特殊的需求，否则我们建议坚持使用普通的DOM API（如window.eval（）或document.createElement（“script”））。

### 通过`reconfigure(settings)`重新配置jsdom

`window.top`属性在规范中被标记为[Unforgeable][中文：伪造的]，这意味着它是一个不可配置的私有属性，因此在jsdom内运行的普通代码是不能覆盖或遮挡它的，即使使用`Object.defineProperty`。

同样，目前在jsdom中是不能够处理`navigation`相关信息的（比如设置`window.location.href ="https://example.com/"`）;这样做会导致虚拟控制台发出`"jsdomError"`，说明此功能未实现，并且没有任何变化,也将不会有新的`Window`或`Document`对象，并且现有`window.location`对象仍保持当前所有相同的属性值。

但是，如果您从 jsdom 窗口之外进行演示，例如在一些创建jsdoms的测试框架中，可以使用特殊的`reconfigure()`方法覆盖其中的一个或两个：
```js
const dom = new JSDOM();

dom.window.top === dom.window;
dom.window.location.href === "about:blank";

dom.reconfigure({ windowTop: myFakeTopForTesting, url: "https://example.com/" });

dom.window.top === myFakeTopForTesting;
dom.window.location.href === "https://example.com/";
```

**请注意**，更改jsdom的URL将影响所有返回当前 document URL的API，例如`window.location`，`document.URL``和document.documentURI`，以及文档中相对URL的解析以及同源检查和提取子资源时使用的引用。但是，它不会执行导航到该URL的内容;DOM的内容将保持不变，并且不会创建`Window`，`Document`等新的实例。


## 便捷的 APIs

### `fromURL()`

除了JSDOM构造函数本身之外，jsdom还提供了一个返回 `Promise` 的工厂方法，用于通过URL构建一个jsdom实例
```js
JSDOM.fromURL("https://example.com/", options).then(dom => {
  console.log(dom.serialize());
});
```

如果URL有效且请求成功，则`onFullfilled`回调执行并返回JSDOM实例。任何URL重定向都将遵循其最终目的地。

`fromURL()`提供的参数选项与提供给JSDOM构造函数的选项类似，但具有以下额外的限制和后果：
- `url` 和 `contentType` 参数不能被提供
- `referrer` 选项用作初始请求的HTTP Referer请求头
- `userAgent` 选项用作任何请求的HTTP User-Agent请求头
- 生成的jsdom的`url` 和 `contentType`和`referrer`是 由 http response来决定
- 任何通过HTTP Set-Cookie响应头设置的cookie都存储在jsdom的cookie jar中。同样，已提供的cookie jar中的任何cookie都会作为HTTP Cookie请求标头发送。

初始的请求并不能无限定制到像[request](https://www.npmjs.com/package/request) npm 包一样的程度;`fromURL()`旨在为大多数情况提供便利的API。如果您需要更好地控制初始请求，您应该自己执行它，然后手动使用JSDOM构造函数。

### `fromFile()`

与`fromURL()`类似，jsdom还提供了一个`fromFile()`工厂方法，用于从文件名构建jsdom
```js
JSDOM.fromFile("stuff.html", options).then(dom => {
  console.log(dom.serialize());
});
```

如果可以打开给定的文件，则`onFullfilled`回调执行并返回JSDOM实例。和Node.js API一样，文件名是相对于当前工作目录的。

`fromFile()`提供的选项与提供给JSDOM构造函数的选项相似，但具有以下额外的默认值：

- `url`选项将默认为给定文件名相对应的文件URL，而不是`"about：blank"`
- 假如给定的文件名是以`.xhtml`或者`.xml`为后缀的话，`contentType`选项默认为`"application/xhtml+xml"`;反之为`"text/html"`。


### `fragment()`

对于最简单的情况，你可能不需要一个完整的JSDOM实例及其所有相关的功能。您甚至可能不需要`Window`或`Document`！相反，你只需要解析一些HTML片段，并获得一个你可以操作的`DOM`对象。为此，我们提供了`fragment()`，它可以从给定的字符串中创建一个`DocumentFragment`：
```js
const frag = JSDOM.fragment(`<p>Hello</p><p><strong>Hi!</strong>`);

frag.childNodes.length === 2;
frag.querySelector("strong").textContent = "Why hello there!";
// etc.
```

`frag`是`DocumentFragment`的实例对象，其内容是通过提供的字符串解析创建的。解析是通过使用`<template>`元素完成的，因此您可以在其中包含任何元素（包括具有奇怪解析规则的元素，如`<td>`）。

`fragment()`工厂函数的所有调用结果的`DocumentFragments`实例都会共享相同的`Document`和`Window`。这允许多次调用`fragment()`而没有额外的开销。但这也意味着对`fragment()`的调用不能用任何选项自定义。

**请注意**，对`DocumentFragments`的序列化并不像使用JSDOM对象那样容易。如果你需要序列化你的`DOM`，你应该直接使用JSDOM构造函数。但对于包含单个元素的片段的特殊情况，通过常规方法就很容易做到。

```js
const frag = JSDOM.fragment(`<p>Hello</p>`);
console.log(frag.firstChild.outerHTML); // logs "<p>Hello</p>"
```

## 其他值得注意的功能

### 支持 Canvas
jsdom支持使用[canvas](https://www.npmjs.com/package/canvas)或[canvas-prebuilt](https://www.npmjs.com/package/canvas-prebuilt)包来扩展任何使用canvas API的`<canvas>`元素。为了做到这一点，您需要将`canvas`作为依赖项加入到您的项目中，和 `jsdom`包并列。如果jsdom可以找到`canvas`包，它将使用它，但是如果它不存在，那么`<canvas>`元素的行为就像`<div>`一样。

### 编码嗅探

除了提供一个字符串外，JSDOM构造函数还支持Node.js  [`Buffer`](https://nodejs.org/docs/latest/api/buffer.html)或标准JavaScript二进制数据类型（如ArrayBuffer，Uint8Array，DataView等）的形式提供二进制数据。当完成后，jsdom将从提供的字节进行[`嗅探编码`](https://html.spec.whatwg.org/multipage/syntax.html#encoding-sniffing-algorithm)，就像浏览器扫描`<meta charset>`标签一样。

这种编码嗅探也适用于`JSDOM.fromFile()`和`JSDOM.fromURL()`。在后一种情况下，就像在浏览器中一样，任何与response响应一起发送的`Content-Type`头信息优先级更高。

**请注意**，在许多情况下，提供字节这种方式可能比提供字符串更好。例如，如果您试图使用Node.js的`buffer.toString('utf-8')`API，则Node.js将不会去除任何前导BOM。如果您将此字符串提供给jsdom，它会逐字解释，从而使BOM保持不变。但jsdom的二进制数据解码代码将剥离前导的BOM，就像浏览器一样;在这种情况下，直接提供`buffer`将会得到想要的结果。

### 关闭一个jsdom

jsdom中定义的定时器（通过`window.setTimeout`或`window.setInterval`设置）将在window上下文中执行代码。由于进程在不活跃的情况下无法执行未来的定时器代码，所以卓越的jsdom定时器将保持您的Node.js进程处于活动状态。同样，对象不活跃的情况下也没有办法在对象的上下文中执行代码，卓越的jsdom定时器将阻止垃圾回收调度它们的window。

如果你想确保关闭jsdom窗口，使用`window.close()`，它将终止所有正在运行的定时器（并且还会删除 `window`和`document`上的任何事件监听器）。

### 在Web浏览器中运行jsdom

使用[browserify](http://browserify.org/)模块，jsdom某些方面也支持在Web浏览器中运行。也就是说，在Web浏览器中，您可以使用被`browserify`模块编译过的jsdom去创建完全独立的普通JavaScript对象集，其外观和行为与浏览器的现有DOM对象非常相似，但完全独立于它们，也就是"虚拟DOM"！

jsdom的主要目标对象仍然是Node.js，因此我们使用仅存在于最新Node.js版本（即Node.js v6 +）中的语言特性功能。因此，在旧版浏览器可能无法正常工作。（即使编译也不会有多大帮助：我们计划在jsdom v10.x的整个过程中广泛使用`Proxy`。）

值得注意的是，jsdom在`web worker`中能很好的运行。项目的开发者[@lawnsea](https://github.com/lawnsea/)使这一功能点成为可能，他发表了一篇关于他的[项目的论文](https://pdfs.semanticscholar.org/47f0/6bb6607a975500a30e9e52d7c9fbc0034e27.pdf)，该论文就使用了这种能力。

在Web浏览器中运行jsdom时，并非所有的工作都完美。有些情况下，这是由于基础的条件限制（比如没有文件系统访问），但有些情况下也是因为我们没有花足够的时间去进行适当的小调整。欢迎大家来提BUG。

### 使用Chrome Devtools调试DOM

从Node.js v6开始，您可以使用Chrome Devtools来调试程序。请参阅[官方文档](https://nodejs.org/en/docs/guides/debugging-getting-started/)了解如何使用。

默认情况下，jsdom元素在控制台中被格式化为普通的旧JS对象。为了便于调试，可以使用[jsdom-devtools-formatter](https://github.com/jsdom/jsdom-devtools-formatter)，它可以让你像真正的DOM元素一样调试它们。

## 注意事项

### 异步脚本加载

使用jsdom时，开发者在加载异步脚本时经常遇到麻烦。许多页面异步加载脚本，但无法分辨脚本什么时候完成，因此无法知道何时是运行代码并检查生成的DOM结构的好时机。这是一个基本的限制;我们无法预测网页上的哪些脚本会做什么，因此无法告诉您脚本何时加载完毕。

这个问题可以通过几种方法来解决。如果您能控制页面逻辑，最好的方法是使用脚本加载器提供的机制来检测何时加载完成。例如，如果您使用像RequireJS这样的模块加载器，代码可能如下所示：
```js
// On the Node.js side:
const window = (new JSDOM(...)).window;
window.onModulesLoaded = () => {
  console.log("ready to roll!");
};
```

```js
<!-- Inside the HTML you supply to jsdom -->
<script>
requirejs(["entry-module"], () => {
  window.onModulesLoaded();
});
</script>
```

如果您不能控制该页面，则可以尝试其他解决方法，例如轮询检查特定元素是否存在。有关更多详细信息，请查看[#640](https://github.com/tmpvar/jsdom/issues/640)中的讨论，尤其是[@ matthewkastor](https://github.com/matthewkastor)的[深刻见解](https://github.com/tmpvar/jsdom/issues/640#issuecomment-22216965)。

### 共享的构造函数和原型

目前，对于大多数Web平台API，jsdom在多个看似独立的jsdoms之间共享相同的类定义。这将意味着，可能会出现以下情况
```js
const dom1 = new JSDOM();
const dom2 = new JSDOM();

dom1.window.Element.prototype.expando = "blah";
console.log(dom2.window.document.createElement("frameset").expando); // logs "blah"
```

这主要是出于性能和内存的原因：如果在Web平台上每次创建jsdom时,创建所有类的单独副本，开销将会相当昂贵。

尽管如此，我们仍然有兴趣在有一天提供一个选项配置来创建一个“独立”的jsdom，但要牺牲一些性能。

### 新API中缺失的功能

与v9.x之前的旧版jsdom API相比，新API显然缺少对资源加载的精细控制。先前版本的jsdom允许您设置request时使用的选项（既可以用于初始请求，也可以用于旧版本的`JSDOM.fromURL()`和子资源请求）。他们还允许您控制请求哪些子资源并将其应用于主文档，以便您可以下载样式表，但不下载脚本文件。最后，他们提供了一个可定制的资源加载器，可以拦截任何传出的请求并用完全合成的response 响应来结束。

以上这些功能尚未在新的jsdom API中实现，尽管我们也希望尽快将它们添加回来，但不幸的是，这需要相当大的幕后工作去实施。

同时，请随时使用旧的jsdom API来访问此功能。它一直处于支持和维护中，但它不会获得新功能。旧的文档位于[`lib/old-api.md`](https://github.com/jsdom/jsdom/blob/master/lib/old-api.md)中。

### 未实现的Web平台部分

目前jsdom中有很多缺失的API，尽管我们也想要在jsdom中添加新的功能并保持最新的Web规范。请随时为缺失的任何内容提交issue，但我们是一个很小并且忙碌的团队，因此大家一起来提交 pull request可能会更好。

除了我们尚未拥有的功能之外，还有两个主要功能目前超出了jsdom的范围。这些是：
- Navigation：在点击链接或赋值location.href或类似操作时可以更改全局对象和所有其他的对象。
- Layout：计算CSS元素的视觉布局的能力，这会影响诸如`getBoundingClientRects()`或者诸如`offsetTop`之类的属性

目前，jsdom对某些功能的某些方面具有虚拟行为，例如操作`navigation` 时向虚拟控制台发送“未实现的”`"jsdomError"`，或者为许多与布局相关的属性返回0。您通常可以在代码中解决这些限制，例如通过在爬网过程中为每个页面创建新的JSDOM实例，或使用`Object.defineProperty`更改各种与布局相关的`getter`和方法的返回值

**请注意**，相同领域中的其他工具（如PhantomJS）确实支持这些功能。在wiki上，我们有关于[jsdom vs. PhantomJS](https://github.com/tmpvar/jsdom/wiki/jsdom-vs.-PhantomJS)的更完整的比较介绍。

## 获取帮助

如果您需要jsdom的帮助，请随时使用以下任何方式：
- [邮件组](https://groups.google.com/forum/#!forum/jsdom)(问题最好以"how do i"的形式)
- [报iusse](https://github.com/tmpvar/jsdom/issues)(最好用BUG 报告)
- IRC频道：#jsdom on freenode

## 特别声明

以上文档翻译自开源项目 jsdom，如有翻译错误，欢迎指正。

[jsdom 原文链接](https://github.com/jsdom/jsdom/blob/master/README.md)

[jsdom 项目链接](https://github.com/jsdom/jsdom)

[原文博客地址](https://github.com/alibaba-paimai-frontend/blog/issues/1)

