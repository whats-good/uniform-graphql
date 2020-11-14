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
const nullable = flow((x: GMixed) => t.union([x, t.null, t.undefined]));

// TODO: can we stop using Object.assign?
const core = {
  id: Object.assign({}, t.union([t.string, t.Int]), { gql: GraphQLID }),
  string: Object.assign({}, t.string, { gql: GraphQLString }),
  number: Object.assign({}, t.number, { gql: GraphQLFloat }),
  Int: Object.assign({}, t.Int, { gql: GraphQLInt }),
};

const required = {
  id: Object.assign({}, core.id, { gql: new GraphQLNonNull(core.id.gql) }),
  string: Object.assign({}, t.string, {
    gql: new GraphQLNonNull(core.string.gql),
  }),
  number: Object.assign({}, t.number, {
    gql: new GraphQLNonNull(core.number.gql),
  }),
  Int: Object.assign({}, t.Int, { gql: new GraphQLNonNull(core.Int.gql) }),
};

const nullables = {
  id: Object.assign({}, core.id, t.union([core.id, t.null, t.undefined])),
  string: Object.assign(
    {},
    core.string,
    t.union([core.id, t.null, t.undefined]),
  ),
  number: Object.assign(
    {},
    core.string,
    t.union([core.id, t.null, t.undefined]),
  ),
  Int: Object.assign({}, t.Int, t.union([core.id, t.null, t.undefined])),
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
  someOtherProp: nullables.id,
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
