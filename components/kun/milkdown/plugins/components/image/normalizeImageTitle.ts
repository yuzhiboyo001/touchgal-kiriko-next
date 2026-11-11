import { $remark } from '@milkdown/utils'
import { visit } from 'unist-util-visit'

/**
 * CommonMark image titles are optional. Some editor node views pass the
 * parsed title straight to a DOM image, where `null` is not a valid string
 * attribute. Normalize it before Milkdown creates the image node.
 */
export const remarkNormalizeImageTitle = $remark(
  'normalize-image-title',
  () => () => (tree: any) => {
    visit(tree, 'image', (node: any) => {
      if (node.title === null || node.title === undefined) {
        node.title = ''
      }
    })
  }
)
