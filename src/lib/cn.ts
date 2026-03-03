/**
 * className 결합 유틸.
 * falsy 값을 필터링하고 공백으로 연결한다.
 *
 * @example
 * cn('base', isActive && 'active', isDark ? 'dark' : 'light')
 * // => "base active light"
 */
export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(' ');
}
