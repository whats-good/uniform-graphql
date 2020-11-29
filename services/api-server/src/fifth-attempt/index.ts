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
      args: {},
    },
    firstName: {
      brick: fac.scalar().string.nonNullable,
      args: {},
    },
  },
});
const employeeInterface = fac.interface({
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
  implementors: {},
});

fieldResolverize({
  semiBrick: person,
  resolvers: {
    id: (root, args) => {
      return root.id;
    },
  },
});

export const animal = fac.outputObject({
  name: 'Animal',
  fields: {
    id: {
      brick: fac.scalar().id.nullable,
      args: {},
    },
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

const idInterface = fac.interface({
  name: 'IDInterface',
  fields: {
    id: {
      brick: fac.scalar().id.nullable,
      args: {},
    },
  },
  // TODO: how can i make sure that the brick's key is the same as its name?
  implementors: {
    employeeInterface,
    person,
    animal,
  },
});

const firstNameInterface = fac.interface({
  name: 'FirstNameInterface',
  fields: {
    firstName: {
      brick: fac.scalar().string.nonNullable,
      args: {},
    },
  },
  implementors: {
    employeeInterface,
  },
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
    person: (_, args, ctx, info) => {
      console.log(info);
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
