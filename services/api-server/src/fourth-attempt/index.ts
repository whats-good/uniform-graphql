/* eslint @typescript-eslint/no-empty-interface: 0 */
import { flow } from 'fp-ts/lib/function';
import _ from 'lodash';
import {
  GraphQLBoolean,
  GraphQLEnumType,
  GraphQLFloat,
  GraphQLID,
  GraphQLInt,
  GraphQLList,
  GraphQLNonNull,
  GraphQLNullableType,
  GraphQLObjectType,
  GraphQLOutputType,
  GraphQLSpecifiedByDirective,
  GraphQLString,
  GraphQLType,
  GraphQLUnionType,
  LoneSchemaDefinitionRule,
} from 'graphql';
import * as t from 'io-ts';
import { key } from 'monocle-ts/lib/Traversal';

type Codec<A, O> = t.Type<A, O, unknown>;

type Kind =
  | 'scalar' // done
  | 'outputobject' // done
  | 'interface'
  | 'union' // done
  | 'enum' // done
  | 'inputobject'
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
interface AnyOutputObjectPropBrick
  extends Brick<any, any, GraphQLOutputType, any, any, any, OutputKind> {}

export interface OutputProps {
  [key: string]: AnyOutputObjectPropBrick;
}
export class OutputObjectSemiBrick<P, S_A, S_O> extends SemiBrick<
  S_A,
  S_O,
  GraphQLObjectType,
  'outputobject'
> {
  public readonly props: P;
  constructor(params: {
    name: string;
    bricks: P;
    semiCodec: Codec<S_A, S_O>;
    semiGraphQLType: GraphQLObjectType;
  }) {
    super({
      name: params.name,
      semiCodec: params.semiCodec,
      semiGraphQLType: params.semiGraphQLType,
      kind: 'outputobject',
    });
    this.props = params.bricks;
  }
}

export interface OutputObjectSemiBrickOfProps<P extends OutputProps>
  extends OutputObjectSemiBrick<
    P,
    { [K in keyof P]: TypeOf<P[K]> },
    { [K in keyof P]: OutputOf<P[K]> }
  > {}

const outputObjectS = <P extends OutputProps>(params: {
  name: string;
  bricks: P;
}): OutputObjectSemiBrickOfProps<P> => {
  const codecs = _.mapValues(params.bricks, (brick) => brick.codec);
  // TODO: how do we add more than just `type` here?
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

const outputObject = flow(outputObjectS, Brick.lift);

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

const abc = membershiplist.codec.encode(['enterprise', 'free', 'paid']);
