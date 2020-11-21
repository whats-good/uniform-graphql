import { ApolloServer } from 'apollo-server-express';
import express from 'express';
import { GraphQLSchema } from 'graphql';
import _ from 'lodash';
import { rootQuery } from './fourth-attempt/';

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
