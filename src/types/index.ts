import { Boolean, Float, ID, Int, String, scalar } from './ScalarType';
import { enu } from './EnumType';
import { inputList, list } from './ListType';
import { inputObject } from './input/InputObjectType';
import { object } from './output/ObjectType';
import { union } from './output/UnionType';
import { interfaceType } from './output/InterfaceType';

export { ScalarType } from './ScalarType';
export { EnumType } from './EnumType';
export { ListType, InputListType } from './ListType';
export { InputObjectType } from './input/InputObjectType';
export { ObjectType } from './output/ObjectType';
export { UnionType } from './output/UnionType';
export { InterfaceType } from './output/InterfaceType';

export const t = {
  boolean: Boolean,
  float: Float,
  id: ID,
  string: String,
  int: Int,
  scalar,
  enum: enu,
  list,
  inputList,
  inputObject,
  object,
  union,
  interface: interfaceType,
};
