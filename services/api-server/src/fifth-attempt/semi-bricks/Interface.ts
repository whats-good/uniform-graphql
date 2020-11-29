import { GraphQLInterfaceType } from 'graphql';
import _ from 'lodash';
import { Brick, NullableBrickOf, NonNullableBrickOf } from '../Brick';
import { SemiBrickFactory } from '../SemiBrickFactory';
import { ImplementorSemiBrick, Implementors } from './Implementor';
import { OutputFieldConfigMap, TMap } from './struct-types';

// TODO: unions and interfaces will both need a "resolveType" field

// TODO: create a shared interface for OutputObject and Interface semibricks, since they can both implement interfaces
export class InterfaceSemiBrick<
  F extends OutputFieldConfigMap
> extends ImplementorSemiBrick<'interface', GraphQLInterfaceType, F> {
  public readonly kind = 'interface' as const;
  public readonly fields: F;
  public readonly implementors: Implementors<F>;

  public readonly nullable: NullableBrickOf<InterfaceSemiBrick<F>>;
  public readonly nonNullable: NonNullableBrickOf<InterfaceSemiBrick<F>>;
  // TODO: add interfaces array here

  constructor(params: {
    name: string;
    fields: F;
    implementors: InterfaceSemiBrick<F>['implementors'];
    semiBrickFactory: SemiBrickFactory;
  }) {
    super(params);
    this.fields = params.fields;
    this.implementors = params.implementors;

    Object.values(this.implementors).forEach((sb) => {
      sb.implements(this);
    });

    this.nullable = Brick.initNullable(this);
    this.nonNullable = Brick.initNonNullable(this);
  }

  public readonly getFreshSemiGraphQLType = (): GraphQLInterfaceType => {
    return new GraphQLInterfaceType(this.getGraphQLTypeConstructor());
  };
}
