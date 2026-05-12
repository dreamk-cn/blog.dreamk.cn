import { NextResponse } from "next/server";
import { ResponseCode, ResponseMessage } from "@/config/response-code";

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

export function internalError(message = "服务器内部错误") {
  return fail(ResponseCode.INTERNAL_SERVER_ERROR, message);
}
