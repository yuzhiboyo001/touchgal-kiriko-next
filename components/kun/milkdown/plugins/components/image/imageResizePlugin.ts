import type { Node as ProseNode } from '@milkdown/prose/model'
import { NodeSelection } from '@milkdown/prose/state'
import type { NodeView, NodeViewConstructor } from '@milkdown/prose/view'

const MIN_WIDTH = 20
const MAX_WIDTH = 100

const clampWidth = (value: number) =>
  Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, Math.round(value / 5) * 5))

const getImageWidth = (title: string | null | undefined) => {
  const match = /(?:^|\s)w=(\d{1,3})%/.exec(title ?? '')
  if (!match) return MAX_WIDTH
  return clampWidth(Number(match[1]))
}

const withImageWidth = (title: string | null | undefined, width: number) => {
  const cleanTitle = (title ?? '').replace(/(?:^|\s)w=\d{1,3}%/g, '').trim()
  return `${cleanTitle}${cleanTitle ? ' ' : ''}w=${clampWidth(width)}%`
}

const boundPasteEditors = new WeakSet<HTMLElement>()

const CORNERS = [
  { name: 'nw', left: '-6px', top: '-6px', direction: -1 },
  { name: 'ne', right: '-6px', top: '-6px', direction: 1 },
  { name: 'sw', left: '-6px', bottom: '-6px', direction: -1 },
  { name: 'se', right: '-6px', bottom: '-6px', direction: 1 }
] as const

/**
 * 图片节点视图：鼠标/手指按住四个角，按比例横向缩放。
 * 宽度保存在 image.title 的 w=80% 标记里，刷新后仍然保留。
 */
export const imageNodeView: NodeViewConstructor = (
  initialNode,
  view,
  getPos
): NodeView => {
  let node: ProseNode = initialNode
  let dragSourcePos: number | null = null
  let dragSourceNode: ProseNode | null = null
  const wrapper = document.createElement('span')
  wrapper.className = 'kun-image-resize-wrap'
  // Make the custom inline node view behave like ProseMirror's native image
  // node so it can be moved by drag/drop.
  wrapper.draggable = true
  wrapper.contentEditable = 'false'

  const image = document.createElement('img')
  image.draggable = true
  wrapper.appendChild(image)

  const getNodeSelection = () => {
    const position = getPos()
    if (typeof position !== 'number') return null
    return {
      position,
      selection: NodeSelection.create(view.state.doc, position)
    }
  }

  const selectImage = () => {
    const current = getNodeSelection()
    if (!current) return
    if (
      view.state.selection instanceof NodeSelection &&
      view.state.selection.from === current.position
    ) {
      return
    }
    view.dispatch(view.state.tr.setSelection(current.selection))
  }

  const escapeAttribute = (value: string) =>
    value
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')

  const getImageClipboardHtml = () =>
    `<img src="${escapeAttribute(node.attrs.src || '')}" alt="${escapeAttribute(
      node.attrs.alt || ''
    )}" title="${escapeAttribute(node.attrs.title || '')}">`

  image.addEventListener('click', selectImage)

  // Native browser drag start. ProseMirror uses view.dragging to move the
  // selected slice instead of inserting a second copied image.
  wrapper.addEventListener('dragstart', (event) => {
    const current = getNodeSelection()
    if (!current) return

    view.dispatch(view.state.tr.setSelection(current.selection))
    dragSourcePos = current.position
    dragSourceNode = node

    // Use our own drop handler so the original image is moved, not duplicated.
    const draggingView = view as typeof view & { dragging: unknown }
    draggingView.dragging = null

    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move'
      event.dataTransfer.setData('text/plain', image.alt || 'image')
      event.dataTransfer.setData('text/html', getImageClipboardHtml())
    }
  })

  wrapper.addEventListener('dragend', () => {
    dragSourcePos = null
    dragSourceNode = null
    const draggingView = view as typeof view & { dragging: unknown }
    draggingView.dragging = null
  })

  const handleDragOver = (event: DragEvent) => {
    if (dragSourcePos === null) return
    event.preventDefault()
    if (event.dataTransfer) event.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = (event: DragEvent) => {
    if (dragSourcePos === null || !dragSourceNode) return

    const target = view.posAtCoords({
      left: event.clientX,
      top: event.clientY
    })
    if (!target) return

    event.preventDefault()
    event.stopPropagation()

    const movedNode = dragSourceNode
    const sourcePos = dragSourcePos
    const transaction = view.state.tr.delete(
      sourcePos,
      sourcePos + movedNode.nodeSize
    )
    const mappedTarget = transaction.mapping.map(target.pos)
    transaction.insert(mappedTarget, movedNode)
    view.dispatch(transaction.scrollIntoView())

    dragSourcePos = null
    dragSourceNode = null
  }

  view.dom.addEventListener('dragover', handleDragOver, true)
  view.dom.addEventListener('drop', handleDrop, true)

  const handleCopy = (event: ClipboardEvent) => {
    const current = getNodeSelection()
    if (
      !current ||
      !(view.state.selection instanceof NodeSelection) ||
      view.state.selection.from !== current.position ||
      !event.clipboardData
    ) {
      return
    }

    event.clipboardData.setData('text/html', getImageClipboardHtml())
    event.clipboardData.setData(
      'text/plain',
      `![${image.alt || ''}](${node.attrs.src || ''})`
    )
    event.preventDefault()
  }

  wrapper.addEventListener('copy', handleCopy)
  view.dom.addEventListener('copy', handleCopy)

  // Paste an image copied from this editor or another page.
  const handlePaste = (event: ClipboardEvent) => {
    const html = event.clipboardData?.getData('text/html') || ''
    const text = event.clipboardData?.getData('text/plain') || ''

    let src = ''
    let alt = ''
    let title = ''

    if (html) {
      const parsed = new DOMParser().parseFromString(html, 'text/html')
      const pastedImage = parsed.querySelector('img')
      if (pastedImage?.getAttribute('src')) {
        src = pastedImage.getAttribute('src') || ''
        alt = pastedImage.getAttribute('alt') || ''
        title = pastedImage.getAttribute('title') || ''
      }
    }

    // Browsers may expose only text/plain for copied inline images.
    if (!src) {
      const match = /^!\[([^\]]*)\]\(([^)\s]+)(?:\s+["'][^"']*["'])?\)$/.exec(
        text.trim()
      )
      if (!match) return
      alt = match[1] || ''
      src = match[2] || ''
    }

    if (!src) return

    const imageNode = view.state.schema.nodes.image.create({
      src,
      alt,
      title
    })

    event.preventDefault()
    event.stopPropagation()
    event.stopImmediatePropagation()

    // Some editor paste handlers replace the selection after the capture
    // phase. Apply the image insertion on the next task so it wins.
    setTimeout(() => {
      view.dispatch(
        view.state.tr.replaceSelectionWith(imageNode).scrollIntoView()
      )
    }, 0)
  }

  // Only one paste listener per editor, otherwise every image node view
  // would insert the same pasted image once.
  if (!boundPasteEditors.has(view.dom)) {
    view.dom.addEventListener('paste', handlePaste, true)
    boundPasteEditors.add(view.dom)
  }

  const applyWidth = () => {
    const width = getImageWidth(node.attrs.title)
    // The wrapper always takes a full line. The image itself can still be
    // resized with the corner handles without letting text flow beside it.
    wrapper.style.width = '100%'
    image.style.width = width >= MAX_WIDTH ? '100%' : `${width}%`
    image.src = node.attrs.src || ''
    image.alt = node.attrs.alt || ''
    image.title = node.attrs.title || ''
  }

  const startResize = (
    event: PointerEvent,
    direction: number,
    handle: HTMLElement
  ) => {
    if (event.button !== 0 && event.pointerType === 'mouse') return
    event.preventDefault()
    event.stopPropagation()

    const startX = event.clientX
    const startWidth = getImageWidth(node.attrs.title)
    const parentWidth =
      wrapper.parentElement?.getBoundingClientRect().width || 1

    const onMove = (moveEvent: PointerEvent) => {
      moveEvent.preventDefault()
      const deltaPercent =
        ((moveEvent.clientX - startX) / parentWidth) * 100 * direction
      const nextWidth = clampWidth(startWidth + deltaPercent)
      if (nextWidth === getImageWidth(node.attrs.title)) return

      const position = getPos()
      if (typeof position !== 'number') return
      view.dispatch(
        view.state.tr.setNodeMarkup(position, undefined, {
          ...node.attrs,
          title: withImageWidth(node.attrs.title, nextWidth)
        })
      )
    }

    const onEnd = () => {
      handle.removeEventListener('pointermove', onMove)
      handle.removeEventListener('pointerup', onEnd)
      handle.removeEventListener('pointercancel', onEnd)
    }

    handle.setPointerCapture?.(event.pointerId)
    handle.addEventListener('pointermove', onMove)
    handle.addEventListener('pointerup', onEnd)
    handle.addEventListener('pointercancel', onEnd)
  }

  for (const corner of CORNERS) {
    const handle = document.createElement('span')
    handle.className = `kun-image-resize-handle kun-image-resize-${corner.name}`
    handle.style.left = 'left' in corner ? corner.left : ''
    handle.style.right = 'right' in corner ? corner.right : ''
    handle.style.top = 'top' in corner ? corner.top : ''
    handle.style.bottom = 'bottom' in corner ? corner.bottom : ''
    handle.addEventListener('pointerdown', (event) =>
      startResize(event, corner.direction, handle)
    )
    wrapper.appendChild(handle)
  }

  applyWidth()

  return {
    dom: wrapper,
    update(nextNode) {
      if (nextNode.type !== initialNode.type) return false
      node = nextNode
      applyWidth()
      return true
    },
    selectNode() {
      wrapper.classList.add('is-selected')
    },
    deselectNode() {
      wrapper.classList.remove('is-selected')
    },
    stopEvent(event) {
      // Only the resize handles should swallow editor events.
      // Clicking, copy/cut and drag/drop must reach ProseMirror.
      const target = event.target as HTMLElement | null
      return Boolean(target?.closest('.kun-image-resize-handle'))
    },
    ignoreMutation() {
      return true
    },
    destroy() {
      view.dom.removeEventListener('copy', handleCopy)
      // The paste listener is shared by all image node views in this editor.
      // Leave it attached for the lifetime of the editor DOM.
      view.dom.removeEventListener('dragover', handleDragOver, true)
      view.dom.removeEventListener('drop', handleDrop, true)
    }
  }
}
