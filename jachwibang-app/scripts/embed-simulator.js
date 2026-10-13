// 혼자 돌아가는 원룸 시뮬레이터 HTML(팀에서 받은 새 버전)에 앱 연결 부분을 붙여
// assets/simulator/oneroom.html 로 저장하고, 앱이 쓰는 파일(src/generated)까지 다시 만든다.
//   npm run embed:simulator -- "../새 시뮬레이터.html"
// 붙이는 것: 앱과 메시지 주고받기(저장·불러오기·미리보기 사진), 커뮤니티 보기 전용 모드,
// 앱 초록 색상, 휴대폰용 아래쪽 패널, 앱 안에서는 브라우저 자동 저장 끄기, 예전 형식 방 불러오기.
// 새 버전에서 고칠 자리를 못 찾으면 어디인지 알려주고 멈춘다.
const fs = require('fs');
const path = require('path');
const src = process.argv[2];
if (!src) throw new Error('사용법: npm run embed:simulator -- "<시뮬레이터.html>"');
const out = path.join(__dirname, '..', 'assets', 'simulator', 'oneroom.html');
let s = fs.readFileSync(src, 'utf8').replace(/\r\n/g, '\n');

function rep(a, b, all) {
  const n = s.split(a).length - 1;
  if (all ? n < 1 : n !== 1) throw new Error(`expected ${all ? '>=1' : '1'} match, got ${n}: ${a.slice(0, 80)}`);
  s = all ? s.split(a).join(b) : s.replace(a, () => b);
}

// 1) App palette (green), light + dark
rep(`    --bg: #DCE3E6; --panel: rgba(247,249,250,0.94); --ink: #1E2A31; --muted: #5B6A72;
    --line: #C3CDD2; --accent: #3552A6; --accent-ink: #FFFFFF; --danger: #B03A3A;`,
`    --bg: #E6E2D8; --panel: rgba(250,247,241,0.95); --ink: #22281F; --muted: #5F6356;
    --line: #D3C8B4; --accent: #2F5446; --accent-ink: #FFFFFF; --danger: #A83A34;`);
rep(`--bg: #151B20; --panel: rgba(28,36,42,0.94); --ink: #E6ECEF; --muted: #9AA8B0;
      --line: #34424B; --accent: #7F9BEA; --accent-ink: #0F1720; --danger: #E27C7C;`,
`--bg: #161A16; --panel: rgba(33,38,33,0.95); --ink: #F1EFE7; --muted: #B3B0A2;
      --line: #384036; --accent: #9DB892; --accent-ink: #141A14; --danger: #D4837A;`);
rep(`    --bg: #151B20; --panel: rgba(28,36,42,0.94); --ink: #E6ECEF; --muted: #9AA8B0;
    --line: #34424B; --accent: #7F9BEA; --accent-ink: #0F1720; --danger: #E27C7C;`,
`    --bg: #161A16; --panel: rgba(33,38,33,0.95); --ink: #F1EFE7; --muted: #B3B0A2;
    --line: #384036; --accent: #9DB892; --accent-ink: #141A14; --danger: #D4837A;`);
rep('0x3552A6', '0x2F5446', true);

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
  .pbody { max-height: min(42vh, 360px); }
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
    background: rgba(20,26,22,0.28); border: 2px solid rgba(255,255,255,0.6);
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
      btype: 'apt', scenery: 'han', floorN: 14, season: 'spring',
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
