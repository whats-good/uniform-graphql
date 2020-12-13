import { ApolloServer } from 'apollo-server-express';
import express from 'express';
import {
  SemiTypeFactory,
  RootOutputField,
  float,
  boolean,
  id,
  string,
  field,
} from './src';
import { SemiTypeOf } from './src/Type';
import { arg } from './src/types/struct-types';

const fac = new SemiTypeFactory();

const membership = fac.enum({
  name: 'Membership',
  keys: { free: null, paid: null, enterprise: null },
});

const someInput = fac.inputObject({
  name: 'SomeInput',
  fields: {
    id: {
      type: id.nullable,
      deprecationReason: 'id is deprecated',
      description: 'this is the description!',
    },
    firstName: {
      type: string.nullable,
    },
    membership: {
      type: membership.nonNullable,
    },
  },
});

const Person = fac.outputObject({
  name: 'Person',
  fields: {
    id: field(id.nullable),
    firstName: field(string.nonNullable),
  },
});

const EmployeeInterface = fac.interface({
  name: 'EmployeeInterface',
  fields: {
    id: field(id.nullable),
    firstName: field(string.nonNullable),
  },
  implementors: [Person],
});

Person.fieldResolverize({
  firstName: (root, args, context) => {
    return root.firstName + root.firstName;
  },
});

const Animal = fac.outputObject({
  name: 'Animal',
  fields: {
    id: field(id.nullable),
    owner: field(Person.nullable),
  },
});

const User = fac.outputObject({
  name: 'User',
  get fields() {
    return {
      id: field(id.nullable),
      friends: field(fac.outputList(fac.recursive(this)).nonNullable),
    };
  },
});

const bestFriend = fac.union({
  name: 'BestFriend',
  semiTypes: [Person, Animal],
});

const idInterface = fac.interface({
  name: 'IDInterface',
  fields: {
    id: field(id.nullable),
  },
  implementors: [Animal],
});

const firstNameInterface = fac.interface({
  name: 'FirstNameInterface',
  fields: {
    firstName: field(string.nonNullable),
  },
  implementors: [Person],
});

fac.rootQuery({
  fields: {
    kerem: new RootOutputField({
      type: Person.nonNullable,
      args: {
        id: arg(id.nonNullable),
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

fac.rootQuery({
  fields: {
    anotherThing: new RootOutputField({
      type: string.nonNullable,
      args: {
        someArg: arg(boolean.nonNullable),
      },
      resolve: (root, args, context) => {
        return 'abc';
      },
    }),
    firstName: new RootOutputField({
      type: firstNameInterface.nullable,
      resolve: () => {
        return {
          __typename: 'Person' as const,
          firstName: 'some firstname',
        };
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
    idInterface: new RootOutputField({
      type: idInterface.nullable,
      resolve: () => {
        return {
          __typename: 'Animal' as const,
          id: 'x',
        };
      },
    }),
    something: new RootOutputField({
      type: string.nonNullable,
      args: {
        inputObjectArg: arg(someInput.nonNullable),
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
        flag: arg(boolean.nonNullable),
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
      type: fac.outputList(Person).nonNullable,
      args: {
        numPeople: arg(float.nonNullable),
        listArg: arg(fac.inputList(membership).nonNullable),
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
        x: arg(boolean.nonNullable),
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
