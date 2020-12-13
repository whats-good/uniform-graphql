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
import {
  AnySemiStaticGraphQLType,
  SemiGraphQLTypeOf,
} from './StaticGraphQLType';
import { EnumSemiStaticGraphQLType, StringKeys } from './types/Enum';
import { Implementors } from './types/Implementor';
import { InputListSemiStaticGraphQLType } from './types/InputList';
import { InputObjectSemiStaticGraphQLType } from './types/InputObject';
import { InterfaceSemiStaticGraphQLType } from './types/Interface';
import { OutputListSemiStaticGraphQLType } from './types/OutputList';
import { OutputObjectSemiStaticGraphQLType } from './types/OutputObject';
import { ScalarSemiStaticGraphQLType } from './types/Scalar';
import {
  AnyOutputSemiStaticGraphQLType,
  AnyInputSemiStaticGraphQLType,
  InputFieldConfigMap,
} from './types/struct-types';
import {
  UnionSemiStaticGraphQLType,
  UnitableSemiStaticGraphQLTypes,
} from './types/Union';
import { OutputFieldMap, RootQueryOutputFieldMap } from './OutputField';

interface SemiStaticGraphQLTypesMap {
  [key: string]: AnySemiStaticGraphQLType;
}

interface GraphQLTypesMap {
  [key: string]: GraphQLType;
}

export class TypeFactory {
  // TODO: put all the semibricks in the order they are initialized here.
  private readonly semiStaticGraphQLTypes: SemiStaticGraphQLTypesMap = {};
  private readonly graphQLTypes: GraphQLTypesMap = {};
  private readonly rootQueryFieldMaps: RootQueryOutputFieldMap[] = [];
  private readonly mutationFieldMaps: RootQueryOutputFieldMap[] = [];

  constructor() {
    const scalar = this.scalar();
    Object.values(scalar).forEach(this.registerSemiStaticGraphQLType);
  }

  public getAllNamedSemiGraphQLTypes = (): GraphQLNamedType[] => {
    const allSemiGraphQLTypes = Object.values(
      this.semiStaticGraphQLTypes,
    ).map((sb) => sb.getSemiGraphQLType());
    return allSemiGraphQLTypes.filter((x) => !(x instanceof GraphQLList));
  };

  private registerSemiStaticGraphQLType = (sb: AnySemiStaticGraphQLType) => {
    if (this.semiStaticGraphQLTypes[sb.name]) {
      throw new Error(
        `SemiStaticGraphQLType with name: ${sb.name} already exists. Try a different name.`,
      );
    }
    this.semiStaticGraphQLTypes[sb.name] = sb;
    return sb;
  };

  public getSemiGraphQLTypeOf = (
    sb: AnySemiStaticGraphQLType,
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
    id: new ScalarSemiStaticGraphQLType<string | number, 'ID'>({
      typeFactory: this,
      name: 'ID',
      semiGraphQLType: GraphQLID,
    }),

    // TODO: see if you can avoid typing the Name param twice
    string: new ScalarSemiStaticGraphQLType<string, 'String'>({
      typeFactory: this,
      name: 'String',
      semiGraphQLType: GraphQLString,
    }),

    float: new ScalarSemiStaticGraphQLType<number, 'Float'>({
      typeFactory: this,
      name: 'Float',
      semiGraphQLType: GraphQLFloat,
    }),

    // int: new ScalarSemiStaticGraphQLType({ // TODO: get back here and reimplement
    //   typeFactory: this,
    //   name: 'Int',
    //   semiGraphQLType: GraphQLInt,
    // }),

    boolean: new ScalarSemiStaticGraphQLType<boolean, 'Boolean'>({
      typeFactory: this,
      name: 'Boolean',
      semiGraphQLType: GraphQLBoolean,
    }),
  });

  enum = <D extends StringKeys, N extends string>(params: {
    name: N;
    description?: string;
    keys: D;
  }): EnumSemiStaticGraphQLType<N, D> => {
    const sb = new EnumSemiStaticGraphQLType({
      typeFactory: this,
      name: params.name,
      keys: params.keys,
    });
    this.registerSemiStaticGraphQLType(sb);
    return sb;
  };

  inputList = <SB extends AnyInputSemiStaticGraphQLType>(
    listOf: SB,
  ): InputListSemiStaticGraphQLType<SB> => {
    const sb = new InputListSemiStaticGraphQLType({
      typeFactory: this,
      name: `InputListOf<${listOf.name}>`,
      listOf: listOf,
    });
    this.registerSemiStaticGraphQLType(sb);
    return sb;
  };

  inputObject = <F extends InputFieldConfigMap, N extends string>(params: {
    name: N;
    fields: F;
  }): InputObjectSemiStaticGraphQLType<F, N> => {
    const sb = new InputObjectSemiStaticGraphQLType({
      typeFactory: this,
      name: params.name,
      fields: params.fields,
    });
    this.registerSemiStaticGraphQLType(sb);
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
  }): InterfaceSemiStaticGraphQLType<F, I, N> => {
    const sb = new InterfaceSemiStaticGraphQLType({
      typeFactory: this,
      name: params.name,
      fields: params.fields,
      implementors: params.implementors,
    });
    this.registerSemiStaticGraphQLType(sb);
    return sb;
  };

  outputList = <SB extends AnyOutputSemiStaticGraphQLType>(params: {
    listOf: SB;
  }): OutputListSemiStaticGraphQLType<SB> => {
    const sb = new OutputListSemiStaticGraphQLType({
      typeFactory: this,
      name: `OutputListOf<${params.listOf.name}>`,
      listOf: params.listOf,
    });
    this.registerSemiStaticGraphQLType(sb);
    return sb;
  };

  outputObject = <F extends OutputFieldMap, N extends string>(params: {
    name: N;
    fields: F;
  }): OutputObjectSemiStaticGraphQLType<F, N> => {
    const sb = new OutputObjectSemiStaticGraphQLType({
      typeFactory: this,
      name: params.name,
      fields: {},
    });
    this.registerSemiStaticGraphQLType(sb);
    // @ts-ignore // TODO: figure this out
    sb.fields = params.fields;
    return sb as any;
  };

  recursive = <F extends OutputFieldMap, N extends string>(params: {
    name: N;
    fields: F;
  }): OutputObjectSemiStaticGraphQLType<F, N> => {
    return this.semiStaticGraphQLTypes[params.name] as any;
  };
  // TODO: warn the user when they try to register the same query field.
  rootQuery = <F extends RootQueryOutputFieldMap>(params: {
    fields: F;
  }): void => {
    this.rootQueryFieldMaps.push(params.fields);
  };

  mutation = <F extends RootQueryOutputFieldMap>(params: {
    fields: F;
  }): void => {
    this.mutationFieldMaps.push(params.fields);
  };

  union = <
    SBS extends UnitableSemiStaticGraphQLTypes,
    N extends string
  >(params: {
    name: N;
    semiStaticGraphQLTypes: SBS;
  }): UnionSemiStaticGraphQLType<SBS, N> => {
    const sb = new UnionSemiStaticGraphQLType({
      typeFactory: this,
      name: params.name,
      semiStaticGraphQLTypes: params.semiStaticGraphQLTypes,
    });
    this.registerSemiStaticGraphQLType(sb);
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
    const Query = new OutputObjectSemiStaticGraphQLType({
      name: 'Query',
      typeFactory: this,
      fields: rootQueryFields,
    });
    const Mutation = new OutputObjectSemiStaticGraphQLType({
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
