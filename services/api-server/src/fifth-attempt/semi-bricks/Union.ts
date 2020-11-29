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
import { SemiBrickFactory } from '../SemiBrickFactory';

export type UnitableSemiBricks = [
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
  public readonly semiBricks: SBS;

  public readonly nullable: NullableBrickOf<UnionSemiBrick<SBS>>;
  public readonly nonNullable: NonNullableBrickOf<UnionSemiBrick<SBS>>;

  public constructor(
    public semiBrickFactory: SemiBrickFactory,
    params: {
      name: string;
      semiBricks: SBS;
      semiCodec: UnionSemiBrick<SBS>['semiCodec'];
    },
  ) {
    this.name = params.name;
    this.semiCodec = params.semiCodec;
    this.semiBricks = params.semiBricks;

    this.nullable = Brick.initNullable(this);
    this.nonNullable = Brick.initNonNullable(this);
  }

  public readonly getSemiGraphQLType = (): GraphQLUnionType => {
    return new GraphQLUnionType({
      name: this.name,
      types: this.semiBricks.map((sb) => sb.getSemiGraphQLType()),
    });
  };
}
