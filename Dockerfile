# specify the node base image with your desired version node:<version>
FROM node:6
WORKDIR /usr/src/app
ADD . /usr/src/app
RUN npm install -g bower && npm install -g gulp && npm install && bower install --allow-root --config.interactive=false
# replace this with your application's default port
EXPOSE 5000
EXPOSE 5858
CMD [ "gulp" ]