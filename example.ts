import { ApolloServer } from 'apollo-server-express';
import express from 'express';
import { field, SemiTypeFactory, SimpleOutputField } from './src';
import { SemiTypeOf } from './src/Type';
import { OutputObjectSemiType } from './src/types/OutputObject';
import { arg, OutputFieldArgumentMap } from './src/types/struct-types';

const fac = new SemiTypeFactory(() => ({
  kerem: 'kerem',
  kazan: 'kazan',
  currentUser: 'currentUser',
}));

// TODO: understand why removing this object breaks things.
fac.object({
  name: 'kazan',
  fields: {
    kerem: () => field(fac.float.nullable),
  },
});

const membership = fac.enum({
  name: 'Membership',
  keys: { free: null, paid: null, enterprise: null },
});

const someInput = fac.inputObject({
  name: 'SomeInput',
  fields: {
    id: {
      type: fac.id.nullable,
      deprecationReason: 'id is deprecated',
      description: 'this is the description!',
    },
    firstName: {
      type: fac.string.nullable,
    },
    membership: {
      type: membership.nonNullable,
    },
  },
});

type PersonType = OutputObjectSemiType<
  {
    id: () => SimpleOutputField<
      typeof fac['id']['nullable'],
      OutputFieldArgumentMap
    >;
    firstName: () => SimpleOutputField<
      typeof fac['string']['nonNullable'],
      OutputFieldArgumentMap
    >;
    pet: () => SimpleOutputField<
      AnimalType['nullable'],
      OutputFieldArgumentMap
    >;
  },
  'Person'
>;

const Person: PersonType = fac.object({
  name: 'Person',
  fields: {
    id: () => field(fac.id.nullable),
    firstName: () => field(fac.string.nonNullable),
    pet: () => field(Animal.nullable),
  },
});

type AnimalType = OutputObjectSemiType<
  {
    id: () => SimpleOutputField<
      typeof fac['id']['nullable'],
      OutputFieldArgumentMap
    >;
    owner: () => SimpleOutputField<
      PersonType['nullable'],
      OutputFieldArgumentMap
    >;
  },
  'Animal'
>;

const Animal: AnimalType = fac.object({
  name: 'Animal',
  fields: {
    id: () => field(fac.id.nullable),
    owner: () => field(Person.nullable),
  },
});

const EmployeeInterface = fac.interface({
  name: 'EmployeeInterface',
  fields: {
    id: () => field(fac.id.nullable),
    firstName: () => field(fac.string.nonNullable),
  },
  implementors: [Person],
});

fac.fieldResolvers(Person, {
  firstName: (root, args, context) => {
    return root.firstName + root.firstName + context.kazan;
  },
  id: (root, args, context) => {
    return context.kazan;
  },
});

const User = fac.object({
  name: 'User',
  get fields() {
    return {
      id: () => field(fac.id.nullable),
      friends: () => field(fac.list(fac.recursive(this)).nonNullable),
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
    id: () => field(fac.id.nullable),
  },
  implementors: [Person],
});

const firstNameInterface = fac.interface({
  name: 'FirstNameInterface',
  fields: {
    firstName: () => field(fac.string.nonNullable),
  },
  implementors: [Person],
});

fac.rootQuery({
  kerem: () =>
    fac.rootField({
      type: Person.nonNullable,
      args: {
        id: arg(fac.id.nonNullable),
      },
      resolve: (root, args, context) => {
        return {
          id: 'this is the id',
          firstName: 'this is the firstname',
          pet: null,
        };
      },
    }),
});

fac.rootQuery({
  firstGuy: () =>
    fac.rootField({
      type: Person.nonNullable,
      args: {},
      resolve: (root, args, context) => {
        return {
          id: 'abc',
          firstName: 'yo',
          get pet() {
            return {
              id: 'x',
              owner: this,
            };
          },
        };
      },
    }),
  anotherThing: () =>
    fac.rootField({
      type: fac.string.nonNullable,
      args: {
        someArg: arg(fac.boolean.nonNullable),
      },
      resolve: (root, args, context) => {
        return 'abc';
      },
    }),
  firstName: () =>
    fac.rootField({
      type: firstNameInterface.nullable,
      resolve: (root, args, context) => {
        return {
          __typename: 'Person' as const,
          firstName: 'some firstname' + context.kazan,
        };
      },
    }),
  currentUser: () =>
    fac.rootField({
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
  employeeInterface: () =>
    fac.rootField({
      type: EmployeeInterface.nullable,
      resolve: (_, args, ctx) => {
        return {
          __typename: 'Person' as const,
          id: 'yo',
          firstName: 'kazan',
        };
      },
    }),
  idInterface: () =>
    fac.rootField({
      type: idInterface.nullable,
      resolve: (root, args, context) => {
        return {
          __typename: 'Person' as const,
          id: 'x',
        };
      },
    }),
  something: () =>
    fac.rootField({
      type: fac.string.nonNullable,
      args: {
        inputObjectArg: arg(someInput.nonNullable),
      },
      resolve: (_, args) => {
        return 'yo';
      },
    }),
  person: () =>
    fac.rootField({
      type: Person.nonNullable,
      args: {
        flag: arg(fac.boolean.nonNullable),
      },
      resolve: (_, args, ctx, info) => {
        return {
          firstName: 'kerem',
          id: 'abc',
          pet: null,
        };
      },
    }),
  bestFriend: () =>
    fac.rootField({
      type: bestFriend.nonNullable,
      resolve: async (_, __) => {
        return {
          __typename: 'Animal' as const,
          id: 'yo',
          get owner() {
            return {
              id: 'this is the id',
              firstName: 'this is the name',
              pet: this,
            };
          },
        };
      },
    }),
  people: () =>
    fac.rootField({
      type: fac.list(Person).nonNullable,
      args: {
        numPeople: arg(fac.float.nonNullable),
        listArg: arg(fac.inputList(membership).nonNullable),
      },
      resolve: (root, args) => {
        const toReturn: Array<SemiTypeOf<typeof Person>> = [];
        const m = args.listArg.reduce((acc, cur) => acc + cur, 'x');
        for (let i = 0; i < args.numPeople; i++) {
          const person = {
            firstName: `some-name-${i}-${m}`,
            id: i,
            get pet() {
              return {
                id: 'adfa',
                owner: this,
              };
            },
          };
          toReturn.push(person);
        }
        return toReturn;
      },
    }),
});

fac.mutation({
  doThis: () =>
    fac.rootField({
      type: Person.nonNullable,
      args: {
        x: arg(fac.boolean.nonNullable),
      },
      resolve: (root, args, context) => {
        return {
          id: 'yo',
          firstName: 'yeah',
          pet: null,
        };
      },
    }),
});

const schema = fac.getGraphQLSchema();

const apolloServer = new ApolloServer({
  schema,
  context: fac.getContext(), // TODO: find a way to get the context inserted properly
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
