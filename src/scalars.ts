import {
  GraphQLBoolean,
  GraphQLFloat,
  GraphQLID,
  GraphQLString,
} from 'graphql';
import { SemiTypeFactory } from './SemiTypeFactory';

import { ScalarSemiType } from './types/Scalar';

const defaultFactory = new SemiTypeFactory();

export const id = new ScalarSemiType<string | number, 'ID'>({
  semiTypeFactory: defaultFactory,
  name: 'ID',
  semiGraphQLType: GraphQLID,
});

// TODO: see if you can avoid typing the Name param twice
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
