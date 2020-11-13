import { ApolloServer, gql } from 'apollo-server-express';
import { GraphQLJSON } from 'graphql-type-json';
import * as R from 'fp-ts/lib/Record';
import * as A from 'fp-ts/lib/Array';
import express from 'express';
import { data } from './cached/data';
import * as t from 'io-ts';
import {
  GraphQLBoolean,
  GraphQLID,
  GraphQLObjectType,
  GraphQLSchema,
  GraphQLString,
  GraphQLInt,
  GraphQLOutputType,
  GraphQLNonNull,
  GraphQLFloat,
} from 'graphql';
import { pipe } from 'fp-ts/lib/function';

// TODO: how do we distinguish between different kinds of numbers?
// TODO: handle non-nullability somehow.

const codec1 = t.type({
  link: t.string,
  title: t.string,
  number: t.number,
  kerem: t.type({
    name: t.string,
    number2: t.number,
    kazan: t.type({
      someOtherBs: t.string,
      isTrue: t.boolean,
      someInt: t.Int,
    }),
  }),
});

// TODO: replace the left ANY with a better type
// TODO: how do we handle dates?
const scalars = new Map<any, GraphQLOutputType>([
  [t.StringType, GraphQLString],
  [t.BooleanType, GraphQLBoolean],
  [t.NumberType, GraphQLFloat],
]);

// TODO: what if there are no subfields?
// TODO: find a way out of the any here.
// TODO: find a way to get the user to provide the name.
const f = (codec: t.Mixed): any => {
  //
  if (codec instanceof t.InterfaceType) {
    const mappedOut = R.map(f)(codec.props);
    const better = pipe(
      mappedOut,
      R.filter((a) => {
        // TODO: find a better way to eliminate bad ones.
        return !!a;
      }),
      R.map((a) => ({
        type: a,
      })),
    );

    const objectType = new GraphQLObjectType({
      name: `type` + String(Number.parseInt(String(Math.random() * 100000))),
      fields: () => better,
    });

    objectType;
    // debugger;

    return objectType;
  }
  for (const [codecClass, gqlScalar] of scalars.entries()) {
    if (codec instanceof codecClass) {
      return gqlScalar;
    }
  }
  if (codec instanceof t.RefinementType) {
    if (codec.name === 'Int') {
      return GraphQLInt;
    }
  }
  // TODO: handle error outputs.
  return undefined;
};

const gqlCodec = f(codec1);

const rootQuery = new GraphQLObjectType({
  name: 'RootQueryType',
  fields: {
    hello: {
      type: GraphQLString,
      args: {
        id: {
          type: GraphQLID,
        },
      },
      // TODO: how can we get id from above?
      // TODO: and how can we get the return type from above?
      resolve: (parent, args) => {
        return 'YO';
      },
    },
    myCodec: {
      type: gqlCodec,
      // type: codecOject,
      resolve: (parent, args) => {
        return {
          link: 'my link',
          title: 'my title',
        };
      },
    },
  },
});

const schema = new GraphQLSchema({
  query: rootQuery,
});

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
