import { ApolloServer } from 'apollo-server-express';
import express from 'express';
import { t, SchemaBuilder } from '@whatsgood/uniform-graphql';

const schemaBuilder = new SchemaBuilder();

schemaBuilder.query('hello', {
  type: t.string,
  resolve: () => 'world',
});

schemaBuilder.query('favoriteInteger', {
  type: t.int,
  resolve: () => 999,
});

schemaBuilder.query('favoriteFloat', {
  type: t.float,
  resolve: () => 999.999,
});

schemaBuilder.query('isLearning', {
  type: t.boolean,
  resolve: () => true,
});

schemaBuilder.query('idExample', {
  type: t.id,
  resolve: () => 'string id',
});

schemaBuilder.query('anotherIdExample', {
  type: t.id,
  resolve: () => 15,
});

schemaBuilder.query('stringExample', {
  type: t.string.nullable,
  resolve: () => {
    return 'string value';
  },
});

schemaBuilder.query('voidExample', {
  type: t.string.nullable,
  resolve: () => {},
});

schemaBuilder.query('nullExample', {
  type: t.string.nullable,
  resolve: () => {
    return null;
  },
});

schemaBuilder.query('undefinedExample', {
  type: t.string.nullable,
  resolve: () => {
    return undefined;
  },
});

const Membership = t.enum({
  name: 'Membership',
  values: {
    free: null,
    paid: null,
    enterprise: null,
  },
});

schemaBuilder.query('myMembership', {
  type: Membership,
  resolve: () => {
    return 'free' as const;
  },
});

const Animal = t.object({
  name: 'Animal',
  fields: {
    name: t.string,
    age: t.int,
    isDomesticated: t.boolean,
  },
});

schemaBuilder.query('myFavoritePet', {
  type: Animal,
  resolve: () => {
    return {
      age: 4,
      isDomesticated: true,
      name: 'Lulu',
    };
  },
});

const User = t.object({
  name: 'User',
  fields: {
    id: t.id,
    email: t.string,
    fullName: t.string,
    age: t.int.nullable,
    pet: Animal.nullable,
  },
});

schemaBuilder.query('currentUser', {
  type: User.nullable,
  resolve: () => {
    return {
      id: '1',
      email: 'email@email.com',
      fullName: 'John Johnson',
      // age
      pet: {
        age: 4,
        isDomesticated: true,
        name: 'Lulu',
      },
    };
  },
});

schemaBuilder.query('activeUsers', {
  type: t.list(User),
  resolve: () => {
    return [
      {
        id: '2',
        email: 'bob@bob.com',
        fullName: 'Bob Bobson',
      },
      {
        id: '3',
        email: 'tim@tim.com',
        fullName: 'Tim Timson',
      },
    ];
  },
});

// 3. Build your schema and serve it.
const start = () => {
  const apolloServer = new ApolloServer({
    schema: schemaBuilder.getSchema(),
  });

  const app = express();
  apolloServer.applyMiddleware({ app });

  const PORT = 4001;
  app.listen({ port: PORT }, () => {
    const url = `http://localhost:${PORT}${apolloServer.graphqlPath}`;
    console.log(`🚀 Server ready at ${url}`);
  });
};

start();
