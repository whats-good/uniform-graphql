<h1 align="center">Welcome to uniform-graphql 👋</h1>
<p>
  <!-- TODO: add docs and enable this <a href="this is the project documentation url" target="_blank">
    <img alt="Documentation" src="https://img.shields.io/badge/documentation-yes-brightgreen.svg" />
  </a> -->
  <a href="#" target="_blank">
    <img alt="License: MIT" src="https://img.shields.io/badge/License-MIT-yellow.svg" />
  </a>
  <a href="https://github.com/whats-good/uniform-graphql/graphs/commit-activity" target="_blank">
    <img alt="Maintenance" src="https://img.shields.io/badge/Maintained%3F-yes-green.svg" />
  </a>

</p>

> Code-first GraphQL apis in TypeScript with complete & robust end-to-end type safety.

- [x] Uniform type system: write once in `TypeScript`, get `GraphQL` schema for free.

- [x] Code-first by default, but can be partially used as schema-first.

- [x] No code generation. Your code becomes instantly usable.

- [x] Sophisticated type system adjusted to the complexities of `GraphQL`.

- [x] Single source of truth for your api.

- [x] No manual typecasting, no decorators, no runtime type checking.

- ⚠️︎ Disclaimer: This is a very young and unstable library. We’re still at `v0`. We have a pretty robust core, but everything is subject to change.

<!-- ### 🏠 [Homepage](this is the project homepage)

### ✨ [Demo](this is the project demo url) -->

# Install

```sh
npm install @whatsgood/uniform-graphql
```

⚠️ `graphql` is a peer dependency

# Examples

Go to the [examples](https://github.com/whats-good/uniform-graphql/tree/master/packages/examples) directory to see a demo

# Quickstart

```ts
import { t, SchemaBuilder } from '@whatsgood/uniform-graphql';
import { ApolloServer } from 'apollo-server-express';
import express from 'express';

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

const User = t.object({
  name: 'User',
  fields: {
    id: t.id,
    fullName: t.string.nullable,
    membership: Membership,
    pets: t.list(Animal),
  },
});

const schemaBuilder = new SchemaBuilder();

schemaBuilder.query('user', {
  type: User,
  args: {
    id: t.id,
  },
  resolve: async (_, args, context) => {
    return {
      id: args.id,
      fullName: () => 'John Johnson',
      membership: 'enterprise' as const,
      pets: async () => [
        {
          name: 'Lulu',
          id: 'cat-1',
          age: 10,
        },
      ],
    };
  },
});

schemaBuilder.mutation('signup', {
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

schemaBuilder.fieldResolvers(User, {
  fullName: async (root) => {
    return 'overriding fullname';
  },
});

const apolloServer = new ApolloServer({
  schema: schemaBuilder.getSchema();
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

## Recommended TSConfig

```json
{
  "compilerOptions": {
    "target": "es2018",
    "module": "commonjs",
    "lib": ["es2018", "esnext.asynciterable"],
    "strict": true
  }
}
```

# Deep Dive

## Motivation

GraphQL apis usually fall under two schools of thought: `schema-first` vs `code-first`. Schema-first GraphQL apis create the typedefs first - including all queries, mutations and subscriptions - and implement the corresponding resolvers after. Code-first apis on the other hand implement the resolvers first and have the typedefs derived from the code. Both approaches have their pros and cons. `uniform-graphql` falls somewhere in the middle, but it's closer to the code-first camp.

The biggest issue with the currently available code-first approaches emerges during the schema-generation phase: a non-trivial mismatch between the implemented resolvers and the generated schema. Developers can't simply rely on the compiler to make sure that their code will match the generated schema, so they have to resort to other means such as decorators and other runtime checks. But it doesn't have to be that way. As it turns out, this is a perfect job for the compiler.

> tl;dr: Type-safety is concerned with compile time whereas GraphQL schemas are concerned with runtime. What we need is a **unified** approach that is type-safe at compile time while preserving a runtime type information that carries smoothly to GraphQL schemas. And that's what `uniform-graphql` is all about: Helping you build code-first GraphQL schemas by delegating all forms of type-safety to the compiler.

## Philosophy

### End-to-End Type Safety

While building a GraphQL api, the most common tasks are:

- Creating GraphQL types
- Composing said GraphQL types to create more complex types
- Implementing query & mutation resolvers that work on said types
- Implementing field resolvers on the object types

`uniform-graphql` is built with compile time type-safety front and center, making it very hard for you to experience type errors at runtime. You will find a simple, streamlined approach that will guide you end-to-end through the tasks listed above.

### Non-Null First

In GraphQL, types are `null-first`, which means they are nullable unless explicitly wrapped with a `GraphQLNonNull` type. In `TypeScript` on the other hand, types are `non-null-first`: non-nullable by default unless they are explicitly made nullable. This tension is something that few code-first approaches acknowledge and solve for, which results in schema-code mismatches and general developer pain.

In `uniform-graphql`, we side with `TypeScript` when it comes to nullability, because we are a code-first library and we want to play nicely with our programming language. This is why everything is non-nullable unless they are explicitly made nullable.

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

import { t } from '@whatsgood/uniform-graphql';

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

### Composability

One of GraphQL's main benefits is the reusability and composability of types. You can create an `enum` type, which you use in an `object` type, which you use in a `list` type, which you use in an `interface` type, which you use in another `object` type, which you use in a `union` type and so on.

In `uniform-graphql`, you are able to infinitely compose and reuse your types. This includes [self referential](https://en.wikipedia.org/wiki/Recursive_data_type) and [mutually recursive](https://en.wikipedia.org/wiki/Recursive_data_type) types, while always adhering to our core principle of end-to-end type safety. Keep on reading to see how we handle such use cases.

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

### Unified Type System

No need to maintain two separate type systems for GraphQL and TypeScript while trying to keep them in sync. Once you create your unified types, all will be taken care of. You will never need to manually type out function parameter types or return types. Everything is inferred from your unified types; all you need to do is to fill in the blanks.

![Code autocompletion for resolvers](https://i.ibb.co/Wvg8Mkp/autocomplete-enum.png)

_Example 1_: The compiler is complaining because the `resolve` function is incorrectly implemented. When we ask for hints on the `membership` field, we are shown that we need to return one of the listed type literals.

![Args types in TypeScript](https://i.ibb.co/BnzKQDW/inferred-args-type.png)

_Example 2_: When we hover over `args.id`, we see that it's a union type between `string` and `number`. All this type information comes directly through the library. While developing our GraphQL api, we don't need to manually write any `TypeScript` types for our resolvers. This inclues the resolver function arguments and the return type.

## Types

The first step in our workflow is creating the `unified types` that will serve as the building blocks for our api. These will serve two purposes: GraphQL schema generation, and compile time type safety for our resolvers. Let's begin with the built-in scalars.

#### Built-in Scalars

`uniform-graphql` ships with 5 built-in scalars:

|             | TypeScript         | GraphQL    |
| ----------- | ------------------ | ---------- |
| `t.string`  | `string`           | `String!`  |
| `t.float`   | `number`           | `Float!`   |
| `t.int`     | `number`           | `Int!`     |
| `t.id`      | `string \| number` | `ID!`      |
| `t.boolean` | `boolean`          | `Boolean!` |

### Nullability

All types, including user-made ones, will have a `.nullable` property, which will make a type nullable both at runtime for `GraphQL` and compile time for `TypeScript`. For example:

|                      | TypeScript                              | GraphQL   |
| -------------------- | --------------------------------------- | --------- |
| `t.string.nullable`  | `string \| null \| undefined`           | `String`  |
| `t.float.nullable`   | `number \| null \| undefined`           | `Float`   |
| `t.int.nullable`     | `number \| null \| undefined`           | `Int`     |
| `t.id.nullable`      | `string \| number \| null \| undefined` | `ID`      |
| `t.boolean.nullable` | `boolean \| null \| undefined`          | `Boolean` |

### Custom Scalars

Use the `t.scalar` type factory to create any custom unified scalars, which will carry both runtime and compile time type information just like any other type in our system.

<!-- TODO: nail the custom scalars -->

### Enums

Use the `t.enum` type factory to create unified enums:

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

```ts
/** TypeScript */
type Membersip = 'free' | 'paid' | 'enterprise';
```

```graphql
# GraphQL
enum Membership {
  free
  paid
  enterprise
}
```

### Input & Output Types

GraphQL makes a clear distinction between input and output types. Input types are concerned with the arguments to our resolvers, and output types are concerned with what we return from our resolvers. Certain types such as scalars can appear both as an input or an output type. However, many input and output types are mutually exclusive.

_Neutral Types_: All scalars, enums, and lists of _neutral types_ fall under this category. For example:

- `String`
- `Float!`
- `enum Membership { free, paid, enterprise }`
- `[String]`
- `[Membership!]`

_Output Types_: All _neutral types_, objects, unions, interfaces, and lists of _output types_ fall under this category. The fields of an object type may only be other _output types_. For example:

- `String`
- `enum Membership { free, paid, enterprise }`
- `type User { id: ID!, membership: Membership! }`
- `[User]`

_Input Types_: All _neutral types_, input objects and lists of _input types_ fall under this category. The fields of an `input object` type may only be other _input types_

- `String`
- `enum Membership { free, paid, enterprise }`
- `input SignupArgs { fullName: String!, membership: Membership! }`

In `uniform-graphql`, the type system will guide you and make sure that you don’t accidentally mix input types and output types.

### Objects

So far we have only dealt with neutral and self-contained types. However, the true power of GraphQL comes from how it lets us compose simpler types to create more complex types. Let's begin with our first `output` type factory: `t.object`:

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
```

```ts
/** TypeScript */

type User = {
  id: string | number;
  email: string | undefined | null;
  membership: 'free' | 'paid' | 'enterprise';
};
```

```graphql
# GraphQL

type User {
  id: ID!
  email: String
  membership: Membership!
}
```

### Lists

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
```

```ts
/** TypeScript */
type Person = {
  id: string | number;
  favoriteFoods: Array<string>;
  pets: Array<{
    id: string | number;
    name: string | null | undefined;
    age: Int;
    species: string;
  }>;
};
```

```graphql
# GraphQL:

type Person {
  id: ID!
  favoriteFoods: [String!]!
  pets: [Animal!]!
}
```

### Input Objects

With `t.object` out of the way, let’s move on to `t.inputObject`. Use this type factory to create objects to be used inside resolver arguments:

```ts
/** Creating an input object from neutral types */
const ProfileArgs = t.inputObject({
  name: 'SignupArgs',
  fields: {
    fullName: t.string.nullable,
    membership: Membership,
    email: t.string,
  },
});

/** Creating an input object from another input type */
const UpdateProfileArgs = t.inputObject({
  name: 'UpdateProfileArgs',
  fields: {
    userId: t.id,
    profile: ProfileArgs,
  },
});
```

```ts
/** TypeScript */

type ProfileArgs = {
  fullName: string | null | undefined;
  membership: Membership;
  email: string;
};

type UpdateProfileArgs = {
  userId: string | number;
  profile: ProfileArgs;
};
```

```graphql
# GraphQL:

input ProfileArgs {
  fullName: String;
  membership: !Membership;
  email: !String;
};

input UpdateProfileArgs {
  userId: !ID;
  profile: !ProfileArgs;
};
```

### Unions

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
```

```ts
/** TypeScript */
type User = {
  id: string | number;
  email: string;
  bestFriend:
    | {
        id: string | number;
        name: string;
        species: string;
      }
    | {
        id: string | number;
        fullName: string;
      };
};
```

```graphql
# GraphQL

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

### Interfaces

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
```

```ts
/** TypeScript */
type Pet = {
  species: string;
};
```

```graphql
# GraphQL

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

## Resolvers

## Roadmap

- Stabilize the `t.scalar` type factory
- IOC & containers
- Documentation website
- Write tests (There are none right now)
- Design a logo (open to suggestions)
- Argument validation
- Remove lodash and become `0 dependency`
- Enable query building through the object syntax: `t.query({ currentUser: ..., todos: ...})` instead of `t.query('currentUser', ...)`
- Subscriptions support
- Enable schema-first features: mock an api without implementing it.

## Acknowledgements

`uniform-graphql` stands on the shoulders of 2 giants:

1. [type-graphql](https://github.com/MichalLytek/type-graphql): This is arguably the strongest code-first GraphQL solution for TypeScript. The author is very friendly and helpful, and has managed to create and maintain a great community. I urge you to go check them out and say hi.

2. [io-ts](https://github.com/gcanti/io-ts): The techniques I’ve found in this library have truly opened my mind to the limitless potential of TypeScript. `io-ts` is the library that convinced me that this library was possible.

> This library is `type-graphql` in substance and `io-ts` in form.

## Author

👤 **Kerem Kazan**

- Website: http://whatsgood.dog <!-- TODO: make this https, and actually put something up there  -->
- Twitter: [@MechanicalKazan](https://twitter.com/MechanicalKazan)
- Github: [@mechanical-turk](https://github.com/mechanical-turk)
- LinkedIn: [@keremkazan](https://linkedin.com/in/keremkazan)
