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

.

⚠️ Disclaimer: This is a very young and unstable library. We’re still at `v0`. We have a pretty robust core, but everything is subject to change.

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

## Philosophy

## Types

#### Built-in Scalars

### Nullability

### Custom Scalars

### Enums

### Input & Output Types

### Objects

### Lists

### Input Objects

### Unions

### Interfaces

## Resolvers

Once you have all your uniform types, you can start building your query and mutation resolvers.

### Schema Builder

Your first step here is initializing your `SchemaBuilder`. This is the object that will stitch all your resolvers and types together to finally give you a `GraphQLSchema`, which you can use in any way you want.

You can initialize your schema builder with a generic type for the GraphQLContext object. In the example below, the context has a `currentUser` object.

```ts
import { t, SchemaBuilder } from '@whatsgood/uniform-graphql';

type MyGraphQLContext = {
  currentUser?: {
    id: string;
    email: string;
  };
};

const schemaBuilder = new SchameBuilder<MyGraphQLContext>();
```

### Your First Query Resolver

Once you have your `SchemaBuilder`, you can start building queries and mutations. You will use the uniform types you've built. The library will guide you and help you with what you are allowed to return from your resolvers, how you can use the arguments, and the GraphQL context object.

Let’s begin with a simple example: A resolver that simply returns the number `100`.

```ts
schemaBuilder.query('oneHundred', {
  type: t.int,
  resolve: () => {
    return 100;
  },
});
```

If we served `schemaBuilder.getSchema()`, we would get a fully functional GraphQL Api with the following typedefs:

```graphql
type Query {
  oneHundred: Int!
}
```

### Arguments

Resolvers become more interesting when they change their behaviors based on user input. Here's a simple example with arguments:

```ts
schemaBuilder.query('ping', {
  type: t.string,
  args: { myNumber: t.int },
  resolve: (_, args) => {
    return `Your number is: ${args.myNumber}`;
  },
});
```

Here we have a resolver that returns a string, based on the integer input of its user. The library will make sure that all arguments passed and all resolver return types match exactly to the uniform types. For example, these would be invalid.

```ts
/** Invalid resolver example: 1 */
schemaBuilder.query('ping', {
  type: t.string,
  args: { myNumber: t.int },
  resolve: (_, args) => {
    return `Your number is: ${args.someOtherNumber}`; // using an arg that doesnt exist
  },
});

/** Invalid resolver example: 2 */
schemaBuilder.query('ping', {
  type: t.string,
  args: { myNumber: t.int },
  resolve: (_, args) => {
    return 100; // returning a number for a string type
  },
});

/** Invalid resolver example: 3 */
schemaBuilder.query('ping', {
  type: t.string,
  args: { myNumber: t.int },
  resolve: (_, args) => {
    const a = args.myNumber.length; // args.myNumber is of type number, where .length doesnt exist
  },
});
```

### Async Resolvers

`uniform-graphql` allows async resolvers for any and all types. For example:

```ts
//...

schemaBuilder.query('numLoggedInUsers', {
  type: t.int,
  args: { myNumber: t.int },
  resolve: async (_, args) => {
    return usersStore.getNumLoggedInUsers(); // some way of accessing a database
  },
});
```

### Resolving Object Types

GraphQL provides a ton of flexibility when it comes to resolving object types. We can enjoy all this flexibility in a completely typesafe manner. Let’s begin with a `User` type:

```ts
//...

const User = t.object({
  name: 'User',
  fields: {
    id: t.id,
    fullName: t.string.nullable,
    expensiveField: t.string,
    // This field is expensive to pull from the DB.
    // If possible, we’d like to avoid pulling it.
  },
});

schemaBuilder.query('user', {
  type: User,
  args: { id: t.id },
  resolve: async (_, args) => {
    const user = await usersStore.findById(args.id);
    const expensiveThing = await expensiveThingsStore.findByUserId(args.id);
    return {
      id: user.id,
      fullName: user.fullName,
      expensiveField: expensiveThing,
    };
  },
});
```

While this resolver is correctly implemented, it will always pull the `expensive` field, even if the end-user doesn’t request it. In scenarios like this, we can use `GraphQL`'s deferred resolution feature to avoid doing unnecessary computations. We will harness the power of `thunks`. A `thunk` is a function with no parameters, but once called, it will return some wrapped value:

```ts
//...

schemaBuilder.query('user', {
  type: User,
  args: { id: t.id },
  resolve: async (_, args) => {
    const usersStore = new UsersStore();
    const expensiveThingsStore = new ExpensiveThingsStore();
    const user = await usersStore.findById(args.id);
    return {
      id: user.id,
      fullName: user.fullName,
      expensiveField: async () => {
        /**
         * here, we're deferring the computation of
         * "expensiveField" through an async thunk, so
         * that it’s only computed when it's necessary.
         */
        return expensiveThingsStore.findByUserId(args.id);
      },
    };
  },
});
```

### Resolve Function Return Types

GraphQL resolve function return types are pretty complex. Let’s go over a few steps to understand how they work. We will attempt to understand the return type of our resolve function for the `"user"` query from above. We will start simple and gradually arrive at the correct type:

```ts
type Promisable<T> = T | Promise<T>; // represents T when it may or may not be wrapped in a promise

type Thunk<T> = () => T; // a thunk is a no-param function that wraps a value

type Thunkable<T> = T | Thunk<T>; // represents T when it may or may not be wrapped inside a thunk

// Let’s start with a simple attempt:
type T1 = {
  id: string | number;
  fullName?: string | null | undefined;
  expensiveField: string;
};

// This is a slightly more sophisticated type that acknowledges that the result may or may not be a promise
type T2 = Promisable<{
  id: string | number;
  fullName?: string | null | undefined;
  expensiveField: string;
}>;

// Almost there. We now cover how the object fields may or may not be thunks
type T3 = Promisable<{
  id: Thunkable<string | number>;
  fullName?: Thunkable<string | null | undefined>;
  expensiveField: Thunkable<string>;
}>;

// All thunks may or may not return promises. With that, we have the fully realized return type for our resolver
type T4 = Promisable<{
  id: Thunkable<Promisable<string | number>>;
  fullName?: Thunkable<Promisable<string | null | undefined>>;
  expensiveField: Thunkable<Promisable<string>>;
}>;
```

> As you can see, there are many ways to resolve the same type. Luckily, you will **never** have to write out these types by hand. In fact, you will **never** need to write out any types while coding your resolvers. All will be automatically derived from your `uniform` types.

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
