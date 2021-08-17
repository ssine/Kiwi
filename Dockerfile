FROM node:14

RUN npm install -g kiwi-wiki@latest

EXPOSE 80

CMD kiwi serve /data --port 80
