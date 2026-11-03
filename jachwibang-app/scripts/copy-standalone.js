// 혼자 열리는 3D 시뮬레이터(assets/simulator/oneroom-standalone.html)를 public/sim.html 로 복사한다.
// 배포 주소에서 /sim.html 로 로그인 없이 3D 시뮬레이션만 해볼 수 있게 하기 위함 (vercel.json 빌드 명령에서 실행).
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const src = path.join(root, 'assets', 'simulator', 'oneroom-standalone.html');
const out = path.join(root, 'public', 'sim.html');

fs.mkdirSync(path.dirname(out), { recursive: true });
fs.copyFileSync(src, out);
console.log(`standalone simulator -> ${path.relative(root, out)}`);
