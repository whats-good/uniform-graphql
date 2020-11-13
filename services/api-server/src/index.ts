import { ApolloServer, gql } from 'apollo-server-express';
import { GraphQLJSON } from 'graphql-type-json';
import express from 'express';
import { data } from './cached/data';
import * as t from 'io-ts';
import {
  GraphQLID,
  GraphQLObjectType,
  GraphQLSchema,
  GraphQLString,
} from 'graphql';

const codec = t.type({
  link: t.string,
  title: t.string,
});

const codecObject = new GraphQLObjectType({
  name: 'my object!',
  fields: () => ({
    link: { type: GraphQLString },
    title: { type: GraphQLString },
  }),
});

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
