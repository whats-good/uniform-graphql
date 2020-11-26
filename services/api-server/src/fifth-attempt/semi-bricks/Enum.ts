import { GraphQLEnumType, GraphQLEnumValueConfig } from 'graphql';
import * as t from 'io-ts';
import _ from 'lodash';
import {
  SemiBrick,
  Brick,
  Codec,
  NullableBrickOf,
  NonNullableBrickOf,
} from '../Brick';

interface StringKeys {
  [key: string]: unknown;
}

export class EnumSemiBrick<D extends StringKeys>
  implements SemiBrick<'enum', GraphQLEnumType, keyof D> {
  public readonly kind = 'enum' as const;
  public readonly name: string;
  public readonly semiCodec: Codec<keyof D>;
  public readonly semiGraphQLType: GraphQLEnumType;
  public readonly nullable: NullableBrickOf<EnumSemiBrick<D>>;
  public readonly nonNullable: NonNullableBrickOf<EnumSemiBrick<D>>;

  public readonly enumFlag = 'enumFLag'; // TODO: remove

  constructor(params: {
    name: string;
    semiCodec: Codec<keyof D>;
    semiGraphQLType: GraphQLEnumType;
  }) {
    this.name = params.name;
    this.semiCodec = params.semiCodec;
    this.semiGraphQLType = params.semiGraphQLType;
    this.nullable = Brick.initNullable(this);
    this.nonNullable = Brick.initNonNullable(this);
  }

  public static init<D extends StringKeys>(params: {
    name: string;
    keys: D;
  }): EnumSemiBrick<D> {
    const values = _.mapValues(
      params.keys,
      (_, key: string): GraphQLEnumValueConfig => ({
        value: key,
        deprecationReason: 'some deprecation reason',
        description: 'some description', // TODO: get back here and expose these fields
      }),
    );
    const semiGraphQLType = new GraphQLEnumType({
      name: params.name,
      description: 'some description', // TODO: get bcak here and expose these fields
      values,
    });
    return new EnumSemiBrick({
      name: params.name,
      semiCodec: t.keyof(params.keys),
      semiGraphQLType,
    });
  }
}

const membership = EnumSemiBrick.init({
  name: 'Membership',
  keys: { free: null, paid: null, enterprise: null }, // TODO: enable the dev to give values to the values too.
});

membership.nullable.semiBrick.semiCodec.encode('enterprise');
