#!/usr/bin/env bash
cd ..
docker build -t datahub-backend:latest .
cd tool/postgres
docker build -t datahub-db:latest .
cd ..
