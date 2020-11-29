import { AnyBrick, AnySemiBrick, SemiTypeOf, TypeOf } from '../Brick';
import { InterfaceSemiBrick } from './Interface';
import { OutputObjectSemiBrick } from './OutputObject';

export type ListTypeOf<SB extends AnySemiBrick> = Array<SemiTypeOf<SB>>;

// TODO: can we do recursive output objects?

export interface BrickMap<B extends AnyBrick> {
  [key: string]: {
    brick: B;
  };
}

type ExtendsFieldConfigMap<F extends OutputFieldConfigMap> = {
  [K in keyof F]: F[K];
};

type Implements<F extends OutputFieldConfigMap> = InterfaceSemiBrick<
  ExtendsFieldConfigMap<F>
>;

// TODO: find a way to make sure the sbs implement the interface
export interface Implementors<F extends OutputFieldConfigMap> {
  [key: string]: Implements<F>;
}

export interface ArgumentConfig {
  brick: AnyInputBrick;
  description?: string;
  deprecationReason?: string;
  // defaultValue?: any; // TODO: implement
}
export interface OutputFieldConfigArgumentMap extends BrickMap<AnyInputBrick> {
  [key: string]: ArgumentConfig;
}

export type OutputKind =
  | 'scalar'
  | 'enum'
  | 'union'
  | 'outputobject'
  | 'interface'
  | 'outputlist';

export type AnyOutputBrick = AnyBrick<OutputKind>;
export type AnyOutputSemiBrick = AnySemiBrick<OutputKind>;

// TODO: add context stuff later
export interface OutputFieldConfig<
  B extends AnyOutputBrick,
  A extends OutputFieldConfigArgumentMap
> {
  readonly brick: B;
  readonly args: A;
  readonly description?: string;
  readonly deprecationReason?: string;
  resolve?: unknown;
  // TODO: consider refining this
}

export interface OutputFieldConfigMap extends BrickMap<AnyOutputBrick> {
  [key: string]: OutputFieldConfig<
    AnyOutputBrick,
    OutputFieldConfigArgumentMap
  >;
}

export type TMap<M extends BrickMap<any>> = {
  [K in keyof M]: TypeOf<M[K]['brick']>;
};

export type AnyOutputObjectSemiBrick = OutputObjectSemiBrick<any>;

// We need this to guarantee uniqueness of registered interfaces
export interface InterfaceSemiBrickMap {
  [key: string]: InterfaceSemiBrick<any>;
}

export interface InputFieldConfig {
  brick: AnyInputBrick;
  description?: string;
  deprecationReason?: string;
  // defaultValue?: any; // TODO: implement
}

export interface InputFieldConfigMap extends BrickMap<AnyInputBrick> {
  [key: string]: InputFieldConfig;
}

export type InputKind = 'scalar' | 'enum' | 'inputlist' | 'inputobject';
export type AnyInputBrick = AnyBrick<InputKind>;
export type AnyInputSemiBrick = AnySemiBrick<InputKind>;
