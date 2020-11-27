import { InputObjectSemiBrick } from './semi-bricks/InputObject';
import { scalars } from './semi-bricks/Scalar';
import { EnumSemiBrick } from './semi-bricks/Enum';
import { OutputObjectSemiBrick } from './semi-bricks/OutputObject';
import { QueryResolver } from './semi-bricks/QueryResolver';

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

export const person = OutputObjectSemiBrick.init({
  name: 'Person',
  description: 'description for person',
  fields: {
    id: {
      brick: scalars.id.nonNullable,
      deprecationReason: 'this field is deprecataed',
      args: {
        x: {
          brick: scalars.id.nullable,
        },
        y: {
          brick: scalars.float.nonNullable,
        },
      },
    },
    firstName: {
      brick: scalars.string.nullable,
      args: {},
    },
  },
});

const rootQuery = OutputObjectSemiBrick.init({
  name: 'RootQuery',
  fields: {
    something: {
      brick: scalars.string.nullable,
      args: {
        inputObjectArg: {
          brick: someInput.nonNullable,
        },
      },
    },
    person: {
      brick: person.nonNullable,
      args: {
        flag: {
          brick: scalars.boolean.nonNullable,
        },
      },
    },
  },
});

const rootQueryResolver = QueryResolver.init({
  semiBrick: rootQuery,
  resolvers: {
    person: (_, args) => {
      return {
        firstName: 'kerem',
        id: 1,
      };
    },
    something: (_, args) => {
      return 'yo';
    },
  },
});

// TODO: note to self: root queries are not allowed to be nonNullable.
export const root = rootQueryResolver.graphQLType;

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
  membership: 'free',
});
// TODO: make OMap appears here, and makes the type less readable
const e = person.nullable.codec.encode(null);

const f = person.fields.id.args.y.brick.semiBrick.nonNullable.codec.encode(
  1234,
);
