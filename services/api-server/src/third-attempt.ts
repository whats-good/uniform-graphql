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
  coerceInputValue,
} from 'graphql';
import { flow, not, pipe } from 'fp-ts/lib/function';
import { isLeft } from 'fp-ts/lib/Either';
import _ from 'lodash';

type Codec<A, O> = t.Type<A, O, unknown>;
type InputType = 'scalar' | 'enum' | 'inputobject' | 'list';
type OutputType = 'scalar' | 'object' | 'interface' | 'union' | 'enum' | 'list';
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

// interface IScalar extends IShape {
//   shape: 'scalar';
// }

// interface IObject extends IShape {
//   shape: 'object';
// }

// interface IInterface extends IShape {
//   shape: 'interface';
// }

// interface IUnion extends IShape {
//   shape: 'union';
// }

// interface IEnum extends IShape {
//   shape: 'enum';
// }

// interface IInputObject extends IShape {
//   shape: 'inputobject';
// }

// interface IList extends IShape {
//   shape: 'list';
// }

interface IAbstractBrick<S extends Shape> extends IShape {
  shape: S;
  name: string;
}
interface ISemiBrick<S extends Shape, A, O> extends IAbstractBrick<S> {
  unrealisedGraphQLType: GraphQLNullableType;
  unrealisedCodec: Codec<A, O>;
}

type Nullability = 'nullable' | 'notNullable';

// TODO: looks like we need to go back to generics...
// TODO: it also looks like we should start putting the nullability and the shape into the generics...
interface IBrick<S extends Shape, BA, BO, SB_A, SB_O>
  extends ISemiBrick<S, SB_A, SB_O> {
  nullability: Nullability;
  realisedGraphQLType: GraphQLType;
  realisedCodec: Codec<BA, BO>;
}

type Brickified<T> = T extends IBrick<
  infer A,
  infer B,
  infer C,
  infer D,
  infer E
>
  ? IBrick<A, B, C, D, E>
  : never;

type SemiBrickified<T> = T extends ISemiBrick<infer A, infer B, infer C>
  ? ISemiBrick<A, B, C>
  : never;

type BrickStruct<T> = {
  [P in keyof T]: T[P] extends IBrick<
    infer A,
    infer B,
    infer C,
    infer D,
    infer E
  >
    ? IBrick<A, B, C, D, E>
    : never;
};

type CodecStruct<T> = {
  [P in keyof T]: T[P] extends IBrick<
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
type UnrealisedGraphqlTypesStruct<T> = {
  [P in keyof T]: T[P] extends IBrick<
    infer A,
    infer B,
    infer C,
    infer D,
    infer E
  >
    ? // TODO: find a way to get rid of "type" here.
      { type: C }
    : never;
};
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

const makeNullable = <S extends Shape, A, O>(sb: ISemiBrick<S, A, O>) => {
  const toReturn = {
    ...sb,
    nullability: 'nullable' as const,
    realisedCodec: t.union([sb.unrealisedCodec, t.undefined, t.null]),
    realisedGraphQLType: sb.unrealisedGraphQLType,
  };
  return <Brickified<typeof toReturn>>toReturn;
};

const makeNotNullable = <S extends Shape, A, O>(sb: ISemiBrick<S, A, O>) => {
  const toReturn = {
    ...sb,
    nullability: 'notNullable' as const,
    realisedCodec: sb.unrealisedCodec,
    realisedGraphQLType: new GraphQLNonNull(sb.unrealisedGraphQLType),
  };
  return <Brickified<typeof toReturn>>toReturn;
};

const lift = <S extends Shape, A, O>(sb: ISemiBrick<S, A, O>) => {
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

const x = scalars.id.shape;
const y = makeNullable(id).shape;
const z = id.shape;
const as = scalars.id.nullable.realisedCodec;

// // TODO: as things stand, there's no straightforward way to make sure that the scalars passed for realised & unrealised gql types will refer to the same gql object.

const struct = <T, B extends BrickStruct<T>>(params: {
  name: string;
  fields: B;
}) => {
  const codecs = <CodecStruct<typeof params.fields>>(
    _.mapValues(params.fields, (x) => x.realisedCodec)
  );
  const gqls = <UnrealisedGraphqlTypesStruct<typeof params.fields>>(
    _.mapValues(params.fields, (x) => ({ type: x.realisedGraphQLType }))
  );
  const codec = t.type(codecs);
  type A = t.TypeOf<typeof codec>;
  type O = t.OutputOf<typeof codec>;
  type CurrentSemiBrick = ISemiBrick<'object', A, O>;
  // TODO: need to expose graphql types too.
  const result: CurrentSemiBrick = {
    name: params.name,
    shape: 'object',
    unrealisedCodec: codec,
    unrealisedGraphQLType: new GraphQLObjectType({
      name: params.name,
      // TODO: find a way to fix the fields object.
      fields: {
        id: {
          type: GraphQLString,
        },
      },
      // fields: gqls,
    }),
  };
  return <SemiBrickified<typeof result>>result;

  // type t = ISemiBrick<'object', t.
  // const x = {
  //   __nullability: 'pending' as const,
  //   __shape: 'struct' as const,
  //   name: params.name,
  //   codec: t.type(codecs),
  //   gql: new GraphQLObjectType({
  //     name: params.name,
  //     fields: gqls,
  //   }),
  // };
  return <SemiBrickified<typeof x>>x;
};
