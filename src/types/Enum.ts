import { GraphQLEnumType } from 'graphql';
import _ from 'lodash';
import {
  SemiStaticGraphQLType,
  StaticGraphQLType,
  NullableStaticGraphQLTypeOf,
  NonNullableStaticGraphQLTypeOf,
} from '../StaticGraphQLType';
import { TypeFactory } from '../SemiStaticGraphQLTypeFactory';

export interface StringKeys {
  [key: string]: unknown;
}

// TODO: expose the enum values as a public property.
// TODO: allow the developer to make the enums actually enumerable
export class EnumSemiStaticGraphQLType<
  N extends string,
  D extends StringKeys
> extends SemiStaticGraphQLType<'enum', N, GraphQLEnumType, keyof D> {
  public readonly kind = 'enum' as const;
  public readonly keys: D;

  public readonly nullable: NullableStaticGraphQLTypeOf<
    EnumSemiStaticGraphQLType<N, D>
  >;
  public readonly nonNullable: NonNullableStaticGraphQLTypeOf<
    EnumSemiStaticGraphQLType<N, D>
  >;

  constructor(params: { name: N; typeFactory: TypeFactory; keys: D }) {
    super(params);
    this.keys = params.keys;
    this.nullable = StaticGraphQLType.initNullable(this);
    this.nonNullable = StaticGraphQLType.initNonNullable(this);
  }

  public readonly getFreshSemiGraphQLType = (): GraphQLEnumType => {
    return new GraphQLEnumType({
      name: this.name,
      values: _.mapValues(this.keys, (_, key: string) => ({
        value: key,
        // TODO: expose deprecation reason via the values of the given keys
        // deprecationReason: 'some deprecation reason',
        // description: 'some description',
      })),
    });
  };
}
