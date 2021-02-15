import { GraphQLFieldConfig } from 'graphql';
import { AnySchemaBuilder } from '../../SchemaBuilder';
import { OutputRealizedType } from '../core';
import { toInputField } from '../input/InputField';
import { ArgsMap } from '../input/ArgsMap';
import {
  ArgsMapInOutputMapValue,
  OutputFieldsMapValue,
  TypeInOutputMapValue,
} from './OutputFieldsMap';
import { brandOf, mapValues } from '../../utils';

export interface OutputFieldConstructorParams<
  R extends OutputRealizedType,
  M extends ArgsMap
> {
  type: R;
  args: M;
  deprecationReason?: string;
  description?: string;
}

export class OutputField<R extends OutputRealizedType, M extends ArgsMap> {
  public readonly type: R;
  public readonly args: M;
  public readonly deprecationReason?: string;
  public readonly description?: string;

  constructor(params: OutputFieldConstructorParams<R, M>) {
    this.type = params.type;
    this.args = params.args;
    this.deprecationReason = params.deprecationReason;
    this.description = params.description;
  }

  getGraphQLFieldConfig(params: {
    schemaBuilder: AnySchemaBuilder;
    objectName?: string;
    fieldName: string;
  }): GraphQLFieldConfig<any, any, any> {
    return {
      type: this.type.getGraphQLType(params.schemaBuilder) as any,
      args: mapValues(this.args, (arg) => {
        const inputField = toInputField(arg);
        return inputField.getGraphQLInputFieldConfig(params.schemaBuilder);
      }),
      deprecationReason: this.deprecationReason,
      description: this.description,
      resolve: params.objectName
        ? (params.schemaBuilder.getFieldResolver(
            params.objectName,
            params.fieldName,
          ) as any)
        : undefined,
    };
  }
}

export const toOutputField = <
  V extends OutputFieldsMapValue<OutputRealizedType, ArgsMap>
>(
  v: V,
): OutputField<TypeInOutputMapValue<V>, ArgsMapInOutputMapValue<V>> => {
  if (brandOf(v as any) == 'realizedtype') {
    return new OutputField({ type: v as any, args: {} as any });
  } else {
    return new OutputField(v as any);
  }
};
