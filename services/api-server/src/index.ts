import { ApolloServer, gql, UserInputError } from 'apollo-server-express';
import { GraphQLJSON } from 'graphql-type-json';
import * as R from 'fp-ts/lib/Record';
import * as T from 'fp-ts/lib/Task';
import * as A from 'fp-ts/lib/Array';
import * as O from 'fp-ts/lib/Option';
import express from 'express';
import { data } from './cached/data';
import * as t from 'io-ts';
import { Lens } from 'monocle-ts';
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
  GraphQLScalarType,
} from 'graphql';
import { flow, pipe } from 'fp-ts/lib/function';
import { isLeft } from 'fp-ts/lib/Either';
import _ from 'lodash';
import { user, rootQuery } from './second-attempt';

// const rootQuery = new GraphQLObjectType({
//   name: 'RootQueryType',
//   fields: queryResolver, // TODO: look into the field configs to find ways to insert arguments.
// });

const schema = new GraphQLSchema({
  query: rootQuery,
});

const apolloServer = new ApolloServer({
  schema,
});

// const typeDefs = gql`
//   type Person {
//     id: ID!
//   }

//   type User1 {
//     f: String!
//   }

//   type User2 {
//     d: String!
//   }

//   type User3 {
//     g: String!
//   }

//   enum Membership {
//     free
//     paid
//     enterprise
//   }

//   union Result = User1 | User2 | User3

//   type Query {
//     person: Person!
//     ui: Result
//   }
// `;

// const apolloServer = new ApolloServer({
//   typeDefs,
//   resolvers: {
//     Query: () => {},
//   },
// });

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
