- from lerna: "Note that devDependencies providing "binary" executables that are used by npm scripts still need to be installed directly in each package where they're used."
- using the "file:../../" trick in package.json helps a lot in monorepose to share very specific package versions.
- when getting the first element of an array, always use head(array), not array[0]. This gives an option<item>
- Either.toError() is a function that parses an unkown error into the Error type. It's very useful for taskEither fallbacks.
- E.fromPredicate is how we create conditional Either types.
- Be careful while using O.of, because it'll always create an Option.some, even if the internal object is undefined. When you think the inner object is nullable, use O.fromNullable
- filterMap is useful for creating arrays that have guaranteed item fields. It only required an option constructor that takes in an item in the array.
- scan is the method that collects the results of each iteration.
- if you want to run tasks in parallel but don't stop when 1 or more fails, use sequence(T.task) instead of sequence(TE.taskEither)
- TE.chain requires the left types to always match, which is a pain.
- `E.either.sequence(T.task)` is your best friend. It will let you convert `Either<A, B>` into `Task<Either<A, B>>`
- `sequence` in general is your best friend. it will let you jiggle and swap out types and behavior in very useful and important ways. if you're stuck, trying to create one type out of another, the answer is probably `sequence`

# TODOS

- install and setup the `eslint-plugin-import` rules.
- eventually handle the absolute imports in tsconfig.
- understand the differences between IncomingMessage and Passthrough for nodejs streams.
- understand TE.alt
- understand TE.bracket
- consider using "https://github.com/monstasat/fp-fetch" for data fetching.
- learn how to do partial failures on sequenceS calls
- E.toError may not be that great.
- I might have accidentally let another git repo get mixed up in this one. How can I carry my commits and leave everything else behind?
- look into partitionmap from fp-ts
- study the p-map library
- study all the sindresorhus p-x libraries
