import { useCallback, useEffect, useState } from 'react'

export function useLocalStorage(key: string, defaultValue: unknown) {
  return useStorage(key, defaultValue, localStorage)
}

export function useSessionStorage(key: string, defaultValue: unknown) {
  return useStorage(key, defaultValue, sessionStorage)
}

function useStorage(key: string, defaultValue: unknown, storageObject: Storage) {
  const [value, setValue] = useState(() => {
    const jsonValue = storageObject.getItem(key)
    if (jsonValue != null)
      return JSON.parse(jsonValue)
    if (typeof defaultValue === 'function') {
      return defaultValue()
    } else {
      return defaultValue
    }
  })

  useEffect(() => {
    if (value === undefined) {
      return storageObject.removeItem(key)
    }
    storageObject.setItem(key, JSON.stringify(value))
  }, [key, value, storageObject])

  const remove = useCallback(() => {
    setValue(undefined)
  }, [])

  return [value, setValue, remove]
}
