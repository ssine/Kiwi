---
title: Macro
tags: []
---

Macro allows you to run javascript in an item and insert the result of it into the content. This evaluation and insertion is done before the content is parsed by parsers (i.e., markdown parser and asciidoctor). Because of this, the grammar is the same across different markup languages.

# Usage

## Basic

Use a pair of double brace like `\{{ the code }}` to include the javascript you want to run. The result returned by the last statement will be put in the place the macro appeared.

For example,

```javascript
\{{new Date().toDateString()}}
```

will result in

> {{new Date().toDateString()}}

in the rendered content.

Note that two double left brace `\{{` always means the start of a macro, if you want to just type them normally, add a backslash before them: `\\{{`.

## Async Code

If the result is a Promise object, the resolved result will be put:

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

will result in

> I'm awake

. Apparently, this will casue the rendering process to hang for a second, so use it with care.

## Context

The scripts are ran by node.js' `vm` module, Kiwi provides a separate context for each item, so names (functions, variables) defined in one item will not affect another item or the global context.

## Plugin

Kiwi's plugin system is based on macro, each plugin is a function, and you use the plugin by calling the function it provided. You can also write your own plugin.

Below are some built-in plugins:

### Include (in progress)

Include let you run the code in another item, in order to import the names defined there, enabling some kind of code reuse.

### Graphviz

Graphviz is a great tool to draw graphs. Just call the function `graphviz()` to use it:

```javascript
\{{graphviz(`
digraph {
  n [label="link in svg!", href="./hello-there"]
  al -> n
}
`)}}
```

{{graphviz(`
digraph {
  n [label="link in svg!", href="./hello-there"]
  al -> n
}
`)}}
