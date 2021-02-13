import { StringKeys } from '../../utils';
import { InputRealizedType, ExternalTypeOf } from '../core';
import { InputFieldsMapValue, TypeInInputMapValue } from './InputFieldsMap';

export type ArgsMap = StringKeys<InputFieldsMapValue<InputRealizedType>>;

export type TypeOfArgsMap<A extends ArgsMap> = {
  [K in keyof A]: ExternalTypeOf<TypeInInputMapValue<A[K]>>;
};
