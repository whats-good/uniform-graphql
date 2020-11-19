import {
  GraphQLBoolean,
  GraphQLFloat,
  GraphQLID,
  GraphQLInt,
  GraphQLNonNull,
  GraphQLNullableType,
  GraphQLObjectType,
  GraphQLString,
  GraphQLType,
  GraphQLUnionType,
  LoneSchemaDefinitionRule,
} from 'graphql';
import * as t from 'io-ts';

type Codec<A, O> = t.Type<A, O, unknown>;

export class SemiBrick<S_A, S_O, S_G extends GraphQLNullableType> {
  public readonly S_A!: S_A;
  public readonly S_O!: S_O;
  public readonly semiGraphQLType: S_G;
  public readonly name: string;
  public readonly semiCodec: Codec<S_A, S_O>;

  constructor(params: {
    name: string;
    semiGraphQLType: S_G;
    semiCodec: Codec<S_A, S_O>;
  }) {
    this.name = params.name;
    this.semiGraphQLType = params.semiGraphQLType;
    this.semiCodec = params.semiCodec;
  }
}

export class Brick<
  S_A,
  S_O,
  S_G extends GraphQLNullableType,
  B_A,
  B_O,
  B_G extends GraphQLType
> extends SemiBrick<S_A, S_O, S_G> {
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
  }) {
    super(params);
    this.graphQLType = params.graphQLType;
    this.codec = params.codec;
  }

  private static fromNullableSemiBrick = <
    S_A,
    S_O,
    S_G extends GraphQLNullableType
  >(
    sb: SemiBrick<S_A, S_O, S_G>,
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
    S_G extends GraphQLNullableType
  >(
    sb: SemiBrick<S_A, S_O, S_G>,
  ) => {
    return new Brick({
      ...sb,
      codec: sb.semiCodec,
      graphQLType: new GraphQLNonNull(sb.semiGraphQLType),
    });
  };

  public static lift = <S_A, S_O, S_G extends GraphQLNullableType>(
    sb: SemiBrick<S_A, S_O, S_G>,
  ) => {
    return {
      ...Brick.fromNonNullableSemiBrick(sb),
      nullable: Brick.fromNullableSemiBrick(sb),
    };
  };
}

const id = new SemiBrick({
  name: 'ID',
  semiCodec: t.union([t.string, t.number]),
  semiGraphQLType: GraphQLID,
});

const string = new SemiBrick({
  name: 'String' as const,
  semiCodec: t.string,
  semiGraphQLType: GraphQLString,
});

const float = new SemiBrick({
  name: 'Float' as const,
  semiCodec: t.number,
  semiGraphQLType: GraphQLFloat,
});

const int = new SemiBrick({
  name: 'Int' as const,
  semiCodec: t.Int,
  semiGraphQLType: GraphQLInt,
});

const boolean = new SemiBrick({
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

export interface AnySemiBrick extends SemiBrick<any, any, any> {}
export interface AnyBrick extends Brick<any, any, any, any, any, any> {}
export type SemiTypeOf<SB extends AnySemiBrick> = SB['S_A'];
export type SemiOutputOf<SB extends AnySemiBrick> = SB['S_O'];
export type SemiGraphQTypeOf<SB extends AnySemiBrick> = SB['semiGraphQLType'];
export type TypeOf<B extends AnyBrick> = B['B_A'];
export type OutputOf<B extends AnyBrick> = B['B_O'];
export type GraphQLTypeOf<B extends AnyBrick> = B['graphQLType'];

export class UnionSemiBrick<
  SBS extends Array<AnySemiBrick>,
  S_A,
  S_O,
  S_G extends GraphQLNullableType
> extends SemiBrick<S_A, S_O, S_G> {
  constructor(params: {
    name: string;
    semiBricks: SBS;
    semiGraphQLType: S_G;
    semiCodec: Codec<S_A, S_O>;
  }) {
    super(params);
  }
}

export interface UnionSB<
  SBS extends [AnySemiBrick, AnySemiBrick, ...Array<AnySemiBrick>]
> extends UnionSemiBrick<
    SBS,
    SemiTypeOf<SBS[number]>,
    SemiOutputOf<SBS[number]>,
    SemiGraphQTypeOf<SBS[number]>
  > {}

export const union = <
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
  return new UnionSemiBrick({
    name: params.name,
    semiBricks: params.semiBricks,
    semiCodec: t.union(codecs),
    semiGraphQLType: GraphQLFloat, // TODO: actually compute
  });
};

const d = union({
  name: 'yhi',
  semiBricks: [scalars.boolean, scalars.float],
});

const e = union({
  name: 'yho',
  semiBricks: [boolean, string],
});

type D = SemiTypeOf<typeof d>;
type E = SemiTypeOf<typeof e>;
