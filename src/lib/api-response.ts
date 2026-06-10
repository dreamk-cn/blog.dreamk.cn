import { NextResponse } from "next/server";
import { ResponseCode, ResponseMessage } from "@/config/response-code";

/** 业务 JSON 响应统一 HTTP 200，成败由 body.code 表达（见 response-code.ts） */

export function ok<T>(data: T, message = ResponseMessage[ResponseCode.SUCCESS]) {
  return NextResponse.json({
    code: ResponseCode.SUCCESS,
    message,
    data,
  });
}

export function fail(code: number, message: string, data: unknown = null) {
  return NextResponse.json({
    code,
    message,
    data,
  });
}

export function zodFail(message = "参数错误") {
  return fail(ResponseCode.FAIL, message);
}

export function unauthorized(message = "请登录后再操作") {
  return fail(ResponseCode.UNAUTHORIZED, message);
}

export function forbidden(message = "您没有操作权限") {
  return fail(ResponseCode.FORBIDDEN, message);
}

export function tooManyRequests(
  message = ResponseMessage[ResponseCode.TOO_MANY_REQUESTS],
  retryAfterSec?: number,
) {
  const headers = new Headers();
  if (retryAfterSec != null && retryAfterSec > 0) {
    headers.set("Retry-After", String(Math.ceil(retryAfterSec)));
  }
  return NextResponse.json(
    {
      code: ResponseCode.TOO_MANY_REQUESTS,
      message,
      data: null,
    },
    { headers },
  );
}

export function internalError(message = "服务器内部错误") {
  return fail(ResponseCode.INTERNAL_SERVER_ERROR, message);
}
