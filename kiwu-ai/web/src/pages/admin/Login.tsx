import { useNavigate } from 'react-router-dom'
import { Button, Field, inputCls, LogoMark } from './ui'

// 권한이 부여된 사용자만 접근
export default function Login() {
  const navigate = useNavigate()
  return (
    <div className="grid min-h-dvh place-items-center bg-zinc-50 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <LogoMark className="size-11" />
          <h1 className="mt-4 text-xl font-semibold tracking-tight text-zinc-900">ESG 챗봇 관리자</h1>
          <p className="mt-1 text-sm text-zinc-500">경인여자대학교 담당자 계정으로 로그인하세요</p>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            navigate('/admin')
          }}
          className="space-y-4 rounded-xl border border-zinc-200 bg-white p-6 shadow-sm"
        >
          <Field label="아이디"><input autoComplete="username" required className={inputCls} /></Field>
          <Field label="비밀번호"><input type="password" autoComplete="current-password" required className={inputCls} /></Field>
          <Button variant="primary" type="submit" className="w-full">로그인</Button>
        </form>
        <p className="mt-6 text-center text-xs text-zinc-400">접속 기록은 보안 정책에 따라 저장됩니다</p>
      </div>
    </div>
  )
}
