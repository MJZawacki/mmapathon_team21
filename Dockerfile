# specify the node base image with your desired version node:<version>
FROM node:6
USER node
WORKDIR /usr/src/app
COPY . .
RUN npm install -g bower
RUN npm install -g gulp
RUN npm install
RUN bower install --allow-root --config.interactive=false
# replace this with your application's default port
EXPOSE 5000
EXPOSE 5858
CMD [ "gulp" ]