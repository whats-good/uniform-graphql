import { GraphQLEnumType } from 'graphql';
import _ from 'lodash';
import {
  SemiBrick,
  Brick,
  NullableBrickOf,
  NonNullableBrickOf,
} from '../Brick';
import { SemiBrickFactory } from '../SemiBrickFactory';

export interface StringKeys {
  [key: string]: unknown;
}

// TODO: expose the enum values as a public property.
// TODO: allow the developer to make the enums actually enumerable
export class EnumSemiBrick<
  N extends string,
  D extends StringKeys
> extends SemiBrick<'enum', N, GraphQLEnumType, keyof D> {
  public readonly kind = 'enum' as const;
  public readonly keys: D;

  public readonly nullable: NullableBrickOf<EnumSemiBrick<N, D>>;
  public readonly nonNullable: NonNullableBrickOf<EnumSemiBrick<N, D>>;

  constructor(params: {
    name: N;
    semiBrickFactory: SemiBrickFactory;
    keys: D;
  }) {
    super(params);
    this.keys = params.keys;
    this.nullable = Brick.initNullable(this);
    this.nonNullable = Brick.initNonNullable(this);
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
