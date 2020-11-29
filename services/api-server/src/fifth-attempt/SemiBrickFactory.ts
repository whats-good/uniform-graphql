import {
  GraphQLBoolean,
  GraphQLFloat,
  GraphQLID,
  GraphQLInt,
  GraphQLString,
} from 'graphql';
import * as t from 'io-ts';
import { AnySemiBrick } from './Brick';
import { EnumSemiBrick } from './semi-bricks/Enum';
import { InputListSemiBrick } from './semi-bricks/InputList';
import { InputObjectSemiBrick } from './semi-bricks/InputObject';
import { InterfaceSemiBrick } from './semi-bricks/Interface';
import { OutputListSemiBrick } from './semi-bricks/OutputList';
import { OutputObjectSemiBrick } from './semi-bricks/OutputObject';
import { ScalarSemiBrick } from './semi-bricks/Scalar';
import { UnionSemiBrick } from './semi-bricks/Union';

export class SemiBrickFactory {
  // TODO: put all the semibricks in the order they are initialized here.
  // private readonly semibricks: AnySemiBrick[];

  scalar = () => ({
    id: new ScalarSemiBrick(this, {
      name: 'ID',
      semiCodec: t.union([t.string, t.number]),
      semiGraphQLType: GraphQLID,
    }),

    string: new ScalarSemiBrick(this, {
      name: 'String',
      semiCodec: t.string,
      semiGraphQLType: GraphQLString,
    }),

    float: new ScalarSemiBrick(this, {
      name: 'Float',
      semiCodec: t.number,
      semiGraphQLType: GraphQLFloat,
    }),

    int: new ScalarSemiBrick(this, {
      name: 'Int',
      semiCodec: t.Int,
      semiGraphQLType: GraphQLInt,
    }),

    boolean: new ScalarSemiBrick(this, {
      name: 'Boolean',
      semiCodec: t.Int,
      semiGraphQLType: GraphQLBoolean,
    }),
  });

  enum = () => EnumSemiBrick.init(this);

  inputList = () => InputListSemiBrick.init(this);

  inputObject = () => InputObjectSemiBrick.init(this);

  interface = () => InterfaceSemiBrick.init(this);

  outputList = () => OutputListSemiBrick.init(this);

  outputObject = () => OutputObjectSemiBrick.init(this);

  union = () => UnionSemiBrick.init(this);
}
