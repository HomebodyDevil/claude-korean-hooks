# korean-hooks

Claude Code가 한국어로 응답하도록 강제하는 훅 플러그인입니다.

| 훅 | 동작 |
|---|---|
| `UserPromptSubmit` | 매 프롬프트마다 한국어 응답 규칙을 컨텍스트에 주입 |
| `Stop` | 이번 턴 응답이 한국어가 아니면 1회 한국어 재작성을 요청 (`stop_hook_active`로 루프 방지) |

코드 식별자, 경로, 명령어, 제품명, 에러 메시지, 인용 출력, 굳어진 외래어·기술 용어는 원문을 유지하도록 지시합니다.
판정은 코드블록·인라인 코드·URL·경로를 제외한 단어 중 한글 포함 단어 비율이 10% 미만일 때입니다. 8단어 미만 응답과, 프롬프트에 "영어로"·"in English" 등 다른 언어 요청이 있는 턴은 판정하지 않습니다.

## 요구 사항

- Claude Code
- `node`가 PATH에 있어야 합니다.

## 설치

GitHub에 올린 경우:

```shell
claude plugin marketplace add HomebodyDevil/claude-korean-hooks
claude plugin install korean-hooks@claude-korean-hooks
```

로컬 폴더에서:

```shell
claude plugin marketplace add <이 폴더 경로>
claude plugin install korean-hooks@claude-korean-hooks
```

설치 후 새 세션부터 적용됩니다.

## 조정

`scripts/korean-enforce.js` 상단의 `MIN_WORDS`, `MIN_HANGUL_RATIO`로 판정 기준을 바꿉니다. 변경 후 `node scripts/korean-enforce.test.js`로 확인하세요.
