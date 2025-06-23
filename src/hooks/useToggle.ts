'use client'
import { useCallback, useState } from "react";

type UseToggle = [
  boolean,
  (nextValue?: boolean | React.MouseEvent) => void
]

const useToggle = (initialValue: boolean = false): UseToggle => {
  const [state, setState] = useState(initialValue);
  
  const toggle = useCallback((nextValue?: boolean | React.MouseEvent) => {
    if (typeof nextValue === 'boolean') {
      setState(nextValue);
    } else {
      setState(prev => !prev);
    }
  }, []);
  
  return [state, toggle];
}

export default useToggle