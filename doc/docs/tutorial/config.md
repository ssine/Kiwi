# Configuration

Install Kiwi by following one of the sections below.

## Node & NPM

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

## Docker

Install Docker Desktop as described in [their website](https://www.docker.com/get-started/). Suppose you are going to store the data under `/path/to/data`, run

```bash
docker run -it -p 8080:8080 -v /path/to/data:/data sineliu/kiwi
```

to start a Kiwi instance. If the port was occupied, change the first part of `-p` to use another port.

<!-- ## Download Executable -->

<!-- ## Download Application -->

---

If you have started Kiwi successfully, open your web browser and visit [http://localhost:8080](http://localhost:8080) , Kiwi should be running there.

