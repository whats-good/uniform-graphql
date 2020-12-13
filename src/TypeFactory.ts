import {
  GraphQLBoolean,
  GraphQLFloat,
  GraphQLID,
  GraphQLList,
  GraphQLNamedType,
  GraphQLSchema,
  GraphQLString,
  GraphQLType,
} from 'graphql';
import { AnySemiType, SemiGraphQLTypeOf } from './Type';
import { EnumSemiType, StringKeys } from './types/Enum';
import { Implementors } from './types/Implementor';
import { InputListSemiType } from './types/InputList';
import { InputObjectSemiType } from './types/InputObject';
import { InterfaceSemiType } from './types/Interface';
import { OutputListSemiType } from './types/OutputList';
import { OutputObjectSemiType } from './types/OutputObject';
import { ScalarSemiType } from './types/Scalar';
import {
  AnyOutputSemiType,
  AnyInputSemiType,
  InputFieldConfigMap,
} from './types/struct-types';
import { UnionSemiType, UnitableSemiTypes } from './types/Union';
import { OutputFieldMap, RootOutputFieldMap } from './OutputField';

interface SemiTypesMap {
  [key: string]: AnySemiType;
}

interface GraphQLTypesMap {
  [key: string]: GraphQLType;
}

export class TypeFactory {
  // TODO: put all the semibricks in the order they are initialized here.
  private readonly semiTypes: SemiTypesMap = {};
  private readonly graphQLTypes: GraphQLTypesMap = {};
  private readonly rootQueryFieldMaps: RootOutputFieldMap[] = [];
  private readonly mutationFieldMaps: RootOutputFieldMap[] = [];

  constructor() {
    const scalar = this.scalar();
    Object.values(scalar).forEach(this.registerSemiType);
  }

  public getAllNamedSemiGraphQLTypes = (): GraphQLNamedType[] => {
    const allSemiGraphQLTypes = Object.values(this.semiTypes).map((sb) =>
      sb.getSemiGraphQLType(),
    );
    return allSemiGraphQLTypes.filter((x) => !(x instanceof GraphQLList));
  };

  private registerSemiType = (sb: AnySemiType) => {
    if (this.semiTypes[sb.name]) {
      throw new Error(
        `SemiType with name: ${sb.name} already exists. Try a different name.`,
      );
    }
    this.semiTypes[sb.name] = sb;
    return sb;
  };

  public getSemiGraphQLTypeOf = (
    sb: AnySemiType,
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
    id: new ScalarSemiType<string | number, 'ID'>({
      typeFactory: this,
      name: 'ID',
      semiGraphQLType: GraphQLID,
    }),

    // TODO: see if you can avoid typing the Name param twice
    string: new ScalarSemiType<string, 'String'>({
      typeFactory: this,
      name: 'String',
      semiGraphQLType: GraphQLString,
    }),

    float: new ScalarSemiType<number, 'Float'>({
      typeFactory: this,
      name: 'Float',
      semiGraphQLType: GraphQLFloat,
    }),

    // int: new ScalarSemiType({ // TODO: get back here and reimplement
    //   typeFactory: this,
    //   name: 'Int',
    //   semiGraphQLType: GraphQLInt,
    // }),

    boolean: new ScalarSemiType<boolean, 'Boolean'>({
      typeFactory: this,
      name: 'Boolean',
      semiGraphQLType: GraphQLBoolean,
    }),
  });

  enum = <D extends StringKeys, N extends string>(params: {
    name: N;
    description?: string;
    keys: D;
  }): EnumSemiType<N, D> => {
    const sb = new EnumSemiType({
      typeFactory: this,
      name: params.name,
      keys: params.keys,
    });
    this.registerSemiType(sb);
    return sb;
  };

  inputList = <SB extends AnyInputSemiType>(
    listOf: SB,
  ): InputListSemiType<SB> => {
    const sb = new InputListSemiType({
      typeFactory: this,
      name: `InputListOf<${listOf.name}>`,
      listOf: listOf,
    });
    this.registerSemiType(sb);
    return sb;
  };

  inputObject = <F extends InputFieldConfigMap, N extends string>(params: {
    name: N;
    fields: F;
  }): InputObjectSemiType<F, N> => {
    const sb = new InputObjectSemiType({
      typeFactory: this,
      name: params.name,
      fields: params.fields,
    });
    this.registerSemiType(sb);
    return sb;
  };

  interface = <
    F extends OutputFieldMap,
    I extends Implementors<F>,
    N extends string
  >(params: {
    name: N;
    fields: F;
    implementors: I;
  }): InterfaceSemiType<F, I, N> => {
    const sb = new InterfaceSemiType({
      typeFactory: this,
      name: params.name,
      fields: params.fields,
      implementors: params.implementors,
    });
    this.registerSemiType(sb);
    return sb;
  };

  outputList = <SB extends AnyOutputSemiType>(params: {
    listOf: SB;
  }): OutputListSemiType<SB> => {
    const sb = new OutputListSemiType({
      typeFactory: this,
      name: `OutputListOf<${params.listOf.name}>`,
      listOf: params.listOf,
    });
    this.registerSemiType(sb);
    return sb;
  };

  outputObject = <F extends OutputFieldMap, N extends string>(params: {
    name: N;
    fields: F;
  }): OutputObjectSemiType<F, N> => {
    const sb = new OutputObjectSemiType({
      typeFactory: this,
      name: params.name,
      fields: {},
    });
    this.registerSemiType(sb);
    // @ts-ignore // TODO: figure this out
    sb.fields = params.fields;
    return sb as any;
  };

  recursive = <F extends OutputFieldMap, N extends string>(params: {
    name: N;
    fields: F;
  }): OutputObjectSemiType<F, N> => {
    return this.semiTypes[params.name] as any;
  };
  // TODO: warn the user when they try to register the same query field.
  rootQuery = <F extends RootOutputFieldMap>(params: { fields: F }): void => {
    this.rootQueryFieldMaps.push(params.fields);
  };

  mutation = <F extends RootOutputFieldMap>(params: { fields: F }): void => {
    this.mutationFieldMaps.push(params.fields);
  };

  union = <SBS extends UnitableSemiTypes, N extends string>(params: {
    name: N;
    semiTypes: SBS;
  }): UnionSemiType<SBS, N> => {
    const sb = new UnionSemiType({
      typeFactory: this,
      name: params.name,
      semiTypes: params.semiTypes,
    });
    this.registerSemiType(sb);
    return sb;
  };

  getGraphQLSchema = (): GraphQLSchema => {
    const rootQueryFields = {};
    const mutationFields = {};
    this.rootQueryFieldMaps.forEach((curRootQueryMap) => {
      Object.assign(rootQueryFields, curRootQueryMap);
    });
    this.mutationFieldMaps.forEach((cur) => {
      Object.assign(mutationFields, cur);
    });
    const Query = new OutputObjectSemiType({
      name: 'Query',
      typeFactory: this,
      fields: rootQueryFields,
    });
    const Mutation = new OutputObjectSemiType({
      name: 'Mutation',
      typeFactory: this,
      fields: mutationFields,
    });
    return new GraphQLSchema({
      query: Query.getSemiGraphQLType(),
      mutation: Mutation.getSemiGraphQLType(),
      types: this.getAllNamedSemiGraphQLTypes(),
    });
  };
}
