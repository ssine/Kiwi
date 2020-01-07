# Kiwi

A flat file personal wiki.

Kiwi is designed to be an extensible content management system based on flat file (no database), it can be a container of your thoughts as well as a tool to get things done.

The project is under very early development, I want to build a wiki that meets my requirements and this is it.

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
