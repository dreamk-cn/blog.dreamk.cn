import { SVGProps } from "react";

// 导出 @prisma/client 相关的所有类型
export type * from '@prisma/client'

export type IconSvgProps = SVGProps<SVGSVGElement> & {
  size?: number;
};
