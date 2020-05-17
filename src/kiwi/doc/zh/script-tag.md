---
title: Script标签
tags: []
---

域代码在 NodeJS 环境下执行，主要目的是扩充文本的表达能力。 对 script 标签支持则是为了增强可交互性。

Markdown, Asciidoc, Wikitext 等标记语言大多支持直接嵌入 HTML 代码，因此可以直接在文本中插入

```html
<script>
  alert('hi!')
</script>
```

这样的 HTML script 标签来在前端运行自己的代码。

通常，浏览器并不保证 script 标签执行的顺序，而 Kiwi 增加了这一逻辑。 举个例子，某个条目内部有五个 script 标签，那么在这个条目被展示出来的时候，这五个 script 标签的内容是依次被执行的，而且只有在上一个执行完毕时下一个才会开始执行。 这样最大的用处是可以方便的引入外部库，并在它被加载之后才继续运行后续的代码。

举个例子，由于标签都是顺序加载，

```html
<script src="https://d3js.org/d3.v5.min.js"></script>

<script>
d3...
</script>
```

这段代码会在第一个 script 标签，也就是 d3 这个库加载完毕之后，才会运行第二个 script 标签中使用 d3 库的内容。 有一个调用外部库的例子可以参考： [Polar Clock](../example/polar-clock) 。

由于 script 标签是直接在当前页面的上下文中运行的，请注意限制变量的作用域，例如

```html
<script>
let a = 1;
</script>
```

这段代码是不可以运行多次的，因为第二次运行时 a 已经被定义，会报错。 这同时还会污染全局命名空间。 为了避免这种情况发生，请使用代码块语法

```html
<script>
{
  let a = 1;
}
</script>
```

或是 IIFE

```html
<script>
(()=>{
  let a = 1;
})()
</script>
```

将变量限制在当前作用域下。
