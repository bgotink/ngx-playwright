#!/usr/bin/env bash

set -e

pushd "$(mktemp -d)" &>/dev/null

cat <<"EOF" > verdaccio-config.yaml
storage: ./storage
auth:
  htpasswd:
    file: ./htpasswd
uplinks:
  npmjs:
    url: https://registry.npmjs.org/
packages:
  "@ngx-playwright/*":
    access: $all
    publish: $authenticated
    proxy:
  "@*/*":
    access: $all
    publish: $authenticated
    proxy: npmjs
  "**":
    access: $all
    publish: $authenticated
    proxy: npmjs
log: { type: stdout, format: pretty, level: http }
EOF

# Start verdaccio
nohup npx verdaccio@5.13.3 --config ./verdaccio-config.yaml &>verdaccio.log &

# wait for verdaccio to be ready
grep -q 'http address' <(tail -f verdaccio.log)

# log on
npm config set --location=user registry="http://localhost:4873"
npx npm-cli-login -u test -p 1234 -e test@domain.test -r http://localhost:4873

popd &>/dev/null

cd "$(dirname "$0")"
cd ../..

# Publish all packages
for i in dist/*.tgz
do
  npm publish "$i"
done
