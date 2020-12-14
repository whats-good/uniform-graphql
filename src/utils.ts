import {
  GraphQLBoolean,
  GraphQLFloat,
  GraphQLID,
  GraphQLString,
} from 'graphql';
import { SemiTypeFactory } from './SemiTypeFactory';
import { InputListSemiType } from './types/InputList';
import { OutputListSemiType } from './types/OutputList';

import { ScalarSemiType } from './types/Scalar';
import { AnyOutputSemiType, AnyInputSemiType } from './types/struct-types';

const defaultFactory = new SemiTypeFactory();

export const outputList = <ST extends AnyOutputSemiType>(
  listOf: ST,
): OutputListSemiType<ST> => {
  return new OutputListSemiType({
    semiTypeFactory: defaultFactory,
    name: `OutputListOf<${listOf.name}>`,
    listOf,
  });
};

export const inputList = <ST extends AnyInputSemiType>(
  listOf: ST,
): InputListSemiType<ST> => {
  return new InputListSemiType({
    semiTypeFactory: defaultFactory,
    name: `InputListOf<${listOf.name}>`,
    listOf: listOf,
  });
};

export const id = new ScalarSemiType<string | number, 'ID'>({
  semiTypeFactory: defaultFactory,
  name: 'ID',
  semiGraphQLType: GraphQLID,
});

export const string = new ScalarSemiType<string, 'String'>({
  semiTypeFactory: defaultFactory,
  name: 'String',
  semiGraphQLType: GraphQLString,
});

export const float = new ScalarSemiType<number, 'Float'>({
  semiTypeFactory: defaultFactory,
  name: 'Float',
  semiGraphQLType: GraphQLFloat,
});

export const boolean = new ScalarSemiType<boolean, 'Boolean'>({
  semiTypeFactory: defaultFactory,
  name: 'Boolean',
  semiGraphQLType: GraphQLBoolean,
});
