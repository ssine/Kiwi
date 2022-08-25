---
sidebar_position: 3
---
# Configuration

## Login

You need to login to be able to edit any items. Navigate to "Action > Account" in left panel and log in to default account `admin` with password `kiwi-admin`.

## Users

Let's create you own account first. Navigate to "Index" tab in left panel and click the "+" button on the right of "kiwi / config" item. You will only see the button when the mouse hovers on the item.

Now a new item with uri "kiwi/config/new-item" is created, click on the pencil button of the item card to begin editing it.

Change the uri at the top from "kiwi/config/new-item" to "kiwi/config/secret.yaml", then change the item type at the bottom from "text/markdown" to "text/yaml". After that, paste the following secret config as the content of "secret.yaml" and modify user names and passwords as you wish.

```yaml
version: 0.8.0
users:
  - name: alice
    password: Pa$$w0rd
  - name: bob
    password: p@ssw0rd
```

Click on the "√" button (or press ctrl+S) to save the secret config. Now logout and login again with your new account.

## Site Config

You can also configure the site by editing `kiwi/config/main.yaml`, see the [reference](/docs/reference/config#main-config) for explainations of options.
