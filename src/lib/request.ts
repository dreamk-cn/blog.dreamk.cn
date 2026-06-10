import { isDev } from '@/utils/env';
import { toast } from '@heroui/react';
import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { signOut } from 'next-auth/react';
import { ResponseCode } from '@/config/response-code';
import { ApiResponse } from '@/types/request';
import { isClient } from '@/utils';
import { getSiteOrigin } from '@/lib/site-url';

let unauthorizedRedirecting = false;

// 基础URL配置
const BASE_URL = getSiteOrigin();

// 请求配置接口
export interface RequestConfig extends AxiosRequestConfig {
  // 是否显示错误提示
  showErrorMessage?: boolean;
  // 是否显示成功提示
  showSuccessMessage?: boolean;
  // 自定义错误处理
  customErrorHandler?: (error: HttpError) => void;
}

// HTTP错误接口
export interface HttpError {
  code: number;
  message: string;
  data?: unknown;
}

/**
 * HTTP请求客户端
 */
class HttpClient {
  // axios实例
  private instance: AxiosInstance;
  
  // 默认配置
  private defaultConfig: RequestConfig = {
    timeout: 10000,
    headers: {
      'Content-Type': 'application/json',
    },
    showErrorMessage: true,
  };

  /**
   * 构造函数
   * @param config 配置
   */
  constructor(config: RequestConfig = {}) {
    // 创建axios实例
    this.instance = axios.create({
      baseURL: `${BASE_URL}/api`,
      ...this.defaultConfig,
      ...config,
    });

    // 初始化拦截器
    this.setupInterceptors();
  }

  /**
   * 设置拦截器
   */
  private setupInterceptors(): void {
    // 请求拦截器
    this.instance.interceptors.request.use(
      (config) => {
        // FormData 须由浏览器自动设置 multipart/form-data 及 boundary
        if (typeof FormData !== 'undefined' && config.data instanceof FormData) {
          config.headers.setContentType(false);
        }

        // 添加时间戳
        config.headers['X-Request-Time'] = new Date().toISOString();
        
        // 开发环境日志
        if (isDev) {
          console.log(`🚀 请求: ${config.method?.toUpperCase()} ${config.url}`, {
            params: config.params,
            data: config.data,
          });
        }
        
        return config;
      },
      (error) => {
        return Promise.reject(this.normalizeError(error));
      }
    );

    // 响应拦截器
    this.instance.interceptors.response.use(
      (response) => {
        const { data } = response;
        
        // 开发环境日志
        if (isDev) {
          console.log(`✅ 响应: ${response.config.url}`, data);
        }
        
        // 处理业务状态码
        if (data.code !== ResponseCode.SUCCESS) {
          // 处理特定业务状态码
          switch (data.code) {
            case ResponseCode.UNAUTHORIZED:
              this.handleUnauthorized();
              break;
          }
          
          // 抛出业务错误
          return Promise.reject(this.normalizeError({
            code: data.code,
            message: data.message || '请求失败',
            data: data.data,
          }));
        }
        
        // 返回成功响应
        return data;
      },
      (error) => {
        return Promise.reject(this.normalizeError(error));
      }
    );
  }

  /**
   * 标准化错误
   * @param error 错误对象
   * @returns 标准化的HTTP错误
   */
  private normalizeError(error: unknown): HttpError {
    // 已经是标准化错误
    if (typeof error === 'object' && error !== null && 'code' in error && 'message' in error) {
      return error as HttpError;
    }
    
    // Axios错误
    if (axios.isAxiosError(error)) {
      // 响应错误
      if (error.response) {
        const status = error.response.status;
        let message = '请求失败';
        
        // 处理常见HTTP状态码
        switch (status) {
          case 400:
            message = '请求参数错误';
            break;
          case 401:
            message = '未授权，请重新登录';
            this.handleUnauthorized();
            break;
          case 403:
            message = '无权限访问';
            break;
          case 404:
            message = '请求的资源不存在';
            break;
          case 500:
            message = '服务器内部错误';
            break;
          default:
            message = `请求失败: ${status}`;
        }
        
        return {
          code: status,
          message,
          data: error.response.data,
        };
      }
      
      // 请求错误
      if (error.request) {
        return {
          code: 0,
          message: '网络连接失败，请检查网络',
        };
      }
    }
    
    // 其他错误
    return {
      code: 500,
      message: error instanceof Error ? error.message : '未知错误',
    };
  }

  /**
   * 处理未授权：提示后登出并跳转登录页（带 callbackUrl）
   */
  private handleUnauthorized(): void {
    if (!isClient() || unauthorizedRedirecting) {
      return;
    }

    const { pathname, search } = window.location;
    if (pathname.startsWith('/auth/signin') || pathname.startsWith('/auth/signout')) {
      return;
    }

    unauthorizedRedirecting = true;
    toast.danger('未授权', { description: '请重新登录' });

    const returnTo = `${pathname}${search}`;
    const signInUrl = `/auth/signin?callbackUrl=${encodeURIComponent(returnTo)}`;

    void signOut({ redirect: false }).finally(() => {
      window.location.href = signInUrl;
    });
  }

  /**
   * 处理错误
   * @param error 错误对象
   * @param config 请求配置
   */
  private handleError(error: HttpError, config?: RequestConfig): void {
    // 自定义错误处理
    if (config?.customErrorHandler) {
      config.customErrorHandler(error);
      return;
    }
    
    // 401 已在 handleUnauthorized 中提示并跳转
    if (error.code === ResponseCode.UNAUTHORIZED) {
      return;
    }

    // 显示错误提示
    if (config?.showErrorMessage !== false) {
      if (isClient()) {
        toast.danger('请求错误', { description: error.message });
      }
    }
    
    // 开发环境日志
    if (isDev) {
      console.error('❌ 请求错误:', error);
    }
  }

  /**
   * 发送请求
   * @param config 请求配置
   * @returns Promise
   */
  async request<T>(config: RequestConfig): Promise<ApiResponse<T>> {
    try {
      const response = await this.instance.request(config);
      
      return response as unknown as ApiResponse<T>;
    } catch (err) {
      const error = this.normalizeError(err);
      
      // 处理错误
      this.handleError(error, config);
      throw error;
    }
  }

  /**
   * GET请求
   * @param url 请求地址
   * @param params 请求参数
   * @param config 请求配置
   * @returns Promise
   */
  async get<T>(url: string, params?: Record<string, unknown>, config?: RequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>({
      method: 'GET',
      url,
      params,
      ...config,
    });
  }

  /**
   * POST请求
   * @param url 请求地址
   * @param data 请求数据
   * @param config 请求配置
   * @returns Promise
   */
  async post<T>(url: string, data?: Record<string, unknown>, config?: RequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>({
      method: 'POST',
      url,
      data,
      ...config,
    });
  }

  /**
   * PUT请求
   * @param url 请求地址
   * @param data 请求数据
   * @param config 请求配置
   * @returns Promise
   */
  async put<T>(url: string, data?: Record<string, unknown>, config?: RequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>({
      method: 'PUT',
      url,
      data,
      ...config,
    });
  }

  /**
   * DELETE请求
   * @param url 请求地址
   * @param params 请求参数
   * @param config 请求配置
   * @returns Promise
   */
  async delete<T>(url: string, params?: Record<string, unknown>, config?: RequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>({
      method: 'DELETE',
      url,
      params,
      ...config,
    });
  }

  /**
   * PATCH请求
   * @param url 请求地址
   * @param data 请求数据
   * @param config 请求配置
   * @returns Promise
   */
  async patch<T>(url: string, data?: Record<string, unknown>, config?: RequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>({
      method: 'PATCH',
      url,
      data,
      ...config,
    });
  }

  /**
   * 上传文件
   * @param url 请求地址
   * @param formData 表单数据
   * @param config 请求配置
   * @returns Promise
   */
  async upload<T>(url: string, formData: FormData, config?: RequestConfig): Promise<ApiResponse<T>> {
    const { headers: extraHeaders, ...restConfig } = config ?? {};
    return this.request<T>({
      method: 'POST',
      url,
      data: formData,
      timeout: 60000,
      ...restConfig,
      headers: {
        ...extraHeaders,
        'Content-Type': false,
      },
    });
  }

  /**
   * 下载文件
   * @param url 请求地址
   * @param config 请求配置
   * @returns Promise<Blob>
   */
  async download(url: string, config?: RequestConfig): Promise<Blob> {
    try {
      const response = await this.instance.request({
        method: 'GET',
        url,
        responseType: 'blob',
        ...config,
      });
      
      return response.data;
    } catch (error) {
      this.handleError(this.normalizeError(error), config);
      throw error;
    }
  }
}

// 创建默认HTTP客户端实例
const request = new HttpClient();

export { request };
