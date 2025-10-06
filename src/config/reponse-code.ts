export const enum ResponseCode {
  SUCCESS = 200, // 通用成功
  FAIL = 400, // 通用失败
  UNAUTHORIZED = 401, // 未登录
  FORBIDDEN = 403, // 无权限
  NOT_FOUND = 404, // 资源不存在
  INTERNAL_SERVER_ERROR = 500 // 服务器内部错误
}

export const ResponseMessage = {
  [ResponseCode.SUCCESS]: '成功',
  [ResponseCode.FAIL]: '失败',
  [ResponseCode.UNAUTHORIZED]: '未登录',
  [ResponseCode.FORBIDDEN]: '无权限',
  [ResponseCode.NOT_FOUND]: '资源不存在',
  [ResponseCode.INTERNAL_SERVER_ERROR]: '服务器内部错误'
}

export const ResponseMap = {
  [ResponseCode.SUCCESS]: {
    code: ResponseCode.SUCCESS,
    message: ResponseMessage[ResponseCode.SUCCESS]
  },
  [ResponseCode.FAIL]: {
    code: ResponseCode.FAIL,
    message: ResponseMessage[ResponseCode.FAIL]
  },
  [ResponseCode.UNAUTHORIZED]: {
    code: ResponseCode.UNAUTHORIZED,
    message: ResponseMessage[ResponseCode.UNAUTHORIZED]
  },
  [ResponseCode.FORBIDDEN]: {
    code: ResponseCode.FORBIDDEN,
    message: ResponseMessage[ResponseCode.FORBIDDEN]
  },
  [ResponseCode.NOT_FOUND]: {
    code: ResponseCode.NOT_FOUND,
    message: ResponseMessage[ResponseCode.NOT_FOUND]
  },
  [ResponseCode.INTERNAL_SERVER_ERROR]: {
    code: ResponseCode.INTERNAL_SERVER_ERROR,
    message: ResponseMessage[ResponseCode.INTERNAL_SERVER_ERROR]
  }
}