import {
  GraphQLFieldConfigMap,
  GraphQLInterfaceType,
  GraphQLObjectType,
} from 'graphql';
import _ from 'lodash';
import { SemiType } from '../Type';
import { OutputFieldMap } from '../OutputField';
import { TypeFactory } from '../TypeFactory';
import { InterfaceSemiType } from './Interface';
import { InterfaceSemiTypeMap, TMap } from './struct-types';

type ImplementorKind = 'interface' | 'outputobject';

// TODO: introduce context later
interface ImplementorGraphQLConfig {
  name: string;
  description?: string;
  interfaces?: Array<GraphQLInterfaceType>;
  fields: () => GraphQLFieldConfigMap<any, any>;
}

export type AnyImplementorSemiTypeOf<
  F extends OutputFieldMap
> = ImplementorSemiType<any, any, any, F>;

type ExtendsFieldConfigMap<F extends OutputFieldMap> = {
  [K in keyof F]: F[K];
};

type Implements<F extends OutputFieldMap> = AnyImplementorSemiTypeOf<
  ExtendsFieldConfigMap<F>
>;

// TODO: find a way to make sure the sbs implement the interface
export type Implementors<F extends OutputFieldMap> = Implements<F>[];
export abstract class ImplementorSemiType<
  K extends ImplementorKind,
  N extends string,
  SB_G extends GraphQLInterfaceType | GraphQLObjectType,
  F extends OutputFieldMap,
  SB_R = TMap<F>
> extends SemiType<K, N, SB_G, TMap<F>, SB_R> {
  public readonly fields: F;
  private readonly shallowInterfaces: InterfaceSemiTypeMap = {};

  constructor(params: { name: N; fields: F; typeFactory: TypeFactory }) {
    super(params);
    this.fields = params.fields;
  }

  // TODO: how can i make sure that this interface actually implements the given interface?
  // TODO: how can i guarantee that this interfacae is already inside the "implementors" map of the interface?
  // TODO: i need to flatten the entire tree of interfaces that this interface itself may be extending, and register all of them here.

  public implements = <I extends OutputFieldMap>(
    sb: InterfaceSemiType<I, any, any>,
  ): void => {
    this.shallowInterfaces[sb.name] = sb;
  };

  public getFlattenedInterfaces = (): InterfaceSemiTypeMap => {
    const interfacesMap: InterfaceSemiTypeMap = {};
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
