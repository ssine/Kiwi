FROM node:14

RUN npm install -g kiwi-wiki@latest

CMD kiwi serve /data --port 80
