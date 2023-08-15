# use docker node 16.15.0
FROM node:16

# custom cache invalidation
ARG CACHEBUST=1

# create a directory to run docker
WORKDIR /app

# copy all other files into the app directory
COPY . /app

# install the dependencies
RUN cd /app \
    && npm ci --legacy-peer-deps

# Give execution rights on the wait-for-it.sh script
RUN chmod +x /app/wait-for-it.sh

# open port 5000
EXPOSE 5000
