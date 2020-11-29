import { fieldResolverize, queryResolverize } from './resolver';
import { SemiBrickFactory } from './SemiBrickFactory';

const fac = new SemiBrickFactory();

const membership = fac.enum({
  name: 'Membership',
  keys: { free: null, paid: null, enterprise: null }, // TODO: enable the dev to give values to the values too.
});

membership.nullable.semiBrick.semiCodec.encode('enterprise');
// TODO: make a note: if all fields are deprecated, the schema will fail to build, forever.
export const someInput = fac.inputObject({
  name: 'SomeInput',
  fields: {
    id: {
      brick: fac.scalar().id.nullable,
      deprecationReason: 'id is deprecated',
      description: 'this is the description!',
    },
    firstName: {
      brick: fac.scalar().string.nullable,
      // deprecationReason: 'firstname is deprecated!',
    },
    membership: {
      brick: membership.nonNullable,
    },
  },
});

export const person = fac.outputObject({
  name: 'Person',
  fields: {
    id: {
      brick: fac.scalar().id.nullable,
      // deprecationReason: 'this field is deprecataed',
      args: {
        x: {
          brick: fac.scalar().id.nullable,
        },
        y: {
          brick: fac.scalar().float.nonNullable,
        },
      },
    },
    firstName: {
      brick: fac.scalar().string.nullable,
      args: {},
    },
  },
});

fieldResolverize({
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

export const animal = fac.outputObject({
  name: 'Animal',
  fields: {
    owner: {
      brick: person.nullable,
      args: {},
    },
  },
});

export const bestFriend = fac.union({
  name: 'BestFriend',
  semiBricks: [person, animal],
});

export const root = fac.outputObject({
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
    animal: {
      brick: animal.nonNullable,
      args: {},
    },
    person: {
      brick: person.nonNullable,
      args: {
        flag: {
          brick: fac.scalar().boolean.nonNullable,
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
queryResolverize({
  semiBrick: root,
  resolvers: {
    person: (_, args) => {
      return {
        firstName: 'kerem',
        id: 1,
      };
    },
    animal: (_, __) => {
      return {
        owner: {
          firstName: 'kerem',
          id: 'kazan',
        },
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

const someInterface = fac.interface({
  name: 'SomeInterface',
  fields: {
    someField: {
      brick: fac.scalar().id.nullable,
      args: {},
    },
  },
});
