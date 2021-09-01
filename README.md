# Kiwi

A wiki under early development.

Kiwi is an extensible content management system. Main features:

- Scripting ability in both backend and frontend side
- Plugins for content generating and rendering
- Friendly API
- Multiple storage options (single-file, multi-file, database)

## Installation

### Docker

```bash
docker run --user $(id -u):$(id -g) -p 8080:8080 -v /path/to/data:/data sineliu/kiwi
```

Visit http://localhost:8080 !

User data are put under `/path/to/data` in a human-readable manner as markdown files, making them usable even outside Kiwi.

### NPM

Install version 14.14.0 or later at [NodeJS](https://nodejs.org/en/).

```bash
npm install kiwi-wiki --global
kiwi serve /path/to/data --port 8080
```

Visit http://localhost:8080 !

## Origin

I have been using [Tiddlywiki](https://tiddlywiki.com/) for a long time, despite appreciating its unique single-file-design and highly extensible architecture, there are things that make me unhappy. Here is an uncomplete list:

- no support for table of contents
- highly affined to its own markup language (wikitext)
- the native single-file-design caused some limitation under server mode
  - all the tiddlers are stored under the same folder
  - have to download the whole wiki at each browsing
  - only has a naive login method and have no permission management
  - cannot reflect real-time filesystem change
- all the tiddlers are under the same space, which could cause conflict between different areas
- plugins don't have a way to persist their data (except writing to a tiddler)

Thus, I plan to develop a wiki with similar conceptual design to Tiddlywiki, but focus more on the server side. The features I plan to preserve from Tiddlywiki include:

- the ability to be usable for a long time
- display several tiddlers in the same page
- the ability to generate static pages for everything

And the planned improvements are:

- support for table of contents
- built-in monaco editor
- use namespace to divide the area of knowledge
- a client-server mode plugin mechanism
- native support for all kinds of markup language (markdown, rst, wikitext)
- custom url mapping rules
- better server functions
  - multi-level folder structure
  - support for server-side rendering and client-side rendering
  - enhanced user management
  - item-level permission management
  - real-time two-way sync between file system and browser
- version control of single item
- more precise reference ability (locate to line)
- better support of external documents (reference info pdf files, caching external web pages)
- more open scripting ability to end user
