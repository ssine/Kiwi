# 安装

跟随以下任意一节的方式来安装 Kiwi 。

## Node & NPM

在 [官方网站](https://nodejs.org/) 下载并安装 NodeJS。 NodeJS 版本应当大于等于 16 。

安装完成后，在命令行中执行

```bash
npm install -g kiwi-wiki
```

以从 npm 软件源安装 Kiwi 。

创建一个用于保存所有数据的文件夹，之后执行

```bash
kiwi serve /path/to/data
```

来启动一个 Kiwi 实例。 如果端口被占用，执行 `kiwi serve -p 31000 /path/to/data` 来指定一个未被占用的端口。

## Docker

按照 [官方网站](https://www.docker.com/get-started/) 的说明安装 Docker。 假设数据被存储在 `/path/to/data` 目录，执行

```bash
docker run -it -p 8080:8080 -v /path/to/data:/data sineliu/kiwi
```

来启动一个 Kiwi 实例。 如果端口被占用，更改 `-p` 参数的第一部分来指定一个未被占用的端口。

<!-- ## Download Executable -->

<!-- ## Download Application -->

---

在 Kiwi 成功启动之后，打开浏览器并访问 [http://localhost:8080](http://localhost:8080) ，你应当可以看到 Kiwi 的页面。

