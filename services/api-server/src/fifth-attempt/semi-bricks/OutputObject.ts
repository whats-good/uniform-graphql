import { GraphQLObjectType } from 'graphql';
import { Brick, NonNullableBrickOf, NullableBrickOf } from '../Brick';
import { SemiBrickFactory } from '../SemiBrickFactory';
import { ImplementorSemiBrick } from './Implementor';
import {
  OutputFieldConfigMap,
  InterfaceSemiBrickMap,
  FieldResolversOf,
  RootQueryResolversOf,
} from './struct-types';

export class OutputObjectSemiBrick<
  F extends OutputFieldConfigMap,
  N extends string
> extends ImplementorSemiBrick<'outputobject', N, GraphQLObjectType, F> {
  public readonly kind = 'outputobject' as const;
  public readonly fields: F;
  public readonly interfaces: InterfaceSemiBrickMap = {};

  public readonly nullable: NullableBrickOf<OutputObjectSemiBrick<F, N>>;
  public readonly nonNullable: NonNullableBrickOf<OutputObjectSemiBrick<F, N>>;

  constructor(params: {
    semiBrickFactory: SemiBrickFactory;
    name: N;
    fields: F;
  }) {
    super(params);
    this.fields = params.fields;
    this.nullable = Brick.initNullable(this);
    this.nonNullable = Brick.initNonNullable(this);
  }

  public getFreshSemiGraphQLType = (): GraphQLObjectType => {
    return new GraphQLObjectType(this.getGraphQLTypeConstructor());
  };

  // TODO: maybe i should separate root resolvers from field resolvers?
  public fieldResolverize = (resolvers: Partial<FieldResolversOf<F>>): void => {
    Object.entries(resolvers).forEach(([key, value]) => {
      this.fields[key].resolve = value;
    });
  };

  public queryResolverize = (resolvers: RootQueryResolversOf<F>): void => {
    Object.entries(resolvers).forEach(([key, value]) => {
      this.fields[key].resolve = value;
    });
  };
}
