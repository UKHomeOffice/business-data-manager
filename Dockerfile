FROM node:9.3-alpine
LABEL maintainer="thomas.fitzherbert1@homeoffice.gsi.gov.uk"

ENV DOCKER_HOME /usr/src/app

WORKDIR $DOCKER_HOME
COPY . ${DOCKER_HOME}
RUN chown -R node ${DOCKER_HOME}
USER node
RUN npm install -q && npm rebuild node-sass

EXPOSE 8080

CMD ["npm","start"]
