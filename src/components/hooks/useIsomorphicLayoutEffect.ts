// author: https://github.com/Siumauricio/nextui-dashboard-template
import {useEffect, useLayoutEffect} from 'react';

export const useIsomorphicLayoutEffect =
   typeof window !== 'undefined' ? useLayoutEffect : useEffect;
