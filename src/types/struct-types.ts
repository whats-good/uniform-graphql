import {
  AnyStaticGraphQLType,
  AnySemiStaticGraphQLType,
  SemiTypeOf,
  TypeOf,
} from '../StaticGraphQLType';
import { InterfaceSemiStaticGraphQLType } from './Interface';
import { OutputObjectSemiStaticGraphQLType } from './OutputObject';

export type ListTypeOf<SB extends AnySemiStaticGraphQLType> = Array<
  SemiTypeOf<SB>
>;

// TODO: can we do recursive output objects?

export interface StaticGraphQLTypeMap<B extends AnyStaticGraphQLType> {
  [key: string]: {
    brick: B;
  };
}

export interface ArgumentConfig {
  brick: AnyInputStaticGraphQLType;
  description?: string;
  deprecationReason?: string;
  // defaultValue?: any; // TODO: implement
}
export interface OutputFieldArgumentMap {
  [key: string]: ArgumentConfig;
}

export type OutputKind =
  | 'scalar'
  | 'enum'
  | 'union'
  | 'outputobject'
  | 'interface'
  | 'outputlist';

export type AnyOutputStaticGraphQLType = AnyStaticGraphQLType<OutputKind>;
export type AnyOutputSemiStaticGraphQLType = AnySemiStaticGraphQLType<
  OutputKind
>;

export type TMap<M extends StaticGraphQLTypeMap<any>> = {
  [K in keyof M]: TypeOf<M[K]['brick']>;
};

export type AnyOutputObjectSemiStaticGraphQLType = OutputObjectSemiStaticGraphQLType<
  any,
  any
>;

// We need this to guarantee uniqueness of registered interfaces
export interface InterfaceSemiStaticGraphQLTypeMap {
  [key: string]: InterfaceSemiStaticGraphQLType<any, any, any>;
}

export interface InputFieldConfig {
  brick: AnyInputStaticGraphQLType;
  description?: string;
  deprecationReason?: string;
  // defaultValue?: any; // TODO: implement
}

export interface InputFieldConfigMap
  extends StaticGraphQLTypeMap<AnyInputStaticGraphQLType> {
  [key: string]: InputFieldConfig;
}

export type InputKind = 'scalar' | 'enum' | 'inputlist' | 'inputobject';
export type AnyInputStaticGraphQLType = AnyStaticGraphQLType<InputKind>;
export type AnyInputSemiStaticGraphQLType = AnySemiStaticGraphQLType<InputKind>;
