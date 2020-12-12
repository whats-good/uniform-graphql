import { GraphQLInterfaceType } from 'graphql';
import { Brick, NullableBrickOf, NonNullableBrickOf } from '../Brick';
import { OutputFieldMap } from '../OutputField';
import { SemiBrickFactory } from '../SemiBrickFactory';
import { ImplementorSemiBrick, Implementors } from './Implementor';
import { TMap } from './struct-types';

// TODO: unions and interfaces will both need a "resolveType" field

export class InterfaceSemiBrick<
  F extends OutputFieldMap,
  I extends Implementors<F>,
  N extends string
> extends ImplementorSemiBrick<
  'interface',
  N,
  GraphQLInterfaceType,
  F,
  TMap<F> & { __typename: I[number]['name'] }
> {
  public readonly kind = 'interface';
  public readonly fields: F;
  public readonly implementors: I;

  public readonly nullable: NullableBrickOf<InterfaceSemiBrick<F, I, N>>;
  public readonly nonNullable: NonNullableBrickOf<InterfaceSemiBrick<F, I, N>>;

  constructor(params: {
    name: N;
    fields: F;
    implementors: InterfaceSemiBrick<F, I, N>['implementors'];
    semiBrickFactory: SemiBrickFactory;
  }) {
    super(params);
    this.fields = params.fields;
    this.implementors = params.implementors;
    this.implementors.forEach((sb) => sb.implements(this));

    this.nullable = Brick.initNullable(this);
    this.nonNullable = Brick.initNonNullable(this);
  }

  public readonly getFreshSemiGraphQLType = (): GraphQLInterfaceType => {
    return new GraphQLInterfaceType(this.getGraphQLTypeConstructor());
  };
}
