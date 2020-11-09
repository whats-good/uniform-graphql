- from lerna: "Note that devDependencies providing "binary" executables that are used by npm scripts still need to be installed directly in each package where they're used."
- using the "file:../../" trick in package.json helps a lot in monorepose to share very specific package versions.
- when getting the first element of an array, always use head(array), not array[0]. This gives an option<item>
- Either.toError() is a function that parses an unkown error into the Error type. It's very useful for taskEither fallbacks.
- E.fromPredicate is how we create conditional Either types.

# TODOS

- install and setup the `eslint-plugin-import` rules.
- eventually handle the absolute imports in tsconfig.
- understand the differences between IncomingMessage and Passthrough for nodejs streams.
- understand TE.alt
- understand TE.bracket
- consider using "https://github.com/monstasat/fp-fetch" for data fetching.
- learn how to do partial failures on sequenceS calls
- E.toError may not be that great.
