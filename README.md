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

/** 2. Compose and reuse your types to create new, more complex ones */

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
    fullName: t.string.nullable, // every type can be made nullable
    membership: Membership, // using a user-made type
    pets: t.list(Animal), // making a list from of a user-made type
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

<!-- TODO: add images ![Code autocompletion for resolvers](https://i.ibb.co/8sNb25r/auto-complete-2.png) -->

## Author

👤 **Kerem Kazan**

- Website: http://whatsgood.dog <!-- TODO: make this https, and actually put something up there  -->
- Twitter: [@MechanicalKazan](https://twitter.com/MechanicalKazan)
- Github: [@mechanical-turk](https://github.com/mechanical-turk)
- LinkedIn: [@keremkazan](https://linkedin.com/in/keremkazan)
