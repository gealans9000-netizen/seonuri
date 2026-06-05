# 서누리공동체(양지온누리교회) 회계현황 — Vercel 버전

기존 Google Apps Script 대시보드를 **Vercel**로 옮긴 버전입니다.
데이터(구글시트)는 그대로 두고, 기존 Apps Script 웹앱을 **API로 재사용**합니다.

## 구조

```
seonuri-vercel/
├── index.html      ← 대시보드 (프론트엔드). 거의 원본 그대로, 상단에 API 연동 shim만 추가
├── api/
│   └── data.js     ← Vercel 서버리스 프록시. Apps Script를 서버에서 호출 (CORS 문제 없음)
├── .gitignore
└── README.md
```

### 동작 흐름

```
브라우저 → /api/data?year=2026  →  (Vercel 서버)  →  Apps Script /exec?action=getData&year=2026  →  구글시트
```

- 브라우저는 **같은 도메인**(`/api/data`)만 호출하므로 CORS·리다이렉트 이슈가 없습니다.
- 기존 `Code.gs`는 **수정할 필요 없습니다.** (`doGet`이 이미 `action=getData` JSON 응답을 지원)

---

## 배포 방법 (둘 중 택1)

### 방법 A. GitHub + Vercel (권장)

1. 이 폴더를 GitHub 저장소에 올립니다.
2. [vercel.com](https://vercel.com) 로그인 → **Add New… → Project** → 해당 저장소 선택.
3. Framework Preset 은 자동으로 **Other**(빌드 없음)로 잡힙니다. 그대로 **Deploy**.
4. (선택) 배포 후 **Settings → Environment Variables** 에 아래 추가하면 URL을 코드에서 분리할 수 있습니다.
   - Key: `GAS_URL`
   - Value: `https://script.google.com/macros/s/.../exec`
   - 추가했다면 한 번 **Redeploy**.

### 방법 B. Vercel CLI

```bash
npm i -g vercel
cd seonuri-vercel
vercel          # 첫 배포 (질문은 기본값 Enter)
vercel --prod   # 프로덕션 배포
```

배포가 끝나면 `https://<프로젝트>.vercel.app` 주소가 나옵니다. 끝.

---

## 사전 조건 (중요)

Apps Script 웹앱이 **누구나 접근 가능**으로 배포돼 있어야 Vercel 프록시가 데이터를 읽을 수 있습니다.

- Apps Script 편집기 → **배포 → 배포 관리** →
  - 실행 사용자: **나(소유자)**
  - 액세스 권한: **모든 사용자(익명 포함)**
- 변경했으면 **새 버전으로 다시 배포**하고, 그때 나온 `/exec` URL을 `GAS_URL`(또는 `api/data.js` 기본값)에 넣으세요.

---

## 자주 바뀌는 값 정리

| 항목 | 위치 |
|---|---|
| Apps Script URL | `api/data.js` 의 `DEFAULT_GAS_URL` 또는 환경변수 `GAS_URL` |
| 비밀번호(2579) | `index.html` 의 `var PW_CORRECT = '2579';` |
| 캐시 시간(60초) | `api/data.js` 의 `Cache-Control` |
| 데이터 소스 경로 | `index.html` 상단 `var API_BASE = '/api/data';` |

---

## 참고 / 다음 단계

- 지금은 Apps Script를 거치므로 구글시트만 수정하면 자동 반영됩니다(최대 1분 캐시 지연).
- 나중에 Apps Script 의존성까지 없애고 싶으면, `api/data.js` 안에서 Google Sheets API로
  직접 시트를 읽도록 바꾸면 됩니다(서비스 계정 + 시트 공유 필요). 이 경우 `index.html` 은 그대로 둬도 됩니다.
