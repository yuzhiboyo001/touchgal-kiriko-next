// /components/edit/create/PatchIntroduction.tsx
'use client'

import { KunDualEditorProvider } from '~/components/kun/milkdown/DualEditorProvider'
import { useCreatePatchStore } from '~/store/editStore'
import { markdownToText } from '~/utils/markdownToText'

interface Props {
  errors: string | undefined
}

export const PatchIntroduction = ({ errors }: Props) => {
  const data = useCreatePatchStore((state) => state.data)

  return (
    <div className="space-y-2">
      <h2 className="text-xl">游戏介绍 (可选)</h2>
      <p className="text-small text-default-500">
        游戏介绍涉及页面的 SEO, 建议填写 100 字以上
      </p>
      <p className="text-small text-default-500">
        章节标题建议使用引用加粗格式，例如 <code>&gt; **游戏背景**</code>
        ，详情页会统一渲染成粉色章节标题。
      </p>
      <p className="text-small text-default-500">
        自定义副标题可写成 <code>&gt; **游戏背景 | MY STORY**</code>
        ，竖线后可以直接写英文或日文。
      </p>
      {errors && <p className="text-xs text-danger-500">{errors}</p>}

      <KunDualEditorProvider storeName="patchCreate" />

      <p className="text-small text-default-500">
        字数: {markdownToText(data.introduction).length}
      </p>
    </div>
  )
}
