// import { TypeOf } from './Brick';
import { fieldResolverize, queryResolverize } from './resolver';
import { SemiBrickFactory } from './SemiBrickFactory';

export const fac = new SemiBrickFactory();

const membership = fac.enum({
  name: 'Membership',
  keys: { free: null, paid: null, enterprise: null }, // TODO: enable the dev to give values to the values too.
});

// const a: TypeOf<typeof membership['nullable']> = 'enterprise';

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

const idInterface = fac.interface({
  name: 'IDInterface',
  fields: {
    id: {
      brick: fac.scalar().id.nonNullable,
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
    something: {
      brick: fac.scalar().string.nullable,
      args: {
        inputObjectArg: {
          brick: someInput.nonNullable,
        },
      },
    },
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
    bestFriend: {
      brick: bestFriend.nonNullable,
      args: {},
    },
    people: {
      brick: fac.outputList({
        listOf: person,
      }).nonNullable,
      args: {
        numPeople: {
          brick: fac.scalar().float.nonNullable,
        },
        listArg: {
          brick: fac.inputList({
            listOf: membership, // TODO: make it take the brick directly, and nothing else
          }).nonNullable,
        },
      },
    },
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
    something: (_, args) => {
      return 'yo';
    },
    bestFriend: async (_, __) => {
      return {
        owner: {
          id: 'this is the id',
          firstName: 'this is the name',
        },
      };
    },
    // // TODO: make the brick to resolve somehow accessible. something like via the info param.
    people: (root, args) => {
      // TODO: dont use any here
      const toReturn: any[] = [];
      const m = args.listArg.reduce((acc, cur) => acc + cur, 'x');
      for (let i = 0; i < args.numPeople; i++) {
        toReturn.push({
          firstName: `some-name-${i}-${m}`,
          id: i,
        });
      }
      return toReturn;
    },
  },
});
