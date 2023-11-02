FROM quay.io/ukhomeofficedigital/ga-node:16-alpine3.17

ENV USERMAP_UID 1000
ENV DOCKER_HOME /usr/src/app

RUN apk update && apk upgrade

# Temporary solution to dump and restore database
RUN apk add --no-cache --update postgresql-client

# Intrim solution for error related to `uid/id being unavailable`
RUN npm config set unsafe-perm true

RUN npm uninstall -g semver@6.3.0 && \
    npm install -g semver@7.5.4 && \
    npm install -g get-func-name@2.0.1 && \
    npm install -g tough-cookie@4.1.3

WORKDIR $DOCKER_HOME
COPY . ${DOCKER_HOME}
RUN chown -R node ${DOCKER_HOME} 
EXPOSE 8080

USER ${USERMAP_UID}
RUN yarn install --quiet
RUN npm install -g npm@10.2.2 && npm rebuild node-sass

CMD ["npm","start"]
