#!/bin/sh
# Runs automatically by the mongo container on first start via
# /docker-entrypoint-initdb.d/. The working database is set by
# MONGO_INITDB_DATABASE env var (kids_marketplace).
mongosh "$MONGO_INITDB_DATABASE" --file /docker-seed/kids_marketplace_init.js
