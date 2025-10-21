/** api响应格式 */
export interface ApiResponse<T> {
  code: number
  message: string
  data: T
}

export interface ApiErrorResponse {
  code: number,
  error: string
}

/** 常规查询请求参数 */
export interface QueryPage {
  pageNo?: string | number | undefined,
  pageSize?: string | number | undefined,
  keyword?: string | undefined,
  sortBy?: string | undefined,
  sortOrder?: string | undefined
}

/** api相应的list格式 */
export interface PageInfo<T> {
  pageNo: number,
  pageSize: number,
  total: number
  totalPages: number
  list: T
  sortBy: string
  sortOrder: string
}

export type ResponsePage<Model> = ApiResponse<PageInfo<Model[]>>