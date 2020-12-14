import { GraphQLEnumType } from 'graphql';
import _ from 'lodash';
import { SemiType, Type, NullableTypeOf, NonNullableTypeOf } from '../Type';
import { SemiTypeFactory } from '../SemiTypeFactory';

export interface StringKeys {
  [key: string]: unknown;
}

// TODO: expose the enum values as a public property.
// TODO: allow the developer to make the enums actually enumerable
export class EnumSemiType<
  N extends string,
  D extends StringKeys
> extends SemiType<'enum', N, GraphQLEnumType, keyof D> {
  public readonly kind = 'enum' as const;
  public readonly keys: D;

  public readonly nullable: NullableTypeOf<EnumSemiType<N, D>>;
  public readonly nonNullable: NonNullableTypeOf<EnumSemiType<N, D>>;

  constructor(params: {
    name: N;
    semiTypeFactory: SemiTypeFactory<any>;
    keys: D;
  }) {
    super(params);
    this.keys = params.keys;
    this.nullable = Type.initNullable(this);
    this.nonNullable = Type.initNonNullable(this);
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
