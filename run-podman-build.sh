#!/bin/bash

podman run -v ./:/tmp/clubhouse -it --entrypoint=/tmp/clubhouse/build.sh node:24.14.0
