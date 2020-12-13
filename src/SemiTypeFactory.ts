import {
  GraphQLList,
  GraphQLNamedType,
  GraphQLSchema,
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

export class SemiTypeFactory {
  private readonly semiTypes: SemiTypesMap = {};
  private readonly graphQLTypes: GraphQLTypesMap = {};
  private readonly rootQueryFieldMaps: RootOutputFieldMap[] = [];
  private readonly mutationFieldMaps: RootOutputFieldMap[] = [];

  getAllNamedSemiGraphQLTypes = (): GraphQLNamedType[] => {
    const allSemiGraphQLTypes = Object.values(this.semiTypes).map((st) =>
      st.getSemiGraphQLType(),
    );
    return allSemiGraphQLTypes.filter((x) => !(x instanceof GraphQLList));
  };

  registerSemiType = (st: AnySemiType) => {
    if (this.semiTypes[st.name]) {
      throw new Error(
        `SemiType with name: ${st.name} already exists. Try a different name.`,
      );
    }
    this.semiTypes[st.name] = st;
    return st;
  };

  getSemiGraphQLTypeOf = (
    st: AnySemiType,
    fallback: () => SemiGraphQLTypeOf<typeof st>,
  ): SemiGraphQLTypeOf<typeof st> => {
    const cachedType: GraphQLType | undefined = this.graphQLTypes[st.name];
    if (cachedType) {
      return cachedType;
    }
    const fresh = fallback();
    this.graphQLTypes[st.name] = fresh;

    return fresh;
  };

  enum = <D extends StringKeys, N extends string>(params: {
    name: N;
    description?: string;
    keys: D;
  }): EnumSemiType<N, D> => {
    const st = new EnumSemiType({
      semiTypeFactory: this,
      name: params.name,
      keys: params.keys,
    });
    this.registerSemiType(st);
    return st;
  };

  inputList = <ST extends AnyInputSemiType>(
    listOf: ST,
  ): InputListSemiType<ST> => {
    const st = new InputListSemiType({
      semiTypeFactory: this,
      name: `InputListOf<${listOf.name}>`,
      listOf: listOf,
    });
    this.registerSemiType(st);
    return st;
  };

  inputObject = <F extends InputFieldConfigMap, N extends string>(params: {
    name: N;
    fields: F;
  }): InputObjectSemiType<F, N> => {
    const st = new InputObjectSemiType({
      semiTypeFactory: this,
      name: params.name,
      fields: params.fields,
    });
    this.registerSemiType(st);
    return st;
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
    const st = new InterfaceSemiType({
      semiTypeFactory: this,
      name: params.name,
      fields: params.fields,
      implementors: params.implementors,
    });
    this.registerSemiType(st);
    return st;
  };

  outputList = <ST extends AnyOutputSemiType>(params: {
    listOf: ST;
  }): OutputListSemiType<ST> => {
    const st = new OutputListSemiType({
      semiTypeFactory: this,
      name: `OutputListOf<${params.listOf.name}>`,
      listOf: params.listOf,
    });
    this.registerSemiType(st);
    return st;
  };

  outputObject = <F extends OutputFieldMap, N extends string>(params: {
    name: N;
    fields: F;
  }): OutputObjectSemiType<F, N> => {
    const st = new OutputObjectSemiType({
      semiTypeFactory: this,
      name: params.name,
      fields: {},
    });
    this.registerSemiType(st);
    // @ts-ignore // TODO: figure this out
    st.fields = params.fields;
    return st as any;
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
    const st = new UnionSemiType({
      semiTypeFactory: this,
      name: params.name,
      semiTypes: params.semiTypes,
    });
    this.registerSemiType(st);
    return st;
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
      semiTypeFactory: this,
      fields: rootQueryFields,
    });
    const Mutation = new OutputObjectSemiType({
      name: 'Mutation',
      semiTypeFactory: this,
      fields: mutationFields,
    });
    return new GraphQLSchema({
      query: Query.getSemiGraphQLType(),
      mutation: Mutation.getSemiGraphQLType(),
      types: this.getAllNamedSemiGraphQLTypes(),
    });
  };
}
