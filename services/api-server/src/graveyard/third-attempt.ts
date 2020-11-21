/* eslint @typescript-eslint/no-empty-interface: 0 */
import { ApolloServer, gql, UserInputError } from 'apollo-server-express';
import * as R from 'fp-ts/lib/Record';
import * as T from 'fp-ts/lib/Task';
import * as A from 'fp-ts/lib/Array';
import * as O from 'fp-ts/lib/Option';
import express from 'express';
import { data } from '../cached/data';
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
  GraphQLInputType,
  GraphQLFieldConfigArgumentMap,
} from 'graphql';
import { flow, not, pipe } from 'fp-ts/lib/function';
import { isLeft } from 'fp-ts/lib/Either';
import _ from 'lodash';
import { fromArray } from 'fp-ts/lib/ReadonlyNonEmptyArray';
import { make } from 'fp-ts/lib/Tree';

type Codec<A, O> = t.Type<A, O, unknown>;
type InputType = 'scalar' | 'enum' | 'inputobject' | 'list';
type OutputType =
  | 'scalar'
  | 'outputobject'
  | 'interface' // TODO: figure it out later
  // TODO: also take a look at abstract types
  | 'union'
  | 'enum'
  | 'list';
type Kind =
  | 'scalar'
  | 'outputobject'
  | 'interface'
  | 'union'
  | 'enum'
  | 'inputobject'
  | 'list';

interface ISemiBrick<S extends Kind, G extends GraphQLNullableType, A, O> {
  name: string;
  kind: S;
  unrealisedGraphQLType: G;
  unrealisedCodec: Codec<A, O>;
}

type Nullability = 'nullable' | 'notNullable';

// TODO: looks like we need to go back to generics...
// TODO: it also looks like we should start putting the nullability and the kind into the generics...
interface IBrick<
  S extends Kind,
  SB_G extends GraphQLNullableType,
  // TODO: make it so that B_G can either be SB_G or the NonNull version of it. punting for now...
  B_G extends GraphQLType,
  B_A,
  B_O,
  SB_A,
  SB_O
> extends ISemiBrick<S, SB_G, SB_A, SB_O> {
  nullability: Nullability;
  realisedGraphQLType: B_G;
  realisedCodec: Codec<B_A, B_O>;
}

type Brickified<T> = T extends IBrick<
  infer S,
  infer SB_G,
  infer B_G,
  infer B_A,
  infer B_O,
  infer SB_A,
  infer SB_O
>
  ? IBrick<S, SB_G, B_G, B_A, B_O, SB_A, SB_O>
  : never;

type BrickStruct<T> = {
  [P in keyof T]: T[P] extends IBrick<
    infer S,
    infer SB_G,
    infer B_G,
    infer B_A,
    infer B_O,
    infer SB_A,
    infer SB_O
  >
    ? IBrick<S, SB_G, B_G, B_A, B_O, SB_A, SB_O>
    : never;
};

type RealisedCodecsStruct<T> = {
  [P in keyof T]: T[P] extends IBrick<
    infer S,
    infer SB_G,
    infer B_G,
    infer B_A,
    infer B_O,
    infer SB_A,
    infer SB_O
  >
    ? Codec<B_A, B_O>
    : never;
};

// TODO: shutdown warnings for unused inferred generics
type RealisedGraphqlOutputTypesStruct<T> = {
  [P in keyof T]: T[P] extends IBrick<
    infer S,
    infer SB_G,
    infer B_G,
    infer B_A,
    infer B_O,
    infer SB_A,
    infer SB_O
  >
    ? // TODO: find a way to get rid of "type" here.
      { type: B_G extends GraphQLOutputType ? B_G : never }
    : never;
};

type RealisedGraphqlInputTypesStruct<T> = {
  [P in keyof T]: T[P] extends IBrick<
    infer S,
    infer SB_G,
    infer B_G,
    infer B_A,
    infer B_O,
    infer SB_A,
    infer SB_O
  >
    ? { type: B_G extends GraphQLInputType ? B_G : never }
    : never;
};
const id = {
  name: 'ID' as const,
  kind: 'scalar' as const,
  unrealisedCodec: t.union([t.string, t.number]),
  unrealisedGraphQLType: GraphQLID,
};

const string = {
  name: 'String' as const,
  kind: 'scalar' as const,
  unrealisedCodec: t.string,
  unrealisedGraphQLType: GraphQLString,
};

const float = {
  name: 'Float' as const,
  kind: 'scalar' as const,
  unrealisedCodec: t.number,
  unrealisedGraphQLType: GraphQLFloat,
};

const int = {
  name: 'Int' as const,
  kind: 'scalar' as const,
  unrealisedCodec: t.Int,
  unrealisedGraphQLType: GraphQLInt,
};

const boolean = {
  name: 'Boolean' as const,
  kind: 'scalar' as const,
  unrealisedCodec: t.boolean,
  unrealisedGraphQLType: GraphQLBoolean,
};

const makeNullable = <S extends Kind, G extends GraphQLNullableType, A, O>(
  sb: ISemiBrick<S, G, A, O>,
) => {
  const toReturn = {
    ...sb,
    nullability: 'nullable' as const,
    realisedCodec: t.union([sb.unrealisedCodec, t.undefined, t.null]),
    realisedGraphQLType: sb.unrealisedGraphQLType,
  };
  return <Brickified<typeof toReturn>>toReturn;
};

const makeNotNullable = <S extends Kind, G extends GraphQLNullableType, A, O>(
  sb: ISemiBrick<S, G, A, O>,
) => {
  const toReturn = {
    ...sb,
    nullability: 'notNullable' as const,
    realisedCodec: sb.unrealisedCodec,
    realisedGraphQLType: new GraphQLNonNull(sb.unrealisedGraphQLType),
  };

  return <Brickified<typeof toReturn>>toReturn;
};

const lift = <S extends Kind, G extends GraphQLNullableType, A, O>(
  sb: ISemiBrick<S, G, A, O>,
) => {
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

// const a = scalars.id.kind;
// const b = scalars.float.unrealisedCodec.encode(1);
// TODO: find a way to make the type names inferrable too...
// const c = scalars.float.realisedGraphQLType;
// const d = scalars.float.name;

// // TODO: as things stand, there's no straightforward way to make sure that the scalars passed for realised & unrealised gql types will refer to the same gql object.

const outputObject = <T, B extends BrickStruct<T>>(params: {
  name: string;
  description?: string;
  fields: B;
}) => {
  const codecs = <RealisedCodecsStruct<typeof params.fields>>(
    _.mapValues(params.fields, (x) => x.realisedCodec)
  );
  const gqls = <RealisedGraphqlOutputTypesStruct<typeof params.fields>>(
    _.mapValues(params.fields, (x) => ({ type: x.realisedGraphQLType }))
  );

  const result = {
    name: params.name,
    kind: 'outputobject' as const,
    unrealisedCodec: t.type(codecs),
    unrealisedGraphQLType: new GraphQLObjectType({
      name: params.name,
      description: params.description,
      fields: gqls,
    }),
  };
  return lift(result);
};

// TODO: could we avoid the redundancy here?
const inputobject = <T, B extends BrickStruct<T>>(params: {
  name: string;
  description?: string;
  fields: B;
}) => {
  const codecs = <RealisedCodecsStruct<typeof params.fields>>(
    _.mapValues(params.fields, (x) => x.realisedCodec)
  );
  const gqls = <RealisedGraphqlInputTypesStruct<typeof params.fields>>(
    _.mapValues(params.fields, (x) => ({ type: x.realisedGraphQLType }))
  );

  return lift({
    name: params.name,
    kind: 'inputobject' as const,
    unrealisedCodec: t.type(codecs),
    unrealisedGraphQLType: new GraphQLInputObjectType({
      name: params.name,
      description: params.description,
      fields: gqls,
    }),
  });
};

interface IFieldConfigArgumentsMap<A, O> {
  codec: Codec<A, O>;
  argumentsMap: GraphQLFieldConfigArgumentMap;
}

const fieldConfigArgumentMap = <T, B extends BrickStruct<T>>(params: {
  fields: B;
}) => {
  const codecs = <RealisedCodecsStruct<typeof params.fields>>(
    _.mapValues(params.fields, (x) => x.realisedCodec)
  );
  const argumentsMap = <RealisedGraphqlInputTypesStruct<typeof params.fields>>(
    _.mapValues(params.fields, (x) => ({ type: x.realisedGraphQLType }))
  );
  const codec = t.type(codecs);

  type A = t.TypeOf<typeof codec>;
  type O = t.OutputOf<typeof codec>;

  const result: IFieldConfigArgumentsMap<A, O> = {
    argumentsMap,
    codec,
  };
  return result;
};

// TODO: find a better name
// TODO: how can we be more granular with the actual gql types that are sent over?
// TODO: could we make sure that there is at least one item in the givem params.props?
function enumerate<P extends { [key: string]: unknown }>(params: {
  name: string;
  description?: string;
  props: P;
}) {
  const codec = t.keyof(params.props, params.name);
  const keyToKey = _.mapValues(params.props, (_, key) => key);
  const gqlValues = _.mapValues(keyToKey, (_, key) => ({
    value: key,
  }));
  return lift({
    name: params.name,
    kind: 'enum' as const,
    unrealisedCodec: codec,
    unrealisedGraphQLType: new GraphQLEnumType({
      name: params.name,
      description: params.description,
      values: gqlValues,
    }),
  });
}

// TODO: is there a way to communicate to the client that the items within the array could be null?
const array = <
  S extends Kind,
  SB_G extends GraphQLNullableType,
  // TODO: make it so that B_G can either be SB_G or the NonNull version of it. punting for now...
  B_G extends GraphQLType,
  B_A,
  B_O,
  SB_A,
  SB_OT
>(
  x: IBrick<S, SB_G, B_G, B_A, B_O, SB_A, SB_OT>,
) => {
  return lift({
    name: `Array<${x.name}>`,
    kind: 'list',
    unrealisedCodec: t.array(x.realisedCodec),
    unrealisedGraphQLType: new GraphQLList(x.realisedGraphQLType),
  });
};

interface AnySemiBrick extends ISemiBrick<any, any, any, any> {}
interface AnyBrick extends IBrick<any, any, any, any, any, any, any> {}
type SemiOutputOf<B extends AnySemiBrick> = B['unrealisedCodec']['_O'];
type SemiTypeOf<B extends AnySemiBrick> = B['unrealisedCodec']['_A'];
// TODO: only enable STRUCT bricks here.
// TODO: handle the anies here.
interface AnyUnionableBrick
  extends ISemiBrick<'outputobject', GraphQLObjectType, any, any> {}
export interface UnionC<
  BS extends [AnyUnionableBrick, AnyUnionableBrick, ...Array<AnyUnionableBrick>]
> extends ISemiBrick<
    SemiTypeOf<BS[number]>,
    SemiOutputOf<BS[number]>,
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
  description?: string;
  bricks: BS;
}) => {
  const [first, second, ...rest] = params.bricks;
  const restOfTheCodecs = rest.map(({ unrealisedCodec }) => unrealisedCodec);
  const gqlObjectTypes = params.bricks.map(
    ({ unrealisedGraphQLType }) => unrealisedGraphQLType,
  );
  return lift({
    name: params.name,
    kind: 'union',
    unrealisedCodec: t.union([
      first.unrealisedCodec,
      second.unrealisedCodec,
      ...restOfTheCodecs,
    ]),
    unrealisedGraphQLType: new GraphQLUnionType({
      name: params.name,
      description: params.description,
      types: () => gqlObjectTypes,
    }),
  });
};

const membership = enumerate({
  name: 'Membership',
  description: 'this is a description for the membership enum',
  props: {
    free: null,
    paid: null,
    enterprise: null,
  },
});

const person = outputObject({
  name: 'Person',
  description: 'this is a description for the person object',
  fields: {
    id: scalars.string,
    favoriteNumber: scalars.float,
    membership: membership,
  },
});

const animal = outputObject({
  name: 'Animal',
  description: 'this is an animal.',
  fields: {
    id: scalars.id,
    owner: person,
  },
});

const bestFriend = union({
  name: 'BestFriend',
  description: 'this is a description for the union',
  bricks: [animal, person],
});

// TODO: how can we make recursive types????
export const myBroh = outputObject({
  name: 'MyBroh',
  fields: {
    person: person.nullable,
    bestFriend: bestFriend.nullable,
    age: scalars.float,
    friends: array(person).nullable,
  },
});

myBroh.realisedCodec.encode({
  age: 1,
  bestFriend: null,
  friends: null,
  person: null,
});

/**
 * TODO: is there a way to make convenience input objects directly out
 * of output objects? Not unless I keep meticulous records of everything as
 * tagged fields. We'd have to reconstruct them from the ground up
 */
export const nameInput = inputobject({
  name: 'NameInput',
  fields: {
    firstName: scalars.string,
    lastName: scalars.string,
  },
});

export const addressInput = inputobject({
  name: 'AddressInput',
  fields: {
    streetName: scalars.string,
    city: scalars.string,
    apartmentNo: scalars.int.nullable,
  },
});

export const registrationInput = inputobject({
  name: 'RegistrationInput',
  fields: {
    name: nameInput,
    address: addressInput,
    membership: membership,
    referrals: array(scalars.string),
  },
});

interface AnyResolvableBrick
  extends IBrick<
    any,
    GraphQLOutputType,
    GraphQLOutputType,
    any,
    any,
    any,
    any
  > {}

type OutputOf<B extends AnyBrick> = B['realisedCodec']['_O'];

type BasicResolverOf<
  B extends AnyResolvableBrick,
  A extends IFieldConfigArgumentsMap<any, any>
> = (root: any, args: A['codec']['_A'], context: any) => OutputOf<B>;

// TODO: find a better name for this.
// TODO: find a way to better kind the arguments
const queryResolverize = <
  T extends AnyResolvableBrick,
  A extends IFieldConfigArgumentsMap<any, any>
>(params: {
  brick: T;
  resolve: BasicResolverOf<T, A>;
  args: A;
  deprecationReason?: string;
  description?: string;
}) => ({
  type: params.brick.realisedGraphQLType,
  resolve: params.resolve as any, // TODO: find a way out of making this an any.
  args: params.args.argumentsMap,
  deprecationReason: params.deprecationReason, // TODO: does this even appear?
  description: params.description, // TODO: Does this even appear?
});

// TODO: maybe we can get rid of some of these extra kind etc types

// using the semibrick here so that we can make sure the unrealised gql type is an object type.
interface AnyFieldResolvableBrick
  extends IBrick<
    'outputobject',
    GraphQLObjectType,
    GraphQLOutputType,
    any,
    any,
    any,
    any
  > {}

// TODO: we need a collecting / wrapping object to make sure that there's only one instance of any given resolvable object
// TODO: we might need to store the gql object type's underlying structure / fields

const fieldResolverize = <
  B extends AnyFieldResolvableBrick,
  A extends B['realisedCodec']['_A'],
  P extends Partial<A>
>(params: {
  from: B;
  a: A;
  p: P;
  resolvers: any;
}) => {
  // return null;
  const existingFields = params.from.unrealisedGraphQLType.getFields();
  const existingFieldsConfig = _.mapValues(
    existingFields,
    ({ args, type, resolve, ...rest }, key) => {
      const extendedResolver = params.resolvers[key];
      const pickedResolver = extendedResolver || resolve;

      return {
        // TODO: find a way to reconstruct the previous one without messing the rest up.
        type,
        // @ts-ignore
        resolve: pickedResolver,
        // TODO: can field resolvers have arguments?
        args: {
          someParamName: { type: new GraphQLNonNull(GraphQLString) },
        },
      };
    },
  );

  const gql = new GraphQLObjectType({
    name: params.from.name,
    fields: existingFieldsConfig,
  });

  const result = {
    name: params.from.name,
    kind: params.from.kind,
    unrealisedCodec: params.from.unrealisedCodec,
    unrealisedGraphQLType: gql,
  };
  // TODO: once an object passes through here, it will be irreversible. This means that
  // it doesn't make sense to lift it anymore.

  if (params.from.nullability === 'nullable') {
    return makeNullable(result);
  } else {
    return makeNotNullable(result);
  }
};

// NOTE: we want to enable the rest of the app to return things that aren't fully
// realized graphql objects, but things we know that our object level field resolvers
// will eventually figure out. Or do we just want to let the higher ups always return
// tasks, and the low level field resolvers always assume something is already given to them,
// and have them only be eligible for modification of said items? Because i doubt that low level
// field resolvers will have access to what their siblings will eventually compute. All the data they
// have will be made available to them from above.

export const personResolver = fieldResolverize({
  from: person,
  a: {
    id: 'asdf',
    favoriteNumber: 2,
    membership: 'enterprise' as const,
  },
  p: {},
  // @ts-ignore
  resolvers: {
    // @ts-ignore
    id: (root, context, args) => {
      return 'yo';
    },
  },
});

// TODO: we want to pass in an ArgsStruct, force the resolve(args) to use the type of said struct, and produce the { type } gql maps
const personQueryResolver = queryResolverize({
  // brick: person,
  // TODO: how do we go from normal brick to resolver brick?
  brick: personResolver,
  // deprecationReason: 'because deprecated',
  description: 'some description',
  // TODO: find ways to make these structs more extensible
  args: fieldConfigArgumentMap({
    fields: {
      id: scalars.id,
      firstName: scalars.string,
      // mySpecialArg: registrationInput,
      // abcabc: scalars.float, // TODO: figure out why passing any key-value pair still works here...
    },
  }),
  resolve: (root, args, context) => {
    return {
      favoriteNumber: 1,
      id: 'myid',
      membership: 'free' as const, // TODO: is there a way to get around enums an allow people to pass them as just consts?
    };
  },
});

export const queryResolver = new GraphQLObjectType({
  name: 'RootQueryType',
  description: 'this is the root description',
  fields: {
    person: personQueryResolver,
    kerem: {
      type: GraphQLString,
      resolve: () => {},
      // deprecationReason: 'because deprecated',
      // description: 'this is a description',
    },
    kazan: {
      type: GraphQLString,
      resolve: (root, args, ctx) => {
        return args.id;
      },
      args: {
        id: {
          type: registrationInput.realisedGraphQLType,
          // deprecationReason: 'deprecated because',
          defaultValue: 'this is a default value',
          description: 'some description!',
        },
      },
    },
  },
});
