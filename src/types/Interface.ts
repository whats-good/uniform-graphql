import { GraphQLInterfaceType } from 'graphql';
import { Type, NullableTypeOf, NonNullableTypeOf } from '../Type';
import { OutputFieldMap } from '../OutputField';
import { SemiTypeFactory } from '../SemiTypeFactory';
import { ImplementorSemiType, Implementors } from './Implementor';
import { TThunkMap } from './struct-types';

export class InterfaceSemiType<
  F extends OutputFieldMap,
  I extends Implementors<F>,
  N extends string
> extends ImplementorSemiType<
  'interface',
  N,
  GraphQLInterfaceType,
  F,
  TThunkMap<F> & { __typename: I[number]['name'] }
> {
  public readonly kind = 'interface';
  public readonly fields: F;
  public readonly implementors: I;

  public readonly nullable: NullableTypeOf<InterfaceSemiType<F, I, N>>;
  public readonly nonNullable: NonNullableTypeOf<InterfaceSemiType<F, I, N>>;

  constructor(params: {
    name: N;
    fields: F;
    implementors: InterfaceSemiType<F, I, N>['implementors'];
    semiTypeFactory: SemiTypeFactory<any>;
  }) {
    super(params);
    this.fields = params.fields;
    this.implementors = params.implementors;
    this.implementors.forEach((st) => st.implements(this));

    this.nullable = Type.initNullable(this);
    this.nonNullable = Type.initNonNullable(this);
  }

  public readonly getFreshSemiGraphQLType = (): GraphQLInterfaceType => {
    return new GraphQLInterfaceType(this.getGraphQLTypeConstructor());
  };
}
