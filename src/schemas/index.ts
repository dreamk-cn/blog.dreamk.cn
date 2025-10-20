import { z } from 'zod';

// 自定义zod解析器，处理undefined值
export default function zValue<T extends z.ZodTypeAny>(_z: T): z.ZodType<
  z.infer<T>,
  T['_def']
> {
  return z.preprocess(v => v ? v : undefined, _z)
}