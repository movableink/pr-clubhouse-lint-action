#!/bin/bash

# This builds javascript code and associated node_modules into one file for distribution.
ncc build src/index.js --license licenses.txt
