// UserPromptSubmit hook: re-inject the Korean response rule every turn so it stays close to the latest context.
const RULE = [
  '[응답 언어 규칙] 이번 응답은 한국어로 작성한다.',
  '- 코드 식별자, 파일 경로, 명령어, API/제품/도구 이름, 에러 메시지, 인용한 출력은 원문 그대로 둔다.',
  '- 업계에서 원어나 음차로 굳어진 외래어·기술 용어(예: hook, commit, merge, prompt, token, 컴포넌트, 렌더링)는 억지로 우리말로 바꾸지 않는다. 번역하면 의미가 흐려지는 용어도 원어를 유지한다.',
  '- 사용자가 명시적으로 다른 언어를 요청한 범위에서는 그 언어를 따른다.',
].join('\n');

// \u-escape non-ASCII so the JSON survives any console code page on Windows.
const out = JSON.stringify({
  hookSpecificOutput: { hookEventName: 'UserPromptSubmit', additionalContext: RULE },
}).replace(/[\u0080-￿]/g, (c) => '\\u' + c.charCodeAt(0).toString(16).padStart(4, '0'));

process.stdout.write(out);
