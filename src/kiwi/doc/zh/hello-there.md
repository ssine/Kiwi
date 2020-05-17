---
title: 欢迎
tags: []
---

欢迎使用 Kiwi ！ Kiwi 是一个开放的内容管理系统，可以帮助你组织、排版并分享自己的知识与想法。

# 初次使用

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

# 层级结构

<img src="../asset/2020-05-16-20-57-12-677.png" width="60%">

如上图所示，文件系统中的每一个节点（文件或文件夹）都是 Kiwi 中的一个条目（item）。 Kiwi 在运行时会维护二者之间的双向同步，也就是说对文件的新建、修改、删除会实时反映到 Kiwi 界面，在 Kiwi 界面新建、修改、删除的条目也会同步到对应的文件。 因此，在浏览器界面的操作逻辑不清晰时，总可以退回到文件系统，把文件目录改成想要的样子。

条目（item）是 Kiwi 的基本元素，它对应的文件可以是 Markdown 的 .md 文件，也可以是其他标记语言如 Asciidoc(.adoc) 或 WikiText(.wiki) 。在这些被渲染的标记语言之外， Kiwi 还支持图片、音频、视频、PDF以及代码文件的展示。

每个条目都有标题与 URI 属性。 URI 用于条目定位，对应于文件名以及分享时的链接，因此最好不包括特殊字符。 标题的选取没有任何限制。 在编辑标题或 URI 时会自动提示建议的另一项。 对于更详细的 URI 规则，请参考 [URI规则](uri-rules) 。

# 个性化

所有与系统相关的文件都在 kiwi 目录下，包括配置文件，要修改这些配置的话，只需要编辑它们并保存，就会在用户目录下生成同样的条目，覆盖系统默认设置。

首先，请在左侧面板 Action -> Login 登录，用户名 admin ，密码 kiwi-admin 。 接下来，为你的维基设置 [标题](/kiwi/config/site-title) ，[副标题](/kiwi/config/site-sub-title)，并[选择一个自己喜欢的颜色吧](/kiwi/plugins/hue-slider)！

用户名和密码存储在 kiwi/config/users.json 中，前端无法修改，请在当前目录下新建这个文件来定义自己的用户，格式如下：

```json
[{
  "name": "admin",
  "password": "kiwi-admin"
}]
```

，对用户的修改需要重启 Kiwi 才能生效。 站点的图标（favicon）同样难以在前端修改，请创建 kiwi/ui/icon/favicon.ico 来覆盖默认图标。

[default-items](/kiwi/config/default-items) 条目存储了每次打开 Kiwi 时自动显示的条目，默认值就是这篇文档。 修改时请将其内容换成自己想要展示的条目的 URI ，每行一个。

在需要帮助时可以随时到左侧面板 Index -> kiwi -> doc -> zh -> 欢迎 查看此文档。

---

如果你还会一点 JavaScript ，就可以充分利用 Kiwi 令人激动的编程功能了，详情请见 [编程](programming) 。
