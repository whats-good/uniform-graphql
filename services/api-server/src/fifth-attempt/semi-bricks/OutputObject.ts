import { GraphQLObjectType } from 'graphql';
import { Brick, NonNullableBrickOf, NullableBrickOf } from '../Brick';
import { ResolverFnOf as AnyResolverFnOf } from '../resolver';
import { SemiBrickFactory } from '../SemiBrickFactory';
import { ImplementorSemiBrick } from './Implementor';
import { OutputFieldConfigMap, InterfaceSemiBrickMap } from './struct-types';

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

  public setFieldResolver = <K extends keyof F>(
    key: K,
    resolve: AnyResolverFnOf<F, K>,
  ): void => {
    this.fields[key].resolve = resolve;
  };
}
