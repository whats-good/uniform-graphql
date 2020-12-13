import {
  GraphQLFieldConfigMap,
  GraphQLInterfaceType,
  GraphQLObjectType,
} from 'graphql';
import _ from 'lodash';
import { SemiStaticGraphQLType } from '../StaticGraphQLType';
import { OutputFieldMap } from '../OutputField';
import { TypeFactory } from '../SemiStaticGraphQLTypeFactory';
import { InterfaceSemiStaticGraphQLType } from './Interface';
import { InterfaceSemiStaticGraphQLTypeMap, TMap } from './struct-types';

type ImplementorKind = 'interface' | 'outputobject';

// TODO: introduce context later
interface ImplementorGraphQLConfig {
  name: string;
  description?: string;
  interfaces?: Array<GraphQLInterfaceType>;
  fields: () => GraphQLFieldConfigMap<any, any>;
}

export type AnyImplementorSemiStaticGraphQLTypeOf<
  F extends OutputFieldMap
> = ImplementorSemiStaticGraphQLType<any, any, any, F>;

type ExtendsFieldConfigMap<F extends OutputFieldMap> = {
  [K in keyof F]: F[K];
};

type Implements<
  F extends OutputFieldMap
> = AnyImplementorSemiStaticGraphQLTypeOf<ExtendsFieldConfigMap<F>>;

// TODO: find a way to make sure the sbs implement the interface
export type Implementors<F extends OutputFieldMap> = Implements<F>[];
export abstract class ImplementorSemiStaticGraphQLType<
  K extends ImplementorKind,
  N extends string,
  SB_G extends GraphQLInterfaceType | GraphQLObjectType,
  F extends OutputFieldMap,
  SB_R = TMap<F>
> extends SemiStaticGraphQLType<K, N, SB_G, TMap<F>, SB_R> {
  public readonly fields: F;
  private readonly shallowInterfaces: InterfaceSemiStaticGraphQLTypeMap = {};

  constructor(params: { name: N; fields: F; typeFactory: TypeFactory }) {
    super(params);
    this.fields = params.fields;
  }

  // TODO: how can i make sure that this interface actually implements the given interface?
  // TODO: how can i guarantee that this interfacae is already inside the "implementors" map of the interface?
  // TODO: i need to flatten the entire tree of interfaces that this interface itself may be extending, and register all of them here.

  public implements = <I extends OutputFieldMap>(
    sb: InterfaceSemiStaticGraphQLType<I, any, any>,
  ): void => {
    this.shallowInterfaces[sb.name] = sb;
  };

  public getFlattenedInterfaces = (): InterfaceSemiStaticGraphQLTypeMap => {
    const interfacesMap: InterfaceSemiStaticGraphQLTypeMap = {};
    Object.entries(this.shallowInterfaces).forEach(([key, value]) => {
      const curFlattenedInterfaces = value.getFlattenedInterfaces();
      Object.entries(curFlattenedInterfaces).forEach(
        ([innerKey, innerValue]) => {
          interfacesMap[innerKey] = innerValue;
        },
      );
      interfacesMap[key] = value;
    });
    return interfacesMap;
  };

  protected getGraphQLTypeConstructor = (): ImplementorGraphQLConfig => {
    return {
      name: this.name,
      interfaces: Object.values(this.getFlattenedInterfaces()).map((sb) =>
        sb.getSemiGraphQLType(),
      ),
      fields: () =>
        _.mapValues(this.fields, (field) => field.getGraphQLTypeConstructor()),
    };
  };
}
