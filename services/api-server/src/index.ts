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

// TODO: how do we distinguish between different kinds of numbers?
// TODO: handle non-nullability somehow.

// TODO: how do we handle ID?

interface GMixed extends t.Type<any, any, unknown> {
  gql: GraphQLOutputType;
  name: string;
  __subFieldsChecked: 'subFieldsChecked';
}

// interface GProps {
//   [key: string]: GMixed;
// }

interface GMixedWithNullability extends GMixed {
  __nullability: 'nullable' | 'notNullable';
}

interface GPropsTagged {
  [key: string]: GMixedWithNullability;
}

type Wrapped<T, I extends string> = { [K in keyof T]: { [key in I]: T[K] } };

// TODO: implement without lodash.
const unwrap = <T, I extends string>(key: I) => (x: Wrapped<T, I>): T => {
  return _.mapValues(x as any, (z) => z[key]);
};

const d = {
  k: { to: 'kerem' as const },
  l: { to: 134 },
};

const e = pipe(d, unwrap('to'));

type Taskified<T> = {
  [P in keyof T]: T.Task<T[P]>;
};

// const originalProps = unproxify(proxyProps);

// TODO: dont have nulls or undefineds. only options.

// TODO: should we return or accept Option<A, B> etc types?

// TODO: find a way to actually take in Option<A, B> etc for nullable ones

// TODO: can we stop using Object.assign?

// TODO: how can I create recursive types?

// TODO: how do I create arrays?

const core = {
  // TODO: ids should be non-empty strings
  id: Object.assign(
    {},
    t.union([t.string, t.Int]),
    { gql: GraphQLID },
    { __subFieldsChecked: 'subFieldsChecked' as const },
  ),
  string: Object.assign(
    {},
    t.string,
    { gql: GraphQLString },
    { __subFieldsChecked: 'subFieldsChecked' as const },
  ),
  number: Object.assign(
    {},
    t.number,
    { gql: GraphQLFloat },
    { __subFieldsChecked: 'subFieldsChecked' as const },
  ),
  Int: Object.assign(
    {},
    t.Int,
    { gql: GraphQLInt },
    { __subFieldsChecked: 'subFieldsChecked' as const },
  ),
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
    x,
    t.union([x, t.null, t.undefined]),
    { gql: x.gql },
    { __nullability: 'nullable' as const },
  );

// TODO: how can i create r & n directly from core by something akin to R.map(nullable)?
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

  return Object.assign(
    {},
    codec,
    { gql },
    { __subFieldsChecked: 'subFieldsChecked' as const },
  );
};

const person = type('Person', {
  ssn: r.id,
  firstName: r.string,
  lastName: r.string,
  favoriteAnimal: n.string,
  favoriteNumber: n.number,
});

const user = type('User', {
  id: r.id,
  firstFriend: notNullable(person),
  // secondFriend: nullable(person),
});

const myTypeName = type('myTypeName', {
  title: r.string,
  id: r.id,
  lastName: n.string,
});

// TODO: root should always take in a taskified record.

// TODO: how can i make it return a PartialTaskified, and not just a Taskified?
// type resolverOf<A extends GMixed> = <B extends t.TypeOf<A>>(
//   from: A,
// ) => (root: Taskified<B>) => Taskified<B>;

// type userResolver = resolverOf<typeof user>;

// TODO: should we use `T.map` language here, or is it good that we're utilizing normal tasks?
// TODO: would it be better to hide the taskified root from the end developer? Would probably be better
// if we just use T.map or T.chain behind the scenes and allowed the end user to act as if the data is already there.

const resolverOf = <A extends GMixed, B extends t.TypeOf<A>>(from: A) => (
  resolverFn: (root: Taskified<B>) => Partial<Taskified<B>>,
) => (root: Taskified<B>) => resolverFn(root);

// TODO: how do we retain GraphqlObject name etc info here?
const userResolver = resolverOf(user)((root) => ({
  id: T.of('some string to replace the original'),
  firstFriend: root.firstFriend,
}));

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
    lastName: 'yo',
  },
  notNested: 1,
});

type a = t.TypeOf<typeof myNestedType>;

// TODO: we should make sure only those that have __nullability fields can be passed as a type here.
// TODO: find out a way to give extensibility to grpahql field resolvers.
const rootQuery = new GraphQLObjectType({
  name: 'RootQueryType',
  fields: {
    here1: {
      type: myTypeName.gql,
    },
    here2: {
      type: myNestedType.gql,
    },
    user: {
      type: user.gql,
      resolve: (root, args, context) => ({
        id: 'here is an id!',
      }),
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
