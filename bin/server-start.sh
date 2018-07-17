#!/usr/bin/env bash

# Default development specific env variables
source ./env.sh

# Starts the nodemon server
nodemon --ignore public/javascript -V -e js,html --exec  "node --inspect=56700 app"

#nodemon -V -e js,html -x "" --inspect=56746 ./bin/www.js
#node --inspect=56746 app
