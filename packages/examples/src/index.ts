import { ApolloServer } from 'apollo-server-express';
import express from 'express';
import {
  t,
  ListType,
  ObjectType,
  TypeContainer,
  unthunk,
} from '@statically-typed-graphql/core';
import { argsToArgsConfig } from 'graphql/type/definition';
// import { TypeContainer } from './TypeContainer';
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

type UserType = ObjectType<
  'User',
  {
    id: typeof t.id;
    name: typeof t.string;
    self: UserType;
    selfArray: {
      type: ListType<UserType>;
      args: {
        a: typeof t.string.nullable;
        b: ListType<typeof t.string>['nullable'];
        c: typeof inputObject.nullable;
        d: ListType<typeof inputObject>['nullable'];
      };
    };
  }
>;

const inputObject = t.inputObject({
  name: 'InputObject',
  fields: {
    a: t.list(t.string),
  },
});

export const UserType: UserType = t.object({
  name: 'User',
  fields: {
    id: () => t.id,
    name: t.string,
    self: () => UserType,
    selfArray: () => ({
      type: t.list(UserType),
      args: {
        a: t.string.nullable,
        b: t.list(t.string).nullable,
        c: inputObject.nullable,
        d: t.list(inputObject).nullable,
      },
    }),
  },
});

const inputObject2 = t.inputObject({
  name: 'InputObject2',
  fields: {
    a: t.list(t.string),
    b: inputObject,
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

const BetterUser = t.object({
  name: 'BetterUser',
  fields: {
    id: t.id,
    membership: Membership,
    firstName: {
      type: t.string.nullable,
      args: { a: t.string },
    },
  },
});

const AnimalType = t.object({
  name: 'Animal',
  fields: {
    id: t.id,
    name: t.string,
    specialAnimalPropery: Membership,
  },
});

const BestFriend = t.union({
  name: 'BestFriend',
  types: [AnimalType, UserType],
  resolveType: async (val) => {
    return 'Animal' as const;
  },
});

const UserInterface = t.interface({
  name: 'UserInterface',
  fields: {
    self: UserType,
  },
  implementors: [UserType],
  resolveType: (...args) => {
    // TODO: RESOLVE TYPE RUNS BEFORE ANYTHING. UPDATE THE CODE ADAPT

    // TODO: find a way to let field resolvers and normal resolvers override the resolve type
    return 'User' as const;
  },
});

const nameInterface = t.interface({
  name: 'NameInterface',
  fields: {
    name: t.string,
  },
  implementors: [UserType, AnimalType],
  resolveType: (x) => {
    return 'Animal' as const;
  },
});

const typeContainer = new TypeContainer();

typeContainer.query('user', {
  type: User,
  args: {
    id: t.id,
  },
  resolve: async (_, args, context) => {
    return {
      id: args.id, // types automatically enforced for args.
      fullName: () => 'John Johnson', // for object fields, you can return thunks
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

const schema = typeContainer.getSchema();

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
