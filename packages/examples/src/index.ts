import { ApolloServer } from 'apollo-server-express';
import express from 'express';
import { t, SchemaBuilder } from '@whatsgood/uniform-graphql';

// 1. Initialize a schema builder.
const schemaBuilder = new SchemaBuilder();

// 2. Create your first resolver.
schemaBuilder.query('hello', {
  type: t.string,
  resolve: () => 'world',
});

// 3. Build your schema and serve it.
const start = () => {
  const apolloServer = new ApolloServer({
    schema: schemaBuilder.getSchema(),
  });

  const app = express();
  apolloServer.applyMiddleware({ app });

  const PORT = 4000;
  app.listen({ port: PORT }, () => {
    const url = `http://localhost:${PORT}${apolloServer.graphqlPath}`;
    console.log(`🚀 Server ready at ${url}`);
  });
};

start();
