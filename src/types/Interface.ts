import { GraphQLInterfaceType } from 'graphql';
import {
  StaticGraphQLType,
  NullableStaticGraphQLTypeOf,
  NonNullableStaticGraphQLTypeOf,
} from '../StaticGraphQLType';
import { OutputFieldMap } from '../OutputField';
import { TypeFactory } from '../SemiStaticGraphQLTypeFactory';
import { ImplementorSemiStaticGraphQLType, Implementors } from './Implementor';
import { TMap } from './struct-types';

// TODO: unions and interfaces will both need a "resolveType" field

export class InterfaceSemiStaticGraphQLType<
  F extends OutputFieldMap,
  I extends Implementors<F>,
  N extends string
> extends ImplementorSemiStaticGraphQLType<
  'interface',
  N,
  GraphQLInterfaceType,
  F,
  TMap<F> & { __typename: I[number]['name'] }
> {
  public readonly kind = 'interface';
  public readonly fields: F;
  public readonly implementors: I;

  public readonly nullable: NullableStaticGraphQLTypeOf<
    InterfaceSemiStaticGraphQLType<F, I, N>
  >;
  public readonly nonNullable: NonNullableStaticGraphQLTypeOf<
    InterfaceSemiStaticGraphQLType<F, I, N>
  >;

  constructor(params: {
    name: N;
    fields: F;
    implementors: InterfaceSemiStaticGraphQLType<F, I, N>['implementors'];
    typeFactory: TypeFactory;
  }) {
    super(params);
    this.fields = params.fields;
    this.implementors = params.implementors;
    this.implementors.forEach((sb) => sb.implements(this));

    this.nullable = StaticGraphQLType.initNullable(this);
    this.nonNullable = StaticGraphQLType.initNonNullable(this);
  }

  public readonly getFreshSemiGraphQLType = (): GraphQLInterfaceType => {
    return new GraphQLInterfaceType(this.getGraphQLTypeConstructor());
  };
}
