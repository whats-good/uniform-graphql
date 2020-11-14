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
import { flow, pipe } from 'fp-ts/lib/function';
import { isLeft } from 'fp-ts/lib/Either';

type Codec<A, O = A, I = unknown> = t.Type<A, O, I>;

type Scalar<N extends string, C extends t.Mixed> = {
  name: N;
  gql: GraphQLScalarType;
  codec: C;
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
const nulled = <C extends t.Mixed, T extends Scalar<any, C>>(x: T) => {
  return {
    __nullability: 'nullable' as const,
    name: x.name,
    codec,
    gql: x.gql,
  };
};

const notNullable = <C extends t.Mixed, T extends Scalar<any, C>>(x: T) => {
  return {
    __nullability: 'notNullable' as const,
    name: x.name,
    codec: x.codec,
    gql: new GraphQLNonNull(x.gql),
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

const core = id.codec.encode('yo');
const notNullE = notNullable(id).codec.encode();

const b = nulled(id);
const bEncoded = b.codec.encode(true);
const c = notNullable(id);
const cEncoded = c.codec.encode('no');

const toX = <T extends Scalar>(scalar: T): NullabilityCheckedScalar<T> => {
  return Object.assign({}, scalar, { __nullability: 'nullable' as const });
};
