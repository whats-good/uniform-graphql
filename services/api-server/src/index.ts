import { ApolloServer, gql } from 'apollo-server-express';
import { GraphQLJSON } from 'graphql-type-json';
import * as R from 'fp-ts/lib/Record';
import * as A from 'fp-ts/lib/Array';
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
import { flip, flow, pipe } from 'fp-ts/lib/function';

// TODO: how do we distinguish between different kinds of numbers?
// TODO: handle non-nullability somehow.

// TODO: how do we handle ID?
const primitives = {
  string: {
    codec: t.string,
    gql: GraphQLString,
  },
  boolean: {
    codec: t.boolean,
    gql: GraphQLBoolean,
  },
  Int: {
    codec: t.Int,
    gql: GraphQLInt,
  },
  number: {
    codec: t.number,
    gql: GraphQLFloat,
  },
};

// TODO: replace the left ANY with a better type
// TODO: how do we handle dates?
const scalars = new Map<any, GraphQLOutputType>([
  [t.StringType, GraphQLString],
  [t.BooleanType, GraphQLBoolean],
  [t.NumberType, GraphQLFloat],
]);

// TODO: what if there are no subfields?
// TODO: find a way out of the any here.
// TODO: find a way to get the user to provide the name.
const f = (codec: t.Mixed): any => {
  //
  if (codec instanceof t.InterfaceType) {
    const mappedOut = R.map(f)(codec.props);
    const better = pipe(
      mappedOut,
      R.filter((a) => {
        // TODO: find a better way to eliminate bad ones.
        return !!a;
      }),
      R.map((a) => ({
        type: a,
      })),
    );

    const objectType = new GraphQLObjectType({
      name:
        codec.name ||
        `type` + String(Number.parseInt(String(Math.random() * 100000))),
      fields: () => better,
    });

    return objectType;
  }
  for (const [codecClass, gqlScalar] of scalars.entries()) {
    if (codec instanceof codecClass) {
      return gqlScalar;
    }
  }
  if (codec instanceof t.RefinementType) {
    if (codec.name === 'Int') {
      return GraphQLInt;
    }
  }
  // TODO: handle error outputs.
  return undefined;
};

const abcd = t.type(
  {
    a: primitives.string.codec,
    b: primitives.boolean.codec,
    c: primitives.number.codec,
  },
  'initialType',
);
//

interface MyMixed extends t.Type<any, any, unknown> {}
interface MyProps {
  [key: string]: MyMixed;
}

const kerem = <P extends MyProps>(props: P, name: string) => {
  const codec = t.type(props, name);
  return {
    codec,
    name,
  };
};

const b = kerem(
  {
    yo: t.string,
  },
  'and the name',
);

// class MyBetterCodec<P extends t.Props> {
//   constructor(props: MyProps) {
//     const codec = t.type(props.innerCodec);
//   }
// }

//
///

type MyCodec<A, B, C> = {
  name: string;
  codec: t.Type<A, B, C>;
  gql: () => GraphQLOutputType;
};

const string: MyCodec<string, unknown, unknown> = {
  name: 'string',
  codec: t.string,
  gql: () => GraphQLString,
};

const liftedPrimitives = {
  string,
};

const complexCodec = {
  name: 'someComplexCodec',
  codec: () =>
    t.type({
      a: liftedPrimitives.string.codec,
    }),
};

type t = t.Props;

// class ComplexCodec {
//   constructor() {

//   }
// }

const myCodec = pipe(abcd, (c) => ({
  name: 'Some_name',
  codec: c,
}));

const myCodec2 = {
  name: 'someOtherName',
  codec: t.type(
    {
      nested: myCodec.codec,
      other: t.string,
    },
    'someOtherName',
  ),
};

const rootQuery = new GraphQLObjectType({
  name: 'RootQueryType',
  fields: {
    yetAnotherCodec: {
      type: f(myCodec2.codec),
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
