# use docker node 16.15.0
FROM node:16

# create a directory to run docker
WORKDIR /app

# custom cache invalidation
ARG CACHEBUST=1

# copy all other files into the app directory
COPY . /app

# install the dependencies
RUN cd /app \
    && npm ci

# open port 5000
EXPOSE 5000
