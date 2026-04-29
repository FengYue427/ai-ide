import { useRef, useCallback, useEffect, useState } from 'react'

/**
 * 防抖 Hook - 用于优化高频触发的事件（如编辑器输入）
 * 
 * @param fn 要防抖执行的函数
 * @param delay 延迟时间（毫秒），默认 300ms
 * @returns 防抖包装后的函数
 * 
 * 使用场景：
 * - 编辑器内容变化（避免每输入一个字符都触发保存）
 * - 搜索框输入（避免每输入一个字符都发起搜索）
 * - 窗口 resize（避免频繁重绘）
 */
export function useDebounce<T extends (...args: any[]) => void>(
  fn: T,
  delay: number = 300
): (...args: Parameters<T>) => void {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // 清理函数
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
    }
  }, [])

  return useCallback(
    (...args: Parameters<T>) => {
      // 清除之前的定时器
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }

      // 设置新的定时器
      timerRef.current = setTimeout(() => {
        fn(...args)
        timerRef.current = null
      }, delay)
    },
    [fn, delay]
  )
}

/**
 * 防抖值 Hook - 用于延迟更新状态值
 * 
 * @param value 原始值
 * @param delay 延迟时间（毫秒），默认 300ms
 * @returns 防抖后的值
 * 
 * 使用场景：
 * - 实时搜索时延迟发送请求
 * - 表单验证延迟触发
 */
export function useDebouncedValue<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(timer)
    }
  }, [value, delay])

  return debouncedValue
}

export default useDebounce
