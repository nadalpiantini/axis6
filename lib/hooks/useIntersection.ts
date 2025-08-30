import { useEffect, useState, RefObject } from 'react'

interface UseIntersectionOptions extends IntersectionObserverInit {
  freezeOnceVisible?: boolean
}

export function useIntersection(
  elementRef: RefObject<Element>,
  { threshold = 0, root = null, rootMargin = '0%', freezeOnceVisible = false }: UseIntersectionOptions = {}
): boolean {
  const [isIntersecting, setIsIntersecting] = useState<boolean>(false)

  useEffect(() => {
    const element = elementRef?.current

    if (!element || !('IntersectionObserver' in window)) {
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        const isElementIntersecting = entry.isIntersecting

        if (!freezeOnceVisible || !isIntersecting) {
          setIsIntersecting(isElementIntersecting)
        }
      },
      { threshold, root, rootMargin }
    )

    observer.observe(element)

    return () => {
      observer.unobserve(element)
    }
  }, [elementRef, threshold, root, rootMargin, freezeOnceVisible, isIntersecting])

  return isIntersecting
}
