# specify the node base image with your desired version node:<version>
FROM node:6
USER node
WORKDIR /usr/src/app
COPY package.json .
RUN npm install bower -g
RUN npm install -g gulp
RUN npm install
RUN bower install
# replace this with your application's default port
EXPOSE 5000
CMD [ "gulp" ]