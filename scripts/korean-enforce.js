// Stop hook: if this turn's reply is mostly non-Korean, block once and ask Claude to rewrite it in Korean.
const fs = require('fs');

const MIN_WORDS = 8;         // too short to judge ("Done.", a bare path, etc.)
const MIN_HANGUL_RATIO = 0.1; // real transcripts: English replies 0–0.04, term-heavy Korean replies down to ~0.16

// Remove content that is legitimately non-Korean: code, inline code, URLs, paths, link targets, table rules.
function stripNonProse(text) {
  return text
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/~~~[\s\S]*?~~~/g, ' ')
    .replace(/`[^`\n]*`/g, ' ')
    .replace(/\]\([^)]*\)/g, ']')
    .replace(/https?:\/\/\S+/g, ' ')
    .replace(/(?:[A-Za-z]:)?[\w.~-]*[\\/][\w.\\/~-]+/g, ' ')
    .replace(/^\s*\|?[\s:|-]+\|?\s*$/gm, ' ');
}

// Word-level ratio, not character-level: one Hangul syllable carries as much as several Latin letters.
function hangulRatio(text) {
  const words = stripNonProse(text).split(/\s+/).filter((w) => /[A-Za-z가-힣]/.test(w));
  if (words.length < MIN_WORDS) return null;
  const korean = words.filter((w) => /[가-힣ㄱ-ㆎ]/.test(w)).length;
  return korean / words.length;
}

function isRealPrompt(e) {
  if (e.type !== 'user' || e.isMeta) return false;
  const c = e.message && e.message.content;
  if (typeof c === 'string') return true;
  return Array.isArray(c) && c.some((b) => b.type === 'text');
}

function promptText(e) {
  const c = e.message.content;
  return typeof c === 'string' ? c : c.filter((b) => b.type === 'text').map((b) => b.text).join('\n');
}

// All assistant text since the last real user prompt, plus that prompt.
function lastTurn(transcriptPath) {
  const lines = fs.readFileSync(transcriptPath, 'utf8').split('\n');
  const texts = [];
  let prompt = '';
  for (let i = lines.length - 1; i >= 0; i--) {
    if (!lines[i].trim()) continue;
    let e;
    try { e = JSON.parse(lines[i]); } catch { continue; }
    if (isRealPrompt(e)) { prompt = promptText(e); break; }
    if (e.type === 'assistant' && !e.isSidechain && Array.isArray(e.message && e.message.content)) {
      for (const b of e.message.content) if (b.type === 'text') texts.unshift(b.text);
    }
  }
  return { reply: texts.join('\n'), prompt };
}

// User explicitly asked for another language this turn.
function otherLanguageRequested(prompt) {
  return /(영어|일본어|중국어|영문)\s*(로|으로)|in english|in japanese|in chinese|respond in|answer in|reply in/i.test(prompt);
}

function shouldBlock({ reply, prompt }) {
  if (otherLanguageRequested(prompt)) return false;
  const ratio = hangulRatio(reply);
  return ratio !== null && ratio < MIN_HANGUL_RATIO;
}

const REASON = [
  '직전 응답이 한국어가 아니다. 같은 내용을 한국어로 다시 작성해 최종 응답으로 출력하라.',
  '- 툴을 다시 실행하거나 작업을 반복하지 말고, 이미 한 작업의 결과만 한국어로 다시 전달한다.',
  '- 코드 식별자, 파일 경로, 명령어, API/제품/도구 이름, 에러 메시지, 인용 출력, 코드 블록은 원문 그대로 둔다.',
  '- 원어나 음차로 굳어진 외래어·기술 용어(예: hook, commit, merge, prompt, token)와 번역하면 의미가 흐려지는 용어는 억지로 우리말로 바꾸지 않는다.',
].join('\n');

function main() {
  let input;
  try { input = JSON.parse(fs.readFileSync(0, 'utf8')); } catch { return; }
  if (input.stop_hook_active) return; // already retried once; never loop
  let turn;
  try {
    turn = input.transcript_path ? lastTurn(input.transcript_path) : null;
  } catch { return; }
  if (!turn || !turn.reply) {
    if (typeof input.last_assistant_message !== 'string') return;
    turn = { reply: input.last_assistant_message, prompt: '' };
  }
  if (!shouldBlock(turn)) return;
  const out = JSON.stringify({ decision: 'block', reason: REASON })
    .replace(/[\u0080-￿]/g, (c) => '\\u' + c.charCodeAt(0).toString(16).padStart(4, '0'));
  process.stdout.write(out);
}

if (require.main === module) main();
module.exports = { hangulRatio, shouldBlock, lastTurn };
