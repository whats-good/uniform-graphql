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
  GraphQLScalarType,
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

  lift = () => {
    const nullable = new Brick({
      ...this,
      codec: t.union([this.semiCodec, t.undefined, t.null]),
      graphQLType: this.semiGraphQLType,
    });
    const notNullable = new Brick({
      ...this,
      codec: this.semiCodec,
      graphQLType: new GraphQLNonNull(this.semiGraphQLType),
    });
    const nullableOuter = {
      ...this,
      ...nullable,
    };
    const notNullableOuter = {
      ...this,
      ...notNullable,
    };
    return {
      ...notNullableOuter,
      nullable: nullableOuter,
    };
  };
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

  constructor(params: {
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
}

interface BrickOf<SB extends SemiBrick<any, any, any, any>>
  extends Brick<
    SB['S_A'],
    SB['S_O'],
    SB['semiGraphQLType'],
    any,
    any,
    any,
    SB['kind']
  > {}

interface OutputSemiBrick<
  S_A,
  S_O,
  S_G extends GraphQLOutputType,
  K extends OutputKind
> extends SemiBrick<S_A, S_O, S_G, K> {
  resolverize(): null;
}

interface AnyOutputSemiBrick
  extends OutputSemiBrick<any, any, any, OutputKind> {}

interface AnyOutputBrick extends BrickOf<AnyOutputSemiBrick> {}

class ScalarSemiBrick<S_A, S_O, S_G extends GraphQLScalarType>
  extends SemiBrick<S_A, S_O, S_G, 'scalar'>
  implements OutputSemiBrick<S_A, S_O, S_G, 'scalar'> {
  constructor(params: {
    name: string;
    semiCodec: Codec<S_A, S_O>;
    semiGraphQLType: S_G;
  }) {
    super({
      ...params,
      kind: 'scalar',
    });
  }

  resolverize() {
    return null;
  }
}

const id = new ScalarSemiBrick({
  name: 'ID',
  semiCodec: t.union([t.string, t.number]),
  semiGraphQLType: GraphQLID,
});

const string = new ScalarSemiBrick({
  name: 'String' as const,
  semiCodec: t.string,
  semiGraphQLType: GraphQLString,
});

const float = new ScalarSemiBrick({
  name: 'Float' as const,
  semiCodec: t.number,
  semiGraphQLType: GraphQLFloat,
});

const int = new ScalarSemiBrick({
  name: 'Int' as const,
  semiCodec: t.Int,
  semiGraphQLType: GraphQLInt,
});

const boolean = new ScalarSemiBrick({
  name: 'Boolean' as const,
  semiCodec: t.boolean,
  semiGraphQLType: GraphQLBoolean,
});

const scalars = {
  id: id.lift(),
  string: string.lift(),
  float: float.lift(),
  int: int.lift(),
  boolean: boolean.lift(),
};

export interface AnySemiBrick extends SemiBrick<any, any, any, any> {}
export interface AnyBrick extends Brick<any, any, any, any, any, any, any> {}
export type SemiTypeOf<SB extends AnySemiBrick> = SB['S_A'];
export type SemiOutputOf<SB extends AnySemiBrick> = SB['S_O'];
export type SemiGraphQTypeOf<SB extends AnySemiBrick> = SB['semiGraphQLType'];
export type TypeOf<B extends AnyBrick> = B['B_A'];
export type OutputOf<B extends AnyBrick> = B['B_O'];
export type GraphQLTypeOf<B extends AnyBrick> = B['graphQLType'];

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

const inputObject = flow(inputObjectSB, (x) => x.lift());

// TODO: can we add kind

interface OutputProps {
  [key: string]: AnyOutputBrick;
}

class OutputObjectSemiBrick<P extends OutputProps, S_A, S_O>
  extends SemiBrick<S_A, S_O, GraphQLObjectType, 'outputobject'>
  implements OutputSemiBrick<S_A, S_O, GraphQLObjectType, 'outputobject'> {
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

  resolverize() {
    return null;
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

const outputObject = flow(outputObjectSB, (x) => x.lift());

interface AnyUnionableSemiBrick
  extends SemiBrick<any, any, GraphQLObjectType, 'outputobject'> {}

class UnionSemiBrick<SBS extends Array<AnyUnionableSemiBrick>, S_A, S_O>
  extends SemiBrick<S_A, S_O, GraphQLUnionType, 'union'>
  implements OutputSemiBrick<S_A, S_O, GraphQLUnionType, 'union'> {
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

  resolverize() {
    return null;
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

export const union = flow(unionS, (x) => x.lift());

class EnumSemiBrick<D extends { [key: string]: unknown }>
  extends SemiBrick<keyof D, unknown, GraphQLEnumType, 'enum'>
  implements OutputSemiBrick<keyof D, unknown, GraphQLEnumType, 'enum'> {
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

  resolverize() {
    return null;
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

export const keyOf = flow(keyofS, (x) => x.lift());

// TODO: how difficult would it be to compute the enum from an array of literals?

// TODO: how do we do recursive definitions?
// TODO: also, how do we do non-nullable recursives? Do we do a Task?

t.array;

// TODO: differentiate between input and output types later
export class ArraySemiBrick<
  S_A,
  S_O,
  BASE_G extends GraphQLType,
  SB extends AnySemiBrick
> extends SemiBrick<S_A, S_O, GraphQLList<BASE_G>, 'list'> {
  public readonly item: SB;

  constructor(params: {
    semiCodec: Codec<S_A, S_O>;
    semiGraphQLType: GraphQLList<BASE_G>;
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
    SB['semiGraphQLType'],
    SB
  > {}

const arraySB = <SB extends AnySemiBrick>(item: SB): ArraySB<SB> => {
  // TODO: do lists have names?
  return new ArraySemiBrick({
    item,
    semiCodec: t.array(item.semiCodec),
    semiGraphQLType: new GraphQLList(item.semiGraphQLType),
  });
};

export const array = flow(arraySB, (x) => x.lift());

// TODO: find a way so that lifting preserves the extended types.
const personobject = outputObjectSB({
  name: 'Person',
  bricks: {
    id: scalars.id,
    firstName: scalars.string,
    lastName: scalars.string,
  },
});

const membership = keyOf({
  name: 'Membership',
  keys: {
    free: null,
    paid: null,
    enterprise: null,
  },
});

const person1 = outputObject({
  name: 'Person1',
  bricks: {
    firstName: scalars.id,
    lastName: scalars.string,
    favoriteNumber: scalars.float,
  },
});

const person2 = outputObject({
  name: 'Person2',
  bricks: {
    id: scalars.id,
    bestFriend: person1,
  },
});

export const rootQuery = new GraphQLObjectType({
  name: 'RootQueryType',
  fields: {
    enhancedPerson: {
      type: enhancedPerson.graphQLType,
      resolve: () => {
        return {
          id: '1234',
          firstName: 'kerem',
          lastName: 'kazan',
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
