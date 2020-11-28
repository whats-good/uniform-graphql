import { InputObjectSemiBrick } from './semi-bricks/InputObject';
import { scalars } from './semi-bricks/Scalar';
import { EnumSemiBrick } from './semi-bricks/Enum';
import { OutputObjectSemiBrick } from './semi-bricks/OutputObject';
import { fieldResolverize, queryResolverize } from './resolver';
import { UnionSemiBrick } from './semi-bricks/Union';
import { OutputListSemiBrick } from './semi-bricks/OutputList';
import { InputListSemiBrick } from './semi-bricks/InputList';
import { GraphQLObjectType } from 'graphql';
import { InterfaceSemiBrick, obj } from './semi-bricks/Interface';

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
  fields: {
    id: {
      brick: scalars.id.nullable,
      // deprecationReason: 'this field is deprecataed',
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

const fieldResolvedPerson = fieldResolverize({
  semiBrick: person,
  resolvers: {
    id: (root, args) => {
      if (!args.x) {
        return 'fallback';
      }
      if (args.y < 10) {
        return null;
      }
      return args.x > 10
        ? root.firstName
        : `${root.id} - ${args.x} - ${args.y}`;
    },
  },
});

export const animal = OutputObjectSemiBrick.init({
  name: 'Animal',
  fields: {
    owner: {
      brick: fieldResolvedPerson.nullable,
      args: {},
    },
  },
});

export const bestFriend = UnionSemiBrick.init({
  name: 'BestFriend',
  semiBricks: [fieldResolvedPerson, animal],
});

const rootQuery = OutputObjectSemiBrick.init({
  name: 'RootQuery',
  fields: {
    // something: {
    //   brick: scalars.string.nullable,
    //   args: {
    //     inputObjectArg: {
    //       brick: someInput.nonNullable,
    //     },
    //   },
    // },
    person: {
      brick: fieldResolvedPerson.nonNullable,
      args: {
        flag: {
          brick: scalars.boolean.nonNullable,
        },
      },
    },
    // bestFriend: {
    //   brick: bestFriend.nonNullable,
    //   args: {},
    // },
    // people: {
    //   brick: OutputListSemiBrick.init({
    //     listOf: fieldResolvedPerson,
    //   }).nonNullable,
    //   args: {
    //     numPeople: {
    //       brick: scalars.float.nonNullable,
    //     },
    //     listArg: {
    //       brick: InputListSemiBrick.init({
    //         listOf: membership,
    //       }).nonNullable,
    //     },
    //   },
    // },
  },
});

// TODO: see if we can do the rootquery resolver without creating the root first.
const rootQueryResolver = queryResolverize({
  semiBrick: rootQuery,
  resolvers: {
    person: (_, args) => {
      return {
        firstName: 'kerem',
        id: 1,
      };
    },
    // something: (_, args) => {
    //   return 'yo';
    // },
    // bestFriend: async (_, __) => {
    //   return {
    //     owner: {
    //       id: 'this is the id',
    //       firstName: 'this is the name',
    //     },
    //   };
    // },
    // // TODO: make the brick to resolve somehow accessible. something like via the info param.
    // people: (root, args) => {
    //   const toReturn: typeof rootQuery['fields']['people']['brick']['codec']['_A'] = [];
    //   const m = args.listArg.reduce((acc, cur) => acc + cur, 'x');
    //   for (let i = 0; i < args.numPeople; i++) {
    //     toReturn.push({
    //       firstName: `some-name-${i}-${m}`,
    //       id: i,
    //     });
    //   }
    //   return toReturn;
    // },
  },
});

// TODO: note to self: root queries are not allowed to be nonNullable.
export const root = rootQueryResolver.getSemiGraphQLType();

const someInterface = InterfaceSemiBrick.init({
  name: 'SomeInterface',
  fields: {
    someField: {
      brick: scalars.id.nullable,
      args: {},
    },
  },
});

// export const root = new GraphQLObjectType({
//   name: 'root',
//   fields: {
//     obj: {
//       type: obj,
//     },
//     // person: {
//     //   type: new GraphQLObjectType({
//     //     name: 'Person',
//     //     fields: {
//     //       someField: {
//     //         type: GraphQLID,
//     //       },
//     //     },
//     //     interfaces: [someInterface.semiGraphQLType],
//     //   }),
//     // },
//     // someObject: {
//     //   type: someInterface.semiGraphQLType,
//     //   resolve: () => {
//     //     return {
//     //       __typename: 'Person',
//     //       someField: 'some id',
//     //     };
//     //   },
//     // },
//   },
// });

const nullableScalar = scalars.id.nullable;
const nonNullableScalar = scalars.id.nonNullable;
nullableScalar.semiBrick;
nonNullableScalar.semiBrick;
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
