import {
  GraphQLID,
  GraphQLNonNull,
  GraphQLNullableType,
  GraphQLObjectType,
  GraphQLString,
  GraphQLType,
} from 'graphql';
import * as t from 'io-ts';

type Codec<A, O> = t.Type<A, O, unknown>;

interface ISemiBrick<SB_G extends GraphQLNullableType, SB_A, SB_O> {
  name: string;
  semiGraphQLType: SB_G;
  semiCodec: Codec<SB_A, SB_O>;
}

interface IBrick<
  SB_G extends GraphQLNullableType,
  SB_A,
  SB_O,
  B_G extends GraphQLType,
  B_A,
  B_O
> extends ISemiBrick<SB_G, SB_A, SB_O> {
  graphQLType: B_G;
  codec: Codec<B_A, B_O>;
}

type AnySemiBrick = ISemiBrick<any, any, any>;
type AnyBrick = IBrick<any, any, any, any, any, any>;

type SemiBrickType<T extends AnySemiBrick> = T['semiCodec']['_A'];
type SemiBrickGraphQLType<T extends AnySemiBrick> = T['semiGraphQLType'];
type BrickType<T extends AnyBrick> = T['codec']['_A'];
type BrickGraphQLType<T extends AnyBrick> = T['graphQLType'];

// type F = <B extends AnySemiBrick>(b: B) => SemiBrickType<B>;

const b = {
  name: 'kerem',
  semiGraphQLType: GraphQLString,
  semiCodec: t.string,
};
