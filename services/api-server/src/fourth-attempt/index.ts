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
import { rightIO } from 'fp-ts/lib/StateReaderTaskEither';
import { argsToArgsConfig } from 'graphql/type/definition';

type Codec<A, O> = t.Type<A, O, unknown>;

type Kind =
  | 'scalar' // done
  | 'enum' // done
  | 'outputobject' // done
  | 'outputlist' // done
  | 'interface' // TODO: implement
  | 'union' // done
  | 'inputobject' // done
  | 'inputlist'; // done

type InputKind = 'scalar' | 'enum' | 'inputobject' | 'inputlist';

type OutputKind =
  | 'scalar'
  | 'enum'
  | 'outputobject'
  | 'outputlist'
  | 'interface'
  | 'union';

// TODO: consider creating different kinds of lists (one for input, one for output)
abstract class SemiBrick<
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

  toNullableBrick = () => {
    return new Brick({
      name: this.name,
      codec: t.union([this.semiCodec, t.undefined, t.null]),
      graphQLType: this.semiGraphQLType,
      kind: this.kind,
      semiCodec: this.semiCodec,
      semiGraphQLType: this.semiGraphQLType,
    });
  };

  toNonNullableBrick = () => {
    return new Brick({
      name: this.name,
      codec: this.semiCodec,
      graphQLType: new GraphQLNonNull(this.semiGraphQLType),
      kind: this.kind,
      semiCodec: this.semiCodec,
      semiGraphQLType: this.semiGraphQLType,
    });
  };

  lift = () => {
    return {
      ...this,
      ...this.toNonNullableBrick(),
      nullable: {
        ...this,
        ...this.toNullableBrick(),
      },
    };
  };
}

class Brick<
  S_A,
  S_O,
  S_G extends GraphQLNullableType,
  B_A,
  B_O,
  B_G extends S_G | GraphQLNonNull<any>, // TODO: is this bad?
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

interface BrickOf<
  SB extends SemiBrick<any, any, any, any>,
  B_A extends SB['S_A'] | null | undefined,
  B_O extends SB['S_O'] | null | undefined
> extends Brick<
    SB['S_A'],
    SB['S_O'],
    SB['semiGraphQLType'],
    B_A,
    B_O,
    SB['semiGraphQLType'] | typeof GraphQLNonNull,
    SB['kind']
  > {}

interface OutputSemiBrick<
  S_A,
  S_O,
  S_G extends GraphQLOutputType,
  K extends OutputKind
> extends SemiBrick<S_A, S_O, S_G, K> {}

interface AnyOutputSemiBrick
  extends OutputSemiBrick<any, any, any, OutputKind> {}

interface AnyOutputBrick extends BrickOf<AnyOutputSemiBrick, any, any> {}

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

interface InputFields {
  [key: string]: {
    brick: AnyInputBrick;
  };
}

export class InputObjectSemiBrick<
  P extends InputFields,
  S_A,
  S_O
> extends SemiBrick<S_A, S_O, GraphQLInputObjectType, 'inputobject'> {
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

export interface InputObjectSemiBrickOfProps<P extends InputFields>
  extends InputObjectSemiBrick<
    P,
    { [K in keyof P]: TypeOf<P[K]['brick']> },
    { [K in keyof P]: OutputOf<P[K]['brick']> }
  > {}

const inputObjectSB = <P extends InputFields>(params: {
  name: string;
  fields: P;
}): InputObjectSemiBrickOfProps<P> => {
  const codecs = _.mapValues(params.fields, (field) => field.brick.codec);
  // TODO: how do we add more than just `type` here?
  const graphQLFields = _.mapValues(params.fields, (field) => ({
    type: field.brick.graphQLType,
  }));
  const semiGraphQLType = new GraphQLInputObjectType({
    name: params.name,
    fields: graphQLFields,
  });
  return new InputObjectSemiBrick({
    name: params.name,
    bricks: params.fields,
    semiCodec: t.type(codecs),
    semiGraphQLType,
  });
};

const inputObject = flow(inputObjectSB, (x) => x.lift());

// TODO: can we add kind

class OutputFieldConfig<B extends AnyOutputBrick, A extends InputFields> {
  public readonly brick: B;
  public readonly args: A;
  constructor(params: { brick: B; args: A }) {
    this.brick = params.brick;
    this.args = params.args;
  }
}

interface FieldConfigsMap {
  [key: string]: OutputFieldConfig<any, any>;
}

type ArgsTypeOf<T extends InputFields> = {
  [K in keyof T]: T[K]['brick']['B_A'];
};

class OutputObjectSemiBrick<P extends FieldConfigsMap, S_A, S_O>
  extends SemiBrick<S_A, S_O, GraphQLObjectType, 'outputobject'>
  implements OutputSemiBrick<S_A, S_O, GraphQLObjectType, 'outputobject'> {
  public readonly fields: P;
  constructor(
    public readonly params: {
      name: string;
      fields: P;
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
    this.fields = params.fields;
  }
}

interface OutputObjectSemiBrickOf<P extends FieldConfigsMap>
  extends OutputObjectSemiBrick<
    P,
    { [K in keyof P]: TypeOf<P[K]['brick']> },
    { [K in keyof P]: OutputOf<P[K]['brick']> }
  > {}

const outputObjectSB = <P extends FieldConfigsMap>(params: {
  name: string;
  description?: string;
  fields: P;
}): OutputObjectSemiBrickOf<P> => {
  const codecs = _.mapValues(params.fields, (field) => field.brick.codec);
  const graphQLFields = _.mapValues(params.fields, (field) => ({
    type: field.brick.graphQLType,
    // deprecationReason: field.deprecationReason,
    // descripion: field.description,
    args: _.mapValues(field.args, (arg) => ({
      // TODO: reuse this part, and add the other stuff in here.
      type: arg.brick.graphQLType,
    })),
  }));
  const semiGraphQLType = new GraphQLObjectType({
    name: params.name,
    description: params.description,
    fields: graphQLFields,
  });
  return new OutputObjectSemiBrick({
    name: params.name,
    fields: params.fields,
    semiCodec: t.type(codecs),
    semiGraphQLType,
  });
};

const outputObject = flow(outputObjectSB, (x) => x.lift());

interface AnyUnionableSemiBrick extends OutputObjectSemiBrick<any, any, any> {}

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

// TODO: how do we do recursive definitions?
// TODO: also, how do we do non-nullable recursives? Do we do a Task?

export class OutputListSemiBrick<
  S_A,
  S_O,
  BASE_G extends GraphQLType,
  SB extends AnySemiBrick
> extends SemiBrick<S_A, S_O, GraphQLList<BASE_G>, 'outputlist'> {
  public readonly item: SB;

  constructor(params: {
    semiCodec: Codec<S_A, S_O>;
    semiGraphQLType: GraphQLList<BASE_G>;
    item: SB;
  }) {
    super({
      name: `Array<${params.item.name}>`,
      kind: 'outputlist',
      semiCodec: params.semiCodec,
      semiGraphQLType: params.semiGraphQLType,
    });
    this.item = params.item;
  }
}

interface OutputListSB<SB extends AnySemiBrick>
  extends OutputListSemiBrick<
    Array<SemiTypeOf<SB>>,
    Array<SemiOutputOf<SB>>,
    SB['semiGraphQLType'],
    SB
  > {}

const outputListSB = <SB extends AnySemiBrick>(item: SB): OutputListSB<SB> => {
  // TODO: do lists have names?
  return new OutputListSemiBrick({
    item,
    semiCodec: t.array(item.semiCodec),
    semiGraphQLType: new GraphQLList(item.semiGraphQLType),
  });
};

export const outputList = flow(outputListSB, (x) => x.lift());

const membership = keyOf({
  name: 'Membership',
  keys: {
    free: null,
    paid: null,
    enterprise: null,
  },
});

type FieldResolverOf<T extends FieldConfigsMap> = {
  [K in keyof T]: (
    root: T,
    args: ArgsTypeOf<T[K]['args']>,
  ) => T[K]['brick']['B_A'];
};

type FieldResolversMapOf<F extends FieldConfigsMap> = Partial<
  FieldResolverOf<F>
>;

// TODO: make this one take in the outputobjectsemibrick
class FieldResolvers<F extends FieldConfigsMap> {
  public readonly fieldConfigs: F;
  public readonly resolvers: FieldResolversMapOf<F>;

  constructor(params: { fieldConfigs: F; resolvers: FieldResolversMapOf<F> }) {
    this.fieldConfigs = params.fieldConfigs;
    this.resolvers = params.resolvers;
  }
}

const person = outputObject({
  name: 'Person',
  description: 'testing person description',
  fields: {
    id: new OutputFieldConfig({
      brick: scalars.id,
      args: { a1: { brick: scalars.string } },
    }),
    firstName: new OutputFieldConfig({
      brick: scalars.string,
      args: { a2: { brick: scalars.int }, a3: { brick: scalars.boolean } },
    }),
    lastName: new OutputFieldConfig({ brick: scalars.string, args: {} }),
    membership: new OutputFieldConfig({
      brick: membership,
      args: { something: { brick: scalars.int } },
    }),
  },
});

const root = outputObject({
  name: 'RootQuery',
  fields: {
    person: { brick: person, args: undefined },
  },
});

export const rootQuery = root.semiGraphQLType;

/**
 * TODO: Find a way to let the developers declare that it's okay to not return a nonNullable field
 * on the initial pass, as long as they give a fieldResolver that will eventually resolve that
 * field. The main challenge in doing so is ensuring that the fields dont appear to be accessible
 * through "root", even though they were returned null from the top. This could be handled by giving
 * a second generic, or a conditional type that sets the `root.X` of that field to a Maybe<X> for the
 * field resolvers.
 */

const fieldConfigs = {
  id: new OutputFieldConfig({
    brick: scalars.id,
    args: { a1: { brick: scalars.string } },
  }),
  firstName: new OutputFieldConfig({
    brick: scalars.string,
    args: { a2: { brick: scalars.int }, a3: { brick: scalars.boolean } },
  }),
  lastName: new OutputFieldConfig({ brick: scalars.string, args: {} }),
};

const fieldResolvers = new FieldResolvers({
  fieldConfigs: person.fields,
  resolvers: {
    id: (root, args) => {
      return '1';
    },
    firstName: (root, args) => {
      return '1234';
    },
    lastName: (root) => {
      return 'kaz';
    },
    membership: (root, args) => {
      args.something;
      // return root.membership;
      return 'enterprise' as const;
    },
  },
});
