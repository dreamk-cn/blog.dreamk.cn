
export const isServer = () => typeof window === 'undefined'

export const isClient = () => !isServer()

export const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))