FROM quay.io/ukhomeofficedigital/node-10:build_id_7

ENV USERMAP_UID 1000
ENV DOCKER_HOME /usr/src/app

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
