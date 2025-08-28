// src/components/Login.tsx
import * as React from "react";
import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/**
 * 로그인 성공 시 상위에서 처리하고 싶다면 onSuccess 콜백을 prop으로 넘겨주세요.
 */
export interface LoginProps {
  onSuccess?: (user: { userId: string }) => void;
  /** 기본값: "http://localhost:8080/api/auth/login" */
  loginEndpoint?: string;
}

const Login: React.FC<LoginProps> = ({
  onSuccess,
  loginEndpoint = "http://localhost:8080/api/login",
}) => {
  const navigate = useNavigate();
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [remember, setRemember] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const canSubmit = userId.trim().length > 0 && password.trim().length > 0 && !isLoading;

  const handleSubmit = useCallback(async () => {
    if (!canSubmit) return;
    setIsLoading(true);
    setErr(null);

    try {
      const res = await fetch(loginEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: userId.trim(),
          password: password,
          rememberMe: remember,
        }),
        credentials: "include", // 쿠키 기반 인증을 위해 필수
      });

      if (!res.ok) {
        // 백엔드에서 텍스트로 에러 메시지를 보내므로 .text()를 사용합니다.
        const errorText = await res.text();
        throw new Error(errorText || `로그인 실패: ${res.status} ${res.statusText}`);
      }

      // 성공 시, 응답 본문이 "로그인 성공" 문자열이므로 별도로 파싱하지 않습니다.
      onSuccess?.({ userId: userId.trim() });

      // 로그인 성공 후 /search 경로로 이동
      navigate("/search");
      // 필요 시 토큰/세션 저장 로직 추가 (localStorage 등)
      // if (data?.token) localStorage.setItem("token", data.token);

    } catch (e: any) {
      setErr(e?.message ?? "네트워크 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  }, [canSubmit, loginEndpoint, onSuccess, password, remember, userId, navigate]);

  const onKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (e) => {
    if (e.key === "Enter") {
      handleSubmit();
    }
  };

  return (
    <div className="fixed inset-0 bg-neutral-900 text-neutral-100 flex items-center justify-center px-4">
      <Card className="bg-neutral-900/60 border-neutral-800 shadow-none w-full max-w-md">
        <CardHeader className="border-b border-neutral-800">
          <div className="flex flex-col items-center gap-2">
            {/* 로고/타이틀 영역 - 필요하면 로고 이미지로 교체 */}
            <div className="h-10 w-10 rounded-xl bg-sky-500/20 border border-sky-500/40 flex items-center justify-center text-sky-400 font-bold">
              P+
            </div>
            <CardTitle className="tracking-tight">PACS+ 로그인</CardTitle>
            <p className="text-sm text-neutral-400">계정으로 로그인하여 서비스를 이용하세요</p>
          </div>
        </CardHeader>

        <CardContent className="p-6 space-y-5">
          {/* 아이디 */}
          <div className="space-y-2">
            <label className="text-sm text-neutral-300">아이디</label>
            <Input
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="예: doctorA"
              className="h-11 rounded-lg bg-neutral-800 border-neutral-700 placeholder:text-neutral-500"
              autoComplete="username"
            />
          </div>

          {/* 비밀번호 + 보기 토글 */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm text-neutral-300">비밀번호</label>
              <button
                type="button"
                onClick={() => setShowPw((v) => !v)}
                className="text-xs text-neutral-400 hover:text-neutral-200 underline underline-offset-4"
              >
                {showPw ? "숨기기" : "표시"}
              </button>
            </div>
            <Input
              type={showPw ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="••••••••"
              className="h-11 rounded-lg bg-neutral-800 border-neutral-700 placeholder:text-neutral-500"
              autoComplete="current-password"
            />
          </div>

          {/* 옵션들 */}
          <div className="flex items-center justify-between">
            <label className="inline-flex items-center gap-2 text-sm text-neutral-400 select-none">
              <input
                type="checkbox"
                className="size-4 rounded border-neutral-700 bg-neutral-800"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
              />
              자동 로그인
            </label>
            <a href="#" className="text-sm text-neutral-400 hover:text-neutral-200 underline underline-offset-4">
              비밀번호 찾기
            </a>
          </div>

          {/* 에러 메시지 */}
          {err && (
            <div className="rounded-md border border-red-800/60 bg-red-900/20 p-3 text-sm text-red-300">
              {err}
            </div>
          )}

          {/* 로그인 버튼 */}
          <Button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="h-11 w-full rounded-full bg-sky-500 hover:bg-sky-600 disabled:bg-sky-800"
          >
            {isLoading ? "로그인 중..." : "로그인"}
          </Button>

          {/* 구분선 + 안내 */}
          <div className="pt-1 text-center text-xs text-neutral-500">
            보안 환경에서만 사용하세요. 무단 사용 금지.
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
