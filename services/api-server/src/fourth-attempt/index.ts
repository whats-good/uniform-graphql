/* eslint @typescript-eslint/no-empty-interface: 0 */
import { flow } from 'fp-ts/lib/function';
import _ from 'lodash';
import {
  GraphQLBoolean,
  GraphQLFloat,
  GraphQLID,
  GraphQLInt,
  GraphQLNonNull,
  GraphQLNullableType,
  GraphQLObjectType,
  GraphQLSpecifiedByDirective,
  GraphQLString,
  GraphQLType,
  GraphQLUnionType,
  LoneSchemaDefinitionRule,
} from 'graphql';
import * as t from 'io-ts';

type Codec<A, O> = t.Type<A, O, unknown>;

type Kind =
  | 'scalar'
  | 'outputobject'
  | 'interface'
  | 'union'
  | 'enum'
  | 'inputobject'
  | 'list';
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

export interface Props {
  [key: string]: AnyBrick;
}
export interface TypeC<P extends Props>
  extends OutputObjectSemiBrick<
    P,
    { [K in keyof P]: TypeOf<P[K]> },
    { [K in keyof P]: OutputOf<P[K]> }
  > {}

const outputObjectS = <P extends Props>(params: {
  name: string;
  bricks: P;
}): TypeC<P> => {
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

class UnionSemiBrick<
  SBS extends Array<AnySemiBrick>,
  S_A,
  S_O,
  S_G extends GraphQLUnionType
> extends SemiBrick<S_A, S_O, S_G, 'union'> {
  public readonly semiBricks;

  constructor(params: {
    name: string;
    semiBricks: SBS;
    semiGraphQLType: S_G;
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
  SBS extends [AnySemiBrick, AnySemiBrick, ...Array<AnySemiBrick>]
> extends UnionSemiBrick<
    SBS,
    SemiTypeOf<SBS[number]>,
    SemiOutputOf<SBS[number]>,
    SemiGraphQTypeOf<SBS[number]>
  > {}

// TODO: make these only take in unionable bricks, and not anybricks
const unionS = <
  SBS extends [AnySemiBrick, AnySemiBrick, ...Array<AnySemiBrick>]
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

const d = union({
  name: 'yhi',
  semiBricks: [scalars.boolean, scalars.float],
});

const e = union({
  name: 'yho',
  semiBricks: [boolean, string],
}).nullable;

type SD = SemiTypeOf<typeof d>;
type D = TypeOf<typeof d>;
type SE = SemiTypeOf<typeof e>;
type E = TypeOf<typeof e>;
