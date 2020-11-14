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

type Codec<A, O> = t.Type<A, O, unknown>;

type Scalar<A, O> = {
  name: string;
  gql: GraphQLScalarType;
  codec: Codec<A, O>;
};

type Lifted<T, B> = T & B;
type NullabilityChecked = {
  __nullability: 'nullable' | 'notNullable';
};

type NullabilityCheckedScalar<T extends Scalar<any, any>> = Lifted<
  T,
  NullabilityChecked
>;

// TODO: how do we make the codec still visible through the typechecker even after the modification?
const nullable = <A, O>(x: Scalar<A, O>) => {
  return {
    __nullability: 'nullable' as const,
    name: x.name,
    gql: x.gql,
    codec: t.union([t.undefined, t.null, x.codec]),
  };
};

const notNullable = <A, O>(x: Scalar<A, O>) => {
  return {
    __nullability: 'notNullable' as const,
    name: x.name,
    gql: new GraphQLNonNull(x.gql),
    codec: x.codec,
  };
};

const id = {
  codec: t.union([t.string, t.number]),
  gql: GraphQLID,
  name: 'ID' as const,
};
const string = {
  codec: t.string,
  gql: GraphQLString,
  name: 'String' as const,
};
const float = {
  codec: t.number,
  gql: GraphQLFloat,
  name: 'Float' as const,
};
const int = {
  codec: t.Int,
  gql: GraphQLInt,
  name: 'Int' as const,
};
const boolean = {
  codec: t.boolean,
  gql: GraphQLBoolean,
  name: 'Boolean' as const,
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
