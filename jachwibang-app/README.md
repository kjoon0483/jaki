# 자취방 키우기

자취생을 위한 앱입니다. 가계부로 돈 관리를 하고, 3D로 내 방 가구를 배치해 보고, 커뮤니티에서 서로의 방을 구경할 수 있어요.

Expo(React Native) 하나로 iOS·안드로이드·웹을 같이 만들고, 로그인과 데이터는 Supabase에 저장합니다.

## 화면

| 탭 | 하는 일 |
| --- | --- |
| 홈 | 이번 달 지출과 예산, 지난달 대비, 최근 기록 |
| 가계부 | 수입·지출 기록, 달력 / 내역 / 분석 탭, 한 달 예산 |
| 3D 배치 | 원룸에 가구를 놓고 햇빛까지 확인, 방 저장·커뮤니티 공유 |
| 커뮤니티 | 글·댓글·좋아요, 공유된 3D 방 둘러보기, 신고·차단 |
| 마이 | 닉네임·비밀번호 변경, 내 활동, 화면 테마, 차단 관리, 약관, 회원 탈퇴 |

## 처음 실행하기

1. 패키지 설치

   ```bash
   npm install
   ```

2. `.env.example`을 복사해 `.env`를 만들고 Supabase 값을 넣습니다.
   (Supabase 대시보드 > Project Settings > API)

   ```
   EXPO_PUBLIC_SUPABASE_URL=https://프로젝트.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=anon public 키
   ```

3. 데이터베이스 준비 (아래 [Supabase 설정](#supabase-설정))

4. 실행

   ```bash
   npm run web       # 브라우저
   npm start         # 휴대폰(Expo Go)·에뮬레이터
   ```

## Supabase 설정

Supabase 대시보드 > SQL Editor에서 실행합니다.

- **새 프로젝트:** `supabase/schema.sql` 하나만 실행하면 됩니다.
- **이미 쓰던 프로젝트:** `supabase/migrations/` 안의 파일을 번호 순서대로, 아직 안 한 것만 실행하세요. 모두 여러 번 실행해도 안전합니다.

| 파일 | 내용 |
| --- | --- |
| `002_community_posts_body.sql` | 커뮤니티 글 본문·주제 칸 |
| `003_rooms.sql` | 3D 방 저장(rooms 표)과 글에 방 첨부 |
| `003_rooms_fix.sql` | 003이 SQL Editor에서 잘 안 될 때 쓰는 대체본 |
| `004_expenses_income.sql` | 가계부 수입 기록 |
| `005_lock_post_counts.sql` | 좋아요 수를 사용자가 직접 못 바꾸게 막기 |
| `006_account_nickname_safety.sql` | 회원 탈퇴, 닉네임 중복 방지, 커뮤니티 신고·차단 |

SQL을 실행했는데 앱에서 칸을 못 찾는다고 나오면 `notify pgrst, 'reload schema';`를 한 번 실행하세요.

## 3D 시뮬레이터 수정

3D 화면은 두 파일로 이루어져 있어요.

| 파일 | 역할 |
| --- | --- |
| `assets/simulator/oneroom-standalone.html` | **원본.** 브라우저에서 혼자 열리는 시뮬레이터예요. 3D 화면을 고칠 땐 이 파일을 고쳐요. |
| `assets/simulator/oneroom.html` | 원본에 앱 연결 부분을 붙인 결과물이에요. 직접 고치지 않아요(다음에 다시 만들면 덮어써져요). |

원본을 고친 뒤 아래 한 줄을 실행하면 앱 연결 부분(저장·불러오기, 커뮤니티 보기 전용, 미리보기 사진, 앱 색상, 휴대폰용 목록·조이스틱·도움말)을 붙여 `oneroom.html`과 앱이 쓰는 `src/generated/oneroom-html.ts`까지 다시 만들어요.

```bash
npm run embed:simulator
```

다른 위치의 새 버전 파일을 쓰려면 경로를 넘기세요: `npm run embed:simulator -- "../새 시뮬레이터.html"`. 붙이는 내용은 `scripts/embed-simulator.js`에 있어요. 원본에서 고칠 자리를 못 찾으면 어디인지 알려주고 멈춥니다. 예전 시뮬레이터로 저장한 방도 새 화면에서 열려요.

## 웹 배포 (Vercel)

`vercel.json`에 설정이 들어 있습니다. Vercel 프로젝트의 Environment Variables에 `.env`와 같은 두 값을 넣으면 `npx expo export -p web` 결과(`dist`)가 배포됩니다.

## 폴더 구조

```
src/
  app/          탭 화면 (expo-router 파일 라우팅)
  components/   화면별 부품과 공통 UI (components/ui)
  state/        로그인·가계부·테마 상태
  hooks/        커뮤니티·방 데이터
  lib/          Supabase 연결, 날짜·금액 형식, 에러 문구
  constants/    색상 팔레트·간격
supabase/       DB 스키마와 마이그레이션 SQL
assets/         아이콘·로고·3D 시뮬레이터 HTML
```
