#!/bin/sh
# Stamp every local script with a new version so browsers fetch the new build.
v=$(date +%Y%m%d%H%M)
sed -i '' -E "s/(src=\"[a-z]+\.js)(\?v=[0-9a-z]*)?\"/\1?v=$v\"/g" index.html
echo "stamped $v"
