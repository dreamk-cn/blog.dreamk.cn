import { z } from 'zod';

export default function zValue<T extends z.ZodTypeAny>(_z: T): z.ZodType<
  z.infer<T>,
  T['_def']
> {
  return z.preprocess(v => v ? v : undefined, _z)
}