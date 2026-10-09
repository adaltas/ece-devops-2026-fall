FROM node:20-alpine

ENV NODE_ENV=production

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm ci --only=production && npm cache clean --force

COPY . .

RUN chmod -R 555 /usr/src/app && chmod -R 555 /home/node

USER node

EXPOSE 8080

CMD [ "node", "server.js" ]
