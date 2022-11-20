# JavaScript’s internal character encoding: UCS-2 or UTF-16?

Published 20th January 2012 · tagged with [JavaScript](https://mathiasbynens.be/notes#javascript), [Unicode](https://mathiasbynens.be/notes#unicode)

Does JavaScript use UCS-2 or UTF-16 encoding? Since I couldn’t find a definitive answer to this question anywhere, I decided to look into it. The answer depends on what you’re referring to: the JavaScript engine, or JavaScript at the language level.

Let’s start with the basics…

## The notorious BMP

Unicode identifies characters by an unambiguous name and an integer number called its _code point_. For example, the `©` character is named “copyright sign” and has U+00A9 — `0xA9` can be written as `169` in decimal — as its code point.

The Unicode code space is divided into seventeen planes of 2^16 (65,536) code points each. Some of these code points have not yet been assigned character values, some are reserved for private use, and some are permanently reserved as non-characters. The code points in each plane have the hexadecimal values `xy0000` to `xyFFFF`, where `xy` is a hex value from `00` to `10`, signifying which plane the values belong to.

The first plane (`xy` is `00`) is called the _Basic Multilingual Plane_ or _BMP_. It contains the code points from U+0000 to U+FFFF, which are the most frequently used characters.

The other sixteen planes (U+010000 → U+10FFFF) are called _supplementary planes_ or _astral planes_. I won’t discuss them here; just remember that there are _BMP characters_ and _non-BMP characters_, the latter of which are also known as _supplementary characters_ or _astral characters_.

## Differences between UCS-2 and UTF-16

Both UCS-2 and UTF-16 are character encodings for Unicode.

**UCS-2** (2-byte Universal Character Set) produces a **fixed-length** format by simply using the code point as the **16-bit code unit**. This produces exactly the same result as UTF-16 for the majority of all code points in the range from `0` to `0xFFFF` (i.e. the BMP).

[**UTF-16**](https://tools.ietf.org/html/rfc2781) (16-bit Unicode Transformation Format) is an extension of UCS-2 that allows representing code points outside the BMP. It produces a **variable-length** result of either **one or two 16-bit code units per code point**. This way, it can encode code points in the range from `0` to `0x10FFFF`.

For example, in both UCS-2 and UTF-16, the BMP character _U+00A9 copyright sign_ (`©`) is encoded as `0x00A9`.

### Surrogate pairs

Characters outside the BMP, e.g. _U+1D306 tetragram for centre_ (`𝌆`), can only be encoded in UTF-16 using two 16-bit code units: `0xD834 0xDF06`. This is called a _surrogate pair_. Note that a surrogate pair only represents a single character.

The first code unit of a surrogate pair is always in the range from `0xD800` to `0xDBFF`, and is called a _high surrogate_ or a _lead surrogate_.

The second code unit of a surrogate pair is always in the range from `0xDC00` to `0xDFFF`, and is called a _low surrogate_ or a _trail surrogate_.

UCS-2 lacks the concept of surrogate pairs, and therefore interprets `0xD834 0xDF06` (the previous UTF-16 encoding) as two separate characters.

### Converting between code points and surrogate pairs

[Section 3.7 of The Unicode Standard 3.0](http://unicode.org/versions/Unicode3.0.0/ch03.pdf) defines the algorithms for converting to and from surrogate pairs.

A code point `C` greater than `0xFFFF` corresponds to a surrogate pair `<H, L>` as per the following formula:

```
H = Math.floor((C - 0x10000) / 0x400) + 0xD800
L = (C - 0x10000) % 0x400 + 0xDC00
```

The reverse mapping, i.e. from a surrogate pair `<H, L>` to a Unicode code point `C`, is given by:

```
C = (H - 0xD800) * 0x400 + L - 0xDC00 + 0x10000
```

## Ok, so what about JavaScript?

ECMAScript, the standardized version of JavaScript, [defines](http://es5.github.io/x2.html#x2) how characters should be interpreted:

> A conforming implementation of this International standard shall interpret characters in conformance with the Unicode Standard, Version 3.0 or later and ISO/IEC 10646-1 with either UCS-2 or UTF-16 as the adopted encoding form, implementation level 3. If the adopted ISO/IEC 10646-1 subset is not otherwise specified, it is presumed to be the BMP subset, collection 300. If the adopted encoding form is not otherwise specified, it is presumed to be the UTF-16 encoding form.

In other words, JavaScript engines are allowed to use either UCS-2 or UTF-16.

However, [specific parts](http://es5.github.io/x15.1.html#x15.1.3) of the specification require some UTF-16 knowledge, regardless of the engine’s internal encoding.

Of course, internal engine specifics don’t really matter to the average JavaScript developer. What’s far more interesting is [what JavaScript considers to be “characters”](http://es5.github.io/x6.html#x6), and how it exposes those:

> Throughout the rest of this document, the phrase _code unit_ and the word _character_ will be used to refer to a 16-bit unsigned value used to represent a single 16-bit unit of text.  
> The phrase _Unicode character_ will be used to refer to the abstract linguistic or typographical unit represented by a single Unicode scalar value (which may be longer than 16 bits and thus may be represented by more than one code unit).  
> The phrase _code point_ refers to such a Unicode scalar value.  
> _Unicode character_ only refers to entities represented by single Unicode scalar values: the components of a combining character sequence are still individual “Unicode characters”, even though a user might think of the whole sequence as a single character.

JavaScript treats code units as individual characters, while humans generally think in terms of Unicode characters. This has some unfortunate consequences for Unicode characters outside the BMP. Since surrogate pairs consist of two code units, `'𝌆'.length == 2`, even though there’s only [one Unicode character](https://codepoints.net/U+1D306) there. The individual surrogate halves are being exposed as if they were characters: `'𝌆' == '\uD834\uDF06'`.

Remind you of something? It should, ’cause this is almost exactly how UCS-2 works. (The only difference is that technically, UCS-2 doesn’t allow surrogate characters, while JavaScript strings do.)

You could argue that it resembles UTF-16, except unmatched surrogate halves are allowed, surrogates in the wrong order are allowed, and surrogate halves are exposed as separate characters. I think you’ll agree that it’s easier to think of this behavior as “UCS-2 with surrogates”.

This UCS-2-like behavior affects the entire language — for example, [regular expressions for ranges of supplementary characters](https://mathiasbynens.be/notes/javascript-unicode#astral-ranges) are much harder to write than in languages that do support UTF-16.

Surrogate pairs are only recombined into a single Unicode character when they’re displayed by the browser (during layout). This happens outside of the JavaScript engine. To demonstrate this, you could write out the high surrogate and the low surrogate in separate `document.write()` calls: `document.write('\uD834'); document.write('\uDF06');`. This ends up getting rendered as `𝌆` — one glyph.

## Conclusion

JavaScript engines are free to use UCS-2 or UTF-16 internally. Most engines that I know of use UTF-16, but whatever choice they made, it’s just an implementation detail that won’t affect the language’s characteristics.

The ECMAScript/JavaScript language itself, however, exposes characters according to UCS-2, not UTF-16.

If you ever need to [escape a Unicode character](https://mathiasbynens.be/notes/javascript-escapes), breaking it up into surrogate halves when necessary, feel free to use my [JavaScript escaper](https://mothereff.in/js-escapes#1%F0%9D%8C%86) tool.

If you want to [count the number of Unicode characters](https://mothereff.in/byte-counter#%F0%9D%8C%86) in a JavaScript string, or create a string based on a non-BMP Unicode code point, you could use [Punycode.js](https://mths.be/punycode)’s utility functions to convert between UCS-2 strings and UTF-16 code points:

```javascript
// `String.length` replacement that only counts full Unicode characters
punycode.ucs2.decode("𝌆").length; // 1
// `String.fromCharCode` replacement that doesn’t make you enter the surrogate halves separately
punycode.ucs2.encode([0x1d306]); // '𝌆'
punycode.ucs2.encode([119558]); // '𝌆'
```

ECMAScript 6 will support a new kind of escape sequence in strings, namely [Unicode code point escapes](https://mathiasbynens.be/notes/javascript-escapes#unicode-code-point) e.g. `\u{1D306}`. Additionally, it will define `String.fromCodePoint` and `String#codePointAt`, both of which accept code points rather than code units.

Thanks to [Jonas ‘nlogax’ Westerlund](http://jonaswesterlund.se/), [Andrew ‘bobince’ Clover](http://www.doxdesk.com/), and [Tab Atkins Jr.](http://www.xanthir.com/) for inspiring me to look into this, and for helping me out with their explanations.

**Note:** If you liked reading about JavaScript’s internal character encoding, check out [_JavaScript has a Unicode problem_](https://mathiasbynens.be/notes/javascript-unicode), which explains the practical problems caused by this behavior in more detail, and offers solutions.
