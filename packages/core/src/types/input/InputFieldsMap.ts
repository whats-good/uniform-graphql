import { Thunkable, Unthunked, StringKeys } from '../../utils';
import { InputRealizedType, ExternalTypeOf } from '../core';
import { InputFieldConstructorParams } from './InputField';

export type InputFieldsMapValue<R extends InputRealizedType> =
  | R
  | InputFieldConstructorParams<R>;

export type TypeInInputMapValue<
  V extends InputFieldsMapValue<any>
> = V extends InputRealizedType
  ? V
  : V extends InputFieldConstructorParams<any>
  ? V['type']
  : never;

type InputFieldConstructorParamsInInputMapValue<
  V extends InputFieldsMapValue<InputRealizedType>
> = InputFieldConstructorParams<TypeInInputMapValue<V>>;

export type InputFieldsMap = StringKeys<
  Thunkable<InputFieldsMapValue<InputRealizedType>>
>;

export type ObfuscatedInputFieldsMap<M extends InputFieldsMap> = {
  [K in keyof M]:
    | M[K]
    | Thunkable<
        | TypeInInputMapValue<Unthunked<M[K]>>
        | InputFieldConstructorParamsInInputMapValue<Unthunked<M[K]>>
      >;
};

export type TypeOfInputFieldsMap<M extends InputFieldsMap> = {
  [K in keyof M]: ExternalTypeOf<TypeInInputMapValue<Unthunked<M[K]>>>;
};
