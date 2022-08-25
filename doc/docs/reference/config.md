---
sidebar_position: 2
---
# Configuration

All the config files are placed under `kiwi/config`, both `json` and `yaml` format is supported with the same schema.

## Main Config

Main config is stored in `kiwi/config/main.yaml` or `kiwi/config/main.json`. All the public available configs are stored here.

<dl>
<dt>version</dt>
<dd>Schema version of this config. Backward compatible.</dd>
<dt>info.title</dt>
<dd>Site title, shown in side panel and page title.</dd>
<dt>info.subtitle</dt>
<dd>Site subtitle, shown in side panel.</dd>
<dt>info.defaultItems</dt>
<dd>A list of uris of items to display when the site is visited.</dd>
<dt>appearance.favicon</dt>
<dd>Site favicon, can be item URI or external URL.</dd>
<dt>appearance.primaryColor</dt>
<dd>Theme color of the site in hex code format. Only the hue of this color is used to generate a set of other theme colors.</dd>
<dt>render.plugin.paths</dt>
<dd>A list of string paths to search for when importing other modules in scripts.</dd>
</dl>

## Secret Config

Secret config is stored in `kiwi/config/secret.yaml` or `kiwi/config/secret.json`. This item is not sent to frontend, 

<dl>
<dt>version</dt>
<dd>Schema version of this config. Backward compatible.</dd>
<dt>users.0.name</dt>
<dd>Name of the user.</dd>
<dt>users.0.password</dt>
<dd>Password of the user.</dd>
</dl>
