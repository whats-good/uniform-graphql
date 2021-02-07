import { GraphQLFieldConfigMap } from 'graphql';
import { mapValues } from 'lodash';
import { AnyTypeContainer } from '../../TypeContainer';
import { StringKeys, Thunkable, unthunk, Unthunked } from '../../utils';
import { ExternalTypeOf, OutputRealizedType } from '../core';
import { ArgsMap } from '../input/ArgsMap';
import { TypeInInputMapValue } from '../input/InputFieldsMap';
import { OutputFieldConstructorParams, toOutputField } from './OutputField';

export type OutputFieldsMapValue<
  R extends OutputRealizedType,
  M extends ArgsMap
> = R | OutputFieldConstructorParams<R, M>;

export type TypeInOutputMapValue<
  V extends OutputFieldsMapValue<OutputRealizedType, ArgsMap>
> = V extends OutputRealizedType
  ? V
  : V extends OutputFieldConstructorParams<OutputRealizedType, ArgsMap>
  ? V['type']
  : never;

export type ArgsMapInOutputMapValue<
  V extends OutputFieldsMapValue<OutputRealizedType, ArgsMap>
> = V extends ArgsMap
  ? V
  : V extends OutputFieldConstructorParams<OutputRealizedType, ArgsMap>
  ? V['args']
  : never;

type OutputFieldConstructorParamsInOutputMapValue<
  V extends OutputFieldsMapValue<OutputRealizedType, ArgsMap>
> = OutputFieldConstructorParams<
  TypeInOutputMapValue<V>,
  ArgsMapInOutputMapValue<V>
>;

export type OutputFieldsMap = StringKeys<
  Thunkable<OutputFieldsMapValue<OutputRealizedType, ArgsMap>>
>;

export const toGraphQLFieldConfigMap = (params: {
  fields: OutputFieldsMap;
  typeContainer: AnyTypeContainer;
  objectName?: string;
}): GraphQLFieldConfigMap<any, any> => {
  return mapValues(params.fields, (protoField, fieldName) => {
    const unthunkedProtoField = unthunk(protoField);
    const field = toOutputField(unthunkedProtoField);
    return field.getGraphQLFieldConfig({
      fieldName,
      typeContainer: params.typeContainer,
      objectName: params.objectName,
    });
  });
};

export type ObfuscatedOutputFieldsMap<M extends OutputFieldsMap> = {
  [K in keyof M]:
    | M[K]
    | Thunkable<
        | TypeInOutputMapValue<Unthunked<M[K]>>
        | OutputFieldConstructorParamsInOutputMapValue<Unthunked<M[K]>>
      >;
};

export type TypeOfOutputFieldsMap<M extends OutputFieldsMap> = {
  [K in keyof M]: ExternalTypeOf<TypeInOutputMapValue<Unthunked<M[K]>>>;
};

type TypeOfArgsMap<A extends ArgsMap> = {
  [K in keyof A]: ExternalTypeOf<TypeInInputMapValue<A[K]>>;
};
