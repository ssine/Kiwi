---
title: 编程
tags: []
---

在介绍编程之前，先来了解一下 Kiwi 的渲染流程：

{{graphviz(`
digraph {
  rankdir=LR
  源文本 -> 中间文本 [label="域代码处理"]
  中间文本 -> HTML [label="渲染"]
  HTML -> HTML [label="前端插件"]
}
`)}}

源文本就是用户直接编辑的文本，是在 Kiwi 编辑页面的内容，或例如 Markdown 文件中存储的内容。 Kiwi 支持域代码功能，可以将文本的某一部分替换为代码的运行结果，经过域代码替换处理过的文本称作中间文本。 中间文本经由对应语言的解析器（例如 Markdown Parser 或是 Asciidoctor 等）后被转换为 HTML ，显示在页面上。 前端的插件有权对这些 HTML 进行修改。

这里有两个部分可以被编程，第一个是域代码部分，以文本生成为主要目的；第二个是前端插件部分，通过 script 标签实现，以前端交互为主要目的。

---

下面先介绍域代码。

# 域代码

{{tc('field-code')}}

---

接下来介绍 script 标签。

# script 标签

{{tc('script-tag')}}
