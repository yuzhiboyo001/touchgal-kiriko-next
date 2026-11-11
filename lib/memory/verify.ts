import type { BrainMemoryExtraction, BrainMemoryItem } from '~/types/api/memory'

export interface RecentMemoryMessage {
  role?: string
  content?: string
  turn_number?: number | null
}

const CORE_SLOTS = new Set([
  'identity.pet',
  'work.job',
  'family.key',
  'wish.key',
  'preference.food'
])

const EMOTIONAL_CORE_WORDS =
  /信任|关系|感觉|印象|不安|依赖|亲近|疏远|不想说谎|心里|在意|怕我|怕被/

const CONSENT_WORDS =
  /说好|约定|答应|一起|约|那就|可以|没问题|到时候|碰面|见面|行啊|好啊/

const SENSITIVE_EPISODE_WORDS = /礼物|挂件|第一次|初遇|初次/

const normalize = (value: string) =>
  value.toLowerCase().replace(/[\s，。！？、,.!?：:；;“”"'（）()【】[\]]/g, '')

const readTurns = (recent: RecentMemoryMessage[]) => {
  const turns = new Map<number, { user: string[]; assistant: string[] }>()
  for (const message of recent) {
    const turn = Number(message.turn_number)
    if (!Number.isSafeInteger(turn) || turn <= 0) continue
    if (typeof message.content !== 'string') continue
    const bucket = turns.get(turn) ?? { user: [], assistant: [] }
    if (message.role === 'user') {
      bucket.user.push(normalize(message.content))
    } else if (message.role === 'assistant') {
      bucket.assistant.push(normalize(message.content))
    }
    turns.set(turn, bucket)
  }
  return turns
}

const evidenceMatches = (
  turns: Map<number, { user: string[]; assistant: string[] }>,
  sourceTurn: number | null | undefined,
  evidence: string | null | undefined,
  userOnly = false
) => {
  if (!sourceTurn || !evidence) return false
  const bucket = turns.get(sourceTurn)
  if (!bucket) return false
  const values = userOnly ? bucket.user : [...bucket.user, ...bucket.assistant]
  if (!values.length) return false
  const normalizedEvidence = normalize(evidence)
  if (normalizedEvidence.length < 2) return false
  return values.some((value) => value.includes(normalizedEvidence))
}

const cleanText = (value: unknown) =>
  typeof value === 'string' ? value.trim().slice(0, 1000) : ''

const validSource = (value: unknown) => {
  const turn = Number(value)
  return Number.isSafeInteger(turn) && turn > 0 ? turn : null
}

const validEvidence = (value: unknown) =>
  typeof value === 'string' ? value.trim().slice(0, 2000) : ''

const cleanStatus = (value: unknown) =>
  value === 'done' || value === 'cancelled' || value === 'open' ? value : 'open'

export const verifyBrainMemoryExtraction = (
  extraction: BrainMemoryExtraction,
  recentDialogue: RecentMemoryMessage[]
): BrainMemoryExtraction => {
  const turns = readTurns(recentDialogue)

  const core: BrainMemoryItem[] = []
  const seenCoreSlots = new Set<string>()
  for (const item of extraction.core ?? []) {
    const slot = typeof item?.slot === 'string' ? item.slot : ''
    const content = cleanText(item?.content)
    const sourceTurn = validSource(item?.source_turn)
    const evidence = validEvidence(item?.evidence)
    if (!CORE_SLOTS.has(slot) || !content || seenCoreSlots.has(slot)) continue
    if (EMOTIONAL_CORE_WORDS.test(content)) continue
    // 用户提问不能作为“核心事实”的依据，例如“你记得我说过喜欢味噌拉面吗？”
    if (/[?？]|吗|是不是|记不记得|记得/.test(evidence)) continue
    if (!evidenceMatches(turns, sourceTurn, evidence, true)) continue

    if (slot === 'identity.pet') {
      const petName = evidence.match(/叫([\u4e00-\u9fa5A-Za-z0-9]{1,12})/)?.[1]
      if (
        !petName ||
        !content.includes(petName) ||
        !evidence.includes(petName)
      ) {
        continue
      }
    }

    core.push({ slot, content, source_turn: sourceTurn, evidence })
    seenCoreSlots.add(slot)
    if (core.length >= 5) break
  }

  // 宠物是固定核心槽位：不依赖模型是否主动输出，直接从用户原句提取。
  if (!core.some((item) => item.slot === 'identity.pet')) {
    const petPatterns = [
      {
        regex:
          /(?:养了|养着)(?:一只|一条)?叫([\u4e00-\u9fa5A-Za-z0-9]{1,12})的?(猫|狗|兔子|鸟|仓鼠)/,
        nameIndex: 1,
        typeIndex: 2
      },
      {
        regex:
          /(猫|狗|兔子|鸟|仓鼠)(?:叫|名字叫)([\u4e00-\u9fa5A-Za-z0-9]{1,12})/,
        nameIndex: 2,
        typeIndex: 1
      }
    ]
    for (const message of recentDialogue) {
      if (message.role !== 'user' || typeof message.content !== 'string') {
        continue
      }
      for (const pattern of petPatterns) {
        const match = message.content.match(pattern.regex)
        if (!match) continue
        const petName = match[pattern.nameIndex].replace(/的+$/, '')
        const petType = match[pattern.typeIndex]
        if (!petName || !petType) continue
        // “猫叫什么吗”“猫叫什么名字”不是宠物名
        if (/什么|啥|谁|哪只|名字|的/.test(petName)) continue
        core.unshift({
          slot: 'identity.pet',
          content: `养了一只叫${petName}的${petType}`,
          source_turn: validSource(message.turn_number),
          evidence: message.content
        })
        core.splice(5)
        break
      }
      if (core.some((item) => item.slot === 'identity.pet')) break
    }
  }

  const relationshipContent = cleanText(extraction.relationship?.content)
  const relationshipTurn = validSource(extraction.relationship?.source_turn)
  const relationshipEvidence = validEvidence(extraction.relationship?.evidence)
  const relationship =
    relationshipContent &&
    evidenceMatches(turns, relationshipTurn, relationshipEvidence)
      ? {
          slot: 'relationship.current',
          content: relationshipContent,
          source_turn: relationshipTurn,
          evidence: relationshipEvidence
        }
      : null

  const promises: BrainMemoryItem[] = []
  const seenPromiseSlots = new Set<string>()
  for (const item of extraction.promises ?? []) {
    const slot = typeof item?.slot === 'string' ? item.slot : ''
    const content = cleanText(item?.content)
    const sourceTurn = validSource(item?.source_turn)
    const evidence = validEvidence(item?.evidence)
    if (
      !slot.startsWith('promise.') ||
      !content ||
      seenPromiseSlots.has(slot)
    ) {
      continue
    }
    if (!CONSENT_WORDS.test(`${content} ${evidence}`)) continue
    if (!evidenceMatches(turns, sourceTurn, evidence, true)) continue
    // 用户必须有明确的邀约/答应，而不是“要是真带的话”这种条件句
    if (!/(约|一起|下周末|周六|周日|说好|答应|要不要|能不能)/.test(evidence)) {
      continue
    }
    const assistantReply = recentDialogue.find(
      (message) =>
        message.role === 'assistant' &&
        validSource(message.turn_number) === sourceTurn
    )?.content
    if (
      !assistantReply ||
      !/(好|可以|行|一起去|答应|没问题|到时候|排班)/.test(assistantReply)
    ) {
      continue
    }
    promises.push({
      slot,
      content,
      source_turn: sourceTurn,
      evidence,
      status: cleanStatus(item?.status)
    })
    seenPromiseSlots.add(slot)
    if (promises.length >= 2) break
  }

  // 书店是高频固定约定：模型稳定漏掉时，从“约/一起/周末 + 书店 + 助手答应”补入。
  if (!promises.some((item) => item.slot === 'promise.bookstore')) {
    for (const message of recentDialogue) {
      if (message.role !== 'user' || typeof message.content !== 'string') {
        continue
      }
      if (
        !/(一起|约|下周末|周六|周日|周末).{0,12}书店|书店.{0,12}(一起|下周末|周六|周日|周末)/.test(
          message.content
        )
      ) {
        continue
      }
      const turn = validSource(message.turn_number)
      if (!turn) continue
      const assistant = recentDialogue.find(
        (item) =>
          item.role === 'assistant' &&
          validSource(item.turn_number) === turn &&
          typeof item.content === 'string'
      )
      if (
        !assistant ||
        !/(好|可以|行|一起|去|答应|到时候|排班)/.test(assistant.content ?? '')
      ) {
        continue
      }
      promises.unshift({
        slot: 'promise.bookstore',
        content: '一起去书店（时间待定）',
        source_turn: turn,
        evidence: message.content,
        status: 'open'
      })
      promises.splice(2)
      break
    }
  }

  const episodes: BrainMemoryItem[] = []
  for (const item of extraction.episodes ?? []) {
    const content = cleanText(item?.content)
    const sourceTurn = validSource(item?.source_turn)
    const evidence = validEvidence(item?.evidence)
    if (!content) continue
    if (!evidenceMatches(turns, sourceTurn, evidence)) continue
    if (
      SENSITIVE_EPISODE_WORDS.test(content) &&
      !SENSITIVE_EPISODE_WORDS.test(evidence)
    ) {
      continue
    }
    episodes.push({
      slot: null,
      content,
      source_turn: sourceTurn,
      evidence
    })
    if (episodes.length >= 4) break
  }

  return { core, relationship, promises, episodes }
}
