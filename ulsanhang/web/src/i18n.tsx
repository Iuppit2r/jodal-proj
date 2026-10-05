import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

export type Lang = 'ko' | 'en' | 'zh' | 'ru'

export const LANGS: { code: Lang; label: string }[] = [
  { code: 'ko', label: '한국어' },
  { code: 'en', label: 'English' },
  { code: 'zh', label: '中文' },
  { code: 'ru', label: 'Русский' },
]

const dict = {
  'nav.chat': { ko: 'AI 상담', en: 'AI Assistant', zh: 'AI 咨询', ru: 'AI‑помощник' },
  'nav.schedule': { ko: '스케줄 예측', en: 'Schedule Forecast', zh: '船期预测', ru: 'Прогноз графика' },
  'nav.forms': { ko: '서식 어시스턴트', en: 'Form Assistant', zh: '表格助手', ru: 'Помощник по формам' },
  'nav.admin': { ko: '관리자', en: 'Admin', zh: '管理', ru: 'Админ' },
  'nav.monitoring': { ko: '모니터링', en: 'Monitoring', zh: '监控', ru: 'Мониторинг' },
  'nav.rag': { ko: 'RAG 성능 평가', en: 'RAG Evaluation', zh: 'RAG 评估', ru: 'Оценка RAG' },
  'nav.feedback': { ko: '사용자 피드백', en: 'Feedback', zh: '用户反馈', ru: 'Отзывы' },
  'nav.data': { ko: '데이터·지식 관리', en: 'Data & Knowledge', zh: '数据与知识', ru: 'Данные и знания' },
  'group.service': { ko: '서비스', en: 'Services', zh: '服务', ru: 'Сервисы' },
  'group.admin': { ko: '관리', en: 'Administration', zh: '管理', ru: 'Администрирование' },
  'search': { ko: '검색', en: 'Search', zh: '搜索', ru: 'Поиск' },
  'skip': { ko: '본문 바로가기', en: 'Skip to content', zh: '跳到正文', ru: 'Перейти к содержимому' },
  'chat.new': { ko: '새 대화', en: 'New chat', zh: '新对话', ru: 'Новый чат' },
  'chat.history': { ko: '대화 이력', en: 'History', zh: '对话记录', ru: 'История' },
  'chat.clearAll': { ko: '전체 이력 삭제', en: 'Delete all', zh: '全部删除', ru: 'Удалить всё' },
  'chat.welcome': { ko: '무엇이든 물어보세요, 울산항 AI입니다', en: 'Ask anything about Ulsan Port', zh: '欢迎咨询蔚山港 AI', ru: 'Задайте вопрос AI порта Ульсан' },
  'chat.welcomeSub': {
    ko: '항만시설 사용료, 입출항 절차, 선석 현황, 채용 정보 등을 공사 공식 자료에 근거해 답변합니다.',
    en: 'Answers on port tariffs, entry/departure procedures, berth status and more, grounded in official UPA sources.',
    zh: '基于蔚山港湾公社官方资料，解答港口使用费、进出港手续、泊位状况等问题。',
    ru: 'Ответы о портовых сборах, процедурах захода/выхода, причалах на основе официальных источников UPA.',
  },
  'chat.placeholder': { ko: '질문을 입력하세요 (Shift+Enter 줄바꿈)', en: 'Type your question (Shift+Enter for newline)', zh: '请输入问题（Shift+Enter 换行）', ru: 'Введите вопрос (Shift+Enter: новая строка)' },
  'chat.send': { ko: '전송', en: 'Send', zh: '发送', ru: 'Отправить' },
  'chat.stop': { ko: '중지', en: 'Stop', zh: '停止', ru: 'Стоп' },
  'chat.sources': { ko: '근거 자료', en: 'Sources', zh: '参考资料', ru: 'Источники' },
  'chat.followups': { ko: '이런 질문은 어떠세요?', en: 'You might also ask', zh: '您可能还想问', ru: 'Возможно, вас интересует' },
  'chat.helpful': { ko: '도움됨', en: 'Helpful', zh: '有帮助', ru: 'Полезно' },
  'chat.notHelpful': { ko: '아쉬움', en: 'Not helpful', zh: '没帮助', ru: 'Не полезно' },
  'chat.copy': { ko: '복사', en: 'Copy', zh: '复制', ru: 'Копировать' },
  'chat.regen': { ko: '다시 생성', en: 'Regenerate', zh: '重新生成', ru: 'Повторить' },
  'chat.disclaimer': {
    ko: 'AI 답변은 참고용이며, 정확한 내용은 근거 자료 원문 또는 담당 부서에 확인하시기 바랍니다. 개인정보는 입력하지 마세요.',
    en: 'AI answers are for reference only. Please verify with the source or the responsible department. Do not enter personal data.',
    zh: 'AI 回答仅供参考，请以原文或负责部门为准。请勿输入个人信息。',
    ru: 'Ответы AI носят справочный характер. Уточняйте в источнике или в ответственном отделе. Не вводите персональные данные.',
  },
  'chat.slow': { ko: '답변 생성이 지연되고 있습니다. 잠시만 기다려 주세요…', en: 'The response is taking longer than usual. Please wait…', zh: '回答生成延迟，请稍候…', ru: 'Ответ задерживается, подождите…' },
} satisfies Record<string, Record<Lang, string>>

export type DictKey = keyof typeof dict

const Ctx = createContext<{ lang: Lang; setLang: (l: Lang) => void; t: (k: DictKey) => string }>({
  lang: 'ko',
  setLang: () => {},
  t: (k) => dict[k].ko,
})

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>('ko')
  useEffect(() => {
    document.documentElement.lang = lang
  }, [lang])
  return <Ctx.Provider value={{ lang, setLang, t: (k) => dict[k][lang] }}>{children}</Ctx.Provider>
}

export const useI18n = () => useContext(Ctx)
