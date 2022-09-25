# 纯 ESM 包

链接到这里的包现在是纯 [ESM](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules)。它不能使用 CommonJS 的 `require()` 引入。

这意味着你有以下选择：

1. 自己使用 ESM。 **（首选）**\
   使用 `import foo from 'foo'` 而不是 `const foo = require('foo')` 来导入包。你还需要在你的 package.json 中加入 `"type": "module"` 等等。请遵循以下指南。
2. 如果是在异步上下文中使用包，你可以在 CommonJS 中使用 [`await import(...)`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/import#dynamic_imports)，而不是 `require(...)`。
3. 继续使用该软件包的现有（CommonJS）版本，直到你可以迁移到 ESM。

**你还需要确保你使用的是最新的 Node.js 次要版本。至少 Node.js 12.20、14.14 或 16.0。**

我强烈建议迁移到 ESM。 ESM 仍然可以导入 CommonJS 包，但是 CommonJS 包不能同步地导入 ESM 包。

Node.js 12 及更高版本原生支持 ESM。

**我的仓库不是问 ESM/TypeScript/Webpack/Jest/ts-node/CRA 支持问题的地方。**

## 常问问题

### 如何将我的 CommonJS 项目移动到 ESM？

- 将 `"type": "module"` 添加到你的 package.json。
- 将 package.json 中的 `"main": "index.js"` 替换为 `"exports": "./index.js"`。
- 将 package.json 中的 `"engines"` 字段更新为 Node.js 14: `"node": ">=14.16"`。 （不包括 Node.js 12，因为它不再受支持）
- 从所有 JavaScript 文件中删除 `'use strict';`。
- 将所有 `require()`/`module.export` 替换为 `import`/`export`。
- 仅使用完整的相对文件路径进行导入：`import x from '.';` → `import x from './index.js';`。
- 如果你有 TypeScript 类型定义（例如，`index.d.ts`），请将其更新为使用 ESM 导入/导出。
- 可选但建议使用 [`node:` 协议](https://nodejs.org/api/esm.html#esm_node_imports) 进行导入。

旁注：如果你正在寻找有关如何向 JavaScript 包添加类型的指导，[查看我的指南](https://github.com/sindresorhus/typescript-definition-style-guide)。

### 我可以在我的 TypeScript 项目中导入 ESM 包吗？

可以，但你需要将项目转换为输出 ESM。见下文。

### 如何让我的 TypeScript 项目输出 ESM？

- 确保你使用的是 TypeScript 4.7 或更高版本。
- 将 `"type": "module"` 添加到你的 package.json。
- 将 package.json 中的 `"main": "index.js"` 替换为 `"exports": "./index.js"`。
- 将 package.json 中的 `"engines"` 字段更新为 Node.js 14: `"node": ">=14.16"`。 （不包括 Node.js 12，因为它不再受支持）
- 将 [`"module": "node16", "moduleResolution": "node16"`](https://www.typescriptlang.org/tsconfig#module) 添加到你的 tsconfig.json。 _([示例](https://github.com/sindresorhus/tsconfig/blob/main/tsconfig.json))_
- 仅使用完整的相对文件路径进行导入：`import x from '.';` → `import x from './index.js';`。
- 删除 `namespace` 的使用并改用 `export`。
- 可选但建议使用 [`node:` 协议](https://nodejs.org/api/esm.html#esm_node_imports) 进行导入。
- **即使你正在导入 `.ts` 文件，你也必须在相对导入中使用 `.js` 扩展名。**

还要确保阅读[官方 TypeScript 指南](https://devblogs.microsoft.com/typescript/announcing-typescript-4-7-beta/#ecmascript-module-support-in-node-js)。

如果你使用 `ts-node`，请遵循[本指南](https://github.com/TypeStrong/ts-node/issues/1007)。

### 如何在 Electron 中导入 ESM？

[Electron 还没有原生地支持 ESM。](https://github.com/electron/electron/issues/21457)

你有以下选择：

1. 使用有问题的软件包的前一个版本。
2. 使用 Webpack 将你的依赖项打包为 CommonJS。
3. 使用 [`esm`](https://github.com/standard-things/esm) 包。

### 使用 ESM 和 Webpack 时遇到问题

这个问题出在 Webpack 或你的 Webpack 配置上。首先，确保你使用的是最新版本的 Webpack。请不要在我的仓库中提 issue。尝试在 Stack Overflow 上提问或 [open an issue the Webpack repo](https://github.com/webpack/webpack)。

### 使用 ESM 和 Next.js 时遇到问题

你必须启用 [ESM 的实验性支持](https://nextjs.org/blog/next-11-1#es-modules-support)。

### 使用 ESM 和 Jest 时遇到问题

[首先阅读这个文档。](https://github.com/facebook/jest/blob/64de4d7361367fd711a231d25c37f3be89564264/docs/ECMAScriptModules.md) 这个问题出在 Jest ([#9771](https://github.com/facebook/jest/issues/9771)) 或你的 Jest 配置。首先，确保你使用的是最新版本的 Jest。请不要在我的仓库中提 issue。尝试在 Stack Overflow 上提问或 [给 Jest 提 issue](https://github.com/facebook/jest)。

### 使用 ESM 和 TypeScript 时遇到问题

如果你决定让你的项目使用 ESM（将 `"type": "module"` 设置在你的 package.json 中），请确保 [`"module": "nodenext"`](https://www.typescriptlang.org/tsconfig#module) 在你的 tsconfig.json 文件中，并且你对本地文件的所有导入语句都使用 `.js` 扩展名，**而不是** `.ts` 或不使用扩展名。

### 遇到了 ESM 和 `ts-node` 的问题

遵循[本指南](https://github.com/TypeStrong/ts-node/issues/1007) 并确保你使用的是最新版本的 `ts-node`。

### 使用 ESM 和 Create React App 时遇到问题

Create React App 还不完全支持 ESM。我建议在他们的仓库中提你遇到的问题的 issue。一个已知问题是 [#10933](https://github.com/facebook/create-react-app/issues/10933)。

### 如何将 TypeScript 与 AVA 一起用于 ESM 项目？

遵循[本指南](https://github.com/avajs/ava/blob/main/docs/recipes/typescript.md#for-packages-with-type-module)。

### 如何确保不会意外使用 CommonJS 特定的约定？

我们提供了这个 [ESLint 规则](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/prefer-module.md)。你还应该使用[这个规则](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/prefer-node-protocol.md)。

### 如何代替 `__dirname` 和 `__filename`？

```js
import { fileURLToPath } from "node:url";
import path from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
```

但是，在大多数情况下，这样会更好：

```js
import { fileURLToPath } from "node:url";

const foo = fileURLToPath(new URL("foo.js", import.meta.url));
```

许多 Node.js API 直接接受 URL，所以你可以这样做：

```js
const foo = new URL("foo.js", import.meta.url);
```

### 如何在测试时导入模块并绕过缓存？

目前还没有很好的方法来做到这一点。直到我们可以使用 [ESM 加载程序挂钩](https://github.com/nodejs/modules/issues/307)。现在，这个段代码可能很有用：

```js
const importFresh = async (modulePath) =>
  import(`${modulePath}?x=${new Date()}`);

const chalk = (await importFresh("chalk")).default;
```

_注意：这会导致内存泄漏，所以只能用于测试，不能用于生产。此外，它只会重新加载导入的模块，而不是它的依赖项。_

### 如何导入 JSON？

JavaScript 模块最终将[原生支持 JSON](https://github.com/tc39/proposal-json-modules)，但现在，你可以这样做：

```js
import fs from "node:fs/promises";

const packageJson = JSON.parse(await fs.readFile("package.json"));
```

### 什么时候应该使用默认导出或命名导出？

我的一般规则是，如果某个东西导出一个主要的东西，它应该是默认导出。

请记住，你可以在有意义的情况下将默认导出与命名导出相结合：

```js
import readJson, { JSONError } from "read-json";
```

在这里，我们导出了主要的 `readJson`，但我们也导出了一个错误作为命名导出。

#### 异步和同步 API

如果你的包同时具有异步和同步主 API，我建议使用命名导出：

```js
import { readJson, readJsonSync } from "read-json";
```

这使读者清楚地知道该包导出了多个主要 API。我们还遵循 Node.js 的约定，即使用 `Sync` 为同步 API 加后缀。

#### 可读的命名导出

我注意到对命名导出使用过于通用的名称的包的错误模式：

```js
import { parse } from "parse-json";
```

这迫使消费者要么接受不明确的名称（这可能导致命名冲突），要么重命名它：

```js
import { parse as parseJson } from "parse-json";
```

相反，这样更易于使用：

```js
import { parseJson } from "parse-json";
```

#### 例子

使用 ESM，我现在更喜欢描述性命名导出而不是命名空间默认导出：

CommonJS（之前）：

```js
const isStream = require('is-stream');

isStream.writable(…);
```

ESM（现在）：

```js
import {isWritableStream} from 'is-stream';

isWritableStream(…);
```
