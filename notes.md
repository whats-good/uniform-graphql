- from lerna: "Note that devDependencies providing "binary" executables that are used by npm scripts still need to be installed directly in each package where they're used."
- using the "file:../../" trick in package.json helps a lot in monorepose to share very specific package versions.

# TODOS

- install and setup the `eslint-plugin-import` rules.
- eventually handle the absolute imports in tsconfig.
