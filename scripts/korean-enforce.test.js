// Run: node korean-enforce.test.js
const assert = require('assert');
const { shouldBlock } = require('./korean-enforce');

const t = (reply, prompt = '') => shouldBlock({ reply, prompt });

// English reply → block
assert.strictEqual(t('I updated the settings file and added two hooks. The Stop hook now checks the reply language before finishing.'), true);
// Korean reply heavy with English terms and code → pass
assert.strictEqual(t('`UserPromptSubmit` hook에서 additionalContext로 규칙을 주입하고, Stop hook은 transcript를 읽어 commit 전에 token 비율을 검사합니다.\n```js\nconst x = require("fs");\nconsole.log("hello world this is code");\n```'), false);
// Korean prose with paths and URLs → pass
assert.strictEqual(t('C:/Users/me/project/src/main.js 파일을 만들었고 https://example.com/docs/hooks 문서를 참고했습니다. 설정은 settings.json에 넣었습니다.'), false);
// Term-heavy Korean progress note (ratio ~0.15, seen in real transcripts) → pass
assert.strictEqual(t('Scene DiceStage Override Editor Prefab DiceRoller Animator Controller Material Shader Texture Sprite Canvas EventSystem Camera Light 연결 상태를 확인하겠습니다.'), false);
// Short reply → not judged
assert.strictEqual(t('Done.'), false);
// Mostly code block with a one-line Korean note → pass
assert.strictEqual(t('수정했습니다.\n```\nfunction foo() { return bar(baz, qux, quux, corge, grault); }\n```'), false);
// English requested explicitly → pass
assert.strictEqual(t('Here is the full answer in English as you asked, covering all the points above.', '영어로 답해줘'), false);

console.log('ok');
