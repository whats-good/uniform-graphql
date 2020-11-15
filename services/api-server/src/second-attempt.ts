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
  GraphQLOutputType,
  GraphQLNonNull,
  GraphQLFloat,
  GraphQLScalarType,
} from 'graphql';
import { flow, not, pipe } from 'fp-ts/lib/function';
import { isLeft } from 'fp-ts/lib/Either';
import _ from 'lodash';
import { Category } from 'fp-ts/lib/Reader';

type Codec<A, O> = t.Type<A, O, unknown>;

interface SemiBrick<A, O, G extends GraphQLOutputType> {
  name: string;
  gql: G;
  codec: Codec<A, O>;
  __nullability: 'pending' | 'nullable' | 'notNullable';
}

interface Brick<
  A,
  O,
  G extends GraphQLOutputType,
  N extends 'nullable' | 'notNullable'
> extends SemiBrick<A, O, G> {
  __nullability: N;
}

type Brickified<T> = T extends Brick<infer A, infer B, infer C, infer D>
  ? Brick<A, B, C, D>
  : never;

const nullable = <A, O, G extends GraphQLOutputType>(x: SemiBrick<A, O, G>) => {
  const toReturn = {
    __nullability: 'nullable' as const,
    name: x.name,
    gql: x.gql,
    codec: t.union([t.undefined, t.null, x.codec]),
  };
  return <Brickified<typeof toReturn>>toReturn;
};

const notNullable = <A, O, G extends GraphQLOutputType>(
  x: SemiBrick<A, O, G>,
) => {
  const toReturn = {
    __nullability: 'notNullable' as const,
    name: x.name,
    gql: new GraphQLNonNull(x.gql),
    codec: x.codec,
  };
  return <Brickified<typeof toReturn>>toReturn;
};

const id = {
  codec: t.union([t.string, t.number]),
  gql: GraphQLID,
  name: 'ID' as const,
  __nullability: 'pending' as const,
};
const string = {
  codec: t.string,
  gql: GraphQLString,
  name: 'String' as const,
  __nullability: 'pending' as const,
};
const float = {
  codec: t.number,
  gql: GraphQLFloat,
  name: 'Float' as const,
  __nullability: 'pending' as const,
};
const int = {
  codec: t.Int,
  gql: GraphQLInt,
  name: 'Int' as const,
  __nullability: 'pending' as const,
};
const boolean = {
  codec: t.boolean,
  gql: GraphQLBoolean,
  name: 'Boolean' as const,
  __nullability: 'pending' as const,
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
