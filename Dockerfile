FROM node:16

WORKDIR /app

COPY package.json ./
COPY yarn.lock ./

RUN yarn install

COPY . .

ENTRYPOINT [ "/app/docker-entrypoint.sh"]

# The base command is "yarn do"
CMD [ "trade" ]
