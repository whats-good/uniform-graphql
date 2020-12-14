import { GraphQLUnionType } from 'graphql';
import {
  Type,
  NonNullableTypeOf,
  NullableTypeOf,
  SemiType,
  SemiTypeOf,
} from '../Type';
import { SemiTypeFactory } from '../SemiTypeFactory';
import { AnyOutputObjectSemiType } from './struct-types';

export type UnitableSemiTypes = [
  AnyOutputObjectSemiType,
  AnyOutputObjectSemiType,
  ...Array<AnyOutputObjectSemiType>
];

type UtdTypes<T extends UnitableSemiTypes> = SemiTypeOf<T[number]>;

export class UnionSemiType<
  SBS extends UnitableSemiTypes,
  N extends string
> extends SemiType<
  'union',
  N,
  GraphQLUnionType,
  UtdTypes<SBS>,
  UtdTypes<SBS> & { __typename: SBS[number]['name'] }
> {
  public readonly kind = 'union' as const;
  public readonly semiTypes: SBS;

  public readonly nullable: NullableTypeOf<UnionSemiType<SBS, N>>;
  public readonly nonNullable: NonNullableTypeOf<UnionSemiType<SBS, N>>;

  public constructor(params: {
    semiTypeFactory: SemiTypeFactory<any>;
    name: N;
    semiTypes: SBS;
  }) {
    super(params);
    this.semiTypes = params.semiTypes;

    this.nullable = Type.initNullable(this);
    this.nonNullable = Type.initNonNullable(this);
  }

  public readonly getFreshSemiGraphQLType = (): GraphQLUnionType => {
    return new GraphQLUnionType({
      name: this.name,
      types: this.semiTypes.map((st) => st.getSemiGraphQLType()),
    });
  };
}
