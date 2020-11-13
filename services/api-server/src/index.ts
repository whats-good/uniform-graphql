import { ApolloServer, gql } from 'apollo-server-express';
import { GraphQLJSON } from 'graphql-type-json';
import express from 'express';
import { data } from './cached/data';
// import { GraphQLObjectType } from 'graphql';

const typeDefs = gql`
  type Query {
    "A simgle type for getting started!"
    hello: String!
    data: JSON!
  }
  scalar JSON
`;

const resolvers = {
  Query: {
    hello: () => 'world',
    data: () => data,
  },
  JSON: GraphQLJSON,
};

const apolloServer = new ApolloServer({
  typeDefs,
  resolvers,
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
