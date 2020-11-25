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
- typescript is hard to have custom errors in, also javascript. using a 3rd party library seems to be a good call.
- `TE.bind` is an excellent way to accumulate results in tasks
- `[P in keyof T]: T[P]` is a good method to create a mapped type.
- Mapped types dont allow you to add extra properties. For that, you can use intersection types.
- GraphQL field resolvers can also be made to take arguments:
- You can refer to the types of input params in your function return types.
- You can typecast as you return: `return <string> yo`;

```gql
{
  person(
    id: "some id"
    firstName: "kerem"
    abcabc: 1234
    mySpecialArg: {
      name: { firstName: "f", lastName: "l" }
      address: { streetName: "sn", city: "ct", apartmentNo: 123 }
      referrals: ["asdf"]
      membership: free
    }
  ) {
    id(someParamName: "hi")
    favoriteNumber(someParamName: "yo")
    membership(someParamName: "yes")
  }
}
```

- We can use "any" in function arguments but still manage to get down to specifics if we use type level programming in return types: `const f = <B extends AnySemiBrick>(b: B): SemiBrickType<B>`
- GraphQL resolution: Starts from query level, where root is undefined. Then, for each node that was returned from the resolver function at the query level, which also happen to have field resolvers, runs said field resolvers while putting the previously returned node as root. For each sibling field resolver, the root remains unchanged.
- Fields that may not exist (i.e ? fields) wont show up on generic lookups.

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
- study: `Traversable`: "Traversable represents data structures which can be traversed accumulating results and effects in some Applicative functor."
- how do we go from `Either<E1, Either<E2, A>>` to `Either<Either<E1, E2>, A>`. Could it be fromLeft fromRight etc?
- is there a way to see a few steps back in the pipeline?
- how can we see the stack history when doing error management in fp-ts?
- take a look at `p-queue` to see if we can benefit from an internal queueing mechanism.
- should i be using IO and IOEither instead of Task and TaskEither for these functions?
- should i use webpack for typescript to js conversion?: https://medium.com/free-code-camp/build-an-apollo-graphql-server-with-typescript-and-webpack-hot-module-replacement-hmr-3c339d05184f
- add either nodemon or webpack hot reloading.
- consider using the apollo-explorer instead of playground.
- understand how `unique symbol` works.
- maybe i should use graphql-typdefs and codegen to have my types, instead of this elaborate fp system
- watch this 40 minute tutorial: https://www.youtube.com/watch?v=wqm5ibtCSf0
- study the `infer` keyword.
- look into recursion. it might be a bit of a headache.
- maybe there's no reason to use io-ts. Could potentially get away with just using the patterns.
- Important: I need to first recreate the internal GraphQL classes without any convenience methods. Once there's a solid foundation, i can add the convenience stuff.
- Main problem: Once we create an object with dynamic keys, accessing it will be usually fine, but modifying it while preserving the generics will be a pain. io-ts does this well, but I'm not sure if I can follow their solution here. For example, once I create an outputobject semibrick, reaching into its field bricks to add specialized resolvers will be a problem.
