<h1 align="center">Welcome to @statically-typed-graphql 👋</h1>
<p>
  <!-- TODO: add docs and enable this <a href="this is the project documentation url" target="_blank">
    <img alt="Documentation" src="https://img.shields.io/badge/documentation-yes-brightgreen.svg" />
  </a> -->
  <a href="#" target="_blank">
    <img alt="License: MIT" src="https://img.shields.io/badge/License-MIT-yellow.svg" />
  </a>

</p>

> Create code-first graphql backends in TypeScript with zero type-safety compromises.

<!-- ### 🏠 [Homepage](this is the project homepage)

### ✨ [Demo](this is the project demo url) -->

<!-- // TODO: Write a motivation section -->
<!-- // TODO: copy the readme to the core package -->

## Install

```sh
npm install reflect-metadata graphql @statically-typed-graphql/core
```

## Quickstart

```ts
import { t, TypeContainer } from '@statically-typed-graphql/core';

/** 1. Create your own types  */

const Membership = t.enum({
  name: 'Membership',
  values: {
    free: null,
    paid: null,
    enterprise: null,
  },
});

const Animal = t.object({
  name: 'Animal',
  fields: {
    id: t.id,
    age: t.integer,
    name: t.string,
  },
});

/** 2. Compose and reuse your types to create new, more complex ones */

const User = t.object({
  name: 'User',
  fields: {
    id: t.id,
    fullName: t.string.nullable, // every type can be made nullable
    membership: Membership, // using a user-made type
    pets: t.list(Animal), // making a list from a user-made type
  },
});

/** 3. Using your new types, create your resolvers */

const typeContainer = new TypeContainer();

typeContainer.query('user', {
  type: User,
  args: {
    id: t.id,
  },
  resolve: async (_, args, context) => {
    return {
      id: args.id, // types automatically enforced for args.
      fullName: () => 'John Johnson', // for object fields, you can also return thunks
      membership: 'enterprise' as const, // enum values are type literals
      pets: async () => [
        /**
         * object fields can also return async thunks. this is useful for
         * potentially expensive computations.
         */
        {
          name: 'Lulu',
          id: 'cat-1',
          age: 10,
        },
      ],
    };
  },
});

typeContainer.mutation('signup', {
  type: User,
  args: {
    email: t.string,
  },
  resolve: (_, args, context) => {
    return {
      id: 'newly signedup user id',
      fullName: 'newly signed up user name',
      membership: 'free' as const,
      pets: [],
    };
  },
});

// can also add optional field resolvers.
typeContainer.fieldResolvers(User, {
  fullName: async (root) => {
    return 'overriding fullname';
  },
});

/** 4. Create and use your new graphQL schema. **/
const schema = typeContainer.getSchema();

const apolloServer = new ApolloServer({
  schema,
});

const PORT = 4001;

const app = express();
apolloServer.applyMiddleware({ app });

app.listen({ port: PORT }, () => {
  console.log(
    `🚀 Server ready at http://localhost:${PORT}${apolloServer.graphqlPath}`,
  );
});
```

<!-- TODO: add images  -->

## Going Deep

### Motivation

GraphQL backends usually fall under two schools of thought: `schema-first` vs `code-first`. Schema-first GraphQL backends create the typedefs first - including all queries, mutations and subscriptions - and implement the corresponding resolvers after. Code-first backends on the other hand implement the resolvers first and have the typedefs generated / derived from the code. Both approaches have their pros and cons. This library falls somewhere in the middle, but it's closer to the code-first camp.

The biggest issue with the currently available code-first approaches emerges during the schema-generation phase: a non-trivial mismatch between the implemented resolvers and the generated schema. Developers can't simply rely on the compiler to make sure that their code will match the generated schema, so they have to resort to other means such as decorators and other runtime checks. But it doesn't have to be that way. As it turns out, this is a perfect job for the compiler.

> tl;dr: Type-safety is concerned with compile-time whereas GraphQL schemas are concerned with runtime. What we need is a unified approach that is type-safe at compile time while preserving a runtime type information that carries smoothly to GraphQL schemas. And that's what this library is all about: Helping you build code-first GraphQL schemas by delegating all forms of type-safety to the compiler.

### Philosophy

#### End-to-End Type Safety

On a GraphQL backend, the most common tasks are:

- Creating GraphQL types
- Composing said GraphQL types to create more complex types
- Implementing query & mutation resolvers that work on said types
- Implementing field resolvers on the object types

This library is built with compile time type-safety front and center, making it very hard for you to experience type errors at runtime. You will find a simple, streamlined approach that will guide you end-to-end through the tasks listed above.

#### Non-Null First

In GraphQL, types are `null-first`, which means they are gonna be nullable unless explicitly wrapped with a `GraphQLNonNull` type. In `TypeScript` on the other hand, types are `non-null-first`: non-nullable by default unless they are explicitly made nullable. This tension is something that few code-first approaches acknowledge and solve for, which results in schema-code mismatches and general developer pain.

In this library, we're gonna side with `TypeScript` when it comes to nullability, because we are a code-first library and we want to play nicely with our programming language. This is why everything is non-nullable unless they are explicitly made nullable.

```ts
/** Null-first: Things are nullable by default, unless explicitly made non-nullable */

import {
  GraphQLID,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
} from 'graphql';

const User = new GraphQLObjectType({
  name: 'User',
  fields: {
    id: { type: new GraphQLNonNull(GraphQLID) },
    fullName: { type: GraphQLString },
  },
});
```

```ts
/** Non-null-first: Things are non-nullable by default, unless explicitly made nullable */

import { t } from '@statically-typed-graphql/core';

const User = t.object({
  name: 'User',
  fields: {
    id: t.id,
    fullName: t.string.nullable,
  },
});
```

```graphql
# Both codes result with the same typedef:

type User {
  id: ID!
  fullName: String
}
```

#### Composability

One of GraphQL's main benefits is the reusability and composability of types. You can create an `enum` type, which you use in an `object` type, which you use in a `list` type, which you use in an `interface` type, which you use in another `object` type, which you use in a `union` type and so on.

In this library, you will be able to infinitely compose and reuse your types. The solutions include [self referential](https://en.wikipedia.org/wiki/Recursive_data_type) and [mutually recursive](https://en.wikipedia.org/wiki/Recursive_data_type) types, while always adhering to our core principle of end-to-end type safety. Keep on reading to see how we handle such use cases.

```graphql
# Self referential type
type User {
  id: ID!
  friends: [User]! # type A refers to itself
}

# Mutually recursive types

type Person {
  id: ID!
  pets: [Animal]! # type A refers to type B
}

type Animal {
  id: ID!
  owner: Person! # type B refers to type A
}
```

#### Unified Type System

No need to maintain two separate type systems and trying to keep them in sync. Once you create your types, all will be taken care of for you. You will never need to manually type out function parameter types or return types. Everything is inferred from your unified types, all you need to do is to fill in the blanks:

![Code autocompletion for resolvers](https://i.ibb.co/Wvg8Mkp/autocomplete-enum.png)
_Example 1_: The compiler is complaining because the `resolve` function is incorrectly implemented. When we ask for hints on the `membership` field, we are hinted that we need to return one of the listed type literals.

![Code autocompletion for resolvers](https://i.ibb.co/BnzKQDW/inferred-args-type.png)
_Example 2_: When we hover over `args.id`, we see that it's a union type between `string` and `number`. All this type information comes directly through the library. While developing our GraphQL backend, we don't need to manually write any `TypeScript` types for our resolvers.

## Author

👤 **Kerem Kazan**

- Website: http://whatsgood.dog <!-- TODO: make this https, and actually put something up there  -->
- Twitter: [@MechanicalKazan](https://twitter.com/MechanicalKazan)
- Github: [@mechanical-turk](https://github.com/mechanical-turk)
- LinkedIn: [@keremkazan](https://linkedin.com/in/keremkazan)

<!-- TODO: create an examples section -->
