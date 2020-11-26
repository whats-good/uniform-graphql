import * as t from 'io-ts';
import {
  GraphQLScalarType,
  GraphQLID,
  GraphQLString,
  GraphQLFloat,
  GraphQLInt,
  GraphQLBoolean,
} from 'graphql';
import {
  SemiBrick,
  Brick,
  Codec,
  NullableBrickOf,
  NonNullableBrickOf,
} from '../Brick';

export class ScalarSemiBrick<SB_G extends GraphQLScalarType, SB_A, SB_O = SB_A>
  implements SemiBrick<'scalar', SB_G, SB_A, SB_O> {
  public readonly kind = 'scalar' as const;
  public readonly name: string;
  public readonly semiCodec: Codec<SB_A, SB_O>;
  public readonly semiGraphQLType: SB_G;
  public readonly nullable: NullableBrickOf<ScalarSemiBrick<SB_G, SB_A, SB_O>>;
  public readonly nonNullable: NonNullableBrickOf<
    ScalarSemiBrick<SB_G, SB_A, SB_O>
  >;

  constructor(params: {
    name: string;
    semiCodec: Codec<SB_A, SB_O>;
    semiGraphQLType: SB_G;
  }) {
    this.name = params.name;
    this.semiCodec = params.semiCodec;
    this.semiGraphQLType = params.semiGraphQLType;
    this.nullable = Brick.initNullable(this);
    this.nonNullable = Brick.initNonNullable(this);
  }

  public readonly scalarity = 'some string'; // TODO: remove
}

export const scalars = {
  id: new ScalarSemiBrick({
    name: 'ID',
    semiCodec: t.union([t.string, t.number]),
    semiGraphQLType: GraphQLID,
  }),

  string: new ScalarSemiBrick({
    name: 'String',
    semiCodec: t.string,
    semiGraphQLType: GraphQLString,
  }),

  float: new ScalarSemiBrick({
    name: 'Float',
    semiCodec: t.number,
    semiGraphQLType: GraphQLFloat,
  }),

  int: new ScalarSemiBrick({
    name: 'Int',
    semiCodec: t.Int,
    semiGraphQLType: GraphQLInt,
  }),

  boolean: new ScalarSemiBrick({
    name: 'Boolean',
    semiCodec: t.Int,
    semiGraphQLType: GraphQLBoolean,
  }),
};

const nullableScalar = scalars.id.nullable;
const notNullableScalar = scalars.id.nonNullable;
nullableScalar.semiBrick.scalarity;
notNullableScalar.semiBrick.scalarity;
const a = nullableScalar.codec.encode(null);
const b = notNullableScalar.codec.encode('a');
