FROM node:10.23-alpine as base
WORKDIR /app
ADD . /app
# --unsafe-perm permit some actions to be run as root.
# https://stackoverflow.com/questions/18136746/npm-install-failed-with-cannot-run-in-wd
RUN npm install --unsafe-perm
EXPOSE 5100
CMD npm start

FROM node:10.23-alpine as dist
WORKDIR /app
copy --from=base /app /app
CMD npm start
