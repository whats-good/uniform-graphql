import { ApolloServer } from 'apollo-server-express';
import express from 'express';
import { t, SchemaBuilder } from '@whatsgood/uniform-graphql';
// import { SchemaBuilder } from './SchemaBuilder';
// import { unthunk } from './utils';
// import { Resolver } from './Resolver';

/**
 * Remaining items:
 *
 * TODO: implement all the deprecationReason & description fields
 * TODO: create type guards for the internal types: { is:(a: unknown) is ThisType }
 * TODO: find a way to make the schema initable through async factories / containers
 * TODO: enable ioc containers
 * TODO: sometimes the subfield will be impossible to compute unless the arguments of
 * the subfield are given to the field resolver. In those cases, how can we have the
 * root query to always return the result? The result would depend on the args, so this
 * seems to be impossible, unless we force the devs to always pass the fieldResolver too?
 */

const Membership = t.enum({
  name: 'Membership',
  values: {
    free: null,
    paid: null,
    enterprise: null,
  },
});

const SignupArgs = t.inputObject({
  name: 'SignupArgs',
  fields: {
    membership: Membership,
    email: t.string,
    fullName: t.string.nullable,
  },
});

const Animal = t.object({
  name: 'Animal',
  fields: {
    id: t.id,
    age: t.int,
    name: t.string,
  },
});

const User = t.object({
  name: 'User',
  fields: {
    id: t.id, // using out of box scalars
    fullName: t.string.nullable, // every type can be made nullable
    membership: Membership, // using a user-made type
    pets: t.list(Animal), // making a list out of a user-made type
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
    signup: SignupArgs,
  },
  resolve: (_, args, context) => {
    return {
      id: 'newly signedup user id',
      fullName: args.signup.fullName || 'newly signed up user name',
      membership: args.signup.membership,
      pets: [],
    };
  },
});

// can also add optional field resolvers.
schemaBuilder.fieldResolvers(User, {
  fullName: async (root) => {
    return 'overriding fullname';
  },
});

const schema = schemaBuilder.getSchema();

const apolloServer = new ApolloServer({
  schema,
});

const PORT = 4001;

const start = () => {
  const app = express();
  apolloServer.applyMiddleware({ app });

  app.listen({ port: PORT }, () => {
    console.log(
      `🚀 Server ready at http://localhost:${PORT}${apolloServer.graphqlPath}`,
    );
  });
};

start();
