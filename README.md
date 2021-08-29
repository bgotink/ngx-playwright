# @ngx-playwright

Utilities for using playwright to test angular applications.

This repository contains multiple packages in the `packages/` folder. Every package has its own README detailing what it does and how to use it.

## Development

This repository is set up using [yarn 3](https://yarnpkg.com) and [snuggery](https://github.com/snuggery/snuggery).

To install dependencies, run the following command:

```bash
yarn
```

To build a package, run this in the folder of the package, or run it in the repository root folder to build all packages:

```bash
yarn build
# or
yarn sn build
# or, if you have @snuggery/global installed globally
sn build
```

Alternatively, you could use the `@angular/cli` by passing the project to build:

```bash
yarn ng build @ngx-playwright/test
# or to build all projects
yarn ng build all
```

The package will be built in `<package folder>/dist`, e.g. `packages/jest/dist`. You can test your build by referring to that folder in a package.json, e.g.

```json
// in dependencies, or via resolutions
{
  "@ngx-playwright/jest": "file:///path/to/ngx-playwright/packages/jest/dist"
}
```

To run the integration tests, run

```bash
yarn test
# or
yarn sn test
# or, if you have @snuggery/global installed globally
sn test
# or, using the @angular/cli
yarn ng test
```

Before opening a pull request, mark the packages that need to be released afterwards using

```bash
yarn version check --interactive
```

To publish, run

```bash
yarn sn deploy
# or, if @snuggery/global is installed globally
sn deploy
# or, using the @angular/cli
yarn ng deploy
```

## License

See [LICENSE.md](./LICENSE.md)
