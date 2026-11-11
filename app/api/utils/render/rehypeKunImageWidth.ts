import { visit } from 'unist-util-visit'
import type { Plugin } from 'unified'
import type { Node } from 'unist'

/**
 * 把编辑器图片 title 里的 w=80% 标记转成真实宽度。
 * 这样发布后的游戏详情页也能保持上传页的缩放比例。
 */
export const rehypeKunImageWidth: Plugin<[], Node> = () => {
  return (tree) => {
    visit(tree, 'element', (node: any) => {
      if (node.tagName !== 'img') return

      const title = String(node.properties?.title ?? '')
      const match = /(?:^|\s)w=(\d{1,3})%/.exec(title)
      if (!match) return

      const width = Math.min(100, Math.max(20, Number(match[1])))
      node.properties = {
        ...node.properties,
        style: `width:${width}%;height:auto;`
      }
    })
  }
}
