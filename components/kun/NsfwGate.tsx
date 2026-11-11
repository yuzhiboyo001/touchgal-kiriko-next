import { KunNull } from './Null'

interface Props {
  isLoggedIn: boolean
  centered?: boolean
}

export const NsfwGate = ({ isLoggedIn, centered = false }: Props) => (
  <div
    className={
      centered
        ? 'flex min-h-[calc(100vh-12rem)] w-full items-center justify-center'
        : 'py-12'
    }
  >
    <div
      className={
        centered
          ? 'flex w-full flex-col items-center justify-center text-center'
          : ''
      }
    >
      <KunNull
        message={
          isLoggedIn ? '请在右上角菜单开启 NSFW 内容显示后查看' : '请登录后查看'
        }
      />
    </div>
  </div>
)
