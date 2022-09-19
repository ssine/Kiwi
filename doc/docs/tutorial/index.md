---
sidebar_position: 1
---
# Tutorial

This part contains a step-by-step tutorial to setup a Kiwi instance and start using it.

## Installation

Install Kiwi by following one of the sections below.

### Node & NPM

Download and install NodeJS at the [official website](https://nodejs.org/). The version should be greater than or equal to 16.

After installation, you should have `npm` in the terminal, run

```bash
npm install -g kiwi-wiki
```

to install Kiwi from npm source.

Create an empty folder to store all your data, then run

```bash
kiwi serve /path/to/data
```

to start a Kiwi instance. If the port was occupied, run `kiwi serve -p 31000 /path/to/data` to use another port.

### Docker

Install Docker Desktop as described in [their website](https://www.docker.com/get-started/). Suppose you are going to store the data under `/path/to/data`, run

```bash
docker run -it -p 8080:8080 -v /path/to/data:/data sineliu/kiwi
```

to start a Kiwi instance. If the port was occupied, change the first part of `-p` to use another port.

<!-- ## Download Executable -->

<!-- ## Download Application -->

---

If you have started Kiwi successfully, open your web browser and visit [http://localhost:8080](http://localhost:8080) , Kiwi should be running there.

<!-- ### StackBlitz -->


## Configuration

### Login

You need to login to be able to edit any items. Navigate to "Action > Account" in left panel and log in to default account `admin` with password `kiwi-admin`.

### Users

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

### Site Config

You can also configure the site by editing `kiwi/config/main.yaml`, see the [reference](/docs/reference/config#main-config) for explainations of options.

## Edit

You have already created

### Content Type

Kiwi supports a wide range of markup languages, including:

* Markdown
* AsciiDoc
* Wikitext
* HTML
* Plain text

. 

### Code



### Media

### Create

### Update

### Delete

### Move

### Read

static mode

