FROM node:14.12.0

WORKDIR /opt/target
ADD . /opt/target/

COPY --chown=node:node package.json .

RUN npm install nodemon -g --quiet
RUN npm install --quiet
COPY --chown=node:node . .

EXPOSE 3000

RUN useradd -ms /bin/bash dockeruser
RUN chown -R dockeruser:dockeruser /opt/target
USER dockeruser

CMD ["npm", "start"]
