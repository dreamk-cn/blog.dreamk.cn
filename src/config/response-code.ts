export const enum ResponseCode {
  SUCCESS = 200,
  FAIL = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  CONFLICT = 409,
  TOO_MANY_REQUESTS = 429,
  INTERNAL_SERVER_ERROR = 500,
}

export const ResponseMessage = {
  [ResponseCode.SUCCESS]: "成功",
  [ResponseCode.FAIL]: "失败",
  [ResponseCode.UNAUTHORIZED]: "未登录",
  [ResponseCode.FORBIDDEN]: "无权限",
  [ResponseCode.NOT_FOUND]: "资源不存在",
  [ResponseCode.CONFLICT]: "数据冲突",
  [ResponseCode.TOO_MANY_REQUESTS]: "请求过于频繁",
  [ResponseCode.INTERNAL_SERVER_ERROR]: "服务器内部错误",
};
