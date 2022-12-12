# use docker node 16.15.0
FROM node:16

# create a directory to run docker
WORKDIR /app

# copy all other files into the app directory
COPY . /app

# install the dependencies
RUN npm ci

# open port 5000
EXPOSE 5000

# run the server
CMD npm run start
