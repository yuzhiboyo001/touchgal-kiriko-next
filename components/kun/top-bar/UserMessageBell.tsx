'use client'

import { Button } from '@heroui/button'
import { Tooltip } from '@heroui/tooltip'
import { Bell, BellRing } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { useRouter } from '@bprogress/next'
import { bellShakeVariants, dotVariants } from '~/motion/bell'

interface AnimatedNotificationBellProps {
  hasUnreadMessages: boolean
  setReadMessage: () => void
}

export const UserMessageBell = ({
  hasUnreadMessages,
  setReadMessage
}: AnimatedNotificationBellProps) => {
  const router = useRouter()

  const handleClickButton = () => {
    router.push('/message/notice')
    if (hasUnreadMessages) {
      setReadMessage()
    }
  }

  return (
    <Tooltip
      disableAnimation
      showArrow
      closeDelay={0}
      content={hasUnreadMessages ? '您有新消息!' : '我的消息'}
    >
      <Button
        isIconOnly
        variant="light"
        onPress={handleClickButton}
        className="text-pink-400/80 hover:text-pink-400"
        aria-label="我的消息"
      >
        <motion.div
          initial="initial"
          animate={hasUnreadMessages ? 'animate' : 'initial'}
          whileHover="hover"
          variants={bellShakeVariants}
        >
          {hasUnreadMessages ? (
            // ✅ 有消息：保持亮粉色
            <BellRing className="size-6 text-pink-400" />
          ) : (
            // ✅ 没消息：去掉了 /60，让颜色跟外层 Button 保持一致
            <Bell className="size-6" />
          )}
        </motion.div>

        <AnimatePresence>
          {hasUnreadMessages && (
            <motion.div
              className="absolute rounded-full bottom-1 right-1 size-2 bg-rose-400"
              variants={dotVariants}
              initial="initial"
              animate="animate"
              exit="exit"
            />
          )}
        </AnimatePresence>
      </Button>
    </Tooltip>
  )
}
