// features/ChatFeature/hooks/useChatController.ts

import { useChat } from '~/components/kun/hooks/useChat'

interface UseChatControllerProps {
  character: 'rin' | 'sayo' | 'shunv'
}

export const useChatController = ({ character }: UseChatControllerProps) => {
  return useChat(character)
}
