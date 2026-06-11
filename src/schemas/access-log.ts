import z from "zod";
import zValue from ".";
import { SearchPageSchema } from "./page";

const visitorKindEnum = z.enum(["HUMAN", "CRAWLER", "PREVIEW", "UNKNOWN"]);

export const AccessLogListSchema = SearchPageSchema.extend({
  pathname: zValue(z.string().optional()),
  ip: zValue(z.string().optional()),
  visitorKind: zValue(visitorKindEnum.optional()),
  userId: zValue(z.string().optional()),
  from: zValue(z.string().optional()),
  to: zValue(z.string().optional()),
});
