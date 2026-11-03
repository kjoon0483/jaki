// 혼자 열리는 3D 시뮬레이터(assets/simulator/oneroom-standalone.html)를 public/sim.html 로 복사한다.
// 배포 주소에서 /sim.html 로 로그인 없이 3D 시뮬레이션만 해볼 수 있게 하기 위함 (vercel.json 빌드 명령에서 실행).
// 복사하면서 아래에 '가입하고 내 방 만들기' 막대를 넣어, 체험해 본 사람이 바로 앱 회원가입으로 갈 수 있게 한다.
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const src = path.join(root, 'assets', 'simulator', 'oneroom-standalone.html');
const out = path.join(root, 'public', 'sim.html');

// 가구를 골랐을 때 나오는 아래 막대(#selbar), 가구를 끄는 중, 1인칭으로 걷는 중에는 가린다.
const JOIN_BAR = `
<style>
  #joinCta { position: fixed; left: 50%; transform: translateX(-50%); bottom: calc(env(safe-area-inset-bottom, 0px) + 14px);
    display: flex; align-items: center; gap: 4px; padding: 6px 6px 6px 16px; border-radius: 999px; z-index: 30;
    background: #FFFFFF; color: #14232E; box-shadow: 0 4px 18px rgba(20, 35, 46, 0.18); font-size: 13px; white-space: nowrap;
    font-family: "Malgun Gothic", "Apple SD Gothic Neo", "Noto Sans KR", system-ui, sans-serif; }
  #joinCta a { margin-left: 6px; padding: 8px 14px; border-radius: 999px; background: #0B6FA4; color: #FFFFFF;
    font-weight: 700; text-decoration: none; }
  #joinCta button { border: 0; background: none; color: #52646F; font-size: 16px; padding: 4px 8px; cursor: pointer; }
  #selbar:not([hidden]) ~ #joinCta, body.walking #joinCta, body.dragItem #joinCta { display: none; }
  @media (prefers-color-scheme: dark) { #joinCta { background: #18232B; color: #EAF2F7; } #joinCta a { background: #7FBCE3; color: #0B141A; } }
</style>
<div id="joinCta">
  <span>마음에 드세요?</span>
  <a href="/?signup=1">가입하고 내 방 만들기</a>
  <button type="button" aria-label="닫기" onclick="this.parentNode.remove()">×</button>
</div>
`;

const html = fs.readFileSync(src, 'utf8');
if (!html.includes('</body>')) throw new Error('oneroom-standalone.html 에 </body> 가 없어요');
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, html.replace('</body>', JOIN_BAR + '</body>'));
console.log(`standalone simulator -> ${path.relative(root, out)}`);
