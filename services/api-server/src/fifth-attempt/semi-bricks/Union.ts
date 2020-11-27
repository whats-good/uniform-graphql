import * as t from 'io-ts';
import { GraphQLUnionType } from 'graphql';
import {
  Codec,
  Brick,
  NonNullableBrickOf,
  NullableBrickOf,
  SemiBrick,
} from '../Brick';
import { AnyOutputObjectSemiBrick } from './OutputObject';

type UnitableSemiBricks = [
  AnyOutputObjectSemiBrick,
  AnyOutputObjectSemiBrick,
  ...Array<AnyOutputObjectSemiBrick>
];

type UtdTypes<T extends UnitableSemiBricks> = T[number]['semiCodec']['_A'];
type UtdOutTypes<T extends UnitableSemiBricks> = T[number]['semiCodec']['_O'];

export class UnionSemiBrick<SBS extends UnitableSemiBricks>
  implements
    SemiBrick<'union', GraphQLUnionType, UtdTypes<SBS>, UtdOutTypes<SBS>> {
  public readonly kind = 'union' as const;
  public readonly name: string;
  public readonly semiCodec: Codec<UtdTypes<SBS>, UtdOutTypes<SBS>>;
  public readonly semiGraphQLType: GraphQLUnionType;
  public readonly nullable: NullableBrickOf<UnionSemiBrick<SBS>>;
  public readonly nonNullable: NonNullableBrickOf<UnionSemiBrick<SBS>>;
  public readonly semiBricks: SBS;

  private constructor(params: {
    name: string;
    semiBricks: SBS;
    semiCodec: UnionSemiBrick<SBS>['semiCodec'];
    semiGraphQLType: GraphQLUnionType;
  }) {
    this.name = params.name;
    this.semiCodec = params.semiCodec;
    this.semiGraphQLType = params.semiGraphQLType;
    this.nullable = Brick.initNullable(this);
    this.nonNullable = Brick.initNonNullable(this);
    this.semiBricks = params.semiBricks;
  }

  public static init<SBS extends UnitableSemiBricks>(params: {
    name: string;
    semiBricks: SBS;
  }): UnionSemiBrick<SBS> {
    const [firstSb, secondSb, ...rest] = params.semiBricks;
    const gql = new GraphQLUnionType({
      name: params.name,
      types: params.semiBricks.map(({ semiGraphQLType }) => semiGraphQLType),
    });
    return new UnionSemiBrick({
      name: params.name,
      semiBricks: params.semiBricks,
      semiCodec: t.union([
        firstSb.semiCodec,
        secondSb.semiCodec,
        ...rest.map(({ semiCodec }) => semiCodec),
      ]),
      semiGraphQLType: gql,
    });
  }
}
