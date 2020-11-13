import { ApolloServer, gql } from 'apollo-server-express';
import express from 'express';

const typeDefs = gql`
  type Query {
    "A simgle type for getting started!"
    hello: String!
  }
`;

const resolvers = {
  Query: {
    hello: () => 'world',
  },
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
