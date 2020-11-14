import { ApolloServer, gql } from 'apollo-server-express';
import { GraphQLJSON } from 'graphql-type-json';
import * as R from 'fp-ts/lib/Record';
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

// TODO: how do we distinguish between different kinds of numbers?
// TODO: handle non-nullability somehow.

// TODO: how do we handle ID?

interface GMixed extends t.Type<any, any, unknown> {
  gql: GraphQLOutputType;
  name: string;
}
interface GProps {
  [key: string]: GMixed;
}

const x = t.string;

// TODO: dont have nulls or undefineds. only options.

// TODO: should we return or accept Option<A, B> etc types?

// TODO: can we stop using Object.assign?
const core = {
  // TODO: ids should be non-empty strings
  id: Object.assign({}, t.union([t.string, t.Int]), { gql: GraphQLID }),
  string: Object.assign({}, t.string, { gql: GraphQLString }),
  number: Object.assign({}, t.number, { gql: GraphQLFloat }),
  Int: Object.assign({}, t.Int, { gql: GraphQLInt }),
};

const makeRequired = <T extends GMixed>(x: T) =>
  Object.assign({}, x, { gql: new GraphQLNonNull(x.gql) });

const makeNullable = <T extends GMixed>(x: T) =>
  Object.assign({}, x, t.union([x, t.null, t.undefined]));

const required = {
  id: makeRequired(core.id),
  string: makeRequired(core.string),
  number: makeRequired(core.number),
  Int: makeRequired(core.Int),
};

const nullable = {
  id: makeNullable(core.id),
  string: makeNullable(core.string),
  number: makeNullable(core.number),
  Int: makeNullable(core.Int),
};

const type = <P extends GProps>(name: string, props: P) => {
  const codec = t.type(props, name);
  const fields = () =>
    pipe(
      props,
      R.map((x) => ({ type: x.gql })),
    );

  const gql = new GraphQLObjectType({
    name,
    fields,
  });

  return Object.assign({}, codec, { gql });
};

const myTypeName = type('myTypeName', {
  title: required.string,
  id: required.id,
  someOtherProp: nullable.Int,
});

const myNestedType = type('myNestedType', {
  nested: myTypeName,
  notNested: required.number,
});

const rootQuery = new GraphQLObjectType({
  name: 'RootQueryType',
  fields: {
    here1: {
      type: myTypeName.gql,
    },
    here2: {
      type: myNestedType.gql,
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
