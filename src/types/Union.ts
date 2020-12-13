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

export class UnionSemiBrick<
  SBS extends UnitableSemiBricks,
  N extends string
> extends SemiBrick<
  'union',
  N,
  GraphQLUnionType,
  UtdTypes<SBS>,
  UtdTypes<SBS> & { __typename: SBS[number]['name'] }
> {
  public readonly kind = 'union' as const;
  public readonly semiBricks: SBS;

  public readonly nullable: NullableBrickOf<UnionSemiBrick<SBS, N>>;
  public readonly nonNullable: NonNullableBrickOf<UnionSemiBrick<SBS, N>>;

  public constructor(params: {
    semiBrickFactory: SemiBrickFactory;
    name: N;
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
