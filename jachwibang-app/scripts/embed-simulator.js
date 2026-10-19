// 혼자 돌아가는 원룸 시뮬레이터 HTML(팀에서 받은 새 버전)에 앱 연결 부분을 붙여
// assets/simulator/oneroom.html 로 저장하고, 앱이 쓰는 파일(src/generated)까지 다시 만든다.
//   npm run embed:simulator                       (assets/simulator/oneroom-standalone.html 사용)
//   npm run embed:simulator -- "../새 시뮬레이터.html"   (다른 파일 사용)
// 붙이는 것: 앱과 메시지 주고받기(저장·불러오기·미리보기 사진), 커뮤니티 보기 전용 모드,
// 앱 파랑 색상, 휴대폰용 아래쪽 패널, 앱 안에서는 브라우저 자동 저장 끄기, 예전 형식 방 불러오기.
// 새 버전에서 고칠 자리를 못 찾으면 어디인지 알려주고 멈춘다.
const fs = require('fs');
const path = require('path');
// 기본 원본: assets/simulator/oneroom-standalone.html (팀이 고치는 혼자 열리는 시뮬레이터). 다른 파일을 쓰려면 경로를 넘긴다.
const src = process.argv[2] || path.join(__dirname, '..', 'assets', 'simulator', 'oneroom-standalone.html');
const out = path.join(__dirname, '..', 'assets', 'simulator', 'oneroom.html');
let s = fs.readFileSync(src, 'utf8').replace(/\r\n/g, '\n');

function rep(a, b, all) {
  const n = s.split(a).length - 1;
  if (all ? n < 1 : n !== 1) throw new Error(`expected ${all ? '>=1' : '1'} match, got ${n}: ${a.slice(0, 80)}`);
  s = all ? s.split(a).join(b) : s.replace(a, () => b);
}

// 1) App palette (cerulean blue), light + dark
rep(`    --bg: #DCE3E6; --panel: rgba(247,249,250,0.94); --ink: #1E2A31; --muted: #5B6A72;
    --line: #C3CDD2; --accent: #3552A6; --accent-ink: #FFFFFF; --danger: #B03A3A;`,
`    --bg: #DCE9F1; --panel: rgba(244,249,252,0.95); --ink: #14232E; --muted: #52646F;
    --line: #BCD3E2; --accent: #0B6FA4; --accent-ink: #FFFFFF; --danger: #A83A34;`);
rep(`--bg: #151B20; --panel: rgba(28,36,42,0.94); --ink: #E6ECEF; --muted: #9AA8B0;
      --line: #34424B; --accent: #7F9BEA; --accent-ink: #0F1720; --danger: #E27C7C;`,
`--bg: #0F171D; --panel: rgba(24,35,43,0.95); --ink: #EAF2F7; --muted: #A6B6C0;
      --line: #2C3F4C; --accent: #7FBCE3; --accent-ink: #0B141A; --danger: #D4837A;`);
rep(`    --bg: #151B20; --panel: rgba(28,36,42,0.94); --ink: #E6ECEF; --muted: #9AA8B0;
    --line: #34424B; --accent: #7F9BEA; --accent-ink: #0F1720; --danger: #E27C7C;`,
`    --bg: #0F171D; --panel: rgba(24,35,43,0.95); --ink: #EAF2F7; --muted: #A6B6C0;
    --line: #2C3F4C; --accent: #7FBCE3; --accent-ink: #0B141A; --danger: #D4837A;`);
rep('0x3552A6', '0x0B6FA4', true);

// 2) Phone layout + read-only view bar styles
rep(`</style>`, `
  /* ---------- 앱 안에서: 설정 패널을 화면 아래쪽 시트로 ---------- */
  .hud {
    top: auto; bottom: 0; left: 0; right: 0; width: 100%;
    display: flex; justify-content: center;
    padding: 0 8px calc(env(safe-area-inset-bottom, 0px) + 8px);
  }
  .panel { width: 100%; max-width: 760px; max-height: none; }
  .phead { padding: 8px 12px; align-items: center; }
  .phead h1 { display: none; }
  .viewbar { padding: 0 12px 8px; }
  .pbody { max-height: min(34vh, 300px); }
  body.has-sel .hud { display: none; }
  .helpBtn { padding: 5px 10px; font-size: 12.5px; }

  /* ---------- 보기 전용(커뮤니티에서 열었을 때) ---------- */
  #viewBar { display: none; }
  body.readonly .hud, body.readonly .selbar, body.readonly .helpBtn { display: none !important; }
  body.readonly #viewBar {
    display: flex; position: fixed; left: 0; right: 0; bottom: 0; justify-content: center; pointer-events: none;
    padding: 0 12px calc(env(safe-area-inset-bottom, 0px) + 12px);
  }
  body.readonly.walking #viewBar { display: none; }
  #viewBar .card { display: flex; gap: 6px; padding: 8px; pointer-events: auto; }
  #viewBar button { padding: 8px 14px; border-radius: 999px; font-weight: 600; }
</style>`);
rep(`<div class="selbar" id="selbar" hidden>`, `<div id="viewBar">
  <div class="card" role="group" aria-label="보기 방식">
    <button id="vb3d" aria-pressed="true">3인칭</button>
    <button id="vbTop" aria-pressed="false">위에서</button>
    <button id="vbWalk">1인칭</button>
  </div>
</div>

<div class="selbar" id="selbar" hidden>`);

// 3) Embedded / read-only / paused state
rep(`  const $ = (id) => document.getElementById(id);\n`, `  const $ = (id) => document.getElementById(id);
  // 앱(휴대폰 WebView·웹 iframe) 안에서 열렸는지. 앱 안에서는 방 저장을 앱이 맡는다.
  const EMBED = !!window.__ONEROOM_EMBED || window.parent !== window;
  let readonly = false;   // 커뮤니티에서 연 방: 둘러보기만 가능
  let paused = false;     // 미리보기 사진만 찍는 숨은 화면: 매 프레임 그리기를 멈춰 배터리를 아낀다
`);

// 4) Read-only: no editing by pointer or keyboard
rep(`    if (walk) { walkDown(e); return; }\n`, `    if (walk) { walkDown(e); return; }\n    if (readonly) return;\n`);
rep(`    if (walk) { walkMove(e); return; }\n`, `    if (walk) { walkMove(e); return; }\n    if (readonly) return;\n`);
rep(`    if (walk) { walkUp(e); return; }\n`, `    if (walk) { walkUp(e); return; }\n    if (readonly) { downAt = null; return; }\n`);
rep(`    if (walk) return;\n    if (e.key === 'r'`, `    if (walk || readonly) return;\n    if (e.key === 'r'`);

// 5) Panel starts folded in the app; hide it while the furniture edit bar is up
rep(`  if (window.innerWidth < 600) setCollapsed(true);\n`, `  if (EMBED || window.innerWidth < 600) setCollapsed(true);
  // 가구를 선택하면 아래 시트를 숨기고 편집 막대만 보여준다.
  new MutationObserver(() => { document.body.classList.toggle('has-sel', !$('selbar').hidden); applyViewOffset(); })
    .observe($('selbar'), { attributes: true, attributeFilter: ['hidden'] });
`);

// 6) In the app, rooms are saved by the app: no browser auto-save/restore, no file save section
rep(`  setInterval(() => saveNow(true), 2000);
  window.addEventListener('beforeunload', () => saveNow(true));`, `  if (!EMBED) {
    setInterval(() => saveNow(true), 2000);
    window.addEventListener('beforeunload', () => saveNow(true));
  } else {
    $('saveFile').closest('section').hidden = true;
  }`);
rep(`    try { s = localStorage.getItem(SAVE_KEY); } catch (e) {}
    if (s) {`, `    try { s = EMBED ? null : localStorage.getItem(SAVE_KEY); } catch (e) {}
    if (s) {`);

// 7) Loop: pause support + hidden-wall update shared with the preview photo
rep(`    const dt = clock.getDelta();\n`, `    const dt = clock.getDelta();
    // 사진 찍기(captureThumb)는 직접 그리므로, 멈춘 동안에는 아무것도 그리지 않는다.
    if (paused) { requestAnimationFrame(tick); return; }
`);
rep(`    // walls facing the camera become invisible but still cast shadows (so curtains/walls keep blocking sun)
    outerWalls.forEach(function (w) {
      tmp.copy(camera.position).sub(w.center);
      const hide = !walk && tmp.dot(w.normal) > 0.15;
      if (hide !== w.hidden) {
        w.hidden = hide;
        w.g.traverse(function (m) { if (m.isMesh) m.material = hide ? M.hiddenWall : m.userData.mat; });
      }
    });
`, `    updateHiddenWalls();
`);

// 7b) Phone (touch) screens
// 원본에서 .hud 를 닫는 </div> 가 빠져 있으면 도움말·1인칭 버튼·가구 편집 막대가 패널 묶음 안에 들어가,
// 1인칭(패널 숨김)일 때 이동 버튼까지 같이 사라진다. 여닫는 수가 안 맞을 때만 채운다.
{
  const body = s.slice(s.indexOf('<body>'), s.indexOf('<script'));
  const missing = (body.match(/<div\b/g) || []).length - (body.match(/<\/div>/g) || []).length;
  if (missing > 0) rep('\n<button class="helpBtn"', '\n' + '</div>'.repeat(missing) + '\n<button class="helpBtn"');
}
rep(`</style>`, `
  /* ---------- 터치 화면(휴대폰): 누르기 쉬운 크기 ---------- */
  body.touch button, body.touch select { min-height: 36px; }
  body.touch .tabs button { min-height: 42px; }
  body.touch input[type="range"] { height: 28px; }
  body.touch .selbar .card { max-height: 46vh; overflow-y: auto; -webkit-overflow-scrolling: touch; overscroll-behavior: contain; }

  /* ---------- 터치 화면 1인칭: 왼쪽 조이스틱으로 걷고, 화면을 끌어 둘러보고, 오른쪽 버튼으로 문·조명 ---------- */
  body.touch .walkPad, body.touch .walkPrompt, body.touch.walking .helpBtn { display: none !important; }
  .joy, .useBtn { display: none; }
  body.touch.walking .joy, body.touch.walking .useBtn { display: block; }
  .joy {
    position: fixed; left: 18px; bottom: calc(env(safe-area-inset-bottom, 0px) + 22px); z-index: 20;
    width: 132px; height: 132px; border-radius: 50%; touch-action: none; user-select: none; -webkit-user-select: none;
    background: rgba(14,28,38,0.28); border: 2px solid rgba(255,255,255,0.6);
  }
  .joy .knob {
    position: absolute; left: 50%; top: 50%; width: 58px; height: 58px; margin: -29px 0 0 -29px; border-radius: 50%;
    background: rgba(255,255,255,0.92); box-shadow: 0 2px 8px rgba(0,0,0,0.25); pointer-events: none;
  }
  .useBtn {
    position: fixed; right: 18px; bottom: calc(env(safe-area-inset-bottom, 0px) + 50px); z-index: 20;
    min-width: 84px; height: 64px; padding: 0 16px; border-radius: 32px; touch-action: none;
    background: var(--panel); border: 1px solid var(--line); font-weight: 600; font-size: 14px;
  }
  .useBtn:disabled { opacity: 0.45; }
  body.touch .walkHelp { padding: 6px 8px 6px 12px; gap: 8px; }
  body.touch .walkHelp span { display: none; }
  body.touch .walkHelp strong { white-space: normal; font-weight: 600; }
  body.touch .walkHelp strong::after { content: ' · 왼쪽 원으로 걷고 화면을 끌어 둘러봐요'; font-weight: 400; color: var(--muted); }
</style>`);
// 휴대폰에서는 손가락으로 끄는 거리가 짧아서 고개 돌리는 감도를 높인다.
rep(`    yaw -= dx * 0.0022; pitch -= dy * 0.0022;`, `    const ls = document.body.classList.contains('touch') ? 0.005 : 0.0022;
    yaw -= dx * ls; pitch -= dy * ls;`);
// 앱 안에서는 아래쪽 패널·편집 막대·보기 버튼이 가리는 만큼 방을 위로 올려, 보이는 곳 가운데에 둔다.
rep(`    camera.clearViewOffset();   // the panel floats over the view; opening or closing it never moves the picture
    camera.updateProjectionMatrix();`, `    camera.clearViewOffset();
    const bar = !EMBED || walk ? null : readonly ? $('viewBar') : document.body.classList.contains('has-sel') ? $('selbar') : document.querySelector('.hud');
    const r = bar ? bar.getBoundingClientRect() : null;
    const cover = r && r.height > 0 ? Math.max(0, Hh - r.top) : 0;
    if (cover > 0) camera.setViewOffset(W, Hh, 0, Math.round(cover / 2), W, Hh);
    camera.updateProjectionMatrix();`);
rep(`  // ---------- loop ----------\n`, `  // ---------- 터치 화면(휴대폰): 1인칭 조이스틱과 문·조명 버튼 ----------
  const TOUCH = navigator.maxTouchPoints > 0 || 'ontouchstart' in window || window.matchMedia('(pointer: coarse)').matches;
  document.body.classList.toggle('touch', TOUCH);
  const joy = document.createElement('div'); joy.className = 'joy'; joy.id = 'joy';
  joy.setAttribute('role', 'application'); joy.setAttribute('aria-label', '이동 조이스틱: 누른 채로 가고 싶은 쪽으로 미세요');
  const knob = document.createElement('div'); knob.className = 'knob'; joy.appendChild(knob);
  const useBtn = document.createElement('button'); useBtn.className = 'useBtn'; useBtn.textContent = '사용';
  $('walkHud').append(joy, useBtn);
  let joyId = null;
  // 원 안에서 민 방향을 W·A·S·D 로 바꾼다. 가장자리까지 밀면 달리기.
  function setJoy(dx, dy) {
    const max = joy.offsetWidth / 2 - 10 || 56, len = Math.hypot(dx, dy), k = len > max ? max / len : 1;
    dx *= k; dy *= k;
    knob.style.transform = 'translate(' + dx + 'px,' + dy + 'px)';
    const nx = dx / max, ny = dy / max;
    keys.KeyW = ny < -0.35; keys.KeyS = ny > 0.35; keys.KeyA = nx < -0.35; keys.KeyD = nx > 0.35;
    keys.ShiftLeft = Math.hypot(nx, ny) > 0.92;
  }
  function joyPoint(e) { const r = joy.getBoundingClientRect(); setJoy(e.clientX - r.left - r.width / 2, e.clientY - r.top - r.height / 2); }
  joy.addEventListener('pointerdown', function (e) {
    e.preventDefault(); e.stopPropagation(); joyId = e.pointerId;
    try { joy.setPointerCapture(e.pointerId); } catch (err) {}
    joyPoint(e);
  });
  joy.addEventListener('pointermove', function (e) { if (e.pointerId === joyId) { e.preventDefault(); joyPoint(e); } });
  ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(function (ev) {
    joy.addEventListener(ev, function (e) { if (e.pointerId === joyId) { joyId = null; setJoy(0, 0); } });
  });
  useBtn.addEventListener('click', useTarget);
  // 바라보는 곳에 문·조명이 있으면 버튼 글자를 바꾸고, 없으면 흐리게.
  (function syncUse() {
    if (walk && TOUCH) {
      const label = ($('walkPrompt').textContent || '').replace(/^E · /, '');
      if (useBtn.textContent !== (label || '사용')) useBtn.textContent = label || '사용';
      useBtn.disabled = !label;
    } else if (joyId !== null) { joyId = null; setJoy(0, 0); }
    requestAnimationFrame(syncUse);
  })();

  // ---------- loop ----------
`);

// 7c) Editing on a small screen: shorter panel, furniture picker buttons, tools fold the panel,
//     camera follows the room when it grows or shrinks
rep(`</style>`, `
  /* ---------- 앱 안: 편집 목록을 작은 화면에 맞게 ---------- */
  body.embed #modeHelp { display: none; }
  /* 펼친 동안엔 보기 버튼 줄을 숨겨 3D 화면을 더 남긴다 (접으면 다시 보임) */
  body.embed .panel:not(.collapsed) .viewbar { display: none; }
  body.embed .pbody { max-height: min(30vh, 260px); }
  body.embed section { padding-top: 10px; }
  body.embed .help { font-size: 12px; }
  .pick .cats { display: flex; gap: 6px; overflow-x: auto; scrollbar-width: none; padding-bottom: 8px; }
  .pick .cats::-webkit-scrollbar { display: none; }
  .pick .cats button { white-space: nowrap; flex-shrink: 0; border-radius: 999px; padding: 5px 12px; }
  .pick .items { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; }
  .pick .items button { padding: 8px 4px; font-size: 12.5px; line-height: 1.25; word-break: keep-all; }
  /* 도구를 고르면 목록이 접히고, 위에 지금 하는 일과 [설정]·[완료]가 뜬다 */
  .modeChip {
    position: fixed; top: calc(env(safe-area-inset-top, 0px) + 10px); left: 10px; right: 112px; z-index: 25;
    display: flex; align-items: center; gap: 6px; padding: 6px 6px 6px 12px; font-size: 12.5px;
  }
  .modeChip[hidden], body.walking .modeChip, body.readonly .modeChip { display: none; }
  .modeChip .mcText { flex: 1; min-width: 0; color: var(--muted); line-height: 1.3; }
  .modeChip .mcText b { color: var(--ink); margin-right: 4px; }
  .modeChip button { flex-shrink: 0; }
  .modeChip .mcDone { background: var(--accent); color: var(--accent-ink); border-color: var(--accent); }
</style>`);
rep(`  function setMode(m) {\n    mode = m;\n`, `  function setMode(m) {\n    mode = m;\n    if (window.__modeHook) window.__modeHook(m);\n`);
rep(`  // ---------- loop ----------\n`, `  // ---------- 앱 안: 작은 화면에서 편집하기 ----------
  document.body.classList.toggle('embed', EMBED);
  if (EMBED) {
    // 가구 추가: 드롭다운 대신 종류 버튼 + 가구 버튼. 누르면 바로 놓고 목록을 접어 놓인 가구가 보이게.
    const sel = $('addSel'), groups = Array.from(sel.querySelectorAll('optgroup'));
    const pick = document.createElement('div'); pick.className = 'pick';
    const cats = document.createElement('div'); cats.className = 'cats';
    cats.setAttribute('role', 'group'); cats.setAttribute('aria-label', '가구 종류');
    const items = document.createElement('div'); items.className = 'items';
    function showCat(i) {
      Array.from(cats.children).forEach((b, j) => b.setAttribute('aria-pressed', String(i === j)));
      items.textContent = '';
      Array.from(groups[i].children).forEach(function (o) {
        const b = document.createElement('button'); b.textContent = o.textContent;
        b.addEventListener('click', function () { sel.value = o.value; $('addBtn').click(); setCollapsed(true); });
        items.appendChild(b);
      });
    }
    groups.forEach(function (g, i) {
      const b = document.createElement('button'); b.textContent = g.label;
      b.addEventListener('click', () => showCat(i)); cats.appendChild(b);
    });
    if (groups.length) { pick.append(cats, items); sel.parentElement.hidden = true; sel.parentElement.after(pick); showCat(0); }

    // 도구를 고르면 목록을 접고 위에 안내를 띄운다. 방 만들기는 입구·문을 골라야 해서 목록을 그대로 둔다.
    const MODE_TIPS = {
      resize: '방 밖 손잡이를 끌어 벽을 옮겨요',
      wall: '바닥을 끌어 벽을 그려요',
      room: '대각선으로 끌어 방을 만들어요',
      partition: '바닥을 끌어 칸막이를 세워요',
      shelfwall: '바닥을 끌어 수납 칸을 세워요',
      erase: '지울 것을 누르세요'
    };
    const chip = document.createElement('div'); chip.className = 'card modeChip'; chip.hidden = true;
    const chipText = document.createElement('span'); chipText.className = 'mcText';
    const chipOpen = document.createElement('button'); chipOpen.textContent = '설정';
    const chipDone = document.createElement('button'); chipDone.className = 'mcDone'; chipDone.textContent = '완료';
    chip.append(chipText, chipOpen, chipDone); document.body.appendChild(chip);
    chipOpen.addEventListener('click', () => setCollapsed(false));
    chipDone.addEventListener('click', () => setMode('move'));
    window.__modeHook = function (m) {
      chip.hidden = m === 'move';
      if (m === 'move') return;
      const name = document.createElement('b');
      name.textContent = (document.querySelector('[data-mode="' + m + '"]') || {}).textContent || '';
      chipText.textContent = ''; chipText.append(name, MODE_TIPS[m] || '');
      if (m !== 'room') setCollapsed(true);
    };
  }

  // 방 크기·모양이 바뀌면(손잡이를 놓은 뒤) 늘어난 곳까지 보이게 카메라를 방 가운데로 옮긴다.
  let roomKey = '';
  (function watchRoom() {
    if (!walk && !action && !restoring) {
      const k = [R.xMin, R.xMax, R.zMin, R.zMax].join(',') + '|' + JSON.stringify(CUT);
      if (k !== roomKey) {
        if (roomKey) setView($('viewTop').getAttribute('aria-pressed') === 'true' ? 'top' : '3d');
        roomKey = k;
      }
    }
    requestAnimationFrame(watchRoom);
  })();

  // ---------- loop ----------
`);

// 7d) Panel lists: one group per tab at a time, and a grip to make the sheet taller or smaller
rep(`</style>`, `
  /* ---------- 앱 안: 탭 안 묶음을 칩으로 나눠 하나씩, 손잡이로 목록 크기 바꾸기 ---------- */
  .subtabs {
    display: flex; gap: 6px; overflow-x: auto; scrollbar-width: none;
    position: sticky; top: 0; z-index: 2; margin: 0 -2px; padding: 10px 2px 6px; background: var(--panel);
  }
  .subtabs::-webkit-scrollbar { display: none; }
  .subtabs button { white-space: nowrap; flex-shrink: 0; border-radius: 999px; padding: 5px 12px; }
  .hasSub > section { padding-top: 4px; }
  .hasSub > section > h2, .subhide { display: none !important; }
  .grip { height: 18px; display: flex; align-items: center; justify-content: center; cursor: grab; touch-action: none; }
  .grip::before { content: ''; width: 40px; height: 5px; border-radius: 3px; background: var(--line); }
  body.embed .phead { padding-top: 0; }
  body.embed .panel.tall .pbody { max-height: 58vh; }
  /* 펼친 동안엔 '방 크기' 줄을 없애고 [접기]를 손잡이 줄 오른쪽 끝으로 올려, 목록에 높이를 더 준다 */
  body.embed .panel:not(.collapsed) .grip { height: 30px; }
  body.embed .panel:not(.collapsed) .phead { position: absolute; top: 2px; right: 8px; padding: 0; z-index: 3; }
  body.embed .panel:not(.collapsed) .phead > div { display: none; }
  body.embed .panel:not(.collapsed) .phead button { min-height: 28px; padding: 2px 12px; font-size: 12.5px; }
  body.embed .panel:not(.collapsed) .pbody { max-height: min(36vh, 320px); }
  body.embed.touch .panel .tabs button { min-height: 36px; }
  body.embed.touch .subtabs button, body.embed.touch .pick .cats button { min-height: 32px; padding: 3px 12px; }
  body.embed .subtabs { padding: 6px 2px 4px; }
  body.embed .pick .cats { padding-bottom: 6px; }
</style>`);
rep(`  // ---------- loop ----------\n`, `  if (EMBED) {
    // 탭 안의 묶음(방 크기·외벽 모양·창문·복층…)을 칩으로 나눠 한 번에 하나만 보여준다. 스크롤이 줄어든다.
    document.querySelectorAll('.tabp').forEach(function (tp) {
      const secs = Array.from(tp.children).filter((el) => el.tagName === 'SECTION' && !el.hidden && el.querySelector('h2'));
      if (secs.length < 2) return;
      const bar = document.createElement('div'); bar.className = 'subtabs';
      bar.setAttribute('role', 'group'); bar.setAttribute('aria-label', '설정 묶음');
      const btns = secs.map(function (sec, i) {
        const b = document.createElement('button'); b.textContent = sec.querySelector('h2').textContent;
        b.addEventListener('click', () => show(i)); bar.appendChild(b); return b;
      });
      function show(i) {
        secs.forEach((el, j) => el.classList.toggle('subhide', i !== j));
        btns.forEach((b, j) => b.setAttribute('aria-pressed', String(i === j)));
        const pb = document.querySelector('.pbody'); if (pb) pb.scrollTop = 0;
      }
      tp.classList.add('hasSub'); tp.insertBefore(bar, tp.firstChild); show(0);
    });

    // 목록 위 손잡이: 누르면 크게/작게, 위로 끌면 크게(접혀 있으면 펼치기), 아래로 끌면 작게 → 접기.
    const panelEl = $('panel');
    const grip = document.createElement('div'); grip.className = 'grip';
    grip.setAttribute('role', 'button'); grip.setAttribute('aria-label', '목록 크기 바꾸기');
    panelEl.insertBefore(grip, panelEl.firstChild);
    const setTall = (on) => { panelEl.classList.toggle('tall', on); applyViewOffset(); };
    let gripStart = null;
    grip.addEventListener('pointerdown', function (e) {
      gripStart = e.clientY; try { grip.setPointerCapture(e.pointerId); } catch (err) {}
    });
    grip.addEventListener('pointerup', function (e) {
      if (gripStart === null) return;
      const dy = e.clientY - gripStart; gripStart = null;
      const folded = panelEl.classList.contains('collapsed'), tall = panelEl.classList.contains('tall');
      if (Math.abs(dy) < 8) { if (folded) setCollapsed(false); else setTall(!tall); }
      else if (dy < 0) { if (folded) setCollapsed(false); else setTall(true); }
      else if (tall) setTall(false);
      else setCollapsed(true);
    });
    grip.addEventListener('pointercancel', () => { gripStart = null; });
  }

  // ---------- loop ----------
`);

// 7f) Duplicate furniture: [복제] button on the edit bar, and a long press on furniture opens a 복제/삭제 menu
// 휴대폰: 가구를 눌러 선택해도 끌면 화면이 돌아간다. 가구를 옮기려면 편집 막대의 [옮기기]를 켠 뒤 끈다.
rep(`        select(it);
        if (it.userData.locked) return;   // locked`, `        const wasSel = selected === it;
        if (!wasSel) setTouchMove(false);
        select(it);
        if (it.userData.locked) return;   // locked`);
rep(`        action = { type: 'drag', item: it,`, `        if (e.pointerType === 'touch' && !touchMove) return;
        action = { type: 'drag', item: it,`);
rep(`</style>`, `
  /* ---------- 가구 길게 누르기 메뉴 ---------- */
  .ctxMenu { position: fixed; z-index: 40; display: flex; gap: 6px; padding: 6px; }
  .ctxMenu[hidden] { display: none; }
  .ctxMenu button { min-height: 40px; padding: 6px 16px; font-weight: 600; }
  body.walking .ctxMenu, body.readonly .ctxMenu { display: none; }
  #moveBtn { display: none; }
  body.touch #moveBtn { display: inline-block; }
  /* 가구를 골라 아래 목록이 편집 막대로 바뀌어도 1인칭으로 바꿀 수 있게 */
  .walkFab {
    position: fixed; top: calc(env(safe-area-inset-top, 0px) + 54px); right: 12px; z-index: 30;
    padding: 7px 14px; border-radius: 999px; font-weight: 600; font-size: 12.5px;
    background: var(--panel); border: 1px solid var(--line); box-shadow: 0 2px 8px rgba(0,0,0,0.12);
  }
  body.walking .walkFab, body.readonly .walkFab { display: none !important; }
  /* 1인칭: 서기/앉기, 낮/밤, 조명 */
  .walkTools { position: fixed; right: 14px; top: calc(env(safe-area-inset-top, 0px) + 74px); z-index: 20; display: flex; flex-direction: column; gap: 8px; }
  .walkTools button {
    min-width: 76px; padding: 8px 12px; border-radius: 999px; font-size: 12.5px; font-weight: 600;
    background: var(--panel); border: 1px solid var(--line); box-shadow: 0 2px 8px rgba(0,0,0,0.12);
  }
  .walkTools button[aria-pressed="true"] { background: var(--accent); color: var(--accent-ink); border-color: var(--accent); }
</style>`);
// 앉으면 눈높이가 낮아진다 (키 설정의 약 2/3)
rep(`return hcm / 100 - 0.11; }`, `return (hcm / 100 - 0.11) * (document.body.classList.contains('sitting') ? 0.66 : 1); }`);
rep(`    walk = true; fly = null; controls.enabled = false;`, `    walk = true; fly = null; controls.enabled = false;
    document.body.classList.remove('sitting'); syncWalkTools();`);
rep(`<div id="viewBar">`, `<button class="walkFab" id="walkFab">1인칭</button>
<div id="viewBar">`);
rep(`<button class="ghost danger" id="delBtn">삭제</button>`, `<button id="moveBtn" aria-pressed="false">옮기기</button>
      <button id="dupBtn">복제</button>\n      <button class="ghost danger" id="delBtn">삭제</button>`);
rep(`  // ---------- loop ----------\n`, `  // ---------- 가구 복제 / 길게 눌러 메뉴 ----------
  function duplicateItem(src) {
    const u = src && src.userData;
    if (!u || u.key === 'bathroom') return null;
    let g;
    if (u.kind === 'wall') {
      g = makeWall(u.wtype, u.w);
      placeItem(g, src.position.x + 0.4, src.position.z + 0.4, u.angle);
    } else {
      const f = FURN[u.key]; if (!f) return null;
      g = makeFurniture(u.key);
      const v = g.userData;
      v.open = !!u.open; v.on = u.on !== false; if (u.inch) v.inch = u.inch; v.onLoft = !!u.onLoft;
      placeItem(g, src.position.x + 0.4, src.position.z + 0.4, u.angle);
      if (f.rebuild || Math.abs(u.w - v.w) > 1e-3 || Math.abs(u.d - v.d) > 1e-3 || (u.h && Math.abs(u.h - (v.h || 0)) > 1e-3)) resizeFurniture(g, u.w, u.d, u.h || undefined);
      (u.parts || []).forEach(function (pt, i) {
        const q = v.parts[i]; if (!q) return;
        q.mat.color.copy(pt.mat.color); if (q.mat.userData.glow) q.mat.emissive.copy(q.mat.color);
      });
      if (v.lightObj) applyLamp(g);
      v.lift = u.lift || 0; clampItem(g); applyItemY(g);
    }
    select(g);
    return g;
  }
  $('dupBtn').addEventListener('click', () => { if (selected) duplicateItem(selected); });
  $('walkFab').addEventListener('click', enterWalk);
  // 1인칭에서 나가지 않고 앉아 보기 · 낮밤 바꾸기 · 조명 켜고 끄기
  const wtSit = document.createElement('button'), wtTime = document.createElement('button'), wtLight = document.createElement('button');
  const wt = document.createElement('div'); wt.className = 'walkTools';
  wt.append(wtSit, wtTime, wtLight); $('walkHud').appendChild(wt);
  const isDay = () => { const t = +$('timeIn').value; return t >= 7 && t < 18; };
  function syncWalkTools() {
    const sit = document.body.classList.contains('sitting');
    wtSit.textContent = sit ? '일어서기' : '앉기'; wtSit.setAttribute('aria-pressed', String(sit));
    wtTime.textContent = isDay() ? '밤으로' : '낮으로';
    wtLight.textContent = lightsOn ? '조명 끄기' : '조명 켜기'; wtLight.setAttribute('aria-pressed', String(lightsOn));
  }
  wtSit.addEventListener('click', () => { document.body.classList.toggle('sitting'); syncWalkTools(); });
  wtTime.addEventListener('click', () => {
    $('timeIn').value = isDay() ? 21 : 12;
    $('timeIn').dispatchEvent(new Event('input', { bubbles: true }));
    // 밤으로 바꾸면 조명도 켜 준다
    if (!isDay() && !lightsOn) $('lightBtn').click();
    syncWalkTools();
  });
  wtLight.addEventListener('click', () => { $('lightBtn').click(); syncWalkTools(); });
  // 휴대폰에서 가구는 [옮기기]를 켠 동안에만 끌어서 옮긴다. 다른 가구를 고르거나 선택을 풀면 꺼진다.
  let touchMove = false;
  function setTouchMove(on) { touchMove = on; $('moveBtn').setAttribute('aria-pressed', String(on)); }
  $('moveBtn').addEventListener('click', () => setTouchMove(!touchMove));
  new MutationObserver(() => { if ($('selbar').hidden) setTouchMove(false); })
    .observe($('selbar'), { attributes: true, attributeFilter: ['hidden'] });
  new MutationObserver(() => { $('dupBtn').hidden = !selected || selected.userData.key === 'bathroom'; })
    .observe($('selName'), { childList: true, characterData: true, subtree: true });

  (function longPress() {
    const menu = document.createElement('div'); menu.className = 'card ctxMenu'; menu.hidden = true;
    const bDup = document.createElement('button'); bDup.textContent = '복제';
    const bDel = document.createElement('button'); bDel.className = 'ghost danger'; bDel.textContent = '삭제';
    menu.append(bDup, bDel); document.body.appendChild(menu);
    let target = null, timer = 0, sx = 0, sy = 0;
    const close = () => { menu.hidden = true; target = null; };
    bDup.addEventListener('click', () => { if (target) duplicateItem(target); close(); });
    bDel.addEventListener('click', () => { if (target && !target.userData.locked) eraseItems([target]); close(); });
    document.addEventListener('pointerdown', (e) => { if (!menu.hidden && !menu.contains(e.target)) close(); }, true);
    const stop = () => { clearTimeout(timer); timer = 0; };
    canvas.addEventListener('pointerdown', function (e) {
      stop(); if (e.pointerType === 'mouse' || walk || readonly || mode !== 'move') return;
      sx = e.clientX; sy = e.clientY;
      timer = setTimeout(function () {
        timer = 0;
        const dragging = action && action.type === 'drag';
        const it = dragging ? action.item : pickFrom(movables, true);
        if (!it || it.userData.locked || (action && !dragging)) return;
        if (dragging) {
          // 손가락이 살짝 움직여 가구가 밀렸으면 제자리로
          it.position.copy(action.start); action.carry.forEach((c) => c.o.position.copy(c.p0)); applyItemY(it);
          action = null; controls.enabled = true; downAt = null;
          document.body.classList.remove('dragItem'); canvas.style.cursor = 'grab';
          try { canvas.releasePointerCapture(e.pointerId); } catch (err) {}
        }
        select(it); target = it;
        bDup.hidden = it.userData.key === 'bathroom';
        menu.hidden = false;
        const w = menu.offsetWidth, h = menu.offsetHeight;
        menu.style.left = Math.max(8, Math.min(window.innerWidth - w - 8, sx - w / 2)) + 'px';
        menu.style.top = Math.max(8, sy - h - 24) + 'px';
        try { navigator.vibrate && navigator.vibrate(15); } catch (err) {}
      }, 550);
    });
    canvas.addEventListener('pointermove', (e) => { if (timer && Math.hypot(e.clientX - sx, e.clientY - sy) > 8) stop(); });
    ['pointerup', 'pointercancel'].forEach((ev) => canvas.addEventListener(ev, stop));
  })();

  // ---------- loop ----------
`);

// 7g) First person: sit on chairs/sofa/toilet, lie on beds, run the taps, open the fridge and wardrobe
rep(`        if (g.userData.lightObj) return { kind: 'lamp', g: g };
      }`, `        if (g.userData.lightObj) return { kind: 'lamp', g: g };
        const ex = extraTarget(g, h); if (ex) return ex;
      }`);
rep(`  function useTarget() {
    const t = aimTarget(); if (!t) return;`, `  function useTarget() {
    if (pose) { standUp(); return; }
    const t = aimTarget(); if (!t) return;
    if (useExtra(t)) return;`);
rep(`    let txt = '';
    if (t && t.kind === 'entrance')`, `    let txt = '';
    if (pose) txt = 'E · 일어나기';
    else if (t && t.kind === 'entrance')`);
rep(`else if (t && t.kind === 'lamp') txt = 'E · ' + t.g.userData.name + ' ' + (t.g.userData.on ? '끄기' : '켜기');`,
    `else if (t && t.kind === 'lamp') txt = 'E · ' + t.g.userData.name + ' ' + (t.g.userData.on ? '끄기' : '켜기');
    else if (t && EXTRA_TXT[t.kind]) txt = 'E · ' + EXTRA_TXT[t.kind](t);`);
rep(`  function walkStep(dt) {
`, `  function walkStep(dt) {
    if (pose) { poseStep(dt); return; }
`);
rep(`  function exitWalk() {
    if (!walk) return;`, `  function exitWalk() {
    if (!walk) return;
    pose = null; pitch = 0; stopAllWater();`);
rep(`  // ---------- loop ----------\n`, `  // ---------- 1인칭: 앉기·눕기, 물 틀기, 냉장고·장롱 열기 ----------
  // 가구마다 '앞쪽'(fz), 앉았을 때 눈 위치(x·z·높이)를 정해 둔다. 좌표는 가구 기준.
  const SEAT = {
    chair:   { x: 0, z: -0.04, y: 1.10, fz: -1 },
    gaming:  { x: 0, z: -0.04, y: 1.16, fz: -1 },
    sofa:    { x: 0.34, z: 0.1, y: 1.03, fz: 1, byHit: true },
    beanbag: { x: 0, z: 0, y: 0.95, fz: -1 },
    toilet:  { x: 0, z: 0.1, y: 1.07, fz: 1 }
  };
  const BED = { bedSS: 1, bedQ: 1 };
  const CAB = { fridge: 1, wardrobe: 1 };
  // 수도꼭지: 물이 나오는 자리(x, z), 위·아래 높이, 눌러지는 높이 범위
  const TAP = {
    kitchen: { x: -0.52, z: -0.1, top: 1.12, bottom: 0.87, lo: 0.8, hi: 1.3 },
    sink:    { x: 0, z: -0.06, top: 1.04, bottom: 0.9, lo: 0.7, hi: 1.3 }
  };
  const EXTRA_TXT = {
    sit: () => '앉기', lie: () => '눕기',
    cab: (t) => t.g.userData.name + (t.g.userData.cab ? ' 닫기' : ' 열기'),
    tap: (t) => '물 ' + (waterOn(t.g) ? '잠그기' : '틀기')
  };
  function extraTarget(g, h) {
    const k = g.userData.key;
    if (SEAT[k]) return { kind: 'sit', g: g, point: h.point.clone() };
    if (BED[k]) return { kind: 'lie', g: g };
    if (CAB[k]) return { kind: 'cab', g: g };
    if (TAP[k]) { const y = g.worldToLocal(h.point.clone()).y; if (y > TAP[k].lo && y < TAP[k].hi) return { kind: 'tap', g: g }; }
    return null;
  }
  function useExtra(t) {
    if (t.kind === 'sit' || t.kind === 'lie') { startPose(t); return true; }
    if (t.kind === 'cab') { t.g.userData.cab = !t.g.userData.cab; rebuildItem(t.g); return true; }
    if (t.kind === 'tap') { toggleWater(t.g); return true; }
    return false;
  }

  // 앉기·눕기: 걷는 자리(WP)는 그대로 두고 카메라만 가구 위로 옮긴다. 일어나면 원래 서 있던 자리로 돌아온다.
  let pose = null;
  function startPose(t) {
    const g = t.g, k = g.userData.key; let eye, fz, p;
    g.updateMatrixWorld(true);
    if (t.kind === 'lie') { eye = new THREE.Vector3(0, 0.72, -0.68); fz = 1; p = 1.0; }
    else {
      const c = SEAT[k]; let x = c.x;
      if (c.byHit) x = g.worldToLocal(t.point.clone()).x < 0 ? -c.x : c.x;
      eye = new THREE.Vector3(x, c.y, c.z); fz = c.fz; p = -0.04;
    }
    const pos = g.localToWorld(eye.clone());
    pos.y = Math.min(pos.y, H - 0.12);
    const fw = g.localToWorld(new THREE.Vector3(0, 0, fz)).sub(g.localToWorld(new THREE.Vector3(0, 0, 0)));
    pose = { pos: pos, cur: camera.position.clone(), yaw: Math.atan2(-fw.x, -fw.z), pitch: p, t: 0 };
    Object.keys(keys).forEach((kk) => { keys[kk] = false; });
  }
  function standUp() { pose = null; pitch = 0; }
  const angDiff = (a, b) => Math.atan2(Math.sin(a - b), Math.cos(a - b));
  function poseStep(dt) {
    pose.t += dt;
    if (pose.t > 0.4 && (keys.KeyW || keys.KeyA || keys.KeyS || keys.KeyD || keys.ArrowUp || keys.ArrowDown || keys.ArrowLeft || keys.ArrowRight)) { standUp(); return; }
    if (pose.t < 0.5) { const q = 1 - Math.exp(-8 * dt); yaw += angDiff(pose.yaw, yaw) * q; pitch += (pose.pitch - pitch) * q; }
    pose.cur.lerp(pose.pos, 1 - Math.exp(-9 * dt));
    camera.position.copy(pose.cur);
    camera.rotation.set(pitch, yaw, 0, 'YXZ');
    walkPrompt();
  }

  // 물 나오기: 가는 물줄기 + 바닥에서 튀는 물방울. 1인칭에서 나가면 잠근다.
  const waters = []; let waterRun = false;
  const waterAlive = (w) => w.parent && w.parent.children.indexOf(w) >= 0 && movables.indexOf(w.userData.owner) >= 0;
  function waterOn(g) { return !!(g.userData.water && waterAlive(g.userData.water)); }
  function dropWater(w) {
    if (w.parent) { const i = w.parent.children.indexOf(w); if (i >= 0) w.parent.children.splice(i, 1); w.parent = null; }
    disposeTree(w); const i = waters.indexOf(w); if (i >= 0) waters.splice(i, 1);
  }
  function stopAllWater() { waters.slice().forEach((w) => { const o = w.userData.owner; dropWater(w); if (o) o.userData.water = null; }); }
  function toggleWater(g) {
    const u = g.userData, c = TAP[u.key];
    if (waterOn(g)) { dropWater(u.water); u.water = null; return; }
    const w = new THREE.Group(); w.userData.owner = g; w.userData.c = c;
    const len = c.top - c.bottom;
    const stream = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.0075, len, 8),
      new THREE.MeshBasicMaterial({ color: 0xBFE3FA, transparent: true, opacity: 0.6, depthWrite: false }));
    stream.position.set(c.x, c.bottom + len / 2, c.z); w.add(stream);
    const N = 16, pg = new THREE.BufferGeometry();
    pg.setAttribute('position', new THREE.BufferAttribute(new Float32Array(N * 3), 3));
    const pts = new THREE.Points(pg, new THREE.PointsMaterial({ color: 0xE6F6FF, size: 0.013, transparent: true, opacity: 0.9, depthWrite: false }));
    pts.frustumCulled = false; w.add(pts);
    w.userData.stream = stream; w.userData.pts = pts;
    u.inner.add(w); u.water = w; waters.push(w);
    if (!waterRun) { waterRun = true; requestAnimationFrame(waterTick); }
  }
  function waterTick(ts) {
    waters.slice().forEach(function (w) { if (!waterAlive(w)) dropWater(w); });
    if (!waters.length) { waterRun = false; return; }
    const t = ts / 1000;
    waters.forEach(function (w) {
      const c = w.userData.c, st = w.userData.stream, a = w.userData.pts.geometry.attributes.position;
      const f = 1 + 0.18 * Math.sin(t * 38); st.scale.set(f, 1, f);
      for (let i = 0; i < a.count; i++) {
        const ph = (t * 2.4 + i * 0.137) % 1, ang = i * 2.399;
        a.setXYZ(i, c.x + Math.cos(ang) * (0.008 + ph * 0.05), c.bottom + 0.075 * Math.sin(Math.PI * ph), c.z + Math.sin(ang) * (0.008 + ph * 0.05));
      }
      a.needsUpdate = true;
    });
    requestAnimationFrame(waterTick);
  }

  // 냉장고·장롱: 속이 빈 상자 + 경첩에 달린 문. 열면 안쪽 선반과 물건이 보인다.
  function hollow(g, W, H, z1, z2, t, m) {
    seg(g, -W / 2, W / 2, z1, z1 + t, 0, H, m);
    seg(g, -W / 2, -W / 2 + t, z1 + t, z2, 0, H, m);
    seg(g, W / 2 - t, W / 2, z1 + t, z2, 0, H, m);
    seg(g, -W / 2 + t, W / 2 - t, z1 + t, z2, H - t, H, m);
    seg(g, -W / 2 + t, W / 2 - t, z1 + t, z2, 0, t, m);
  }
  FURN.fridge.build = function (g, w, d, u) {
    const open = !!(u && u.cab), W = 0.68, H = 1.55, D = 0.65, t = 0.03, ang = 1.75;
    hollow(g, W, H, -D / 2, D / 2 - t, t, M.fridge);
    seg(g, -W / 2 + t, W / 2 - t, -D / 2 + t, D / 2 - t, 0.995, 1.005, M.porcelain);
    [0.36, 0.7].forEach((y) => seg(g, -W / 2 + t, W / 2 - t, -D / 2 + t, D / 2 - t - 0.02, y, y + 0.012, M.porcelain));
    seg(g, -W / 2 + t, W / 2 - t, -D / 2 + t, D / 2 - t - 0.02, 1.27, 1.282, M.porcelain);
    [[-0.2, 0.372, 0, 0.2], [0.0, 0.372, 1, 0.2], [0.2, 0.372, 2, 0.2], [-0.12, 0.712, 3, 0.16], [0.14, 0.712, 0, 0.16], [-0.15, 0.03, 1, 0.22], [0.1, 0.03, 2, 0.22]].forEach(function (q) {
      cyl(g, 0.035, 0.035, q[3], M.bottles[q[2]], q[0], q[1], -0.05);
    });
    seg(g, -W / 2, W / 2, D / 2 - t, D / 2 - 0.001, 0.995, 1.005, M.base);
    [[0, 0.995, 0.6, 0.95], [1.005, 1.55, 1.08, 1.4]].forEach(function (q) {
      const h = new THREE.Group(); h.position.set(W / 2, q[0], D / 2); h.rotation.y = open ? ang : 0; g.add(h);
      seg(h, -W, 0, -t, 0, 0, q[1] - q[0], M.fridge);
      seg(h, -0.58, -0.55, 0, 0.02, q[2] - q[0], q[3] - q[0], M.handle);
    });
  };
  FURN.wardrobe.build = function (g, w, d, u) {
    const open = !!(u && u.cab), W = 1.2, H = 2.0, D = 0.6, t = 0.03, ang = 1.75;
    hollow(g, W, H, -D / 2, D / 2 - 0.02, t, M.white);
    seg(g, -W / 2 + t, W / 2 - t, D / 2 - 0.06, D / 2 - 0.02, 0, 0.05, M.base);
    seg(g, -W / 2 + t, W / 2 - t, -D / 2 + t, D / 2 - 0.03, 1.82, 1.834, M.white);
    seg(g, -W / 2 + t, W / 2 - t, -D / 2 + t, D / 2 - 0.03, 0.42, 0.434, M.white);
    seg(g, -W / 2 + t, W / 2 - t, -0.1, -0.085, 1.72, 1.735, M.steel);
    for (let i = 0; i < 9; i++) {
      const x = -0.46 + i * 0.115, hh = 0.7 + (i % 3) * 0.12;
      box(g, 0.035, hh, 0.38, M.cloth[i % 6], x, 1.72 - hh, -0.09);
    }
    [[-0.3, 0], [0.05, 1], [0.35, 2]].forEach((q) => box(g, 0.3, 0.1, 0.34, M.cloth[(q[1] + 3) % 6], q[0], 0.434, -0.06));
    [[-0.3, 0], [0.2, 3]].forEach((q) => box(g, 0.34, 0.12, 0.36, M.cloth[q[1]], q[0], 0.05, -0.05));
    [[-1, -ang, 0.55], [1, ang, -0.55]].forEach(function (q) {
      const h = new THREE.Group(); h.position.set(q[0] * W / 2, 0.04, D / 2 - 0.02); h.rotation.y = open ? q[1] : 0; g.add(h);
      if (q[0] < 0) seg(h, 0, W / 2, 0, 0.02, 0, 1.94, M.white); else seg(h, -W / 2, 0, 0, 0.02, 0, 1.94, M.white);
      seg(h, q[2] - 0.01, q[2] + 0.01, 0.02, 0.04, 0.86, 1.16, M.handle);
    });
  };
  movables.forEach(function (g) { if (g.userData.key === 'fridge' || g.userData.key === 'wardrobe') rebuildItem(g); });

  // ---------- loop ----------
`);

// 7i) 1인칭에 들어가면 화면 전체로 (웹: 앱의 위쪽 막대·아래 탭을 덮고, 가능한 폰은 가로로 돌린다)
rep(`    document.body.classList.remove('sitting'); syncWalkTools();`, `    document.body.classList.remove('sitting'); syncWalkTools(); walkEnv(true);`);
rep(`    pose = null; pitch = 0; stopAllWater();`, `    pose = null; pitch = 0; stopAllWater(); walkEnv(false);`);
rep(`</style>`, `
  /* ---------- 폰은 세로인 채 화면만 옆으로 눕혀 보여줄 때: 안내와 방향 바꾸기 ---------- */
  .rotateHint { display: none; }
  @keyframes rhFade { 0%, 75% { opacity: 1; } 100% { opacity: 0; visibility: hidden; } }
  body.touch.walking.rotated .rotateHint {
    display: block; position: fixed; top: calc(env(safe-area-inset-top, 0px) + 68px); left: 50%; transform: translateX(-50%);
    z-index: 20; padding: 7px 14px; border-radius: 999px; font-size: 12.5px; font-weight: 600; white-space: nowrap; pointer-events: none;
    background: var(--panel); border: 1px solid var(--line); animation: rhFade 6s forwards;
  }
  .walkTools .flipBtn { display: none; }
  body.rotated .walkTools .flipBtn { display: block; }
</style>`);
rep(`  // ---------- loop ----------\n`, `  // ---------- 1인칭: 전체 화면 · 가로 ----------
  const rotateHint = document.createElement('div'); rotateHint.className = 'rotateHint'; rotateHint.textContent = '폰을 옆으로 돌려서 보세요';
  $('walkHud').appendChild(rotateHint);
  // 앱이 화면을 옆으로 눕힌 방향이 반대면 눌러서 뒤집는다
  const flipBtn = document.createElement('button'); flipBtn.className = 'flipBtn'; flipBtn.textContent = '↻ 방향';
  flipBtn.addEventListener('click', () => sendToApp({ type: 'flip' }));
  wt.appendChild(flipBtn);
  function walkEnv(on) {
    sendToApp({ type: 'walk', on: on });   // 웹 앱이 이 신호로 전체 화면·가로(나가면 세로)를 맡는다
  }

  // ---------- loop ----------
`);

// 7e) Touch screens: smaller furniture edit bar, touch-only help, first person starts inside the room
rep(`</style>`, `
  /* ---------- 터치 화면: 가구 편집 막대를 짧게 (투명도 빼고, 색상은 버튼으로 펼치기) ---------- */
  body.touch .selop { display: none !important; }
  body.touch .selbar:not(.colors-open) #colorRow { display: none; }
  .colorToggle[hidden] { display: none; }
  /* 터치 화면 도움말 */
  .touchHelp { display: grid; gap: 4px 0; }
  .touchHelp h3 { font-size: 13.5px; margin: 14px 0 4px; color: var(--accent); }
  .touchHelp ul { margin: 0; padding-left: 18px; font-size: 13px; line-height: 1.6; color: var(--ink); }
  .touchHelp li b { font-weight: 600; }
</style>`);
rep(`    WP.set(doorX0() + 0.75, 0, R.zMax + 1.1); yaw = 0; pitch = 0; feetY = 0;\n`,
`    WP.set(doorX0() + 0.75, 0, R.zMax + 1.1); yaw = 0; pitch = 0; feetY = 0;
    // 휴대폰에서는 현관문 밖이 아니라 방 안 빈 곳에서, 창문 쪽(위쪽 벽)을 보며 시작한다.
    if (document.body.classList.contains('touch')) { const sp = walkSpawnInside(); if (sp) WP.set(sp.x, 0, sp.z); }
`);
rep(`  // ---------- loop ----------\n`, `  // 1인칭 시작 자리: 방 가운데에서 가까운 순서로, 가구·벽·잘린 모서리에서 떨어진 빈 곳.
  function walkSpawnInside() {
    const M0 = 0.45, cx = (R.xMin + R.xMax) / 2, cz = (R.zMin + R.zMax) / 2, pts = [];
    for (let x = R.xMin + M0; x <= R.xMax - M0; x += 0.25) for (let z = R.zMin + M0; z <= R.zMax - M0; z += 0.25) pts.push({ x: x, z: z });
    pts.sort((a, b) => Math.hypot(a.x - cx, a.z - cz) - Math.hypot(b.x - cx, b.z - cz));
    const inCut = (p) => ['nw', 'ne', 'sw', 'se'].some(function (c) {
      const k = CUT[c]; if (!k || !(k[0] > 0 && k[1] > 0)) return false;
      const inX = c[1] === 'w' ? p.x < R.xMin + k[0] + M0 : p.x > R.xMax - k[0] - M0;
      const inZ = c[0] === 'n' ? p.z < R.zMin + k[1] + M0 : p.z > R.zMax - k[1] - M0;
      return inX && inZ;
    });
    const occupied = (p) => movables.some(function (g) {
      const u = g.userData, ry = g.rotation.y, dx = p.x - g.position.x, dz = p.z - g.position.z;
      const lx = dx * Math.cos(ry) - dz * Math.sin(ry), lz = dx * Math.sin(ry) + dz * Math.cos(ry);
      return Math.abs(lx) < (u.w || 0.1) / 2 + 0.3 && Math.abs(lz) < (u.d || 0.1) / 2 + 0.3;
    });
    return pts.find((p) => !inCut(p) && !occupied(p)) || null;
  }

  if (TOUCH) {
    // 가구 편집 막대: 색상은 '색상' 버튼을 눌러야 펼쳐진다 (색을 바꿀 수 없는 물건이면 버튼도 숨김).
    const selbarEl = $('selbar');
    const colorBtn = document.createElement('button'); colorBtn.className = 'colorToggle'; colorBtn.textContent = '색상';
    colorBtn.setAttribute('aria-pressed', 'false');
    $('lockBtn').before(colorBtn);
    colorBtn.addEventListener('click', function () {
      const open = !selbarEl.classList.contains('colors-open');
      selbarEl.classList.toggle('colors-open', open); colorBtn.setAttribute('aria-pressed', String(open));
      applyViewOffset();
    });
    const syncColorBtn = () => { colorBtn.hidden = $('colorRow').hidden; };
    new MutationObserver(syncColorBtn).observe($('colorRow'), { attributes: true, attributeFilter: ['hidden'] });
    syncColorBtn();

    // 휴대폰 키보드에는 Enter 대신 '완료'가 있다.
    $('roomMsg').textContent = '숫자를 고치고 키보드의 완료를 누르면 바뀌어요.';

    // 도움말: 키보드·마우스 설명 대신 터치 조작만.
    const card = document.querySelector('.helpCard');
    card.querySelectorAll('.helpGrid, .helpFoot').forEach((el) => { el.hidden = true; });
    const th = document.createElement('div'); th.className = 'touchHelp';
    th.innerHTML =
      '<h3>화면 움직이기</h3><ul>' +
      '<li><b>한 손가락으로 끌기</b>: 방을 빙글 돌려 보기</li>' +
      '<li><b>두 손가락 벌리기·오므리기</b>: 확대·축소</li>' +
      '<li><b>두 손가락으로 끌기</b>: 보는 위치 옮기기</li>' +
      '<li><b>3D · 위에서</b>: 처음 시점 · 평면도처럼 위에서 보기</li>' +
      '<li><b>벽 낮추기</b>: 벽을 낮춰 방 안을 잘 보이게</li></ul>' +
      '<h3>아래 목록</h3><ul>' +
      '<li><b>손잡이(─)</b>: 누르면 목록을 크게·작게, 아래로 끌면 접기</li>' +
      '<li><b>배치 · 방 · 꾸미기 · 환경</b> 탭과 그 아래 칩으로 원하는 설정을 골라요</li></ul>' +
      '<h3>가구</h3><ul>' +
      '<li><b>가구 추가</b>에서 종류를 고르고 가구를 누르면 방에 놓여요</li>' +
      '<li><b>가구 누르기</b>: 선택 · <b>끌기</b>: 옮기기 (작은 물건은 책상·침대 위로 끌면 올라가요)</li>' +
      '<li>아래 막대에서 각도·크기를 바꾸고, <b>색상</b>을 눌러 색을 바꿔요</li>' +
      '<li><b>위치 고정</b>: 실수로 움직이지 않게 · <b>삭제</b>: 지우기</li></ul>' +
      '<h3>도구 (배치 탭)</h3><ul>' +
      '<li>벽 그리기·칸막이·방 만들기 등을 고르면 위에 안내가 떠요. 다 하면 <b>완료</b></li>' +
      '<li><b>방 크기</b>: 방 밖 손잡이를 끌어 벽 옮기기 (방이 바뀌면 화면이 따라와요)</li></ul>' +
      '<h3>1인칭</h3><ul>' +
      '<li><b>왼쪽 원</b>을 누른 채 밀면 걷고, 끝까지 밀면 달려요</li>' +
      '<li><b>화면을 끌면</b> 둘러봐요</li>' +
      '<li><b>오른쪽 버튼</b>: 앞에 있는 문 열기·조명 켜기</li></ul>' +
      '<h3>저장</h3><ul><li>앱 위쪽의 <b>저장</b> 버튼으로 내 방에 저장하고, <b>공유</b>로 커뮤니티에 올려요</li></ul>';
    card.appendChild(th);
    $('helpTitle').textContent = '조작법';
  }

  // ---------- loop ----------
`);

// 8) Bridge to the app
rep(`  tick();\n})();`, `  // walls facing the camera become invisible but still cast shadows (so curtains/walls keep blocking sun)
  function updateHiddenWalls(forceOutside) {
    outerWalls.forEach(function (w) {
      tmp.copy(camera.position).sub(w.center);
      const hide = (forceOutside || !walk) && tmp.dot(w.normal) > 0.15;
      if (hide !== w.hidden) {
        w.hidden = hide;
        w.g.traverse(function (m) { if (m.isMesh) m.material = hide ? M.hiddenWall : m.userData.mat; });
      }
    });
  }

  // ---------- 앱과 통신 ----------
  // 커뮤니티 미리보기용 사진: 보기 전용 3D 화면을 처음 열었을 때와 같은 시점으로 4:5 사진을 한 장 찍어
  // 작은 JPEG(data URL)로 돌려준다. 화면에 보이는 카메라·크기는 같은 프레임 안에서 원래대로 돌려놓는다.
  const THUMB_W = 640, THUMB_H = 800;
  function captureThumb() {
    const saved = { pos: camera.position.clone(), quat: camera.quaternion.clone(), aspect: camera.aspect };
    const hidden = [outline, eraseOutline].concat(previews).filter((o) => o.visible);
    hidden.forEach((o) => { o.visible = false; });
    try {
      renderer.setSize(THUMB_W, THUMB_H, false);
      camera.aspect = THUMB_W / THUMB_H; camera.clearViewOffset(); camera.updateProjectionMatrix();
      const p = view3dPose(); camera.position.copy(p.pos).sub(p.target).multiplyScalar(0.82).add(p.target); camera.lookAt(p.target);
      updateHiddenWalls(true);
      renderer.render(scene, camera);
      const out = document.createElement('canvas'); out.width = THUMB_W; out.height = THUMB_H;
      out.getContext('2d').drawImage(canvas, 0, 0, THUMB_W, THUMB_H);
      return out.toDataURL('image/jpeg', 0.8);
    } catch (e) {
      return null;
    } finally {
      hidden.forEach((o) => { o.visible = true; });
      renderer.setSize(window.innerWidth, window.innerHeight, false);
      camera.position.copy(saved.pos); camera.quaternion.copy(saved.quat);
      camera.aspect = saved.aspect; camera.updateProjectionMatrix(); applyViewOffset();
      updateHiddenWalls();
      renderer.render(scene, camera);
    }
  }

  // 예전 시뮬레이터로 저장한 방({ R, floor, wall, items: [{ k: 가구키 }] })을 지금 형식으로 바꾼다.
  function fromOldFormat(st) {
    return {
      v: 1, room: st.R, wins: st.wins || [], face: st.face, time: st.time,
      btype: 'apt', scenery: 'none', floorN: 14, season: 'spring',
      finish: {
        floor: st.floor ? { key: st.floor.key, kind: st.floor.kind, chip: st.floor.chip } : null,
        wall: st.wall, bathFloor: st.bathFloor, bathWall: st.bathWall
      },
      items: (st.items || []).map(function (o) {
        const base = { x: o.x, z: o.z, a: o.a || 0, roomId: o.room || null };
        if (o.t === 'wall') return Object.assign(base, { k: 'wall', t: o.wt, w: o.w });
        return Object.assign(base, { k: 'furniture', key: o.k, w: o.w, d: o.d, h: o.h || 0, lift: o.lift || 0, on: o.on !== false, colors: o.c || [] });
      })
    };
  }
  function loadState(st) {
    if (!st || st.v !== 1) return false;
    const data = st.room ? st : st.R ? fromOldFormat(st) : null;
    if (!data) return false;
    if (walk) exitWalk();
    try { restore(data); } catch (e) { restoring = false; return false; }
    const p = view3dPose(); camera.position.copy(p.pos); controls.target.copy(p.target); controls.update();
    return true;
  }
  function setReadonly(on) {
    readonly = !!on;
    document.body.classList.toggle('readonly', readonly);
    if (readonly) { select(null); setMode('move'); hidePreviews(); }
    applyViewOffset();
  }
  function setViewBar(v) {
    $('vb3d').setAttribute('aria-pressed', String(v === '3d'));
    $('vbTop').setAttribute('aria-pressed', String(v === 'top'));
    setView(v);
  }
  $('vb3d').addEventListener('click', () => setViewBar('3d'));
  $('vbTop').addEventListener('click', () => setViewBar('top'));
  $('vbWalk').addEventListener('click', enterWalk);

  // 앱(React Native WebView 또는 웹 iframe)으로 메시지를 보낸다.
  function sendToApp(msg) {
    if (window.ReactNativeWebView) window.ReactNativeWebView.postMessage(JSON.stringify(msg));
    else if (window.parent && window.parent !== window) window.parent.postMessage(Object.assign({ source: 'oneroom' }, msg), '*');
  }
  function receive(msg) {
    if (!msg || typeof msg !== 'object') return;
    if (msg.type === 'init') { paused = !!msg.paused; if (msg.state) loadState(msg.state); setReadonly(msg.readonly); sendToApp({ type: 'loaded' }); }
    else if (msg.type === 'load') { const ok = loadState(msg.state); sendToApp({ type: 'loaded', ok: ok }); }
    else if (msg.type === 'serialize') {
      const st = snapshot();
      if (msg.thumb) { const t = captureThumb(); if (t) st.thumb = t; }
      sendToApp({ type: 'state', id: msg.id, state: st });
    }
    else if (msg.type === 'reset') location.reload();
    else if (msg.type === 'rotated') document.body.classList.toggle('rotated', !!msg.on);
  }
  window.__oneroomReceive = receive;   // native: injectJavaScript(...)
  window.addEventListener('message', function (e) {   // web: iframe.contentWindow.postMessage(...)
    const d = e.data; if (d && d.target === 'oneroom') receive(d);
  });
  window.OneRoom = { serialize: snapshot, load: loadState, setReadonly: setReadonly };

  tick();
  sendToApp({ type: 'ready' });
})();`);

fs.writeFileSync(out, s);
console.log('앱 연결을 붙였어요 -> ' + path.relative(process.cwd(), out));
require('./build-simulator.js');
