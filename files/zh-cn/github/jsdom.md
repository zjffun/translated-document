---
title: jsdom 中文文档
---

<h1 align="center">
    <img width="100" height="100" src="https://github.com/jsdom/jsdom/raw/master/logo.svg" alt=""><br>
    jsdom
</h1>

jsdom 是一个纯粹由 JavaScript 实现的一系列 Web 标准，特别是 WHATWG 组织制定的 [DOM](https://dom.spec.whatwg.org/) 和 [HTML](https://html.spec.whatwg.org/multipage/) 标准，用于在 Node.js 中使用。大体上来说，该项目的目标是模拟足够的 Web 浏览器子集，以便用于测试和挖掘真实世界的 Web 应用程序。

最新版本的 jsdom 运行环境需要 Node.js v14 或者更高的版本。（jsdom v20 以下版本依旧可以在 Node.js 以前的版本使用，但是我们已经不支持维护了。）

## 基本用法

<!-- prettier-ignore-start -->
```js
const jsdom = require("jsdom");
const { JSDOM } = jsdom;
```
<!-- prettier-ignore-end -->

为了使用 jsdom，主要用到 jsdom 主模块的一个命名导出的 `JSDOM` 构造函数。往构造器传递一个字符串，将会得到一个 `JSDOM` 构造实例对象，这个对象有很多实用的属性，特别是 `window` 对象：

<!-- prettier-ignore-start -->
```js
const dom = new JSDOM(`<!DOCTYPE html><p>Hello world</p>`);
console.log(dom.window.document.querySelector("p").textContent); // "Hello world"
```
<!-- prettier-ignore-end -->

（请注意，jsdom 会像浏览器一样解析您传递的 HTML，包括隐含的 `<html>`，`<head>` 和 `<body>` 标记。）

生成的对象是 `JSDOM` 类的一个实例，其中包括 `window` 对象在内的许多有用的属性和方法。一般来说，它可以用来从“外部”对 jsdom 进行操作，而这些操作对于普通 DOM API 来说是不可能的。对于不需要任何功能的简单场景，我们推荐使用类似的编码模式

<!-- prettier-ignore-start -->
```js
const { window } = new JSDOM(`...`);
// or even
const { document } = (new JSDOM(`...`)).window;
```
<!-- prettier-ignore-end -->

下面是关于 `JSDOM` 类所能做的一切的完整文档，在“`JSDOM` 对象 API”部分。

## 定制 jsdom

`JSDOM` 构造函数接受第二个参数，可以用以下方式定制您的 jsdom。

### 简单选项

<!-- prettier-ignore-start -->
```js
const dom = new JSDOM(``, {
  url: "https://example.org/",
  referrer: "https://example.com/",
  contentType: "text/html",
  includeNodeLocations: true,
  storageQuota: 10000000
});
```
<!-- prettier-ignore-end -->

- `url` 设置的值可以通过 `window.location`，`document.URL` 和 `document.documentURI` 来返回，并会影响文档中相关 URL 的解析以及获取子资源时使用的同源限制和 referrer。默认值为`"about:blank"`。
- `referrer` 仅仅影响 `document.referrer` 的值。默认没有引用（即为空字符串）。
- `contentType` 影响 `document.contentType` 的值，是按照 HTML 解析文档还是 XML 来解析。它的值如果不是 [HTML MIME 类型](https://mimesniff.spec.whatwg.org/#html-mime-type) 或 [XML MIME 类型](https://mimesniff.spec.whatwg.org/#xml-mime-type) 值的话将会抛出异常。默认值为`"text/html"`。如果存在 `charset` 参数，它会影响[二进制数据处理](#编码嗅探)。
- `includeNodeLocations` 保留由 HTML 解析器生成的位置信息，允许您使用 `nodeLocation()` 方法（如下所述）检索它。它还能确保在 `<script>` 元素内运行的代码的异常堆栈跟踪中报告的行号是正确的。默认值为 `false` 以提供最佳性能，并且不能与 XML 内容类型一起使用，因为我们的 XML 解析器不支持位置信息。
- `storageQuota` 是 `localStorage` 和 `sessionStorage` 使用的单独存储区域的代码单元的最大大小。尝试存储大于此限制的数据将导致抛出 `DOMException`。默认情况下，受 HTML 规范的启发，每个源设置为 5,000,000 个代码单元。

请注意，`url` 和 `referrer` 在使用之前已经被规范化了，例如：如果你传入 `"https:example.com"`，jsdom 会自动规范化解释为 `"https://example.com/"`。如果你传递了一个不可解析的 URL，该调用将抛出错误。（URL 根据 [URL 标准](https://url.spec.whatwg.org/)进行分析和序列化。）

### 执行脚本

jsdom 最强大的功能是它可以在 jsdom 中执行脚本。这些脚本可以修改页面的内容并访问 jsdom 实现的所有 Web 平台 API。

但是，这在处理不可信内容时也非常危险。jsdom 沙箱并不是万无一失的，在 DOM 的 `<script>` 内部运行的代码如果足够深入，就可以访问 Node.js 环境，从而访问您的计算机。因此，默认情况下，执行嵌入在 HTML 中的脚本的功能是禁用的：

<!-- prettier-ignore-start -->
```js
const dom = new JSDOM(`<body>
  <script>document.body.appendChild(document.createElement("hr"));</script>
</body>`);

// 脚本默认将不会执行：
dom.window.document.body.children.length === 1;
```
<!-- prettier-ignore-end -->

要在页面内启用脚本，可以使用 `runScripts: "dangerously"` 选项：

<!-- prettier-ignore-start -->
```js
const dom = new JSDOM(`<body>
  <script>document.body.appendChild(document.createElement("hr"));</script>
</body>`, { runScripts: "dangerously" });

// 脚本将执行并修改 DOM：
dom.window.document.body.children.length === 2;
```
<!-- prettier-ignore-end -->

我们再次强调只有在提供给 jsdom 的代码是你已知道是安全的才可使用它。如果您运行了任意用户提供的或 Internet 上的不可信的 Node.js 代码，可能会危及您的计算机。

假如你想通过 `<script src="">` 来执行外部脚本，你需要确保已经加载了它们。为此，请添加选项 `resources: "usable"` [如下所述](#加载子资源)。（出于此处讨论的原因，您可能还需要设置 `url` 选项。）

除非 `runScripts` 设置为 `"dangerously"`，否则事件处理属性（如`<div onclick="">`）也将受此选项控制不起作用。（但是，事件处理函数属性，比如 `div.onclick = ...`，将忽略 `runScripts` 参数并且会起作用。）

如果您只是试图从“外部”执行脚本，而不是通过 `<script>` 元素和事件处理属性从“内部”运行，则可以使用 `runScripts: "outside-only"` 选项，这使得所有 JavaScript 规范提供的全局变量的新副本都可以安装在 `window` 上。 这包括诸如 `window.Array`、`window.Promise` 等等。值得注意的是，它还包括 `window.eval` 可以用来运行脚本，运行时将 jsdom 的 `window` 作为全局：

<!-- prettier-ignore-start -->
```js
const { window } = new JSDOM(``, { runScripts: "outside-only" });

window.eval(`document.body.innerHTML = "<p>Hello, world!</p>";`);
window.document.body.children.length === 1;
```
<!-- prettier-ignore-end -->

由于性能原因，默认情况下会关闭此功能，但可以安全启用。

（注意，默认配置下，不设置 `runScripts`，`window.Array`、`window.eval`等的值会与外部 Node.js 环境提供的值相同。即` window.eval === eval` 会成立，所以 `window.eval` 不会以有用的方式运行脚本。）

我们强烈建议不要试图通过将 jsdom 和 Node 全局环境混合在一起（例如，通过执行 `global.window = dom.window`）来“执行脚本”，然后在 Node 全局环境中执行脚本或测试代码。相反，您应该像对待浏览器一样对待 jsdom，并使用 `window.eval` 或 `runScripts: "dangerously"` 来运行需要访问 jsdom 环境内的 DOM 的所有脚本和测试。例如，这可能需要创建一个 browserify 包作为 `<script>` 元素执行 - 就像在浏览器中一样。

最后，对于高级用例，您可以使用 `dom.getInternalVMContext()` 方法，如下所述。

### 假装成一个视觉浏览器

jsdom 没有渲染可视内容的能力，并且默认情况下会像无头浏览器一样工作。它通过 API（如 `document.hidden`）向网页提供提示，表明其内容不可见。

当 `pretendToBeVisual` 选项设置为 true 时，jsdom 会假装它正在呈现并显示内容。它是这样做的：

- 更改 `document.hidden` 以返回 `false` 而不是 `true`
- 更改 `document.visibilityState` 以返回 `"visible"` 而不是 `"prerender"`
- 启用 `window.requestAnimationFrame()` 和 `window.cancelAnimationFrame()` 方法，否则不存在

<!-- prettier-ignore-start -->
```js
const window = (new JSDOM(``, { pretendToBeVisual: true })).window;

window.requestAnimationFrame(timestamp => {
  console.log(timestamp > 0);
});
```
<!-- prettier-ignore-end -->

请注意，jsdom 仍然[不做任何布局或渲染](#未实现的-web-平台部分)，因此这实际上只是假装为可视化，而不是实现真正的可视化 Web 浏览器将实现的部分。

### 加载子资源

#### 基础选项

默认情况下，jsdom 不会加载任何子资源，如脚本，样式表，图像或 iframe。如果您希望 jsdom 加载这些资源，则可以传递 `resources: "usable"` 选项，该选项将加载所有可用资源。资源列表如下：

- 通过 `<frame>` 和 `<iframe>` 加载 frame 和 iframe
- 通过 `<link rel="stylesheet">` 加载样式
- 通过 `<script>` 加载脚本，但是前提是 `runScripts: "dangerously"` 设置了
- 通过 `<img>` 加载图片，但是前提是 `canvas` npm 包已安装（详见下面的[支持 Canvas](#支持-canvas)）

尝试加载资源时，请记住 `url` 选项的默认值是 `"about:blank"`，这意味着通过相对 URL 包含的任何资源都将无法加载。（针对 URL `about:blank` 解析 URL `/something` 的结果是一个错误。）因此，在这些情况下，您可能希望为 `url` 选项设置一个非默认值，或使用自动执行此操作的[便捷的 API](#便捷的-api) 之一。

#### 高级配置

要更全面地自定义 jsdom 的资源加载行为，可以将 `ResourceLoader` 类的实例作为 `resources` 选项值传递：

<!-- prettier-ignore-start -->
```js
const resourceLoader = new jsdom.ResourceLoader({
  proxy: "http://127.0.0.1:9001",
  strictSSL: false,
  userAgent: "Mellblomenator/9000",
});
const dom = new JSDOM(``, { resources: resourceLoader });
```
<!-- prettier-ignore-end -->

`ResourceLoader` 构造函数的三个选项是：

- `proxy` 是要使用的 HTTP 代理的地址。
- `strictSSL` 可以设置为 false 以禁用 SSL 证书有效的要求。
- `userAgent` 影响发送的 `User-Agent` 标头，从而影响 `navigator.userAgent` 的结果值。 它默认为 <code>\`Mozilla/5.0 (${process.platform || "unknown OS"}) AppleWebKit/537.36 (KHTML, like Gecko) jsdom/${jsdomVersion}\`</code>。

您可以通过继承 `ResourceLoader` 并覆盖 `fetch()` 方法来进一步自定义资源获取。例如，覆盖指定 URL 返回的内容：

<!-- prettier-ignore-start -->
```js
class CustomResourceLoader extends jsdom.ResourceLoader {
  fetch(url, options) {
    // 重写此脚本的内容以执行一些不寻常的操作。
    if (url === "https://example.com/some-specific-script.js") {
      return Promise.resolve(Buffer.from("window.someGlobal = 5;"));
    }

    return super.fetch(url, options);
  }
}
```
<!-- prettier-ignore-end -->

jsdom 在遇到之前说到的“可用”资源时会调用自定义资源加载器的 `fetch()` 方法。该方法接受一个 URL 字符串，以及一些在调用 `super.fetch()` 时应透传的选项。它必须返回一个 Node.js 的 `Buffer` 对象的 promise，或者如果有意不加载资源则返回 `null`。一般来说，大多数情况下都希望像上面代码一样委托给 `super.fetch()`。

可以在 `fetch()` 中收到的选项之一是获取资源的元素（如果适用）。

<!-- prettier-ignore-start -->
```js
class CustomResourceLoader extends jsdom.ResourceLoader {
  fetch(url, options) {
    if (options.element) {
      console.log(`Element ${options.element.localName} is requesting the url ${url}`);
    }

    return super.fetch(url, options);
  }
}
```
<!-- prettier-ignore-end -->

### 虚拟控制台

像网页浏览器一样，jsdom 也具有“控制台”的概念。通过在文档内执行的脚本以及来自 jsdom 本身实现的信息和记录会从页面直接发送过来。我们将用户可控制的控制台称为“虚拟控制台”，以便将其与 Node.js `console` API 和页面内部的 `window.console` API 区分开来。

默认情况下，`JSDOM` 构造函数将返回一个具有虚拟控制台的实例，该虚拟控制台将其所有输出转发到 Node.js 控制台。为了创建自己的虚拟控制台并将其传递给 jsdom，可以通过执行下面代码来覆盖此默认值

<!-- prettier-ignore-start -->
```js
const virtualConsole = new jsdom.VirtualConsole();
const dom = new JSDOM(``, { virtualConsole });
```
<!-- prettier-ignore-end -->

这样的代码将创建一个没有任何行为的虚拟控制台。您可以为所有可能的控制台方法添加事件侦听器来为其提供行为：

<!-- prettier-ignore-start -->
```js
virtualConsole.on("error", () => { ... });
virtualConsole.on("warn", () => { ... });
virtualConsole.on("info", () => { ... });
virtualConsole.on("dir", () => { ... });
// ... etc. See https://console.spec.whatwg.org/#logging
```
<!-- prettier-ignore-end -->

（请注意，最好在调用 `new JSDOM()` 之前设置这些事件侦听器，因为在解析期间可能会发生错误或控制台调用脚本错误。）

如果你只是想将虚拟控制台输出重定向到另一个控制台，比如默认的 Node.js，你可以这样做

<!-- prettier-ignore-start -->
```js
virtualConsole.sendTo(console);
```
<!-- prettier-ignore-end -->

还有一个特殊的事件，`"jsdomError"`，它的触发将通过错误对象来记录 jsdom 本身的错误。这与错误消息在 Web 浏览器控制台中的显示方式类似，即使它们不是由 console.error 输出的。到目前为止，错误会按照下面的方式输出：

- 加载或解析子资源时出错（脚本，样式表，frames 和 iframe）
- 不是由 window `onerror` 事件处理程序处理的脚本执行错误，它将会返回 `true` 或调用 `event.preventDefault()`
- 由于调用 jsdom 没有实现的方法而导致的错误，例如 `window.alert`，兼容性的 Web 浏览器都实现了这些方法

如果您使用 `sendTo(c)` 将错误发送给 `c`，则默认情况下，它将使用来自`"jsdomError"`事件的信息调用 `c.error(errorStack[, errorDetail])`。如果您希望保持事件与方法调用的严格的一对一映射，并且可能自己处理`"jsdomError"`，那么您可以执行

<!-- prettier-ignore-start -->
```js
virtualConsole.sendTo(c, { omitJSDOMErrors: true });
```
<!-- prettier-ignore-end -->

### Cookie 容器

像网页浏览器一样，jsdom 也具有 cookie 容器的概念，存储 HTTP cookie。在文档的同一个域上一个 URL，并且没有标记为 HTTP-only 的 cookies，可以通过`document.cookie` API 来访问。此外，cookie 容器中的所有 cookie 都会影响子资源的加载。

默认情况下，`JSDOM` 构造函数将返回一个带有空 cookie 的实例。要创建自己的 cookie 容器并将其传递给 jsdom，可以通过以下代码来覆盖默认值

<!-- prettier-ignore-start -->
```js
const cookieJar = new jsdom.CookieJar(store, options);
const dom = new JSDOM(``, { cookieJar });
```
<!-- prettier-ignore-end -->

如果您想要在多个 jsdom 中共享同一个 cookie 容器，或者提前使用特定的值来填充 cookie 容器，这将非常有用。

Cookie jar 由 [tough-cookie](https://www.npmjs.com/package/tough-cookie) 包提供。`jsdom.CookieJar`构造函数是 tough-cookie cookie 容器的子类，并且默认设置了 `looseMode：true` 选项，因为它[更符合浏览器的行为方式](https://github.com/whatwg/html/issues/804)。如果您想自己使用 tough-cookie 的方法和类，则可以使用 `jsdom.toughCookie` 模块导出来访问使用 jsdom 打包的 tough-cookie 模块实例。

### 在解析之前进行干预

jsdom 允许您在很早的时候介入创建 jsdom：创建 Window 和 Document 对象之后，但在解析任何 HTML 并使用节点填充文档之前：

<!-- prettier-ignore-start -->
```js
const dom = new JSDOM(`<p>Hello</p>`, {
  beforeParse(window) {
    window.document.childNodes.length === 0;
    window.someCoolAPI = () => { /* ... */ };
  }
});
```
<!-- prettier-ignore-end -->

如果您想以某种方式修改环境，例如为 jsdom 不支持的 Web 平台 API 添加 shim，这将特别有用。

## `JSDOM` object API

一旦你构建了一个 `JSDOM` 对象，它将具有以下有用的功能：

### Properties

`window` 属性: `window` 对象的 key 从 `Window` 对象检索而来。

`virtualConsole` 和 `cookieJar`：可以传入或者使用默认值。

### 通过 `serialize()` 序列化 document

`serialize()` 方法将返回文档的 [HTML 序列化](https://html.spec.whatwg.org/#html-fragment-serialisation-algorithm)，包括 doctype：

<!-- prettier-ignore-start -->
```js
const dom = new JSDOM(`<!DOCTYPE html>hello`);

dom.serialize() === "<!DOCTYPE html><html><head></head><body>hello</body></html>";

// 对比:
dom.window.document.documentElement.outerHTML === "<html><head></head><body>hello</body></html>";
```
<!-- prettier-ignore-end -->

### 通过 `nodeLocation(node)` 获取节点的源位置信息

`nodeLocation()`方法将查找 DOM 节点在源文档中的位置，并返回节点的 [parse5 位置信息](https://www.npmjs.com/package/parse5#options-locationinfo)：

<!-- prettier-ignore-start -->
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
<!-- prettier-ignore-end -->

请注意，只有设置了 `includeNodeLocations` 选项才能使用此功能；由于性能原因这个选项默认为关闭。

### 使用 `getInternalVMContext()` 与 Node.js `vm` 模块交互

Node.js 的内置 [`vm`](https://nodejs.org/api/vm.html) 模块是 jsdom 脚本运行魔法的基础。一些高级用例，例如预编译脚本然后多次运行，可以通过直接使用 `vm` 模块和 jsdom 创建的 `Window` 实现。

可以使用 `getInternalVMContext()` 方法获取与 `vm` API 一起使用的[上下文化的全局对象](https://nodejs.org/api/vm.html#vm_what_does_it_mean_to_contextify_an_object)：

<!-- prettier-ignore-start -->
```js
const { Script } = require("vm");

const dom = new JSDOM(``, { runScripts: "outside-only" });
const script = new Script(`
  if (!this.ran) {
    this.ran = 0;
  }

  ++this.ran;
`);

const vmContext = dom.getInternalVMContext();

script.runInContext(vmContext);
script.runInContext(vmContext);
script.runInContext(vmContext);

console.assert(dom.window.ran === 3);
```
<!-- prettier-ignore-end -->

这是高级功能，除非您有特殊的需求，否则我们建议坚持使用普通的 DOM API（如 `window.eval()` 或 `document.createElement("script")`）。

请注意，如果在没有设置 `runScripts` 的情况下创建了 `JSDOM` 实例，或者如果您 [在 Web 浏览器中使用 jsdom](#在-web-浏览器中运行-jsdom)，此方法将抛出异常。

### 通过 `reconfigure(settings)` 重新配置 jsdom

`window.top` 属性在规范中被标记为 `[Unforgeable]`，这意味着它是一个不可配置的私有属性，因此在 jsdom 内运行的普通代码是不能覆盖或隐藏它，即使使用 `Object.defineProperty`。

同样，目前在 jsdom 中是不能够处理导航相关信息的（比如设置 `window.location.href = "https://example.com/"`）；这样做会导致在虚拟控制台报 `"jsdomError"` 错误，说明此功能未实现，并且没有任何变化：也将不会有新的 `Window` 或 `Document` 对象，并且现有 `window` 的 `location` 对象仍保持当前所有相同的属性值。

但是，如果您从 jsdom 窗口之外进行操作，例如在一些创建 jsdom 的测试框架中，可以使用特殊的 `reconfigure()` 方法覆盖其中的一个或两个：

<!-- prettier-ignore-start -->
```js
const dom = new JSDOM();

dom.window.top === dom.window;
dom.window.location.href === "about:blank";

dom.reconfigure({
  windowTop: myFakeTopForTesting,
  url: "https://example.com/",
});

dom.window.top === myFakeTopForTesting;
dom.window.location.href === "https://example.com/";
```
<!-- prettier-ignore-end -->

请注意，更改 jsdom 的 URL 将影响所有返回当前 document URL 的 API，例如 `window.location`、`document.URL` 和 `document.documentURI `，以及文档中相对 URL 的解析以及同源检查和提取子资源时使用的来源。但是，它不会执行导航到该 URL 的内容；DOM 的内容将保持不变，并且不会创建 `Window`，`Document`等新的实例。

## 便捷的 API

### `fromURL()`

除了 `JSDOM` 构造函数本身之外，jsdom 还提供了一个返回 Promise 的工厂方法，用于通过 URL 构建一个 jsdom 实例：

<!-- prettier-ignore-start -->
```js
JSDOM.fromURL("https://example.com/", options).then(dom => {
  console.log(dom.serialize());
});
```
<!-- prettier-ignore-end -->

如果 URL 有效且请求成功，则 `onFullfilled` 回调执行并返回 `JSDOM` 实例。任何 URL 重定向都将遵循其最终目的地。

`fromURL()` 提供的选项与提供给 `JSDOM` 构造函数的选项类似，但具有以下额外的限制和后果：

- `url` 和 `contentType` 参数不能被提供。
- `referrer` 选项用作初始请求的 HTTP `Referer` 请求头。
- `resources` 选项也会影响初始请求；这很有用，例如，如果您想配置代理（见上文）。
- 生成的 jsdom 的 URL、内容类型和来源是由响应来决定。
- 任何通过 HTTP `Set-Cookie` 响应头设置的 cookie 都存储在 jsdom 的 cookie 容器中。同样，已提供的 cookie 容器中的任何 cookie 都会作为 HTTP `Cookie` 请求头发送。

### `fromFile()`

与 `fromURL()` 类似，jsdom 还提供了一个 `fromFile()` 工厂方法，用于从文件名构建 jsdom：

<!-- prettier-ignore-start -->
```js
JSDOM.fromFile("stuff.html", options).then(dom => {
  console.log(dom.serialize());
});
```
<!-- prettier-ignore-end -->

如果可以打开给定的文件，则 `onFullfilled` 回调执行并返回 `JSDOM` 实例。和 Node.js API 一样，文件名是相对于当前工作目录的。

`fromFile()` 提供的选项与提供给 `JSDOM` 构造函数的选项相似，但具有以下额外的默认值：

- `url` 选项将默认为给定文件名相对应的文件 URL，而不是 `"about：blank"`。
- 假如给定的文件名是以 `.xht`、`.xhtml` 或者 `.xml` 为后缀的话，`contentType` 选项默认为 `"application/xhtml+xml"`；反之为 `"text/html"`。

### `fragment()`

对于最简单的情况，你可能不需要一个完整的 `JSDOM` 实例及其所有相关的功能。您甚至可能不需要 `Window` 或 `Document`！相反，你只需要解析一些 HTML 片段，并获得一个你可以操作的 DOM 对象。为此，我们提供了 `fragment()`，它可以从给定的字符串中创建一个` DocumentFragment`：

<!-- prettier-ignore-start -->
```js
const frag = JSDOM.fragment(`<p>Hello</p><p><strong>Hi!</strong>`);

frag.childNodes.length === 2;
frag.querySelector("strong").textContent === "Hi!";
// etc.
```
<!-- prettier-ignore-end -->

`frag` 是 [`DocumentFragment`](https://developer.mozilla.org/zh-CN/docs/Web/API/DocumentFragment) 的实例对象，其内容是通过提供的字符串解析创建的。解析是通过使用 `<template>` 元素完成的，因此您可以在其中包含任何元素（包括具有奇怪解析规则的元素，如 `<td>`）。还需要注意的是，生成的 `DocumentFragment` 不会有[关联的浏览上下文](https://html.spec.whatwg.org/multipage/#concept-document-bc)：即元素的 `ownerDocument` 将有一个空的 `defaultView` 属性，资源不会加载，等等。

`fragment()` 工厂函数的所有调用结果的 `DocumentFragments` 实例都会共享相同的 `Document`。这允许多次调用 `fragment()` 而没有额外的开销。但这也意味着对 `fragment()` 的调用不能用任何选项自定义。

请注意，对 `DocumentFragments` 的序列化并不像使用 `JSDOM` 对象那样容易。如果你需要序列化你的 DOM ，你应该直接使用 `JSDOM` 构造函数。但对于包含单个元素的片段的特殊情况，通过常规方法就很容易做到。

<!-- prettier-ignore-start -->
```js
const frag = JSDOM.fragment(`<p>Hello</p>`);
console.log(frag.firstChild.outerHTML); // logs "<p>Hello</p>"
```
<!-- prettier-ignore-end -->

## 其他值得注意的功能

### 支持 Canvas

jsdom 支持使用 [`canvas`](https://www.npmjs.com/package/canvas) 包来扩展任何使用 canvas API 的 `<canvas>` 元素。为了做到这一点，您需要将 `canvas` 作为依赖项加入到您的项目中，和 `jsdom` 包并列。如果 jsdom 可以找到 `canvas` 包，它将使用它，但是如果它不存在，那么 `<canvas>` 元素的行为就像 `<div>` 一样。从 jsdom v13 开始，需要 `canvas` 的 2.x 版本；不再支持 1.x 版。

### 编码嗅探

除了提供一个字符串外，`JSDOM` 构造函数还支持 Node.js [`Buffer`](https://nodejs.org/docs/latest/api/buffer.html)或标准 JavaScript 二进制数据类型（如 `ArrayBuffer`，`Uint8Array`，`DataView` 等）的形式提供二进制数据。当完成后，jsdom 将就像浏览器一样从提供的字节进行[嗅探编码](https://html.spec.whatwg.org/multipage/syntax.html#encoding-sniffing-algorithm)，扫描 `<meta charset>` 标签。

如果提供的 `contentType` 选项包含 `charset` 参数，则该编码将覆盖嗅探的编码 - 除非存在 UTF-8 或 UTF-16 BOM，在这种情况下嗅探的编码优先。（同样就像浏览器。）

这种编码嗅探也适用于 `JSDOM.fromFile()` 和 `JSDOM.fromURL()`。在后一种情况下，就像在浏览器中一样，任何与响应一起发送的 `Content-Type` 头信息优先级更高，与构造函数的 `contentType` 选项的方式相同。

请注意，在许多情况下，提供字节这种方式可能比提供字符串更好。例如，如果您试图使用 Node.js 的 `buffer.toString('utf-8')` API，则 Node.js 将不会去除任何前导 BOM。如果您将此字符串提供给 jsdom，它会逐字解释，从而使 BOM 保持不变。但 jsdom 的二进制数据解码代码将剥离前导的 BOM，就像浏览器一样；在这种情况下，直接提供 `buffer` 将会得到想要的结果。

### 关闭 jsdom

jsdom 中定义的定时器（通过 `window.setTimeout()` 或 `window.setInterval()` 设置）将在 window 上下文中执行代码。由于进程在不活跃的情况下无法执行未来的定时器代码，所以卓越的 jsdom 定时器将保持您的 Node.js 进程处于活动状态。同样，对象不活跃的情况下也没有办法在对象的上下文中执行代码，卓越的 jsdom 定时器将阻止垃圾回收调度它们的 window。

如果你想确保关闭 jsdom 窗口，使用 `window.close()`，它将终止所有正在运行的定时器（并且还会删除 `window` 和 `document` 上的任何事件监听器）。

### 在 Web 浏览器中运行 jsdom

使用 [browserify](http://browserify.org/) 模块，jsdom 某些方面也支持在 Web 浏览器中运行。也就是说，在 Web 浏览器中，您可以使用被 `browserify` 模块编译过的 jsdom 去创建完全独立的普通 JavaScript 对象集，其外观和行为与浏览器的现有 DOM 对象非常相似，但完全独立于它们，也就是“虚拟 DOM”！

jsdom 的主要目标对象仍然是 Node.js，因此我们使用仅存在于最新 Node.js 版本中的语言特性功能。因此，在旧版浏览器可能无法正常工作。（即使编译也不会有多大帮助：我们在整个 jsdom 代码库中广泛使用 `Proxy`。）

值得注意的是，jsdom 在 Web Worker 中能很好的运行。项目的开发者 [@lawnsea](https://github.com/lawnsea/) 使这一功能点成为可能，他发表了一篇关于他的[项目的论文](https://pdfs.semanticscholar.org/47f0/6bb6607a975500a30e9e52d7c9fbc0034e27.pdf)，该论文就使用了这种能力。

在 Web 浏览器中运行 jsdom 时，并非所有的工作都完美。有些情况下，这是由于基础的条件限制（比如没有文件系统访问），但有些情况下也是因为我们没有花足够的时间去进行适当的小调整。欢迎大家来提 bug。

### 使用 Chrome 开发者工具调试 DOM

可以使用 Chrome 开发者工具来调试 Node.js 程序。请参阅[官方文档](https://nodejs.org/en/docs/inspector/)了解如何使用。

默认情况下，jsdom 元素在控制台中被格式化为普通的旧 JS 对象。为了便于调试，可以使用[jsdom-devtools-formatter](https://github.com/jsdom/jsdom-devtools-formatter)，它可以让你像真正的 DOM 元素一样调试它们。

## 注意事项

### 异步脚本加载

使用 jsdom 时，开发者在加载异步脚本时经常遇到麻烦。许多页面异步加载脚本，但无法分辨脚本什么时候完成，因此无法知道何时是运行代码并检查生成的 DOM 结构的好时机。这是一个基本的限制；我们无法预测网页上的哪些脚本会做什么，因此无法告诉您脚本何时加载完毕。

这个问题可以通过几种方法来解决。如果您能控制页面逻辑，最好的方法是使用脚本加载器提供的机制来检测何时加载完成。例如，如果您使用像 RequireJS 这样的模块加载器，代码可能如下所示：

<!-- prettier-ignore-start -->
```js
// On the Node.js side:
const window = (new JSDOM(...)).window;
window.onModulesLoaded = () => {
  console.log("ready to roll!");
};
```
<!-- prettier-ignore-end -->

<!-- prettier-ignore-start -->
```html
<!-- Inside the HTML you supply to jsdom -->
<script>
requirejs(["entry-module"], () => {
  window.onModulesLoaded();
});
</script>
```
<!-- prettier-ignore-end -->

如果您不能控制该页面，则可以尝试其他解决方法，例如轮询检查特定元素是否存在。

有关更多详细信息，请查看[#640](https://github.com/tmpvar/jsdom/issues/640)中的讨论，尤其是 [@matthewkastor](https://github.com/matthewkastor) 的[深刻见解](https://github.com/tmpvar/jsdom/issues/640#issuecomment-22216965)。

### 未实现的 Web 平台部分

目前 jsdom 中有很多缺失的 API，尽管我们也想要在 jsdom 中添加新的功能并保持最新的 Web 规范。请随时为缺失的任何内容提交 issue，但我们是一个很小并且忙碌的团队，因此大家一起来提交 pull request 可能会更好。

除了我们尚未拥有的功能之外，还有两个主要功能目前超出了 jsdom 的范围。这些是：

- **导航**：在点击链接或赋值 `location.href` 或类似操作时可以更改全局对象和所有其他的对象。
- **布局**：计算 CSS 元素的视觉布局的能力，这会影响诸如 `getBoundingClientRects()` 或者诸如 `offsetTop` 之类的属性。

目前，jsdom 对某些功能的某些方面具有虚拟行为，例如操作导航时向虚拟控制台发送“未实现的”`"jsdomError"`，或者为许多与布局相关的属性返回 0。您通常可以在代码中解决这些限制，例如通过在爬网过程中为每个页面创建新的 `JSDOM` 实例，或使用 `Object.defineProperty()` 更改各种与布局相关的 getter 和方法的返回值

请注意，相同领域中的其他工具（如 PhantomJS）确实支持这些功能。在 wiki 上，我们有关于 [jsdom 与 PhantomJS 比较](https://github.com/jsdom/jsdom/wiki/jsdom-vs.-PhantomJS)的更完整的介绍。

## 支持 jsdom

jsdom 是一个社区驱动的项目，由[志愿者](https://github.com/orgs/jsdom/people)团队维护。您可以通过以下方式支持 jsdom：

- 在 Tidelift 订阅中[获得对 jsdom 的专业支持](https://tidelift.com/subscription/pkg/npm-jsdom?utm_source=npm-jsdom&utm_medium=referral&utm_campaign=readme)。Tidelift 帮助我们实现开源的可持续发展，同时为团队提供维护、许可和安全方面的保证。
- 直接对项目[做贡献](https://github.com/jsdom/jsdom/blob/master/Contributing.md)。

## 获取帮助

如果您需要 jsdom 的帮助，请随时使用以下任何方式：

- [邮件组](https://groups.google.com/group/jsdom)（最好以 “how do I” 的形式提问）
- [提 issue](https://github.com/jsdom/jsdom/issues)（最好用来提 bug）
- Matrix 房间：[#jsdom:matrix.org](https://matrix.to/#/#jsdom:matrix.org)

---

原文地址：[jsdom/jsdom: A JavaScript implementation of various web standards, for use with Node.js](https://github.com/jsdom/jsdom)

此翻译由 [zjffun/translated-document](https://github.com/zjffun/translated-document) 提供，在 GitHub 上[完善此翻译](https://github.com/zjffun/translated-document/edit/main/files/zh-cn/github/jsdom.md)。
