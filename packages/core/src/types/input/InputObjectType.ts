import { GraphQLInputObjectType } from 'graphql';
import { AnyTypeContainer } from '../../TypeContainer';
import { InternalType, RealizedType } from '../core';
import { mapValues, unthunk } from '../../utils';
import { toInputField } from './InputField';
import {
  InputFieldsMap,
  ObfuscatedInputFieldsMap,
  TypeOfInputFieldsMap,
} from './InputFieldsMap';

export interface InputObjectInternalTypeConstructorParams<
  N extends string,
  M extends InputFieldsMap
> {
  name: N;
  fields: M;
  description?: string;
}

export class InputObjectInternalType<
  N extends string,
  M extends InputFieldsMap
> extends InternalType<N, TypeOfInputFieldsMap<M>> {
  public readonly fields: M;
  public readonly description?: string;

  constructor(params: InputObjectInternalTypeConstructorParams<N, M>) {
    super(params);
    this.fields = params.fields;
    this.description = params.description;
  }

  protected getFreshInternalGraphQLType(
    typeContainer: AnyTypeContainer,
  ): GraphQLInputObjectType {
    return new GraphQLInputObjectType({
      name: this.name,
      description: this.description,
      fields: () =>
        mapValues(this.fields, (protoField) => {
          const unthunkedProtoField = unthunk(protoField);
          const inputField = toInputField(unthunkedProtoField);
          return inputField.getGraphQLInputFieldConfig(typeContainer);
        }),
    });
  }
}

export type InputObjectType<
  N extends string,
  M extends InputFieldsMap,
  NULLABLE extends boolean = false
> = RealizedType<
  InputObjectInternalType<N, ObfuscatedInputFieldsMap<M>>,
  NULLABLE
>;

export const inputObject = <N extends string, M extends InputFieldsMap>(
  params: InputObjectInternalTypeConstructorParams<N, M>,
): InputObjectType<N, M> => {
  const internalType: InputObjectInternalType<
    N,
    ObfuscatedInputFieldsMap<M>
  > = new InputObjectInternalType(params);
  return new RealizedType({
    internalType,
    isNullable: false,
  });
};
