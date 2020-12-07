import {
  GraphQLFieldConfigMap,
  GraphQLInterfaceType,
  GraphQLObjectType,
} from 'graphql';
import _ from 'lodash';
import { SemiBrick } from '../Brick';
import { SemiBrickFactory } from '../SemiBrickFactory';
import { InterfaceSemiBrick } from './Interface';
import {
  InterfaceSemiBrickMap,
  OutputFieldConfigMap,
  TMap,
} from './struct-types';

type ImplementorKind = 'interface' | 'outputobject';

// TODO: introduce context later
interface ImplementorGraphQLConfig {
  name: string;
  description?: string;
  interfaces?: Array<GraphQLInterfaceType>;
  fields: GraphQLFieldConfigMap<any, any>;
}

export type AnyImplementorSemiBrickOf<
  F extends OutputFieldConfigMap
> = ImplementorSemiBrick<any, any, any, F>;

type ExtendsFieldConfigMap<F extends OutputFieldConfigMap> = {
  [K in keyof F]: F[K];
};

type Implements<F extends OutputFieldConfigMap> = AnyImplementorSemiBrickOf<
  ExtendsFieldConfigMap<F>
>;

// TODO: find a way to make sure the sbs implement the interface
export type Implementors<F extends OutputFieldConfigMap> = Implements<F>[];
export abstract class ImplementorSemiBrick<
  K extends ImplementorKind,
  N extends string,
  SB_G extends GraphQLInterfaceType | GraphQLObjectType,
  F extends OutputFieldConfigMap,
  SB_R = TMap<F>
> extends SemiBrick<K, N, SB_G, TMap<F>, SB_R> {
  public readonly fields: F;
  private readonly shallowInterfaces: InterfaceSemiBrickMap = {};

  constructor(params: {
    name: N;
    fields: F;
    semiBrickFactory: SemiBrickFactory;
  }) {
    super(params);
    this.fields = params.fields;
  }

  // TODO: how can i make sure that this interface actually implements the given interface?
  // TODO: how can i guarantee that this interfacae is already inside the "implementors" map of the interface?
  // TODO: i need to flatten the entire tree of interfaces that this interface itself may be extending, and register all of them here.

  public implements = <I extends OutputFieldConfigMap>(
    sb: InterfaceSemiBrick<I, any, any>,
  ): void => {
    this.shallowInterfaces[sb.name] = sb;
  };

  public getFlattenedInterfaces = (): InterfaceSemiBrickMap => {
    const interfacesMap: InterfaceSemiBrickMap = {};
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
      fields: _.mapValues(this.fields, (field) =>
        field.getGraphQLTypeConstructor(),
      ),
    };
  };
}
