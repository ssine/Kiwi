# Kiwi

A flat file personal wiki.

Kiwi is designed to be an extensible content management system based on flat file (no database), it can be a container of your thoughts as well as a tool to get things done.

The project is under very early development, I want to build a wiki that meets my requirements and this is it.

欢迎使用 Kiwi ！ Kiwi 是一个开放的内容管理系统，可以帮助你组织、排版并分享自己的知识与想法。

## 初次使用

Kiwi 是一个 npm 包，要使用它，请首先安装 NodeJS：

[NodeJS中文网](http://nodejs.cn/download/) | [NodeJS官网](https://nodejs.org/en/)

在安装好 NodeJS 之后， npm 便可以在命令行访问了。 打开命令行，输入

```bash
npm install kiwi-wiki --global
```

（也可以用缩写 `npm i kiwi-wiki -g` ），等待安装完成。

中国的用户可能需要使用淘宝源来加速下载：

```bash
npm install kiwi-wiki --global --registry=https://registry.npm.taobao.org
```

之后，新建一个文件夹作为 Kiwi 的根目录，使用

```bash
kiwi serve /path/to/directory
```

（在当前目录的话 `kiwi serve .` 即可）指令就可以启动 Kiwi 了。

默认端口为 3000 ，在浏览器访问 `http://localhost:3000/` 即可。 要改变端口，可以添加命令行参数： `kiwi serve . --port 8080` 。

## 层级结构

<img src="../asset/2020-05-16-20-57-12-677.png" width="60%">

如上图所示，文件系统中的每一个节点（文件或文件夹）都是 Kiwi 中的一个条目（item）。 Kiwi 在运行时会维护二者之间的双向同步，也就是说对文件的新建、修改、删除会实时反映到 Kiwi 界面，在 Kiwi 界面新建、修改、删除的条目也会同步到对应的文件。 因此，在浏览器界面的操作逻辑不清晰时，总可以退回到文件系统，把文件目录改成想要的样子。

条目（item）是 Kiwi 的基本元素，它对应的文件可以是 Markdown 的 .md 文件，也可以是其他标记语言如 Asciidoc(.adoc) 或 WikiText(.wiki) 。在这些被渲染的标记语言之外， Kiwi 还支持图片、音频、视频、PDF以及代码文件的展示。

每个条目都有标题与 URI 属性。 URI 用于条目定位，对应于文件名以及分享时的链接，因此最好不包括特殊字符。 标题的选取没有任何限制。 在编辑标题或 URI 时会自动提示建议的另一项。 对于更详细的 URI 规则，请参考 [URI规则](uri-rules) 。

## The Problem

I have been using [Tiddlywiki](https://tiddlywiki.com/) for a long time, despite appreciating its unique single-file-design and highly extensible architecture, there are things that make me unhappy. Here is an uncomplete list:

* no support for table of contents
* highly affined to its own markup language (wikitext)
* the native single-file-design caused some limitation under server mode
  * all the tiddlers are stored under the same folder
  * have to download the whole wiki at each browsing
  * only has a naive login method and have no permission management
  * cannot reflect real-time filesystem change
* all the tiddlers are under the same space, which could cause conflict between different areas
* plugins don't have a way to persist their data (except writing to a tiddler)

Thus, I plan to develop a wiki with similar conceptual design to Tiddlywiki, but focus more on the server side. The features I plan to preserve from Tiddlywiki include:

* the ability to be usable for a long time
* display several tiddlers in the same page
* the ability to generate static pages for everything

And the planned improvements are:

* support for table of contents
* built-in monaco editor
* use namespace to divide the area of knowledge
* a client-server mode plugin mechanism
* native support for all kinds of markup language (markdown, rst, wikitext)
* custom url mapping rules
* better server functions
  * multi-level folder structure
  * support for server-side rendering and client-side rendering
  * enhanced user management
  * item-level permission management
  * real-time two-way sync between file system and browser
* version control of single item
* more precise reference ability (locate to line)
* better support of external documents (reference info pdf files, caching external web pages)
* more open scripting ability to end user
