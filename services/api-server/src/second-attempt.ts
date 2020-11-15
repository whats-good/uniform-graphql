import { ApolloServer, gql, UserInputError } from 'apollo-server-express';
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
  GraphQLOutputType as GraphqlType,
  GraphQLNonNull,
  GraphQLFloat,
  GraphQLScalarType,
  ValidationContext,
  GraphQLList,
} from 'graphql';
import { flow, not, pipe } from 'fp-ts/lib/function';
import { isLeft } from 'fp-ts/lib/Either';
import _ from 'lodash';
import { Category } from 'fp-ts/lib/Reader';

type Codec<A, O> = t.Type<A, O, unknown>;

type Nullability = 'nullable' | 'notNullable';
type Shape = 'struct' | 'scalar' | 'array';

// TODO: find a new way to make the Bricks more extensible without having to create a universe of generics.
/* eslint @typescript-eslint/no-empty-interface: 0 */
interface AbstractBrick<
  A,
  O,
  G extends GraphqlType,
  N extends 'pending' | Nullability,
  S extends Shape
> {
  name: string;
  gql: G;
  codec: Codec<A, O>;
  __nullability: N;
  __shape: S;
}
interface SemiBrick<A, O, G extends GraphqlType, S extends Shape>
  extends AbstractBrick<A, O, G, 'pending', S> {}

type SemiBrickified<T> = T extends SemiBrick<infer A, infer B, infer C, infer D>
  ? SemiBrick<A, B, C, D>
  : never;

interface Brick<
  A,
  O,
  G extends GraphqlType,
  N extends Nullability,
  S extends Shape
> extends AbstractBrick<A, O, G, N, S> {}

type Brickified<T> = T extends Brick<
  infer A,
  infer B,
  infer C,
  infer D,
  infer E
>
  ? Brick<A, B, C, D, E>
  : never;

const nullable = <A, O, G extends GraphqlType, S extends Shape>(
  x: SemiBrick<A, O, G, S>,
) => {
  const toReturn = {
    __nullability: 'nullable' as const,
    __shape: x.__shape,
    name: x.name,
    gql: x.gql,
    codec: t.union([t.undefined, t.null, x.codec]),
  };
  return <Brickified<typeof toReturn>>toReturn;
};

const notNullable = <A, O, G extends GraphqlType, S extends Shape>(
  x: SemiBrick<A, O, G, S>,
) => {
  const toReturn = {
    __nullability: 'notNullable' as const,
    __shape: x.__shape,
    name: x.name,
    gql: new GraphQLNonNull(x.gql),
    codec: x.codec,
  };
  return <Brickified<typeof toReturn>>toReturn;
};

// TODO: is there a way to communicate to the client that the items within the array could be null?
const array = <
  A,
  O,
  G extends GraphqlType,
  N extends Nullability,
  S extends Shape
>(
  x: Brick<A, O, G, N, S>,
) => {
  const toReturn = {
    __nullability: 'pending' as const,
    __shape: 'array' as const,
    name: `Array<${x.name}>`,
    codec: t.array(x.codec),
    gql: new GraphQLList(x.gql),
  };
  return <SemiBrickified<typeof toReturn>>toReturn;
};

const id = {
  codec: t.union([t.string, t.number]),
  gql: GraphQLID,
  name: 'ID' as const,
  __nullability: 'pending' as const,
  __shape: 'scalar' as const,
};
const string = {
  codec: t.string,
  gql: GraphQLString,
  name: 'String' as const,
  __nullability: 'pending' as const,
  __shape: 'scalar' as const,
};
const float = {
  codec: t.number,
  gql: GraphQLFloat,
  name: 'Float' as const,
  __nullability: 'pending' as const,
  __shape: 'scalar' as const,
};
const int = {
  codec: t.Int,
  gql: GraphQLInt,
  name: 'Int' as const,
  __nullability: 'pending' as const,
  __shape: 'scalar' as const,
};
const boolean = {
  codec: t.boolean,
  gql: GraphQLBoolean,
  name: 'Boolean' as const,
  __nullability: 'pending' as const,
  __shape: 'scalar' as const,
};

const core = {
  id,
  string,
  float,
  int,
  boolean,
};

const r = {
  id: notNullable(core.id),
  string: notNullable(core.string),
  float: notNullable(core.float),
  int: notNullable(core.int),
  boolean: notNullable(core.boolean),
};

const n = {
  id: nullable(core.id),
  string: nullable(core.string),
  float: nullable(core.float),
  int: nullable(core.int),
  boolean: nullable(core.boolean),
};

// TODO: find a way to map from the core object into these.

// const type = (props: )

type BrickMap<T> = {
  [P in keyof T]: T[P] extends Brick<
    infer A,
    infer B,
    infer C,
    infer D,
    infer E
  >
    ? Brick<A, B, C, D, E>
    : never;
};

type CodecsOfBrickMap<T> = {
  [P in keyof T]: T[P] extends Brick<
    infer A,
    infer B,
    infer C,
    infer D,
    infer E
  >
    ? Codec<A, B>
    : never;
};

// TODO: shutdown warnings for unused inferred generics
type GraphqlTypesOfBrickMap<T> = {
  [P in keyof T]: T[P] extends Brick<
    infer A,
    infer B,
    infer C,
    infer D,
    infer E
  >
    ? { type: C }
    : never;
};

// TODO: make this take in the name of the type.
const type = <T, B extends BrickMap<T>>(s: B) => {
  const codecs = <CodecsOfBrickMap<typeof s>>_.mapValues(s, (x) => x.codec);
  const gqls = <GraphqlTypesOfBrickMap<typeof s>>(
    _.mapValues(s, (x) => ({ type: x.gql }))
  );
  const x = {
    __nullability: 'pending' as const,
    __shape: 'struct' as const,
    name: 'Some struct name',
    codec: t.type(codecs),
    gql: new GraphQLObjectType({
      name: 'someStructName',
      fields: gqls,
    }),
  };
  return <SemiBrickified<typeof x>>x;
};

const person = type({
  firstName: r.string,
  lastName: r.string,
  ssn: n.int,
});

const user = type({
  person: nullable(person),
  id: r.id,
  friends: nullable(array(nullable(person))),
});

user.codec.encode({
  id: 'yo',
  person: {
    firstName: 'my first',
    lastName: 'my last',
    ssn: null,
  },
  friends: null, // TODO: is there a way to let the user completely skip the nullable fields?
});

// TODO: do we need a higher class that sits in the middle of Brick and SemiBrick which both inherit from?

type OutType<T> = T extends AbstractBrick<
  infer A,
  infer B,
  infer C,
  infer D,
  infer E
>
  ? A
  : never;

type Taskified<T> = T extends AbstractBrick<
  infer A,
  infer B,
  infer C,
  infer D,
  infer E
>
  ? T.Task<A>
  : never;

type FieldResolver<T> = T extends AbstractBrick<
  infer A,
  infer B,
  infer C,
  infer D,
  'struct'
>
  ? (root: Taskified<T>) => Partial<Taskified<T>>
  : never;

// TODO: only struct bricks should be allowed to have their own field resolvers.
// TODO: how do we add array?
