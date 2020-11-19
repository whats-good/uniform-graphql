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
type SemiBrickOutType<T extends AnySemiBrick> = T['semiCodec']['_O'];
type SemiBrickGraphQLType<T extends AnySemiBrick> = T['semiGraphQLType'];

type BrickType<T extends AnyBrick> = T['codec']['_A'];
type BrickOutType<T extends AnyBrick> = T['codec']['_O'];
type BrickGraphQLType<T extends AnyBrick> = T['graphQLType'];

type F = <B extends AnySemiBrick>(b: B) => SemiBrickType<B>;

type SemiBrickified<T> = T extends ISemiBrick<
  infer SB_G,
  infer SB_A,
  infer SB_O
>
  ? ISemiBrick<SB_G, SB_A, SB_O>
  : never;

type Brickified<T> = T extends IBrick<
  infer SB_G,
  infer SB_A,
  infer SB_O,
  infer B_G,
  infer B_A,
  infer B_O
>
  ? IBrick<SB_G, SB_A, SB_O, B_G, B_A, B_O>
  : never;

type BrickOf<SB extends AnySemiBrick> = IBrick<
  SemiBrickGraphQLType<SB>,
  SemiBrickType<SB>,
  SemiBrickOutType<SB>,
  any,
  any,
  any
>;

const makeSemiBrick = <SB extends AnySemiBrick>(sb: SB) => sb;

const nullable = <SB extends AnySemiBrick>(sb: SB): BrickOf<typeof sb> => {
  return {
    ...sb,
    codec: t.union([t.null, t.undefined, sb.semiCodec]),
    graphQLType: sb.semiGraphQLType,
  };
};

const notNullable = <SB extends AnySemiBrick>(sb: SB): BrickOf<typeof sb> => {
  return {
    ...sb,
    codec: sb.semiCodec,
    graphQLType: new GraphQLNonNull(sb.semiGraphQLType),
  };
};

// const string = makeScalar({
//   name: 'String',
//   semiCodec: t.string,
//   semiGraphQLType: GraphQLString,
// });
