import { GraphQLObjectType, GraphQLString } from 'graphql';
import { InputObjectSemiBrick } from './semi-bricks/InputObject';
import { scalars } from './semi-bricks/Scalar';

const nullableScalar = scalars.id.nullable;
const nonNullableScalar = scalars.id.nonNullable;
nullableScalar.semiBrick.scalarity;
nonNullableScalar.semiBrick.scalarity;
const a = nullableScalar.codec.encode(null);
const b = nonNullableScalar.codec.encode('a');

// TODO: make a note: if all fields are deprecated, the schema will fail to build, forever.
export const c = InputObjectSemiBrick.init({
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
  },
});

const d = c.fields.firstName.brick.codec.encode('b');

export const root = new GraphQLObjectType({
  name: 'RootQuery',
  fields: () => ({
    something: {
      type: GraphQLString,
      args: {
        inputObjectArg: {
          type: c.nonNullable.graphQLType,
        },
      },
    },
  }),
});
