FROM quay.io/ukhomeofficedigital/ga-node:16-alpine3.17

ENV USERMAP_UID 1000
ENV DOCKER_HOME /usr/src/app

RUN apk update && apk upgrade

# Update the package list and upgrade libpq and postgresql15-client
RUN apk update && apk upgrade && \
    apk add --no-cache libpq postgresql15-client braces@latest

# Temporary solution to dump and restore database
RUN apk add --no-cache --update postgresql-client

# Intrim solution for error related to `uid/id being unavailable`
RUN npm config set unsafe-perm true

WORKDIR $DOCKER_HOME
COPY . ${DOCKER_HOME}
RUN chown -R node ${DOCKER_HOME}
EXPOSE 8080

USER ${USERMAP_UID}
RUN yarn install --quiet
RUN npm rebuild node-sass

CMD ["npm","start"]
