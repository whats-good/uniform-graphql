import { ApolloServer } from 'apollo-server-express';
import express from 'express';
import { t, ListType, ObjectType } from './types';
import { TypeContainer } from './TypeContainer';
import { unthunk } from './utils';

/**
 * Remaining items:
 *
 * TODO: implement all the deprecationReason & description fields
 * TODO: create type guards for the internal types: { is:(a: unknown) is ThisType }
 * TODO: find a way to make the schema initable through async factories / containers
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
      args: { a: typeof t.string };
    };
  }
>;

export const UserType: UserType = t.object({
  name: 'User',
  fields: {
    id: () => t.id,
    name: t.string,
    self: () => UserType,
    selfArray: () => ({
      type: t.list(UserType),
      args: { a: t.string },
    }),
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
  resolveType: (x) => {
    // TODO: write a better resolveType function that takes the rest of the params into consideration
    return 'Animal';
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

const typeContainer = new TypeContainer({
  contextGetter: () => ({ kerem: 'kerem', kazan: 'kazan' }),
});

typeContainer.addFieldResolvers(UserType, {
  id: async (root, args, context) => {
    return (await unthunk(root.id)) + 'fieldResolved';
  },
  selfArray: async (root, args, context) => {
    const id = await unthunk(root.id);
    const otherId = root.id;
    return [
      root,
      {
        ...root,
        id: args.a + id,
      },
    ];
  },
});

typeContainer.addQuery('kerem', {
  type: UserType,
  resolve: async (root, args, context) => {
    return {
      id: async () => {
        return 'kerem';
      },
      name: 'name' + args.k,
      get self() {
        return this;
      },
      selfArray: async () => [
        {
          id: 'id',
          name: 'name',
          get self() {
            return this;
          },
          selfArray: [],
        },
      ],
    };
  },
});

typeContainer.addQuery('kazan', {
  type: nameInterface,
  resolve: async (root, args, context) => {
    return {
      id: 'yo',
      name: 'yo',
      specialAnimalPropery: 'enterprise' as const,
    };
  },
});

typeContainer.addMutation('kazan', {
  type: UserType,
  args: {
    ke: t.string,
  },
  resolve: (root, args, context) => {
    return {
      id: 'kerem',
      name: 'name' + args.ke,
      get self() {
        return this;
      },
      selfArray: [],
    };
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
