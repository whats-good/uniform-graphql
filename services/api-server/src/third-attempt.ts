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
  isInputObjectType,
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

interface IShape {
  shape: Shape;
}

interface IScalar extends IShape {
  shape: 'scalar';
}

interface IObject extends IShape {
  shape: 'object';
}

interface IInterface extends IShape {
  shape: 'interface';
}

interface IUnion extends IShape {
  shape: 'union';
}

interface IEnum extends IShape {
  shape: 'enum';
}

interface IInputObject extends IShape {
  shape: 'inputobject';
}

interface IList extends IShape {
  shape: 'list';
}

/** */

// interface IUnrealisedGraphQLType extends IType {
//   __unrealisedGraphQLType: GraphQLNullableType;
// }

// interface IRealisedGrapQLTypes extends IUnrealisedGraphQLType {
//   __realisedGraphqlType: GraphQLType;
// }

/** */

interface IAbstractBrick extends IShape {
  name: string;
}
interface ISemiBrick<A, O> extends IAbstractBrick {
  unrealisedGraphQLType: GraphQLNullableType;
  unrealisedCodec: Codec<A, O>;
}

type Nullability = 'nullable' | 'notNullable';

// TODO: looks like we need to go back to generics...
// TODO: it also looks like we should start putting the nullability and the shape into the generics...
interface IBrick<BA, BO, SA, SO> extends ISemiBrick<SA, SO> {
  nullability: Nullability;
  realisedGraphQLType: GraphQLType;
  realisedCodec: Codec<BA, BO>;
}

/** */

interface IScalarSemiBrick<A, O> extends ISemiBrick<A, O> {
  shape: 'scalar';
  unrealisedGraphQLType: GraphQLScalarType;
}

interface IScalarBrick<BA, BO, SA, SO> extends IBrick<BA, BO, SA, SO> {
  shape: 'scalar';
  realisedGraphQLType: GraphQLScalarType | GraphQLNonNull<GraphQLScalarType>;
}

// TODO: if we dont reuse the semiBrick within the brick, then what's the point? How can we keep them centralized?

const id = {
  name: 'ID' as const,
  shape: 'scalar' as const,
  unrealisedCodec: t.union([t.string, t.number]),
  unrealisedGraphQLType: GraphQLID,
};

const string = {
  name: 'String' as const,
  shape: 'scalar' as const,
  unrealisedCodec: t.string,
  unrealisedGraphQLType: GraphQLString,
};

const float = {
  name: 'Float' as const,
  shape: 'scalar' as const,
  unrealisedCodec: t.number,
  unrealisedGraphQLType: GraphQLFloat,
};

const int = {
  name: 'Int' as const,
  shape: 'scalar' as const,
  unrealisedCodec: t.Int,
  unrealisedGraphQLType: GraphQLInt,
};

const boolean = {
  name: 'Boolean' as const,
  shape: 'scalar' as const,
  unrealisedCodec: t.boolean,
  unrealisedGraphQLType: GraphQLBoolean,
};

const makeNullable = <A, O>(sb: ISemiBrick<A, O>) => {
  return {
    ...sb,
    nullability: 'nullable' as const,
    realisedCodec: t.union([sb.unrealisedCodec, t.undefined, t.null]),
    realisedGraphQLType: sb.unrealisedGraphQLType,
  };
};

const makeNotNullable = <A, O>(sb: ISemiBrick<A, O>) => {
  return {
    ...sb,
    nullability: 'notNullable' as const,
    realisedCodec: sb.unrealisedCodec,
    realisedGraphQLType: new GraphQLNonNull(sb.unrealisedGraphQLType),
  };
};

const lift = <A, O>(sb: ISemiBrick<A, O>) => {
  makeNullable(sb);
  return {
    ...makeNotNullable(sb),
    nullable: makeNullable(sb),
  };
};

const scalars = {
  id: lift(id),
  string: lift(string),
  float: lift(float),
  int: lift(int),
  boolean: lift(boolean),
};

// nullable.id.realisedCodec.encode(undefined);

// const nullableString = {
//   ...stringSemiBrick,
// };

// const nBrick: IBrick = nullableString;

// type OutputOf<T> = T extends IBrick ? T['realisedCodec']['_A'] : never;
// type a = OutputOf<typeof nullableString>;

// const semiBricks = {};

// // TODO: is there a way for ScalarBrick to implement IBrick and IScalar at the same time?
// // TODO: as things stand, there's no straightforward way to make sure that the scalars passed for realised & unrealised gql types will refer to the same gql object.
// // TODO: how can we infer things now?
