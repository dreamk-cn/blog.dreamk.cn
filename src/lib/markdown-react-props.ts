/** react-markdown 传递 `node` 给自定义组件；永远不会转发到原生 DOM。 */
export function withoutNodeProps<T extends Record<string, unknown>>(props: T): Omit<T, "node"> {
  const { node: _node, ...rest } = props as T & { node?: unknown };
  return rest;
}
