#!/usr/bin/env bash

set -e

DIR="$(mktemp -d)"
cd "$DIR"

# set up angular app
npx --package @angular/cli ng new test --package-manager yarn --skip-git --skip-install --defaults
cd test
yarn install

if ! [[ "$*" =~ --no-angular ]]; then
	# add the CDK, a peer dependency of our package
	yarn add @angular/cdk
fi

# add our package
yarn ng add --registry "$(npm config get registry)" --skip-confirmation --defaults @ngx-playwright/test "$@"

# run the tests
yarn ng e2e

# clean up disk space used by the test
rm -rf "$DIR"
