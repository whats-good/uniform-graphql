import {
  GraphQLBoolean,
  GraphQLFloat,
  GraphQLID,
  GraphQLList,
  GraphQLNamedType,
  GraphQLString,
  GraphQLType,
} from 'graphql';
import { AnySemiBrick, SemiGraphQLTypeOf } from './Brick';
import { EnumSemiBrick, StringKeys } from './semi-bricks/Enum';
import { Implementors } from './semi-bricks/Implementor';
import { InputListSemiBrick } from './semi-bricks/InputList';
import { InputObjectSemiBrick } from './semi-bricks/InputObject';
import { InterfaceSemiBrick } from './semi-bricks/Interface';
import { OutputListSemiBrick } from './semi-bricks/OutputList';
import { OutputObjectSemiBrick } from './semi-bricks/OutputObject';
import { ScalarSemiBrick } from './semi-bricks/Scalar';
import {
  AnyOutputSemiBrick,
  AnyInputSemiBrick,
  InputFieldConfigMap,
} from './semi-bricks/struct-types';
import { UnionSemiBrick, UnitableSemiBricks } from './semi-bricks/Union';
import { OutputFieldMap, RootQueryOutputFieldMap } from './OutputField';

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
    id: new ScalarSemiBrick<string | number, 'ID'>({
      semiBrickFactory: this,
      name: 'ID',
      semiGraphQLType: GraphQLID,
    }),

    // TODO: see if you can avoid typing the Name param twice
    string: new ScalarSemiBrick<string, 'String'>({
      semiBrickFactory: this,
      name: 'String',
      semiGraphQLType: GraphQLString,
    }),

    float: new ScalarSemiBrick<number, 'Float'>({
      semiBrickFactory: this,
      name: 'Float',
      semiGraphQLType: GraphQLFloat,
    }),

    // int: new ScalarSemiBrick({ // TODO: get back here and reimplement
    //   semiBrickFactory: this,
    //   name: 'Int',
    //   semiGraphQLType: GraphQLInt,
    // }),

    boolean: new ScalarSemiBrick<boolean, 'Boolean'>({
      semiBrickFactory: this,
      name: 'Boolean',
      semiGraphQLType: GraphQLBoolean,
    }),
  });

  enum = <D extends StringKeys, N extends string>(params: {
    name: N;
    description?: string;
    keys: D;
  }): EnumSemiBrick<N, D> => {
    const sb = new EnumSemiBrick({
      semiBrickFactory: this,
      name: params.name,
      keys: params.keys,
    });
    this.registerSemiBrick(sb);
    return sb;
  };

  inputList = <SB extends AnyInputSemiBrick>(
    listOf: SB,
  ): InputListSemiBrick<SB> => {
    const sb = new InputListSemiBrick({
      semiBrickFactory: this,
      name: `InputListOf<${listOf.name}>`,
      listOf: listOf,
    });
    this.registerSemiBrick(sb);
    return sb;
  };

  inputObject = <F extends InputFieldConfigMap, N extends string>(params: {
    name: N;
    fields: F;
  }): InputObjectSemiBrick<F, N> => {
    const sb = new InputObjectSemiBrick({
      semiBrickFactory: this,
      name: params.name,
      fields: params.fields,
    });
    this.registerSemiBrick(sb);
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
  }): InterfaceSemiBrick<F, I, N> => {
    const sb = new InterfaceSemiBrick({
      semiBrickFactory: this,
      name: params.name,
      fields: params.fields,
      implementors: params.implementors,
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
    });
    this.registerSemiBrick(sb);
    return sb;
  };

  outputObject = <F extends OutputFieldMap, N extends string>(params: {
    name: N;
    fields: F;
  }): OutputObjectSemiBrick<F, N> => {
    const sb = new OutputObjectSemiBrick({
      semiBrickFactory: this,
      name: params.name,
      fields: params.fields,
    });
    this.registerSemiBrick(sb);
    return sb;
  };

  rootQuery = <F extends RootQueryOutputFieldMap, N extends string>(params: {
    name: N;
    fields: F;
  }): OutputObjectSemiBrick<F, N> => {
    const sb = new OutputObjectSemiBrick({
      semiBrickFactory: this,
      name: params.name,
      fields: params.fields,
    });
    this.registerSemiBrick(sb);
    return sb;
  };

  union = <SBS extends UnitableSemiBricks, N extends string>(params: {
    name: N;
    semiBricks: SBS;
  }): UnionSemiBrick<SBS, N> => {
    const sb = new UnionSemiBrick({
      semiBrickFactory: this,
      name: params.name,
      semiBricks: params.semiBricks,
    });
    this.registerSemiBrick(sb);
    return sb;
  };
}
