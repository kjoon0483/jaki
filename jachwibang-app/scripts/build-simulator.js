// assets/simulator/oneroom.html 을 문자열 모듈로 변환해서
// WebView(네이티브)와 iframe srcDoc(웹)에서 같은 HTML을 쓰도록 한다.
// HTML을 수정한 뒤에는 `npm run build:simulator` 로 다시 생성하세요.
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const src = path.join(root, 'assets', 'simulator', 'oneroom.html');
const out = path.join(root, 'src', 'generated', 'oneroom-html.ts');

const html = fs.readFileSync(src, 'utf8');
const body =
  '// 자동 생성 파일입니다. 직접 수정하지 말고 assets/simulator/oneroom.html 을 고친 뒤\n' +
  '// `npm run build:simulator` 를 실행하세요.\n' +
  `const ONEROOM_HTML = ${JSON.stringify(html)};\n\nexport default ONEROOM_HTML;\n`;

fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, body);
console.log(`simulator html -> ${path.relative(root, out)} (${html.length} chars)`);
