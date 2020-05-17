---
title: URI规则
tags: []
---

URI 是一个条目的唯一标识符。 在 Kiwi 启动时，会为目录下的每一个文件分配一个 URI ，对于可以被渲染的文件（Markdown, WikiText, Asciidoc），例如 `/path/to/markdown.md` ，它的 URI 是去除扩展名后的路径，即 `/path/to/markdown` 。 对于其他文件， URI 是带有扩展名的完整路径。 这些路径以命令行指定的目录为根目录。 在新建条目时，可渲染文件（即编辑页面左下角的 content 类别）的 URI 自动对应到文件系统，并添加扩展名；而代码条目（Code 类别）则需要手动给 URI 添加扩展名。

文件系统中的目录不能承载文字，而 Kiwi 中目录也是条目，却不能编辑。 因此， Kiwi 使用目录下的 index 条目来作为目录条目的代表。 比如， dir 文件夹下有一个 index.md 文件，那么 dir 对应的条目就会被 index 条目替代。 在创建一个目录时，请通过创建目录下的 index 来完成。
