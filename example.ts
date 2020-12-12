import { ApolloServer } from 'apollo-server-express';
import express from 'express';
import {
  SemiBrickFactory,
  SimpleOutputField,
  RootQueryOutputField,
} from './src';
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
    id: new SimpleOutputField({
      brick: fac.scalar().id.nullable,
      args: {},
    }),
    firstName: new SimpleOutputField({
      brick: fac.scalar().string.nonNullable,
      args: {},
    }),
  },
});
const EmployeeInterface = fac.interface({
  name: 'EmployeeInterface',
  fields: {
    firstName: new SimpleOutputField({
      brick: fac.scalar().string.nonNullable,
      args: {},
    }),
    id: new SimpleOutputField({
      brick: fac.scalar().id.nullable,
      args: {},
    }),
  },
  implementors: [Person],
});

Person.fieldResolverize({
  firstName: (root, args, context) => {
    return root.firstName + root.firstName;
  },
});

export const Animal = fac.outputObject({
  name: 'Animal',
  fields: {
    id: new SimpleOutputField({
      brick: fac.scalar().id.nullable,
      args: {},
    }),
    owner: new SimpleOutputField({
      brick: Person.nullable,
      args: {},
    }),
  },
});

export const User = fac.outputObject({
  name: 'User',
  get fields() {
    return {
      id: new SimpleOutputField({
        brick: fac.scalar().id.nullable,
        args: {},
      }),
      friends: new SimpleOutputField({
        brick: fac.outputList({
          listOf: fac.recursive(this),
        }).nonNullable,
        args: {},
      }),
    };
  },
});

export const bestFriend = fac.union({
  name: 'BestFriend',
  semiBricks: [Person, Animal],
});

const idInterface = fac.interface({
  name: 'IDInterface',
  fields: {
    id: new SimpleOutputField({
      brick: fac.scalar().id.nullable,
      args: {},
    }),
  },
  implementors: [EmployeeInterface, Person, Animal],
});

const firstNameInterface = fac.interface({
  name: 'FirstNameInterface',
  fields: {
    firstName: new SimpleOutputField({
      brick: fac.scalar().string.nonNullable,
      args: {},
    }),
  },
  implementors: [EmployeeInterface],
});

fac.rootQuery({
  fields: {
    kerem: new RootQueryOutputField({
      brick: Person.nonNullable,
      args: {
        id: { brick: fac.scalar().id.nonNullable },
      },
      resolve: (root, args, context) => {
        return {
          id: 'this is the id',
          firstName: 'this is the firstname',
        };
      },
    }),
  },
});

// TODO: find a way to get this done without having to call the classes directly. just via passing the constructors
fac.rootQuery({
  fields: {
    anotherThing: new RootQueryOutputField({
      brick: fac.scalar().string.nonNullable,
      args: {
        someArg: { brick: fac.scalar().boolean.nonNullable },
      },
      resolve: (root, args, context) => {
        return 'abc';
      },
    }),
    currentUser: new RootQueryOutputField({
      brick: User.nullable,
      args: {},
      resolve: (root, args, context) => {
        return {
          id: 'yo',
          get friends() {
            return [this];
          },
        };
      },
    }),
    employeeInterface: new RootQueryOutputField({
      brick: EmployeeInterface.nullable,
      args: {},
      resolve: (_, args, ctx) => {
        return {
          __typename: 'Person' as const,
          id: 'yo',
          firstName: 'kazan',
        };
      },
    }),
    something: new RootQueryOutputField({
      brick: fac.scalar().string.nonNullable,
      args: {
        inputObjectArg: {
          brick: someInput.nonNullable,
        },
      },
      resolve: (_, args) => {
        return 'yo';
      },
    }),
    animal: new RootQueryOutputField({
      brick: Animal.nonNullable,
      args: {},
      resolve: (_, __) => {
        return {
          id: 'yo',
          owner: {
            firstName: 'kerem',
            id: 'kazan',
          },
        };
      },
    }),
    person: new RootQueryOutputField({
      brick: Person.nonNullable,
      args: {
        flag: {
          brick: fac.scalar().boolean.nonNullable,
        },
      },
      resolve: (_, args, ctx, info) => {
        return {
          firstName: 'kerem',
          id: 1,
        };
      },
    }),
    bestFriend: new RootQueryOutputField({
      brick: bestFriend.nonNullable,
      args: {},
      resolve: async (_, __) => {
        return {
          __typename: 'Animal' as const,
          id: 'yo',
          owner: {
            id: 'this is the id',
            firstName: 'this is the name',
          },
        };
      },
    }),
    people: new RootQueryOutputField({
      brick: fac.outputList({
        listOf: Person,
      }).nonNullable,
      args: {
        numPeople: {
          brick: fac.scalar().float.nonNullable,
        },
        listArg: {
          brick: fac.inputList(membership).nonNullable,
        },
      },
      resolve: (root, args) => {
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
    }),
  },
});

fac.mutation({
  fields: {
    // TODO: since it's reused in mutations, RootQueryOutput isn't that appropriate here.
    doThis: new RootQueryOutputField({
      brick: Person.nonNullable,
      args: {
        x: {
          brick: fac.scalar().boolean.nonNullable,
        },
      },
      resolve: (root, args, context) => {
        return {
          id: 'yo',
          firstName: 'yeah',
        };
      },
    }),
  },
});

const schema = fac.getGraphQLSchema();

const apolloServer = new ApolloServer({
  schema,
});

const PORT = 4001;

const start = () => {
  const app = express();
  apolloServer.applyMiddleware({ app });
  app.listen({ port: PORT }, () => {
    console.log(
      `🚀 Server ready at http://localhost:${PORT}${apolloServer.graphqlPath}`,
    );
  });
};

start();
