#!/usr/bin/env bash

set -ex

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

if [ -f playwright/tsconfig.json ]; then
	yarn tsc --noEmit -p playwright/tsconfig.json
fi

# run the tests
yarn ng e2e

# Playwright has the annoying tendency to succeed if there are no tests, and
# certain errors cause it to detect no tests without detecting the errors themselves
if [ ! -f playwright/test-results/junit.xml ]; then
	echo "Didn't find test result file, did the tests run?" >&2
	exit 1
fi

# clean up disk space used by the test
rm -rf "$DIR"
