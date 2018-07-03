FROM node:9.11-alpine
LABEL maintainer="thomas.fitzherbert1@homeoffice.gsi.gov.uk"

ENV DOCKER_HOME /usr/src/app

WORKDIR $DOCKER_HOME
COPY . ${DOCKER_HOME}
RUN chown -R node ${DOCKER_HOME}
USER 1000
RUN npm install -q && npm rebuild node-sass

EXPOSE 8080

CMD ["npm","start"]
