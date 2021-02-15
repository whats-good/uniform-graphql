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
npm install @statically-typed-graphql/core
```

⚠️ `graphql` is a peer dependency

## Quickstart

```ts
import { t, TypeContainer } from '@statically-typed-graphql/core';
import { ApolloServer } from 'apollo-server-express';
import express from 'express';

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

## Deep Dive

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

No need to maintain two separate type systems for GraphQL and TypeScript while trying to keep them in sync. Once you create your unified types, all will be taken care of. You will never need to manually type out function parameter types or return types. Everything is inferred from your unified types; all you need to do is to fill in the blanks.

![Code autocompletion for resolvers](https://i.ibb.co/Wvg8Mkp/autocomplete-enum.png)

_Example 1_: The compiler is complaining because the `resolve` function is incorrectly implemented. When we ask for hints on the `membership` field, we are shown that we need to return one of the listed type literals.

![Args types in TypeScript](https://i.ibb.co/BnzKQDW/inferred-args-type.png)

_Example 2_: When we hover over `args.id`, we see that it's a union type between `string` and `number`. All this type information comes directly through the library. While developing our GraphQL backend, we don't need to manually write any `TypeScript` types for our resolvers. This inclues the resolver function arguments and the return type.

### Types

The first step in our workflow is creating the `unified types` that will serve as the building blocks for our backend. These will serve two purposes: GraphQL schema generation, and compile time type safety for our resolvers. Let's begin with the built-in scalars.

#### Built-in Scalars

`@statically-typed-graphql` ships with 5 built-in scalars:

|             | GraphQL Type                     | TypeScript Type    |
| ----------- | -------------------------------- | ------------------ |
| `t.id`      | `GraphQLNonNull<GraphQLID>`      | `string \| number` |
| `t.float`   | `GraphQLNonNull<GraphQLFloat>`   | `number`           |
| `t.int`     | `GraphQLNonNull<GraphQLInt>`     | `number`           |
| `t.boolean` | `GraphQLNonNull<GraphQLBoolean>` | `boolean`          |
| `t.string`  | `GraphQLNonNull<GraphQLString>`  | `string`           |

All types, including scalars, will have a `.nullable` property, which will make a type nullable both at runtime for `GraphQL` and compile time for `TypeScript`. For example:

|                      | GraphQL Type     | TypeScript Type                         |
| -------------------- | ---------------- | --------------------------------------- |
| `t.id.nullable`      | `GraphQLID`      | `string \| number \| null \| undefined` |
| `t.float.nullable`   | `GraphQLFloat`   | `number \| null \| undefined`           |
| `t.int.nullable`     | `GraphQLInt`     | `number \| null \| undefined`           |
| `t.boolean.nullable` | `GraphQLBoolean` | `boolean \| null \| undefined`          |
| `t.string.nullable`  | `GraphQLString>` | `string \| null \| undefined`           |

#### Custom Scalars

Use the `t.scalar` type factory to create any custom unified scalars, which will carry both runtime and compile time type information just like any other type in our system.

<!-- TODO: nail the custom scalars -->

#### Enums

Use the `t.enum` type factory to crate unified enums:

```ts
const Membership = t.enum({
  name: 'Membership',
  values: {
    free: null,
    paid: null,
    enterprise: null,
  },
});
```

At compile time, this type will resolve to the following string literal union: `"free" | "paid" | "enterprise"`. At GraphQL runtime, it will correspond to:

```graphql
enum Membership {
  free
  paid
  enterprise
}
```

#### Objects

Up until now, we just dealt with simple and self-contained types. However, the true power of GraphQL comes from how it lets us compose simpler types to create more complex types. Let's begin with the `t.object` type factory:

<!-- TODO: Use Email type for a custom scalar example -->

```ts
// Copying the Membership example from above for convenience
const Membership = t.enum({
  name: 'Membership',
  values: {
    free: null,
    paid: null,
    enterprise: null,
  },
});

const User = t.object({
  name: 'User',
  fields: {
    id: t.id,
    email: t.string.nullable,
    membership: Membership,
  },
});

/**
 * At compile time, this will resolve to:
 * {
 *   id: string | number;
 *   email: string | undefined | null;
 *   membership: 'free' | 'paid' | 'enterprise';
 * }
 */
```

```graphql
# And at GraphQL runtime, it will correspond to:

type User {
  id: ID!
  email: String
  membership: Membership!
}
```

<!-- TODO: let resolvers of object type omit the nullable fields -->

#### Lists

Use the `t.list` type factory to take an existing type and derive a list from it.

```ts
// Creating a custom object type to be used inside a list in another type:
const Animal = t.object({
  name: 'Animal',
  fields: {
    id: t.id,
    name: t.string.nullable,
    age: t.int,
    species: t.string,
  },
});

// Now, we'll use the Animal type within a list:
const Person = t.object({
  name: 'User',
  fields: {
    id: t.id,
    favoriteFoods: t.list(t.string),
    pets: t.list(Animal),
  },
});

/**
 * At compile time, this will resolve to:
 * {
 *   id: string | number;
 *   favoriteFoods: Array<string>;
 *   pets: Array<{
 *     id: string | number;
 *     name: string | null | undefined;
 *     age: Int;
 *     species: string;
 *   }>
 * }
 */
```

```graphql
# And at GraphQL runtime, it will correspond to:

type Animal {
  id: ID!
  name: String
  age: Int!
  species: String!
}

type User {
  id: ID!
  favoriteFoods: [String!]!
  pets: [Animal!]!
}
```

#### Unions

Use the `t.union` type factory to combine multiple object types into a union.

```ts
const Animal = t.object({
  name: 'Animal',
  fields: {
    id: t.id,
    name: t.string,
    species: t.string,
  },
});

const Person = t.object({
  name: 'Person',
  fields: {
    id: t.id,
    fullName: t.string,
  },
});

const BestFriend = t.union({
  name: 'BestFriend',
  types: [Animal, Person],
  resolveType: (x) => {
    /**
     * All abstract types need a resolveType function that will
     * figure out the type name of a resolved object so that
     * GraphQL can understand which Object type this returned
     * piece of data falls under.
    */

    if (/** some condition */) {
      return 'Person' as const;
    } else {
      return 'Animal' as const;
    }
  },
});

const User = t.object({
  name: 'User',
  fields: {
    id: t.id,
    email: t.string,
    bestFriend: BestFriend,
  }
});

/**
 * At compile time, this will resolve to:
 * {
 *   id: string | number;
 *   email: string;
 *   bestFriend: {
 *     id: string | number;
 *     name: string;
 *     species: string;
 *   } | {
 *     id: string | number;
 *     fullName: string;
 *   }
 * }
 */

```

```graphql
# And at GraphQL runtime, it will correspond to:

type Animal {
  id: ID!
  name: String!
  species: String!
}

type Person {
  id: ID!
  fullName: String!
}

union BestFriend = Animal | Person

type User {
  id: ID!
  email: String!
  bestFriend: BestFriend!
}
```

#### Interfaces

Use the `t.interface` type factory to create unified interface types.

```ts
const Dog = t.object({
  name: 'Dog',
  fields: {
    species: t.string,
    isLoyal: t.boolean,
  },
});

const Cat = t.object({
  name: 'Cat',
  fields: {
    species: t.string,
    isDomesticated: t.boolean,
  },
});

const Pet = t.interface({
  name: 'Pet',
  fields: {
    species: t.string,
  },

  /**
   * the library makes sure that object types
   * passed here correctly implement the interface.
  */
  implementors: [Dog, Cat],
  resolveType: () => {
    /**
     * All abstract types need a resolveType function that will
     * figure out the type name of a resolved object so that
     * GraphQL can understand which Object type this returned
     * piece of data falls under.
    */
    if (/** some condition */) {
      return 'Dog' as const;
    } else {
      return 'Cat' as const;
    }
  }
})

/**
 * At compile time, this will resolve to:
 * {
 *   species: string;
 * }
 */
```

```graphql
# And at GraphQL runtime, it will correspond to:

interface Pet {
  species: String!
}

type Dog implements Pet {
  species: String!
  isLoyal: Boolean!
}

type Cat implements Pet {
  species: String!
  isDomesticated: Boolean!
}
```

## Author

👤 **Kerem Kazan**

- Website: http://whatsgood.dog <!-- TODO: make this https, and actually put something up there  -->
- Twitter: [@MechanicalKazan](https://twitter.com/MechanicalKazan)
- Github: [@mechanical-turk](https://github.com/mechanical-turk)
- LinkedIn: [@keremkazan](https://linkedin.com/in/keremkazan)

<!-- TODO: create an examples section -->
