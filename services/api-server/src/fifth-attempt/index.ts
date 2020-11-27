import { GraphQLObjectType, GraphQLString } from 'graphql';
import { InputObjectSemiBrick } from './semi-bricks/InputObject';
import { scalars } from './semi-bricks/Scalar';
import { EnumSemiBrick } from './semi-bricks/Enum';

const membership = EnumSemiBrick.init({
  name: 'Membership',
  keys: { free: null, paid: null, enterprise: null }, // TODO: enable the dev to give values to the values too.
});

membership.nullable.semiBrick.semiCodec.encode('enterprise');
// TODO: make a note: if all fields are deprecated, the schema will fail to build, forever.
export const someInput = InputObjectSemiBrick.init({
  name: 'SomeInput',
  fields: {
    id: {
      brick: scalars.id.nullable,
      deprecationReason: 'id is deprecated',
      description: 'this is the description!',
    },
    firstName: {
      brick: scalars.string.nullable,
      // deprecationReason: 'firstname is deprecated!',
    },
    membership: {
      brick: membership.nonNullable,
    },
  },
});

export const root = new GraphQLObjectType({
  name: 'RootQuery',
  fields: () => ({
    something: {
      type: GraphQLString,
      args: {
        inputObjectArg: {
          type: someInput.nonNullable.graphQLType,
        },
      },
    },
  }),
});

const nullableScalar = scalars.id.nullable;
const nonNullableScalar = scalars.id.nonNullable;
nullableScalar.semiBrick.scalarity;
nonNullableScalar.semiBrick.scalarity;
const a = nullableScalar.codec.encode(null);
const b = nonNullableScalar.codec.encode('a');
const c = someInput.fields.firstName.brick.codec.encode('b');
const d = someInput.semiCodec.encode({
  id: '1',
  firstName: 'kerem',
  membership: 'free' as const,
});
