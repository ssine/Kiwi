FROM node:14

RUN npm install -g kiwi-wiki@latest

EXPOSE 8080

CMD kiwi serve /data --port 8080
