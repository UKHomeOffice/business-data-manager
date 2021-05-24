FROM quay.io/ukhomeofficedigital/ga-node:14-alpine

ENV USERMAP_UID 1000
ENV DOCKER_HOME /usr/src/app

RUN apk update && apk upgrade

# Temporary solution to dump and restore database
RUN apk add --no-cache --update postgresql-client

# Intrim solution for error related to `uid/id being unavailable`
RUN npm config set unsafe-perm true
RUN npm install -gs yarn

WORKDIR $DOCKER_HOME
COPY . ${DOCKER_HOME}
RUN chown -R node ${DOCKER_HOME}
EXPOSE 8080

USER ${USERMAP_UID}
RUN yarn install --quiet
RUN npm rebuild node-sass

CMD ["npm","start"]
