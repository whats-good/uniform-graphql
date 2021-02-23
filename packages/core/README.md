<p align="center">
  <img src="https://raw.githubusercontent.com/whats-good/uniform-graphql/master/packages/website/static/logo.png">
</p>

# UniformGraphQL

<p>
  <a href="https://www.npmjs.com/package/@whatsgood/uniform-graphql" target="_blank">
    <img alt="Version" src="https://img.shields.io/npm/v/@whatsgood/uniform-graphql.svg">
  </a>
  <a href="http://uniform-graphql.whatsgood.dog/" target="_blank">
    <img alt="Documentation" src="https://img.shields.io/badge/documentation-yes-brightgreen.svg" />
  </a>
  <a href="https://github.com/whats-good/uniform-graphql/graphs/commit-activity" target="_blank">
    <img alt="Maintenance" src="https://img.shields.io/badge/Maintained%3F-yes-green.svg" />
  </a>
  <a href="#" target="_blank">
    <img alt="License: MIT" src="https://img.shields.io/badge/License-MIT-yellow.svg" />
  </a>
</p>

> Code-first GraphQL apis in TypeScript with complete & robust end-to-end type safety.

🏠 Docs: [https://uniform-graphql.whatsgood.dog](http://uniform-graphql.whatsgood.dog)

## Features

- 🤝 Uniform type system: write once in `TypeScript`, get `GraphQL` schema for free.
- 👨‍💻 Code-first by default, but can be partially used as schema-first.
- 🚀 No code generation. Your code becomes instantly usable.
- 🔬 Sophisticated type system adjusted to the complexities of `GraphQL`.
- 💡 Single source of truth for your api.
- 😌 No manual typecasting, no decorators, no runtime type checking.

⚠️ Disclaimer: This is a very young and unstable library. We’re still at `v0`. We have a pretty robust core, but everything is subject to change.

## Install

```sh
npm install @whatsgood/uniform-graphql
```

⚠️ `graphql` is a peer dependency

## Examples

Go to the [examples](https://github.com/whats-good/uniform-graphql/tree/master/packages/examples) directory to see a demo

## Quick Start

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

- Twitter: [@MechanicalKazan](https://twitter.com/MechanicalKazan)
- Github: [@mechanical-turk](https://github.com/mechanical-turk)
- LinkedIn: [@keremkazan](https://linkedin.com/in/keremkazan)
