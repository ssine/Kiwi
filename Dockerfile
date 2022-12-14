FROM node:16-alpine

RUN npm install -g kiwi-wiki@latest

EXPOSE 8080

CMD node --experimental-vm-modules /usr/local/bin/kiwi serve /data --port 8080 --log-path /logs/kiwi-full.log
