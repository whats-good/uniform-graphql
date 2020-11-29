import { AnySemiBrick, SemiTypeOf } from '../Brick';

export type ListTypeOf<SB extends AnySemiBrick> = Array<SemiTypeOf<SB>>;
