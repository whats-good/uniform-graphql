import { GraphQLObjectType } from 'graphql';
import { Brick, NonNullableBrickOf, NullableBrickOf } from '../Brick';
import { FieldResolversOf, OutputFieldMap } from '../OutputField';
import { SemiBrickFactory } from '../SemiBrickFactory';
import { ImplementorSemiBrick } from './Implementor';
import { InterfaceSemiBrickMap } from './struct-types';

export class OutputObjectSemiBrick<
  F extends OutputFieldMap,
  N extends string
> extends ImplementorSemiBrick<'outputobject', N, GraphQLObjectType, F> {
  public readonly kind = 'outputobject' as const;
  public readonly fields: F;
  public readonly flatInterfaces: InterfaceSemiBrickMap = {};

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

  public fieldResolverize = (resolvers: Partial<FieldResolversOf<F>>): void => {
    // TODO: should this be a complete / stateless overwrite, or can it have history and state?
    // TODO: should we create new fields or mutate the existing ones?
    Object.entries(resolvers).forEach(([key, value]) => {
      this.fields[key].setResolve(value);
    });
  };
}
