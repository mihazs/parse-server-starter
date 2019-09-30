FROM node:alpine

RUN mkdir parse

ADD . /parse
WORKDIR /parse
RUN npm install

# Uncomment if you want to access cloud code outside of your container
# A main.js file must be present, if not Parse will not start

CMD [ "npm", "start" ]
