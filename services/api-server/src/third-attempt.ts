/* eslint @typescript-eslint/no-empty-interface: 0 */
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
  GraphQLString,
  GraphQLInt,
  GraphQLNonNull,
  GraphQLFloat,
  GraphQLList,
  GraphQLEnumType,
  GraphQLUnionType,
  GraphQLOutputType,
  GraphQLInputObjectType,
  GraphQLType,
  GraphQLScalarType,
  GraphQLNullableType,
  graphqlSync,
} from 'graphql';
import { flow, not, pipe } from 'fp-ts/lib/function';
import { isLeft } from 'fp-ts/lib/Either';
import _ from 'lodash';

type Codec<A, O> = t.Type<A, O, unknown>;

type Shape =
  | 'scalar'
  | 'object'
  | 'interface'
  | 'union'
  | 'enum'
  | 'inputobject'
  | 'list';

interface IType {
  __shape: Shape;
}

interface IScalar extends IType {
  __shape: 'scalar';
}

interface IObject extends IType {
  __shape: 'object';
}

interface IInterface extends IType {
  __shape: 'interface';
}

interface IUnion extends IType {
  __shape: 'union';
}

interface IEnum extends IType {
  __shape: 'enum';
}

interface IInputObject extends IType {
  __shape: 'inputobject';
}

interface IList extends IType {
  __shape: 'list';
}

/** */

// interface IUnrealisedGraphQLType extends IType {
//   __unrealisedGraphQLType: GraphQLNullableType;
// }

// interface IRealisedGrapQLTypes extends IUnrealisedGraphQLType {
//   __realisedGraphqlType: GraphQLType;
// }

/** */

interface ISemiBrick extends IType {
  __unrealisedGraphQLType: GraphQLNullableType;
  __unrealisedCodec: Codec<any, any>;
}

type Nullability = 'nullable' | 'notNullable';

interface IBrick extends ISemiBrick {
  __nullability: Nullability;
  __realisedGraphQLType: GraphQLType;
  __realisedCodec: Codec<any, any>;
}

/** */

interface IScalarSemiBrick extends ISemiBrick {
  __shape: 'scalar';
  __unrealisedGraphQLType: GraphQLScalarType;
}

interface IScalarBrick extends IBrick {
  __shape: 'scalar';
  __realisedGraphQLType: GraphQLScalarType | GraphQLNonNull<GraphQLScalarType>;
}

// TODO: if we dont reuse the semiBrick within the brick, then what's the point? How can we keep them centralized?

const stringSemiBrick: IScalarSemiBrick = {
  __shape: 'scalar' as const,
  __unrealisedCodec: t.string,
  __unrealisedGraphQLType: GraphQLString,
};

const nullableString = {
  // __shape: 'scalar' as const,
  // __unrealisedCodec: t.string,
  // __unrealisedGraphQLType: GraphQLString,
  ...stringSemiBrick,
  __nullability: 'nullable' as const,
  __realisedCodec: t.union([t.string, t.undefined, t.null]),
  __realisedGraphQLType: GraphQLString,
};

const nBrick: IBrick = nullableString;

type OutputOf<T> = T extends IBrick ? T['__realisedCodec']['_A'] : never;
type a = OutputOf<typeof nullableString>;

// // TODO: is there a way for ScalarBrick to implement IBrick and IScalar at the same time?
// // TODO: as things stand, there's no straightforward way to make sure that the scalars passed for realised & unrealised gql types will refer to the same gql object.
// // TODO: how can we infer things now?
