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
  GraphQLSchema,
  GraphQLString,
  GraphQLInt,
  GraphQLOutputType as GraphqlType,
  GraphQLNonNull,
  GraphQLFloat,
  GraphQLScalarType,
  ValidationContext,
  GraphQLList,
  GraphQLEnumType,
  GraphQLUnionType,
  GraphQLOutputType,
} from 'graphql';
import { flow, not, pipe } from 'fp-ts/lib/function';
import { isLeft } from 'fp-ts/lib/Either';
import _ from 'lodash';
import { Category } from 'fp-ts/lib/Reader';

type Codec<A, O> = t.Type<A, O, unknown>;

type Nullability = 'nullable' | 'notNullable';
type Shape = 'struct' | 'scalar' | 'array' | 'enum' | 'union';

// TODO: find a way to pass down the names to io-ts codecs.

// TODO: find a new way to make the Bricks more extensible without having to create a universe of generics.
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

// TODO: find a better name
// TODO: how can we be more granular with the actual gql types that are sent over?
// TODO: could we make sure that there is at least one item in the givem params.props?
function enumerate<P extends { [key: string]: unknown }>(params: {
  name: string;
  props: P;
}) {
  const codec = t.keyof(params.props, params.name);
  const keyToKey = _.mapValues(params.props, (_, key) => key);
  const gqlValues = _.mapValues(keyToKey, (_, key) => ({
    value: key,
  }));
  const toReturn = {
    __nullability: 'pending' as const,
    __shape: 'enum' as const,
    name: params.name,
    codec,
    gql: new GraphQLEnumType({
      name: params.name,
      values: gqlValues,
    }),
  };
  return <SemiBrickified<typeof toReturn>>toReturn;
}

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

type BrickStruct<T> = {
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

type CodecStruct<T> = {
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
type GQLStruct<T> = {
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

const struct = <T, B extends BrickStruct<T>>(params: {
  name: string;
  fields: B;
}) => {
  const codecs = <CodecStruct<typeof params.fields>>(
    _.mapValues(params.fields, (x) => x.codec)
  );
  const gqls = <GQLStruct<typeof params.fields>>(
    _.mapValues(params.fields, (x) => ({ type: x.gql }))
  );
  const x = {
    __nullability: 'pending' as const,
    __shape: 'struct' as const,
    name: params.name,
    codec: t.type(codecs),
    gql: new GraphQLObjectType({
      name: params.name,
      fields: gqls,
    }),
  };
  return <SemiBrickified<typeof x>>x;
};

const person = struct({
  name: 'Person' as const,
  fields: {
    firstName: r.string,
    lastName: r.string,
    ssn: n.int,
  },
});

const animal = struct({
  name: 'Animal' as const,
  fields: {
    owner: r.string,
  },
});

const building = struct({
  name: 'Building' as const,
  fields: {
    builtIn: r.float,
  },
});

interface AnyBrick extends AbstractBrick<any, any, any, any, any> {}
type OutputOf<B extends AnyBrick> = B['codec']['_O'];
type TypeOf<B extends AnyBrick> = B['codec']['_A'];
// TODO: only enable STRUCT bricks here.
// TODO: handle the anies here.
interface AnyUnionableBrick
  extends SemiBrick<any, any, GraphQLObjectType, 'struct'> {}
export interface UnionC<
  BS extends [AnyUnionableBrick, AnyUnionableBrick, ...Array<AnyUnionableBrick>]
> extends SemiBrick<
    TypeOf<BS[number]>,
    OutputOf<BS[number]>,
    GraphQLUnionType,
    'union'
  > {}

// TODO: find a way to make the GQL types also inferrable here.
// TODO: record the fact that things were united, and what those things were, so that you can undo them later.
// TODO: fix this union error: "Abstract type \"SomeUnion\" must resolve to an Object type at runtime for field \"User.unitedField\". Either the \"SomeUnion\" type should provide a \"resolveType\" function or each possible type should provide an \"isTypeOf\" function.",
export const union = <
  BS extends [AnyUnionableBrick, AnyUnionableBrick, ...AnyUnionableBrick[]]
>(params: {
  name: string;
  bricks: BS;
}): UnionC<BS> => {
  const [first, second, ...rest] = params.bricks;
  const restOfTheCodecs = rest.map(({ codec }) => codec);
  const gqlObjectTypes = params.bricks.map(({ gql }) => gql);
  const toReturn: UnionC<BS> = {
    name: params.name,
    __nullability: 'pending',
    __shape: 'union',
    codec: t.union([first.codec, second.codec, ...restOfTheCodecs]),
    gql: new GraphQLUnionType({
      name: params.name,
      types: () => gqlObjectTypes,
    }),
    // bricks: params.bricks, // TODO: find a way to store the bricks here.
  };
  return toReturn;
};

const someUnion = union({
  name: 'SomeUnion',
  bricks: [animal, person, building],
});

const membership = enumerate({
  name: 'Membership',
  props: {
    free: null,
    paid: null,
    enterprise: null,
  },
});

export const user = struct({
  name: 'User' as const, // TODO: find a way to infer the names later.
  fields: {
    person: nullable(person),
    id: r.id,
    friends: nullable(array(nullable(person))),
    membership: notNullable(membership),
    unitedField: nullable(someUnion),
  },
});

const a = user.codec.encode({
  id: 'yo',
  person: {
    firstName: 'my first',
    lastName: 'my last',
    ssn: null,
  },
  friends: null, // TODO: is there a way to let the user completely skip the nullable fields?
  membership: 'paid',
  unitedField: null,
});

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

/**
 * Now the plan is allowing the addition of multiple different query resolvers and combining them into one.
 */

const resof = (a: any): any => null;

interface AnyStructBrick
  extends Brick<any, any, GraphQLObjectType, Nullability, 'struct'> {}

interface AnyResolvableBrick
  extends Brick<any, any, GraphQLOutputType, Nullability, any> {}

type BasicResolverOf<T extends AnyResolvableBrick> = (
  root: any,
  args: any,
  context: any,
) => OutputOf<T>;

// TODO: find a better name for this.
const resolverize = <T extends AnyResolvableBrick>(
  brick: T,
  basicResolver: BasicResolverOf<T>,
) => ({
  type: brick.gql,
  resolve: basicResolver, // TODO: maybe we should embed the resolving inside the bricks? but probably not...
});

export const queryResolver = {
  person: resolverize(nullable(person), (root, args, context) => {
    return {
      firstName: 'some first name',
      lastName: 'some last name',
      ssn: null,
    };
  }),
  user: resolverize(notNullable(user), (root, args, context) => {
    return {
      id: 'my id',
      membership: 'free' as const, // TODO: this might get old. is there a way around this "as const" thing?
      unitedField: {
        owner: 'owner name',
      },
      person: null,
      friends: [
        {
          firstName: 'first friend name',
          lastName: 'first friend last name',
          ssn: null,
        },
      ],
    };
  }),
};
