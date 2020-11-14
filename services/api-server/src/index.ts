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

interface GMixedTagged extends GMixed {
  __nullability: 'nullable' | 'notNullable';
}

interface GPropsTagged {
  [key: string]: GMixedTagged;
}

const x = t.string;

// TODO: dont have nulls or undefineds. only options.

// TODO: should we return or accept Option<A, B> etc types?

// TODO: find a way to actually take in Option<A, B> etc for nullable ones

// TODO: can we stop using Object.assign?
const core = {
  // TODO: ids should be non-empty strings
  id: Object.assign({}, t.union([t.string, t.Int]), { gql: GraphQLID }),
  string: Object.assign({}, t.string, { gql: GraphQLString }),
  number: Object.assign({}, t.number, { gql: GraphQLFloat }),
  Int: Object.assign({}, t.Int, { gql: GraphQLInt }),
};

const notNullable = <T extends GMixed>(x: T) =>
  Object.assign(
    {},
    x,
    { gql: new GraphQLNonNull(x.gql) },
    { __nullability: 'notNullable' as const },
  );

const nullable = <T extends GMixed>(x: T) =>
  Object.assign(
    {},
    t.union([x, t.null, t.undefined]),
    { gql: x.gql },
    { __nullability: 'nullable' as const },
  );

const r = {
  id: notNullable(core.id),
  string: notNullable(core.string),
  number: notNullable(core.number),
  Int: notNullable(core.Int),
};

const n = {
  id: nullable(core.id),
  string: nullable(core.string),
  number: nullable(core.number),
  Int: nullable(core.Int),
};

const type = <P extends GPropsTagged>(name: string, props: P) => {
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
  title: r.string,
  id: r.id,
  // someOtherProp: n.Int,
});

// myTypeName.encode({
//   title: 'yo',
//   id: 'yeah',
// });

const myNestedType = type('myNestedType', {
  nestedNullable: nullable(myTypeName),
  nestedRequired: notNullable(myTypeName),
  notNested: r.number,
});

// TODO: is it possible to just not even provide the nullable ones?
myNestedType.encode({
  // nestedNullable: {
  //   id: 'yo',
  //   title: 'yeah',
  // },
  nestedNullable: undefined,
  nestedRequired: {
    id: 'yeah',
    title: 'yoh',
  },
  notNested: 1,
});

type a = t.TypeOf<typeof myNestedType>;

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
