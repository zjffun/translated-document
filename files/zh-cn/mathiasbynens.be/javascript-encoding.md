# JavaScript 的内部字符编码：UCS-2 还是 UTF-16？

2012 年 1 月 20 日发布 · 标记为 [JavaScript](https://mathiasbynens.be/notes#javascript), [Unicode](https://mathiasbynens.be/notes#unicode)

JavaScript 使用 UCS-2 还是 UTF-16 编码？由于我在任何地方都找不到这个问题的明确答案，所以我决定调查一下。答案取决于你指的是 JavaScript 引擎，或语言级别的 JavaScript。

让我们从基础开始……

## BMP 介绍 ₁

Unicode 通过明确的名称和称其为代码点的整数来识别字符。例如，`©` 字符被命名为“版权标志”，其代码点为 U+00A9 —— `0xA9` 可以写成十进制的 `169`。

Unicode 代码空间分为 17 个平面，每个平面有 2^16（65,536）个代码点。其中一些代码点尚未分配字符值，一些保留供私人使用，还有一些永久保留为非字符。每个平面中的代码点具有从 `xy0000` 到 `xyFFFF` 的十六进制值，其中 `xy` 是从 `00` 到 `10` 的十六进制值，表示这些值属于哪个平面。

第一个平面（`xy` 是 `00`）被称为基本多文种平面或者 BMP。它包含从 U+0000 到 U+FFFF 的代码点，这些是最常用的字符。

其他十六个平面（U+010000 → U+10FFFF）称为补充平面或星体平面。我不会在这里讨论它们；只需要记住，有 BMP 字符和非 BMP 字符，后者也称为补充字符或星体字符。

## UCS-2 和 UTF-16 的区别

UCS-2 和 UTF-16 都是 Unicode 的字符编码。

**UCS-2**（2 字节通用字符集）通过简单的将代码点作为 **16 位代码单元**来生成**固定长度**编码。对于从 `0` 到 `0xFFFF`（即 BMP）范围内的大多数代码点，这会产生与 UTF-16 完全相同的结果。

[**UTF-16**](https://tools.ietf.org/html/rfc2781)（16 位 Unicode 转换格式）是 UCS-2 的扩展，允许表示 BMP 之外代码点。它产生一个**可变长度**结果，**每个代码点由一个或两个 16 位代码单元**组成。这样，它可以对从 `0` 到 `0x10FFFF` 范围内的代码点进行编码。

例如，在 UCS-2 和 UTF-16 中，BMP 字符 U+00A9 版权符号（`©`）被编码为 `0x00A9`。

### 代理对

BMP 之外的字符，例如 U+1D306「中」符号（`𝌆`）₂，只能使用两个 16 位代码单元以 UTF-16 编码：`0xD834 0xDF06`。这称为代理对。请注意，代理对仅表示单个字符。

代理对的第一个代码单元始终在`0xD800`到`0xDBFF`的范围内，称为高半代理或前半代。

代理对的第二个代码单元始终在`0xDC00`到`0xDFFF`的范围内，称为低半代理或后半代。

UCS-2 缺少代理对的概念，因此将`0xD834 0xDF06`（之前的 UTF-16 编码）解释为两个单独的字符。

### 在代码点和代理对之间转换

[Unicode 3.0 规范的第 3.7 节](http://unicode.org/versions/Unicode3.0.0/ch03.pdf) 定义了与代理对相互转换的算法。

根据以下公式，大于 `0xFFFF` 的代码点 `C` 对应于代理对 `<H, L>`：

```
H = Math.floor((C - 0x10000) / 0x400) + 0xD800
L = (C - 0x10000) % 0x400 + 0xDC00
```

反之，从代理对 `<H, L>` 到 Unicode 代码点 `C`，由下式给出：

```
C = (H - 0xD800) * 0x400 + L - 0xDC00 + 0x10000
```

## 好的，那么 JavaScript 呢？

JavaScript 的标准化版本 ECMAScript [定义](http://es5.github.io/x2.html#x2) 了应如何解释字符：

> 符合本国际标准的实施应解释符合 Unicode 标准 3.0 版或更高版本和 ISO/IEC 10646-1 的字符，采用 UCS-2 或 UTF-16 作为编码形式，实施级别 3。如果采用 ISO/IEC 10646-1 子集没有特别说明，假定为 BMP 集合 300 子集 ₃。如果没有特别说明采用的编码形式，则假定为 UTF-16 编码形式。

换句话说，允许 JavaScript 引擎使用 UCS-2 或 UTF-16。

然而，规范的[特定部分](http://es5.github.io/x15.1.html#x15.1.3)要求不论引擎的内部编码不论如何都需要一些 UTF-16 知识。

当然，内部引擎细节对普通 JavaScript 开发人员来说并不重要。有趣的是[什么是 JavaScript 认为的“字符”](http://es5.github.io/x6.html#x6)，和它的暴露方式：

> 在本文档的其余部分，短语“代码单元”和单词“字符”将用于指代用于表示单个 16 位文本单元的 16 位无符号值。
>
> 短语 “Unicode 字符”将用于指代由单个 Unicode 标量值（可能长于 16 位，因此可能由多个代码单元表示）表示的抽象语言或印刷单位。
>
> 短语代码单元指的是这样一个 Unicode 标量值。
>
> Unicode 字符仅指由单个 Unicode 标量值表示的实体：组合字符序列的组件仍然是单独的“Unicode 字符”，即使用户可能将整个序列视为单个字符。

JavaScript 将代码单元视为单个字符，而人类通常根据 Unicode 字符来思考。这对 BMP 之外的 Unicode 字符有一些不幸的后果。即使 `𝌆` 只有[一个 Unicode 字符](https://codepoints.net/U+1D306)，由于代理对由两个代码单元组成 `'𝌆'.length == 2`。代理对的一半被暴露，就好像它们是字符一样：`'𝌆' == '\uD834\uDF06'`。

让你想起了什么？因为这几乎正是 UCS-2 的工作方式，应该是 UCS-2。（唯一的区别是，从技术上讲，UCS-2 不允许代理字符，而 JavaScript 字符串允许。）

你可能会争辩说它类似于 UTF-16，除了允许不匹配的半代理，错误顺序的半代理是允许的，以及半代理作为单独的字符公开。我想你会同意将此视为“带代理的 UCS-2”更容易。

这种类似于 UCS-2 的行为会影响整个语言——例如，[补充字符范围的正则表达式](https://mathiasbynens.be/notes/javascript-unicode#astral-ranges) 比在支持 UTF-16 的语言更难编写。

代理对仅在浏览器显示时（布局期间）才重新组合为单个 Unicode 字符。这发生在 JavaScript 引擎之外。为了证明这一点，你可以在单独的 `document.write()` 调用中写出高半代理和低半代理：`document.write('\uD834');document.write('\uDF06');`。这最终被渲染为 `𝌆` ——一个字形。

## 结论

JavaScript 引擎可以在内部自由使用 UCS-2 或 UTF-16。我所知道的大多数引擎都使用 UTF-16，但无论他们做出什么选择，它只是一个不会影响语言特性的实现细节。

然而，ECMAScript/JavaScript 语言本身根据 UCS-2 而非 UTF-16 公开字符。

如果你需要[转义一个 Unicode 字符](https://mathiasbynens.be/notes/javascript-escapes)，在必要时将其分成两半，请随时使用我的 [JavaScript 转义器](https://mothereff.in/js-escapes#1%F0%9D%8C%86)工具。

如果你想在一个 JavaScript 字符串中[计算 Unicode 字符数](https://mothereff.in/byte-counter#%F0%9D%8C%86)，或者创建一个基于非 BMP Unicode 代码点的字符串，你可以使用 [Punycode.js](https://mths.be/punycode) 的工具函数在 UCS-2 字符串和 UTF-16 代码点之间进行转换：

```javascript
// 代替 `String.length` 仅计算完整 Unicode 字符的
punycode.ucs2.decode("𝌆").length; // 1
// 代替 `String.fromCharCode` 不会让你分别输入半代理
punycode.ucs2.encode([0x1d306]); // '𝌆'
punycode.ucs2.encode([119558]); // '𝌆'
```

ECMAScript 6 将支持一种新的字符串转义序列，即 [Unicode 代码点转义](https://mathiasbynens.be/notes/javascript-escapes#unicode-code-point)，例如：`\u{1D306}`。此外，它将定义接受代码点而不是代码单元的 `String.fromCodePoint` 和 `String#codePointAt`。

感谢 [Jonas 'nlogax' Westerlund](http://jonaswesterlund.se/)、[Andrew 'bobince' Clover](http://www.doxdesk.com/) 和 [Tab Atkins Jr.](http://www.xanthir.com/) 启发我对此进行调查，并给出他们的解释帮助我完成这篇文章。

**备注：** 如果你喜欢阅读 JavaScript 的内部字符编码，请继续看 [JavaScript 的 Unicode 有一个问题](https://mathiasbynens.be/notes/javascript-unicode)，它更详细得解释了这种行为导致的实际问题，并提供了解决方案。

**译者注：**

1. 标题的字面翻译应该是臭名昭著的 BMP，但译者没有找到 BMP 臭名昭著的相关讨论，这里应该是捏他说唱歌手臭名昭著的大人物（The Notorious B.I.G.），为避免歧义翻译为 BMP 介绍。
2. 《太玄经》中的符号，参见：<https://chukaml.tripod.com/linguistics/unicode/codeChart/U01D300.html>。
3. ISO/IEC 10646-1 中 BMP 有多个集合，参见：<http://unicode.org/L2/L2010/10038-fcd10646-main.pdf>。
