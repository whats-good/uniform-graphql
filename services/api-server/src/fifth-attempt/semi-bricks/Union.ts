import { GraphQLUnionType } from 'graphql';
import {
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

export class UnionSemiBrick<SBS extends UnitableSemiBricks> extends SemiBrick<
  'union',
  GraphQLUnionType,
  UtdTypes<SBS>,
  UtdOutTypes<SBS>
> {
  public readonly kind = 'union' as const;
  public readonly semiBricks: SBS;

  public readonly nullable: NullableBrickOf<UnionSemiBrick<SBS>>;
  public readonly nonNullable: NonNullableBrickOf<UnionSemiBrick<SBS>>;

  public constructor(params: {
    semiBrickFactory: SemiBrickFactory;
    name: string;
    semiBricks: SBS;
    semiCodec: UnionSemiBrick<SBS>['semiCodec'];
  }) {
    super(params);
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
