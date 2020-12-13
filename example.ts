import { ApolloServer } from 'apollo-server-express';
import express from 'express';
import { SemiTypeFactory, SimpleOutputField, RootOutputField } from './src';
import { SemiTypeOf } from './src/Type';

export const fac = new SemiTypeFactory();

const membership = fac.enum({
  name: 'Membership',
  keys: { free: null, paid: null, enterprise: null }, // TODO: enable the dev to give values to the values too.
});

export const someInput = fac.inputObject({
  name: 'SomeInput',
  fields: {
    id: {
      type: fac.scalar().id.nullable,
      deprecationReason: 'id is deprecated',
      description: 'this is the description!',
    },
    firstName: {
      type: fac.scalar().string.nullable,
    },
    membership: {
      type: membership.nonNullable,
    },
  },
});

export const Person = fac.outputObject({
  name: 'Person',
  fields: {
    id: new SimpleOutputField({
      type: fac.scalar().id.nullable,
    }),
    firstName: new SimpleOutputField({
      type: fac.scalar().string.nonNullable,
    }),
  },
});
const EmployeeInterface = fac.interface({
  name: 'EmployeeInterface',
  fields: {
    firstName: new SimpleOutputField({
      type: fac.scalar().string.nonNullable,
    }),
    id: new SimpleOutputField({
      type: fac.scalar().id.nullable,
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
      type: fac.scalar().id.nullable,
    }),
    owner: new SimpleOutputField({
      type: Person.nullable,
    }),
  },
});

export const User = fac.outputObject({
  name: 'User',
  get fields() {
    return {
      id: new SimpleOutputField({
        type: fac.scalar().id.nullable,
      }),
      friends: new SimpleOutputField({
        type: fac.outputList({
          listOf: fac.recursive(this),
        }).nonNullable,
      }),
    };
  },
});

export const bestFriend = fac.union({
  name: 'BestFriend',
  semiTypes: [Person, Animal],
});

const idInterface = fac.interface({
  name: 'IDInterface',
  fields: {
    id: new SimpleOutputField({
      type: fac.scalar().id.nullable,
    }),
  },
  implementors: [EmployeeInterface, Person, Animal],
});

const firstNameInterface = fac.interface({
  name: 'FirstNameInterface',
  fields: {
    firstName: new SimpleOutputField({
      type: fac.scalar().string.nonNullable,
    }),
  },
  implementors: [EmployeeInterface],
});

fac.rootQuery({
  fields: {
    kerem: new RootOutputField({
      type: Person.nonNullable,
      args: {
        id: { type: fac.scalar().id.nonNullable },
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
    anotherThing: new RootOutputField({
      type: fac.scalar().string.nonNullable,
      args: {
        someArg: { type: fac.scalar().boolean.nonNullable },
      },
      resolve: (root, args, context) => {
        return 'abc';
      },
    }),
    currentUser: new RootOutputField({
      type: User.nullable,
      resolve: (root, args, context) => {
        return {
          id: 'yo',
          get friends() {
            return [this];
          },
        };
      },
    }),
    employeeInterface: new RootOutputField({
      type: EmployeeInterface.nullable,
      resolve: (_, args, ctx) => {
        return {
          __typename: 'Person' as const,
          id: 'yo',
          firstName: 'kazan',
        };
      },
    }),
    something: new RootOutputField({
      type: fac.scalar().string.nonNullable,
      args: {
        inputObjectArg: {
          type: someInput.nonNullable,
        },
      },
      resolve: (_, args) => {
        return 'yo';
      },
    }),
    animal: new RootOutputField({
      type: Animal.nonNullable,
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
    person: new RootOutputField({
      type: Person.nonNullable,
      args: {
        flag: {
          type: fac.scalar().boolean.nonNullable,
        },
      },
      resolve: (_, args, ctx, info) => {
        return {
          firstName: 'kerem',
          id: 1,
        };
      },
    }),
    bestFriend: new RootOutputField({
      type: bestFriend.nonNullable,
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
    people: new RootOutputField({
      type: fac.outputList({
        listOf: Person,
      }).nonNullable,
      args: {
        numPeople: {
          type: fac.scalar().float.nonNullable,
        },
        listArg: {
          type: fac.inputList(membership).nonNullable,
        },
      },
      resolve: (root, args) => {
        const toReturn: Array<SemiTypeOf<typeof Person>> = [];
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
    doThis: new RootOutputField({
      type: Person.nonNullable,
      args: {
        x: {
          type: fac.scalar().boolean.nonNullable,
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
