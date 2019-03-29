FROM quay.io/ukhomeofficedigital/node-10
LABEL maintainer="thomas.fitzherbert1@homeoffice.gsi.gov.uk"

ENV USERMAP_UID 1000
ENV DOCKER_HOME /usr/src/app

WORKDIR $DOCKER_HOME
COPY . ${DOCKER_HOME}
RUN chown -R node ${DOCKER_HOME}
EXPOSE 8080

USER ${USERMAP_UID}
RUN npm install -q && npm rebuild node-sass

CMD ["npm","start"]
