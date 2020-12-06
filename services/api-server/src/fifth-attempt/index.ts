import { fieldResolverize, queryResolverize } from './resolver';
import { SemiBrickFactory } from './SemiBrickFactory';
export const fac = new SemiBrickFactory();

const membership = fac.enum({
  name: 'Membership',
  keys: { free: null, paid: null, enterprise: null }, // TODO: enable the dev to give values to the values too.
});

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

export const Person = fac.outputObject({
  name: 'Person',
  fields: {
    id: {
      brick: fac.scalar().id.nullable,
      args: {},
    },
    firstName: {
      brick: fac.scalar().string.nonNullable,
      args: {},
    },
  },
});
const EmployeeInterface = fac.interface({
  name: 'EmployeeInterface',
  fields: {
    firstName: {
      brick: fac.scalar().string.nonNullable,
      args: {},
    },
    id: {
      brick: fac.scalar().id.nullable,
      args: {},
    },
  },
  implementors: [],
});

fieldResolverize({
  semiBrick: Person,
  resolvers: {
    id: (root, args) => {
      return root.id;
    },
  },
});

export const Animal = fac.outputObject({
  name: 'Animal',
  fields: {
    id: {
      brick: fac.scalar().id.nullable,
      args: {},
    },
    owner: {
      brick: Person.nullable,
      args: {},
    },
  },
});

export const bestFriend = fac.union({
  name: 'BestFriend',
  semiBricks: [Person, Animal],
});

const idInterface = fac.interface({
  name: 'IDInterface',
  fields: {
    id: {
      brick: fac.scalar().id.nullable,
      args: {},
    },
  },
  implementors: [EmployeeInterface, Person, Animal],
});

const firstNameInterface = fac.interface({
  name: 'FirstNameInterface',
  fields: {
    firstName: {
      brick: fac.scalar().string.nonNullable,
      args: {},
    },
  },
  implementors: [EmployeeInterface],
});
export const root = fac.outputObject({
  name: 'RootQuery',
  fields: {
    idInterface: {
      brick: idInterface.nullable,
      args: {},
    },
    something: {
      brick: fac.scalar().string.nullable,
      args: {
        inputObjectArg: {
          brick: someInput.nonNullable,
        },
      },
    },
    animal: {
      brick: Animal.nonNullable,
      args: {},
    },
    person: {
      brick: Person.nonNullable,
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
        listOf: Person,
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
    idInterface: (_, args, ctx) => {
      return {
        __typename: 'Person' as const,
        id: 'yo',
        firstName: 'kazan',
      };
    },
    person: (_, args, ctx, info) => {
      return {
        firstName: 'kerem',
        id: 1,
      };
    },
    animal: (_, __) => {
      return {
        id: 'yo',
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
        __typename: 'Animal' as const,
        id: 'yo',
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
