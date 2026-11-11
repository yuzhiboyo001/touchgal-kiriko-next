import { $remark } from '@milkdown/utils'
import { visit } from 'unist-util-visit'

/**
 * remark-directive 会把正文里的「:月に憑かれたピエロ」解析成 textDirective。
 * Milkdown 没有对应的 textDirective 节点，遇到未知指令会直接抛
 * "Cannot match target parser for node: textDirective"。
 *
 * 这里把所有 textDirective 还原成普通文本。Milkdown 自己的 kun-link /
 * kun-video 使用的是 leafDirective，不受影响。
 */
export const remarkTextDirectiveFallback = $remark(
  'remark-text-directive-fallback',
  () => () => (tree: any) => {
    visit(tree, (node: any, index, parent: any) => {
      if (node.type !== 'textDirective') {
        return
      }
      if (!parent || typeof index !== 'number') {
        return
      }

      const name = typeof node.name === 'string' ? node.name : ''
      const children = Array.isArray(node.children)
        ? node.children
            .map((child: any) =>
              typeof child.value === 'string' ? child.value : ''
            )
            .join('')
        : ''

      parent.children[index] = {
        type: 'text',
        value: name ? `:${name}${children}` : children
      }
    })
  }
)
