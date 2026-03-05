# CLAUDE.md - 예수성심 천주교 커네티컷 성당 웹사이트

## 프로젝트 개요
예수성심 천주교 커네티컷 성당(Sacred Heart Korean Catholic Church of Connecticut) 공식 웹사이트.
커네티컷주 한인 가톨릭 성당의 미사 안내, 공지사항, 주보, 앨범 등을 제공.
Non-Profit (501(c)(3)) 등록 기관. Google Workspace for Nonprofits 사용 중.

## 확정 아키텍처 (2026-03-03)

| 항목 | 결정 | 비고 |
|------|------|------|
| Framework | **Astro + Tailwind CSS** | 컴포넌트 기반, JS 0KB 출력 |
| Hosting | **GitHub Pages** + Team Non-Profit | 무료, 3000 CI/CD분/월 |
| Data Source | Google Apps Script (GAS) | Google Drive 연동 |
| i18n | Astro 내장 라우팅 | /ko/, /en/ URL 기반 |
| Sync | Live GAS 우선 + repository_dispatch | 5~20분 지연 |
| Design | 전체 리디자인 | 모던 + 교회 + 프로페셔널 |
| Album Auth | 비밀번호 제거 | 공개 앨범 |
| Security | Build-time 다운로드 + URL 스트리핑 | Drive URL 미노출 |
| Domain | 커스텀 도메인 보유 | GitHub Pages 연결 |
| Budget | $0/월 | 모든 무료 티어 활용 |

## 기술 스택

| 항목 | 기술 | 비고 |
|------|------|------|
| SSG | Astro | 빌드 시 순수 HTML 출력 |
| CSS | Tailwind CSS | PostCSS 빌드, 미사용 CSS 자동 제거 |
| Font | Noto Sans KR (Google Fonts) | 300, 400, 700 |
| Icons | 미정 (Font Awesome 또는 Heroicons) | Astro 컴포넌트로 통합 |
| CI/CD | GitHub Actions | Astro build + deploy-pages |
| Data Backend | Google Apps Script (GAS) | REST endpoint |
| Node.js | v20 | GitHub Actions 빌드 환경 |

## 프로젝트 구조 (목표)
```
ctkorean/
├── src/
│   ├── components/           # Astro 재사용 컴포넌트
│   │   ├── Header.astro
│   │   ├── Footer.astro
│   │   ├── Hero.astro
│   │   ├── PriestCard.astro
│   │   ├── MassSchedule.astro
│   │   ├── BulletinCard.astro
│   │   ├── AlbumGallery.astro
│   │   ├── AnnouncementList.astro
│   │   ├── MapSection.astro
│   │   └── LanguageToggle.astro
│   ├── layouts/
│   │   └── BaseLayout.astro  # 공통 HTML head, meta, layout
│   ├── pages/
│   │   ├── ko/               # 한국어 라우트
│   │   │   ├── index.astro
│   │   │   └── news.astro
│   │   ├── en/               # 영어 라우트
│   │   │   ├── index.astro
│   │   │   └── news.astro
│   │   └── index.astro       # Root → /ko/ 리다이렉트
│   ├── i18n/
│   │   ├── ko.json           # 한국어 번역
│   │   └── en.json           # 영어 번역
│   ├── styles/
│   │   └── global.css        # Tailwind directives + custom CSS
│   └── assets/images/        # 히어로/사제 이미지
├── public/data/              # 정적 JSON (자동 생성)
├── tools/
│   └── publish-data.cjs      # GAS fetch + 썸네일/PDF 다운로드 + URL 스트리핑
├── .github/workflows/
│   ├── deploy.yaml           # Astro build + GitHub Pages 배포
│   └── publish-data.yaml     # GAS → JSON 데이터 동기화
├── astro.config.mjs
├── tailwind.config.mjs
├── package.json
├── CLAUDE.md                 # 이 파일
└── documents/completed/      # 작업 완료 문서
```

## 데이터 흐름
```
Google Drive → GAS (5min trigger) → repository_dispatch → GitHub Actions
  → publish-data.cjs:
    1. GAS fetch (ann, bulletin, albums)
    2. Thumbnail download → public/images/thumbs/
    3. PDF download → public/data/pdfs/
    4. Drive URL stripping → public/data/*.json
  → Astro build → dist/ → GitHub Pages

Browser → /ko/ or /en/ → Static HTML (JS 0KB)
Browser → data/*.json → Live GAS fallback (if stale)
```

## 보안 전략

### Drive URL 보호 (Build-time Download)
| 자산 | 보호 방법 | 상태 |
|------|----------|------|
| 소스 코드 (GAS URL, config) | Private repo | 보호됨 |
| 썸네일 이미지 | 빌드 시 다운로드 → `/images/thumbs/` 로컬 서빙 | 보호됨 |
| 주보 PDF | 빌드 시 다운로드 → `/data/pdfs/` 로컬 서빙 | 보호됨 |
| 앨범 폴더 ID | JSON에 ID만 포함 (full URL 아님) | 부분 노출* |
| 공지사항 텍스트 | 공개 콘텐츠 | 공개 |

*앨범 ID는 Drive 폴더가 "링크 있는 사용자" 공유이므로 추가 리스크 없음.

### 향후 강화 옵션
- **Cloudflare Access + GitHub OAuth**: 커스텀 도메인 + Cloudflare DNS 이전 필요 (50명 무료)
- `/data/*` 경로만 선택적 보호 가능

## GAS 엔드포인트
- Base URL: `https://script.google.com/macros/s/AKfycbz.../exec`
- `?type=ann` — 공지사항
- `?type=bulletin` — 주보
- `?type=albums` — 앨범
- 앨범 비밀번호: **제거 예정** (현재 `?type=albumPw` 존재)

## 디자인 토큰

### 컬러
- Primary: `#3A66B0` (Primary-500)
- Primary Scale: 50~900 (Tailwind config에 정의)
- Liturgical Colors: Advent(#5B2C6F), Christmas(#FFF), Lent(#7D3C98), Easter(#F4D03F), Ordinary(#27AE60)
- Text: `#333`
- Background: `#F5F5F5`

### 타이포그래피
- Font: `'Noto Sans KR', system-ui, sans-serif`
- Heading: `word-break: keep-all`, `letter-spacing: -0.02em`
- Body: `word-break: keep-all`, `overflow-wrap: break-word`

### 레이아웃
- Max Width: `1200px`
- Border Radius: `8px` (default), `rounded-lg` in Tailwind
- Responsive: Tailwind default breakpoints (sm:640, md:768, lg:1024, xl:1280)

---

## 개발 컨벤션

### 문서화 규칙 (필수)
- **모든 작업 세션 종료 시** `documents/completed/` 에 순차 번호 문서 작성
- **문서 번호**: 순차 증가 (001, 002, 003, ...)
- **문서 내용 필수 포함**: 사용된 프롬프트, 작업 내용, AI 대화 요약, 결과
- **AI 대화 내용**: 채팅에서 나온 간략한 부분도 반드시 completed 문서에 저장
- **다이어그램**: Mermaid 형식 우선. Mermaid 불가 시 텍스트 그림
- **텍스트 그림 규칙**: 고정폭 문자만, 그림 내부 텍스트는 영어, 본문은 한글 유지
- **모든 작업 유형 적용**: Feature 구현, 버그 수정, 설정 변경, 리팩토링 등

### Astro 코딩 규칙
- 컴포넌트는 `src/components/` 에 `.astro` 파일로 작성
- 페이지는 `src/pages/` 하위에 locale별 디렉토리 (`ko/`, `en/`)
- 레이아웃은 `src/layouts/BaseLayout.astro` 공통 사용
- props 인터페이스는 `Astro.props`로 타입 정의
- 클라이언트 사이드 JS 최소화 (island architecture)

### Tailwind CSS 규칙
- 커스텀 테마는 `tailwind.config.mjs` 에 정의
- 인라인 스타일 사용 금지 → Tailwind 유틸리티 클래스 사용
- 컴포넌트별 반복 패턴은 `@apply`로 추출 (global.css)
- 다크모드: 미적용 (향후 고려)

### i18n 규칙
- 번역 JSON: `src/i18n/ko.json`, `src/i18n/en.json`
- URL 구조: `/ko/`, `/en/` (locale prefix)
- 기본 언어: 한국어 (`/ko/`)
- Root `/` → `/ko/` 리다이렉트
- 번역 키는 dot notation (`hero.title`, `nav.home`)

### 데이터 규칙
- 정적 JSON은 `public/data/` 에 저장 (빌드 시 그대로 복사)
- 브라우저에서 Live GAS 우선 fetch, 정적 JSON fallback
- **Google Drive 직접 링크 노출 절대 금지**
- 썸네일: 빌드 시 `lh3.googleusercontent.com/d/FILE_ID=w400` 다운로드 → `public/images/thumbs/` 로컬 저장
- 주보 PDF: 빌드 시 `drive.google.com/uc?export=download` 다운로드 → `public/data/pdfs/` 로컬 저장
- JSON 내 모든 Drive URL은 `publish-data.cjs`에서 로컬 경로로 변환
- 앨범은 `albumId` (폴더 ID만) 저장, JS에서 클릭 시 URL 조립

### Git 규칙
- Main 브랜치: 프로덕션 배포
- Feature 브랜치: `feature/기능명`
- 커밋 메시지: Conventional Commits (`feat:`, `fix:`, `chore:`, `docs:`)
- GitHub Actions: push to main → Astro build → deploy-pages

---

## Non-Profit 혜택 체크리스트
- [ ] GitHub Team Non-Profit 신청
- [ ] Google Cloud $10,000/년 크레딧 활성화
- [ ] Google Ad Grants $10,000/월 활성화
- [ ] Google Maps $250/월 크레딧 활성화

## 참고 문서
- `documents/completed/001-project-analysis-and-requirements.md` — 초기 분석
- `documents/completed/002-comprehensive-architecture-analysis.md` — 종합 아키텍처 비교
- `documents/completed/003-final-architecture-and-roadmap.md` — 확정 아키텍처 + 로드맵
- `documents/completed/004-session-full-conversation-log.md` — 전체 대화 기록
- `documents/completed/005-phase0-astro-project-init.md` — Phase 0 Astro 프로젝트 초기화
- `documents/completed/006-security-analysis-drive-url-protection.md` — 보안 분석 + Drive URL 보호
