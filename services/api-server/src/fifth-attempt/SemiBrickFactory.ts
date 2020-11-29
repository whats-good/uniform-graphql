import {
  GraphQLBoolean,
  GraphQLFloat,
  GraphQLID,
  GraphQLInt,
  GraphQLList,
  GraphQLNamedType,
  GraphQLString,
  GraphQLType,
} from 'graphql';
import _ from 'lodash';
import * as t from 'io-ts';
import { AnySemiBrick, SemiGraphQLTypeOf } from './Brick';
import { EnumSemiBrick, StringKeys } from './semi-bricks/Enum';
import { InputListSemiBrick } from './semi-bricks/InputList';
import {
  AnyInputSemiBrick,
  InputFieldConfigMap,
  InputObjectSemiBrick,
} from './semi-bricks/InputObject';
import { InterfaceSemiBrick } from './semi-bricks/Interface';
import { OutputListSemiBrick } from './semi-bricks/OutputList';
import {
  AnyOutputSemiBrick,
  OutputFieldConfigMap,
  OutputObjectSemiBrick,
} from './semi-bricks/OutputObject';
import { ScalarSemiBrick } from './semi-bricks/Scalar';
import { UnionSemiBrick, UnitableSemiBricks } from './semi-bricks/Union';

interface SemiBricksMap {
  [key: string]: AnySemiBrick;
}

interface GraphQLTypesMap {
  [key: string]: GraphQLType;
}

export class SemiBrickFactory {
  // TODO: put all the semibricks in the order they are initialized here.
  private readonly semiBricks: SemiBricksMap = {};
  private readonly graphQLTypes: GraphQLTypesMap = {};

  constructor() {
    const scalar = this.scalar();
    Object.values(scalar).forEach(this.registerSemiBrick);
  }

  public getAllNamedSemiGraphQLTypes = (): GraphQLNamedType[] => {
    const allSemiGraphQLTypes = Object.values(this.semiBricks).map((sb) =>
      sb.getSemiGraphQLType(),
    );
    return allSemiGraphQLTypes.filter((x) => !(x instanceof GraphQLList));
  };

  private registerSemiBrick = (sb: AnySemiBrick) => {
    if (this.semiBricks[sb.name]) {
      throw new Error(
        `SemiBrick with name: ${sb.name} already exists. Try a different name.`,
      );
    }
    this.semiBricks[sb.name] = sb;
    return sb;
  };

  public getSemiGraphQLTypeOf = (
    sb: AnySemiBrick,
    fallback: () => SemiGraphQLTypeOf<typeof sb>,
  ): SemiGraphQLTypeOf<typeof sb> => {
    const cachedType: GraphQLType | undefined = this.graphQLTypes[sb.name];
    if (cachedType) {
      return cachedType;
    }
    const fresh = fallback();
    this.graphQLTypes[sb.name] = fresh;

    return fresh;
  };

  // TODO: find a way to avoid doing this delayed execution
  scalar = () => ({
    id: new ScalarSemiBrick({
      semiBrickFactory: this,
      name: 'ID',
      semiCodec: t.union([t.string, t.number]),
      semiGraphQLType: GraphQLID,
    }),

    string: new ScalarSemiBrick({
      semiBrickFactory: this,
      name: 'String',
      semiCodec: t.string,
      semiGraphQLType: GraphQLString,
    }),

    float: new ScalarSemiBrick({
      semiBrickFactory: this,
      name: 'Float',
      semiCodec: t.number,
      semiGraphQLType: GraphQLFloat,
    }),

    int: new ScalarSemiBrick({
      semiBrickFactory: this,
      name: 'Int',
      semiCodec: t.Int,
      semiGraphQLType: GraphQLInt,
    }),

    boolean: new ScalarSemiBrick({
      semiBrickFactory: this,
      name: 'Boolean',
      semiCodec: t.Int,
      semiGraphQLType: GraphQLBoolean,
    }),
  });

  enum = <D extends StringKeys>(params: {
    name: string;
    description?: string;
    keys: D;
  }): EnumSemiBrick<D> => {
    const sb = new EnumSemiBrick({
      semiBrickFactory: this,
      name: params.name,
      keys: params.keys,
      semiCodec: t.keyof(params.keys),
    });
    this.registerSemiBrick(sb);
    return sb;
  };

  inputList = <SB extends AnyInputSemiBrick>(params: {
    listOf: SB;
  }): InputListSemiBrick<SB> => {
    const sb = new InputListSemiBrick({
      semiBrickFactory: this,
      name: `InputListOf<${params.listOf.name}>`,
      listOf: params.listOf,
      semiCodec: t.array(params.listOf.semiCodec),
    });
    this.registerSemiBrick(sb);
    return sb;
  };

  inputObject = <F extends InputFieldConfigMap>(params: {
    name: string;
    fields: F;
  }): InputObjectSemiBrick<F> => {
    const codecs = _.mapValues(params.fields, (field) => field.brick.codec);
    const sb = new InputObjectSemiBrick({
      semiBrickFactory: this,
      name: params.name,
      fields: params.fields,
      semiCodec: t.type(codecs),
    });
    this.registerSemiBrick(sb);
    return sb;
  };

  interface = <F extends OutputFieldConfigMap>(params: {
    name: string;
    fields: F;
    description?: string;
  }): InterfaceSemiBrick<F> => {
    const codecs = _.mapValues(params.fields, (field) => field.brick.codec);
    const sb = new InterfaceSemiBrick({
      semiBrickFactory: this,
      name: params.name,
      fields: params.fields,
      semiCodec: t.type(codecs),
    });
    this.registerSemiBrick(sb);
    return sb;
  };

  outputList = <SB extends AnyOutputSemiBrick>(params: {
    listOf: SB;
  }): OutputListSemiBrick<SB> => {
    const sb = new OutputListSemiBrick({
      semiBrickFactory: this,
      name: `OutputListOf<${params.listOf.name}>`,
      listOf: params.listOf,
      semiCodec: t.array(params.listOf.semiCodec),
    });
    this.registerSemiBrick(sb);
    return sb;
  };

  outputObject = <F extends OutputFieldConfigMap>(params: {
    name: string;
    fields: F;
  }): OutputObjectSemiBrick<F> => {
    const codecs = _.mapValues(params.fields, (field) => field.brick.codec);
    const sb = new OutputObjectSemiBrick({
      semiBrickFactory: this,
      name: params.name,
      fields: params.fields,
      semiCodec: t.type(codecs),
    });
    this.registerSemiBrick(sb);
    return sb;
  };

  union = <SBS extends UnitableSemiBricks>(params: {
    name: string;
    semiBricks: SBS;
  }): UnionSemiBrick<SBS> => {
    const [firstSb, secondSb, ...rest] = params.semiBricks;
    const sb = new UnionSemiBrick({
      semiBrickFactory: this,
      name: params.name,
      semiBricks: params.semiBricks,
      semiCodec: t.union([
        firstSb.semiCodec,
        secondSb.semiCodec,
        ...rest.map(({ semiCodec }) => semiCodec),
      ]),
    });
    this.registerSemiBrick(sb);
    return sb;
  };
}
