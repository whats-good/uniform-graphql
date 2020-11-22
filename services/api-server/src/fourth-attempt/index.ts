/* eslint @typescript-eslint/no-empty-interface: 0 */
import { flow, pipe } from 'fp-ts/lib/function';
import _ from 'lodash';
import {
  GraphQLBoolean,
  GraphQLEnumType,
  GraphQLFloat,
  GraphQLID,
  GraphQLInputObjectType,
  GraphQLInputType,
  GraphQLInt,
  GraphQLList,
  GraphQLNonNull,
  GraphQLNullableType,
  GraphQLObjectType,
  GraphQLOutputType,
  GraphQLString,
  GraphQLType,
  GraphQLUnionType,
} from 'graphql';
import * as t from 'io-ts';

type Codec<A, O> = t.Type<A, O, unknown>;

type Kind =
  | 'scalar' // done
  | 'outputobject' // done
  | 'interface'
  | 'union' // done
  | 'enum' // done
  | 'inputobject' // done
  | 'list'; // done

type InputKind = 'scalar' | 'enum' | 'inputobject' | 'list'; // TODO: the list items themselves should be 'inputable'

type OutputKind =
  | 'scalar'
  | 'outputobject'
  | 'interface'
  | 'union'
  | 'enum'
  | 'list'; // TODO: the list items themselves should be outputable

// TODO: consider creating different kinds of lists (one for input, one for output)
export class SemiBrick<
  S_A,
  S_O,
  S_G extends GraphQLNullableType,
  K extends Kind
> {
  public readonly S_A!: S_A;
  public readonly S_O!: S_O;
  public readonly semiGraphQLType: S_G;
  public readonly name: string;
  public readonly semiCodec: Codec<S_A, S_O>;
  public readonly kind: K;

  constructor(params: {
    name: string;
    semiGraphQLType: S_G;
    semiCodec: Codec<S_A, S_O>;
    kind: K;
  }) {
    this.name = params.name;
    this.semiGraphQLType = params.semiGraphQLType;
    this.semiCodec = params.semiCodec;
    this.kind = params.kind;
  }
}

export class Brick<
  S_A,
  S_O,
  S_G extends GraphQLNullableType,
  B_A,
  B_O,
  B_G extends GraphQLType,
  K extends Kind
> extends SemiBrick<S_A, S_O, S_G, K> {
  public readonly B_A!: B_A;
  public readonly B_O!: B_O;
  public readonly graphQLType: B_G;
  public readonly codec: Codec<B_A, B_O>;

  private constructor(params: {
    name: string;
    semiGraphQLType: S_G;
    semiCodec: Codec<S_A, S_O>;
    graphQLType: B_G;
    codec: Codec<B_A, B_O>;
    kind: K;
  }) {
    super(params);
    this.graphQLType = params.graphQLType;
    this.codec = params.codec;
  }

  private static fromNullableSemiBrick = <
    S_A,
    S_O,
    S_G extends GraphQLNullableType,
    K extends Kind
  >(
    sb: SemiBrick<S_A, S_O, S_G, K>,
  ) => {
    return new Brick({
      ...sb,
      codec: t.union([sb.semiCodec, t.undefined, t.null]),
      graphQLType: sb.semiGraphQLType,
    });
  };

  private static fromNonNullableSemiBrick = <
    S_A,
    S_O,
    S_G extends GraphQLNullableType,
    K extends Kind
  >(
    sb: SemiBrick<S_A, S_O, S_G, K>,
  ) => {
    return new Brick({
      ...sb,
      codec: sb.semiCodec,
      graphQLType: new GraphQLNonNull(sb.semiGraphQLType),
    });
  };

  // TODO: lifting removes special fields...
  public static lift = <
    S_A,
    S_O,
    S_G extends GraphQLNullableType,
    K extends Kind
  >(
    sb: SemiBrick<S_A, S_O, S_G, K>,
  ) => {
    // TODO: we need to create one more class: LiftedBricks
    return {
      ...Brick.fromNonNullableSemiBrick(sb),
      nullable: Brick.fromNullableSemiBrick(sb),
    };
  };
}

const id = new SemiBrick({
  kind: 'scalar',
  name: 'ID',
  semiCodec: t.union([t.string, t.number]),
  semiGraphQLType: GraphQLID,
});

const string = new SemiBrick({
  kind: 'scalar',
  name: 'String' as const,
  semiCodec: t.string,
  semiGraphQLType: GraphQLString,
});

const float = new SemiBrick({
  kind: 'scalar',
  name: 'Float' as const,
  semiCodec: t.number,
  semiGraphQLType: GraphQLFloat,
});

const int = new SemiBrick({
  kind: 'scalar',
  name: 'Int' as const,
  semiCodec: t.Int,
  semiGraphQLType: GraphQLInt,
});

const boolean = new SemiBrick({
  kind: 'scalar',
  name: 'Boolean' as const,
  semiCodec: t.boolean,
  semiGraphQLType: GraphQLBoolean,
});

const scalars = {
  id: Brick.lift(id),
  string: Brick.lift(string),
  float: Brick.lift(float),
  int: Brick.lift(int),
  boolean: Brick.lift(boolean),
};

export interface AnySemiBrick extends SemiBrick<any, any, any, any> {}
export interface AnyBrick extends Brick<any, any, any, any, any, any, any> {}
export type SemiTypeOf<SB extends AnySemiBrick> = SB['S_A'];
export type SemiOutputOf<SB extends AnySemiBrick> = SB['S_O'];
export type SemiGraphQTypeOf<SB extends AnySemiBrick> = SB['semiGraphQLType'];
export type TypeOf<B extends AnyBrick> = B['B_A'];
export type OutputOf<B extends AnyBrick> = B['B_O'];
export type GraphQLTypeOf<B extends AnyBrick> = B['graphQLType'];

// TODO: can we add kind
interface AnyOutputBrick
  extends Brick<any, any, GraphQLOutputType, any, any, any, OutputKind> {}
interface OutputProps {
  [key: string]: AnyOutputBrick;
}

class OutputObjectSemiBrick<P extends OutputProps, S_A, S_O> extends SemiBrick<
  S_A,
  S_O,
  GraphQLObjectType,
  'outputobject'
> {
  public readonly bricks: P;
  constructor(
    public readonly params: {
      name: string;
      bricks: P;
      semiCodec: Codec<S_A, S_O>;
      semiGraphQLType: GraphQLObjectType;
    },
  ) {
    super({
      name: params.name,
      semiCodec: params.semiCodec,
      semiGraphQLType: params.semiGraphQLType,
      kind: 'outputobject',
    });
    this.bricks = params.bricks;
  }
}

interface OutputObjectSemiBrickOfProps<P extends OutputProps>
  extends OutputObjectSemiBrick<
    P,
    { [K in keyof P]: TypeOf<P[K]> },
    { [K in keyof P]: OutputOf<P[K]> }
  > {}

const outputObjectSB = <P extends OutputProps>(params: {
  name: string;
  bricks: P;
}): OutputObjectSemiBrickOfProps<P> => {
  const codecs = _.mapValues(params.bricks, (brick) => brick.codec);
  const graphQLFields = _.mapValues(params.bricks, (brick) => ({
    type: brick.graphQLType,
  }));
  const semiGraphQLType = new GraphQLObjectType({
    name: params.name,
    fields: graphQLFields,
  });
  return new OutputObjectSemiBrick({
    name: params.name,
    bricks: params.bricks,
    semiCodec: t.type(codecs),
    semiGraphQLType,
  });
};

const outputObject = flow(outputObjectSB, Brick.lift);

interface AnyInputBrick
  extends Brick<any, any, GraphQLInputType, any, any, any, InputKind> {}

interface InputProps {
  [key: string]: AnyInputBrick;
}

export class InputObjectSemiBrick<P, S_A, S_O> extends SemiBrick<
  S_A,
  S_O,
  GraphQLInputObjectType,
  'inputobject'
> {
  public readonly props: P;
  constructor(params: {
    name: string;
    bricks: P;
    semiCodec: Codec<S_A, S_O>;
    semiGraphQLType: GraphQLInputObjectType;
  }) {
    super({
      name: params.name,
      semiCodec: params.semiCodec,
      semiGraphQLType: params.semiGraphQLType,
      kind: 'inputobject',
    });
    this.props = params.bricks;
  }
}

export interface InputObjectSemiBrickOfProps<P extends InputProps>
  extends InputObjectSemiBrick<
    P,
    { [K in keyof P]: TypeOf<P[K]> },
    { [K in keyof P]: OutputOf<P[K]> }
  > {}

const inputObjectSB = <P extends InputProps>(params: {
  name: string;
  bricks: P;
}): InputObjectSemiBrickOfProps<P> => {
  const codecs = _.mapValues(params.bricks, (brick) => brick.codec);
  // TODO: how do we add more than just `type` here?
  const graphQLFields = _.mapValues(params.bricks, (brick) => ({
    type: brick.graphQLType,
  }));
  const semiGraphQLType = new GraphQLInputObjectType({
    name: params.name,
    fields: graphQLFields,
  });
  return new InputObjectSemiBrick({
    name: params.name,
    bricks: params.bricks,
    semiCodec: t.type(codecs),
    semiGraphQLType,
  });
};

const inputObject = flow(inputObjectSB, Brick.lift);

interface AnyUnionableSemiBrick
  extends SemiBrick<any, any, GraphQLObjectType, 'outputobject'> {}

class UnionSemiBrick<
  SBS extends Array<AnyUnionableSemiBrick>,
  S_A,
  S_O
> extends SemiBrick<S_A, S_O, GraphQLUnionType, 'union'> {
  public readonly semiBricks;

  constructor(params: {
    name: string;
    semiBricks: SBS;
    semiGraphQLType: GraphQLUnionType;
    semiCodec: Codec<S_A, S_O>;
  }) {
    super({
      ...params,
      kind: 'union',
    });
    this.semiBricks = params.semiBricks;
  }
}

interface UnionSB<
  SBS extends [
    AnyUnionableSemiBrick,
    AnyUnionableSemiBrick,
    ...Array<AnyUnionableSemiBrick>
  ]
> extends UnionSemiBrick<
    SBS,
    SemiTypeOf<SBS[number]>,
    SemiOutputOf<SBS[number]>
  > {}

// TODO: make these only take in unionable bricks, and not anybricks
const unionS = <
  SBS extends [
    AnyUnionableSemiBrick,
    AnyUnionableSemiBrick,
    ...Array<AnyUnionableSemiBrick>
  ]
>(params: {
  semiBricks: SBS;
  name: string;
}): UnionSB<SBS> => {
  const [firstBrick, secondBrick, ...otherBricks] = params.semiBricks;
  const codecs: [t.Mixed, t.Mixed, ...Array<t.Mixed>] = [
    firstBrick.semiCodec,
    secondBrick.semiCodec,
    ...otherBricks.map(({ semiCodec }) => semiCodec),
  ];
  const graphQLTypes = [
    firstBrick.semiGraphQLType,
    secondBrick.semiGraphQLType,
    ...otherBricks.map(({ semiGraphQLType }) => semiGraphQLType),
  ];
  return new UnionSemiBrick({
    name: params.name,
    semiBricks: params.semiBricks,
    semiCodec: t.union(codecs),
    semiGraphQLType: new GraphQLUnionType({
      // TODO:refine
      name: params.name,
      types: graphQLTypes,
    }),
  });
};

export const union = flow(unionS, Brick.lift);

const myOb = outputObject({
  name: 'yo',
  bricks: {
    firstName: scalars.string,
    lastName: scalars.float,
  },
});

myOb.semiCodec.encode({
  firstName: 'yo',
  lastName: 1,
});

const d = union({
  name: 'yhi',
  semiBricks: [myOb, myOb], // TODO: how do we prevent these two objects frombeing the same?
});

class EnumSemiBrick<D extends { [key: string]: unknown }> extends SemiBrick<
  keyof D,
  unknown,
  GraphQLEnumType,
  'enum'
> {
  constructor(params: {
    name: string;
    keys: D;
    semiCodec: Codec<keyof D, keyof D>; // TODO: maybe we shouldn't compute this here, and just do the usual S_A & S_B
    semiGraphQLType: GraphQLEnumType;
  }) {
    super({
      name: params.name,
      semiCodec: params.semiCodec,
      kind: 'enum',
      semiGraphQLType: params.semiGraphQLType,
    });
  }
}

interface EnumSemiBrickOfKeyOf<D extends { [key: string]: unknown }>
  extends EnumSemiBrick<D> {}

const keyofS = <D extends { [key: string]: unknown }>(params: {
  name: string;
  keys: D;
}): EnumSemiBrickOfKeyOf<D> => {
  const keyToKey = _.mapValues(params.keys, (_, key) => key);
  const gqlValues = _.mapValues(keyToKey, (_, key) => ({
    value: key,
  }));
  return new EnumSemiBrick({
    name: params.name,
    keys: params.keys,
    semiCodec: t.keyof(params.keys),
    semiGraphQLType: new GraphQLEnumType({
      name: params.name,
      values: gqlValues,
    }),
  });
};

export const keyOf = flow(keyofS, Brick.lift);

// TODO: how difficult would it be to compute the enum from an array of literals?

// TODO: how do we do recursive definitions?
// TODO: also, how do we do non-nullable recursives? Do we do a Task?

t.array;

export class ArraySemiBrick<
  S_A,
  S_O,
  S_G extends GraphQLList<any>, // TODO: maybe this shouldn't be an any
  SB extends AnySemiBrick
> extends SemiBrick<S_A, S_O, S_G, 'list'> {
  public readonly item: SB;

  constructor(params: {
    semiCodec: Codec<S_A, S_O>;
    semiGraphQLType: S_G;
    item: SB;
  }) {
    super({
      name: `Array<${params.item.name}>`,
      kind: 'list',
      semiCodec: params.semiCodec,
      semiGraphQLType: params.semiGraphQLType,
    });
    this.item = params.item;
  }
}

interface ArraySB<SB extends AnySemiBrick>
  extends ArraySemiBrick<
    Array<SemiTypeOf<SB>>,
    Array<SemiOutputOf<SB>>,
    GraphQLList<SB['semiGraphQLType']>,
    SB
  > {}

const membership = keyOf({
  name: 'Membership',
  keys: {
    free: null,
    paid: null,
    enterprise: null,
  },
});

type ASD = ArraySB<typeof membership>;

const arraySB = <SB extends AnySemiBrick>(item: SB): ArraySB<SB> => {
  // TODO: do lists have names?
  return new ArraySemiBrick({
    item,
    semiCodec: t.array(item.semiCodec),
    semiGraphQLType: new GraphQLList(item.semiGraphQLType),
  });
};

export const array = flow(arraySB, Brick.lift);

const membershiplist = array(membership);

const person = outputObject({
  name: 'Person',
  bricks: {
    id: scalars.id,
    firstName: scalars.string,
    lastName: scalars.string,
    age: scalars.float,
  },
});

const personSB = outputObjectSB({
  name: 'Person',
  bricks: {
    id: scalars.id,
    firstName: scalars.string,
    lastName: scalars.string,
    age: scalars.float,
  },
});
const signupArgs = inputObject({
  name: 'SignupArgs',
  bricks: {
    firstName: scalars.string,
    lastName: scalars.string,
    age: scalars.float,
  },
});
// TODO: find a way so that lifting preserves the extended types.
const personobject = outputObjectSB({
  name: 'Person',
  bricks: {
    id: scalars.id,
    firstName: scalars.string,
  },
});

type ARGSOF<T extends InputProps> = {
  [P in keyof T]: T[P]['B_A'];
};

const fieldResolverize = <
  SB extends OutputObjectSemiBrick<any, any, any>,
  K extends keyof SB['bricks'],
  I extends InputProps,
  RET extends SB['bricks'][K]['B_A']
>(
  sb: SB,
  key: K,
  args: I,
  resolve: (
    root: SB['S_A'],
    args: ARGSOF<I>,
    context: any,
  ) => RET | Promise<RET>,
) => ({
  // TODO: graph other things too, such as descripton and deprecation reason.
  type: sb.bricks[key].graphQLType,
  args: _.mapValues(args, (arg) => ({
    type: arg.graphQLType, // TODO: see if there's a better way than this
  })),
  resolve: resolve as any, // TODO: find a way out of this.
});

const fieldResolvedId = fieldResolverize(
  personobject,
  'id',
  { deeperId: scalars.id, deeperNumber: scalars.float },
  (root, { deeperId, deeperNumber }) => {
    return 'yo' + root.firstName + deeperId + ',' + deeperNumber;
  },
);

type FieldResolversMap<P extends OutputProps> = {
  [K in keyof P]: ReturnType<typeof fieldResolverize>;
};

const resolverize = <
  SB extends OutputObjectSemiBrick<any, any, any>,
  P extends SB['bricks'],
  F extends Partial<FieldResolversMap<P>>
>(
  sb: SB,
  enhancedFields: F,
) => {
  const nextGraphQLType = new GraphQLObjectType({
    name: sb.name,
    fields: {
      // TODO: find a way to preserve the previous values here, without having to overwrite everything.
      ..._.mapValues(sb.bricks, (brick) => ({
        type: brick.graphQLType,
      })),
      ...enhancedFields,
    },
  });
  const nextSB = new OutputObjectSemiBrick({
    ...sb.params,
    semiGraphQLType: nextGraphQLType,
  });
  return Brick.lift(nextSB);
};

// TODO: next milestones: a: find a way to avoid having to repeat "fieldResolverize", b) make it impossible to resolverize another field.
const enhancedPerson = resolverize(personobject, {
  id: fieldResolverize(
    personobject,
    'id',
    { deeperId: scalars.id },
    (root, { deeperId }) => {
      return deeperId;
    },
  ),
  firstName: fieldResolverize(
    personobject,
    'firstName',
    { someRandomArg: scalars.boolean },
    async (root, { someRandomArg }) => {
      return someRandomArg ? root.firstName : 'fallback';
    },
  ),
});

const enhancedPersonGraphQLType = new GraphQLObjectType({
  name: personobject.name,
  fields: {
    // TODO: find a way to preserve the previous values here, without having to overwrite everything.
    ..._.mapValues(personobject.bricks, (brick) => ({
      type: brick.graphQLType,
    })),
    id: fieldResolvedId,
  },
});

export const rootQuery = new GraphQLObjectType({
  name: 'RootQueryType',
  fields: {
    enhancedPerson: {
      type: enhancedPerson.graphQLType,
      resolve: () => {
        return {
          id: 'kerem',
          firstName: 'kazan',
        };
      },
    },
    otherPerson: {
      args: {
        higherArg: {
          type: GraphQLString,
        },
      },
      type: new GraphQLObjectType({
        name: 'OtherPerson',
        fields: {
          id: {
            type: GraphQLID,
            args: {
              scalarArg: {
                type: GraphQLString,
              },
              inputObjectArg: {
                type: new GraphQLInputObjectType({
                  name: 'InputObjectArg',
                  fields: {
                    first: {
                      type: GraphQLString,
                    },
                    second: {
                      type: GraphQLString,
                    },
                  },
                }),
              },
            },
          },
        },
      }),
    },
  },
});
