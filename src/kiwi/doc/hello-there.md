---
title: Hello There
tags: []
---

Welcome! Kiwi is a personal content management system built to organize, typeset and share your knowledge, idea and thoughts.

**Item** is the unit of information in Kiwi.

Every item has an unique **uri** and a title. The uri is used for sharing the link and naming the files, and is recommended to be a ascii version of title (in order to be a file name and avoid ugly uri encoding when sharing the link).

Kiwi use markup language for the content of items, Markdown, Asciidoc and Wikitext are supported. The editor is called Monaco, which is the core of Visual Studio Code ported to web.

Every item has its own javascript context when parsing, allowing you to run your own scrips in item and use their results as content, see [Macro](./macro) for more information.

---

\* Kiwi is inspired by [Tiddlywiki](http://tiddlywiki.com/), but focus more on server side functions instead of single file integrity.
