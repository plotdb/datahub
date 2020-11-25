#!/usr/bin/env bash
docker run -d -p 15432:5432 -e POSTGRES_USER=pg -e POSTGRES_PASSWORD=pg -e POSTGRES_DB=pg -it datahub-db:latest
