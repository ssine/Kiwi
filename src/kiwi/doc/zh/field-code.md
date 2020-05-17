---
title: 域代码
tags: []
---

## 基础使用

域代码被包裹在一对 `\{{ the code }}` 这样的双大括号中，里面的内容是 Javascript 代码。 在处理时，这段代码会被运行，并用最后一个语句的结果替代原本的代码。

举个例子,

```javascript
\{{new Date().toDateString()}}
```

这段代码在渲染之后会被显示为

> {{new Date().toDateString()}}

。

需要注意的一点时两个连续的左大括号 `\{{` 意味着域的开始，如果你只是字面上的想要使用它，请添加转义字符： `\\{{`。

域代码同样支持嵌套，最先执行最内侧的部分：

```javascript
\{{ \{{ ["1", "+", "1"].join('') }} }}
```

结果为

```javascript
{{ {{["1", "+", "1"].join('')}}}}
```

。

## 异步代码

如果域代码的最后一条语句返回了一个 Promise 对象，那么它被 resolve 后的内容会被输出：

```javascript
\{{
async function sleep(ms) {
  return new Promise((res, rej) => setTimeout(res, ms))
}

async function resolveAfterOneSecond() {
  await sleep(1000)
  return `I'm awake!`
}

resolveAfterOneSecond()
}}
```

这段代码会在一秒后返回字符串 "I'm awake" ：

> I'm awake

很显然，这会导致当前文本的渲染函数等待一秒钟。所以谨慎使用异步。

## 上下文

域代码通过 NodeJS 的 `vm` 模块执行， Kiwi 为每个 item 提供一个单独的上下文，因此在一个 item 中定义的名字（函数、变量等）不会污染其他 item 的上下文。 上下文中还定义了 `currentURI` 变量，代表当前 item 的 uri ： {{currentURI}}

## 插件

Kiwi 的插件系统是基于域代码的，每个插件都是一个函数，用户通过调用这些函数来使用插件。 你同样可以自己编写插件。

下面是一些自带插件：

### Transclude

Transclude 插件返回另一个条目的内容。 这带来很多的可能性，比如在一个基础条目中定义一些工具函数，并在另一个条目中 Transclude 它，就可以实现代码复用。 在日常使用中， Transclude 工具也可以帮助你拆分条目，使得它们更加独立，便于维护和复用。

使用 `transclude()` 或 `tc()` 来调用它，参数是被嵌入条目的 URI ，例如：

```js
\{{tc('kiwi/doc/zh/field-code')}}
```

。 当然，像这样的递归嵌入会导致域代码调用次数超出限制（一万次）。

### Graphviz

Graphviz 是一个很好的画 _图_ 工具。 使用 `graphviz()` 函数就可以了：

```javascript
\{{graphviz(`
digraph {
  n [label="link in svg!", href="./hello-there"]
  al -> n
}
`)}}
```

结果：

{{graphviz(`
digraph {
  n [label="link in svg!", href="./hello-there"]
  al -> n
}
`)}}

### List

你可以通过 `list()` 插件来生成一个列表。 参数：

```typescript
filter: (all: Partial<ServerItem>[]) => Partial<ServerItem>[], kw: { ordered?: boolean, href?: any, name?: any } = {}
```

第一个参数是一个 filter 函数，它接收所有条目对象，并返回那些要放入列表中的条目。 第二个参数可选，包括列表是否有标号以及从条目对象到 href 和 name 的映射函数。

ServerItem 的主要属性有 title, uri, content (string 类型) 和 tags (string 列表) 。
