import { GraphQLUnionType } from 'graphql';
import {
  Brick,
  NonNullableBrickOf,
  NullableBrickOf,
  SemiBrick,
  SemiTypeOf,
} from '../Brick';
import { SemiBrickFactory } from '../SemiBrickFactory';
import { AnyOutputObjectSemiBrick } from './struct-types';

export type UnitableSemiBricks = [
  AnyOutputObjectSemiBrick,
  AnyOutputObjectSemiBrick,
  ...Array<AnyOutputObjectSemiBrick>
];

type UtdTypes<T extends UnitableSemiBricks> = SemiTypeOf<T[number]>;

export class UnionSemiBrick<SBS extends UnitableSemiBricks> extends SemiBrick<
  'union',
  GraphQLUnionType,
  UtdTypes<SBS>
> {
  public readonly kind = 'union' as const;
  public readonly semiBricks: SBS;

  public readonly nullable: NullableBrickOf<UnionSemiBrick<SBS>>;
  public readonly nonNullable: NonNullableBrickOf<UnionSemiBrick<SBS>>;

  public constructor(params: {
    semiBrickFactory: SemiBrickFactory;
    name: string;
    semiBricks: SBS;
  }) {
    super(params);
    this.semiBricks = params.semiBricks;

    this.nullable = Brick.initNullable(this);
    this.nonNullable = Brick.initNonNullable(this);
  }

  public readonly getFreshSemiGraphQLType = (): GraphQLUnionType => {
    return new GraphQLUnionType({
      name: this.name,
      types: this.semiBricks.map((sb) => sb.getSemiGraphQLType()),
    });
  };
}
