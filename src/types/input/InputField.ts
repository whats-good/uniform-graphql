import { GraphQLInputFieldConfig } from 'graphql';
import { AnyTypeContainer } from '../../TypeContainer';
import { InputRealizedType } from '../core';
import { brandOf } from '../../utils';
import { InputFieldsMapValue, TypeInInputMapValue } from './InputFieldsMap';

export interface InputFieldConstructorParams<R extends InputRealizedType> {
  type: R;
  deprecationReason?: string;
  description?: string;
}

class InputField<R extends InputRealizedType> {
  public readonly type: R;
  public readonly deprecationReason?: string;
  public readonly description?: string;

  constructor(params: InputFieldConstructorParams<R>) {
    this.type = params.type;
    this.deprecationReason = params.deprecationReason;
    this.description = params.description;
  }

  getGraphQLInputFieldConfig(
    typeContainer: AnyTypeContainer,
  ): GraphQLInputFieldConfig {
    return {
      type: this.type.getGraphQLType(typeContainer) as any,
      deprecationReason: this.deprecationReason,
      description: this.description,
    };
  }
}

export const toInputField = <V extends InputFieldsMapValue<any>>(
  v: V,
): InputField<TypeInInputMapValue<V>> => {
  if (brandOf(v as any) == 'realizedtype') {
    return new InputField({ type: v as any });
  } else {
    return new InputField(v as any);
  }
};
