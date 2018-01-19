FROM node:9.3-alpine
LABEL maintainer="thomas.fitzherbert1@homeoffice.gsi.gov.uk"

ENV DOCKER_HOME /usr/src/app

RUN mkdir -p ${DOCKER_HOME}
WORKDIR $DOCKER_HOME
COPY . ${DOCKER_HOME}

EXPOSE 8080

RUN npm install -q && npm rebuild node-sass

CMD ["npm","start"]
