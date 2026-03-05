# 007 - Phase 1: 핵심 레이아웃 컴포넌트 구현

**작업일**: 2026-03-04
**작업 유형**: Feature 구현
**상태**: 완료

---

## 사용된 프롬프트

```
Phase 1 진행해줘
```

---

## 1. Phase 1 목표

Phase 1은 웹사이트의 핵심 레이아웃 컴포넌트를 구현하는 단계:
- **Header.astro**: 스티키 내비게이션 + 모바일 햄버거 메뉴 + 언어 토글
- **Footer.astro**: 교회 정보 + 빠른 링크 + 저작권
- **Hero.astro**: 5장 이미지 슬라이더 + 자동 재생 + 인디케이터
- **BaseLayout.astro 업데이트**: Header/Footer 통합 + OG 메타 태그

---

## 2. 생성된 컴포넌트

### Header.astro

```
+------------------------------------------------------------------+
| [Cross] Church Name          Nav Links...     [EN/KO] [Hamburger] |
+------------------------------------------------------------------+
|                     Mobile Menu (toggle)                          |
+------------------------------------------------------------------+
```

**주요 기능:**
- `sticky top-0 z-50` + `bg-white/95 backdrop-blur-sm` (프로스티드 글래스 효과)
- 데스크톱 (`lg:` 이상): 로고 + 6개 내비 링크 + 언어 토글 버튼
- 모바일 (`< lg`): 로고 + 햄버거 → 드롭다운 메뉴
- 현재 페이지 하이라이트 (Home/News → `text-primary-500`)
- 해시 링크 클릭 시 모바일 메뉴 자동 닫힘
- 햄버거 ↔ X 아이콘 토글
- `aria-expanded`, `aria-label` 접근성 속성

**내비게이션 링크 구조:**
| 항목 | 메인 페이지 | 뉴스 페이지 |
|------|-----------|-----------|
| 홈 | `/ctkorean/ko/` | `/ctkorean/ko/` |
| 성당 소개 | `/ctkorean/ko/#about` | `/ctkorean/ko/#about` |
| 사제단 | `/ctkorean/ko/#priests` | `/ctkorean/ko/#priests` |
| 미사 안내 | `/ctkorean/ko/#mass` | `/ctkorean/ko/#mass` |
| 공동체 소식 | `/ctkorean/ko/news` | `/ctkorean/ko/news` |
| 오시는 길 | `/ctkorean/ko/#directions` | `/ctkorean/ko/#directions` |

**언어 토글:**
- KO 모드 → "English" 버튼 → EN 동일 페이지로 이동
- EN 모드 → "한국어" 버튼 → KO 동일 페이지로 이동
- URL 경로에서 locale 부분만 교체 (`/ko/news` → `/en/news/`)

### Footer.astro

```
+------------------------------------------------------------------+
| Church Name                    | Quick Links                      |
| Address: 56 Hartford Ave...    |   Home        Community News    |
| Phone: 860-529-1456            |   Mass        Directions        |
| Mobile: 860-519-4650           |                                  |
+------------------------------------------------------------------+
| (c) 2026 Church Name. All rights reserved.                       |
+------------------------------------------------------------------+
```

**주요 기능:**
- `bg-gray-900` 다크 배경
- 2컬럼 레이아웃 (`md:grid-cols-2`)
- 전화번호 `tel:` 링크 (모바일에서 바로 전화)
- 빠른 링크 4개 (홈, 소식, 미사, 오시는 길)
- 하단 구분선 + 저작권

### Hero.astro

```
+------------------------------------------------------------------+
|                                                                    |
|           [Image Slider - 5 photos with crossfade]                |
|                                                                    |
|              Church Title (large, white, shadow)                   |
|              Welcome subtitle                                      |
|              [News Button] [Mass Button]                           |
|                                                                    |
|                    o o o o o  (dots)                                |
+------------------------------------------------------------------+
```

**주요 기능:**
- 5장 이미지 (`00.jpg`, `01.jpg`, `02.webp`, `03.webp`, `04.jpg`)
- 높이: 모바일 `h-[60vh]`, 데스크톱 `h-[80vh]`
- `bg-black/50` 오버레이
- CSS `opacity` 기반 크로스페이드 (1000ms transition)
- 5초 자동 재생 (`setInterval`)
- 닷 인디케이터 클릭으로 수동 이동
- 첫 이미지만 `loading="eager"`, 나머지 `loading="lazy"`
- 반응형 타이포그래피 (`text-3xl sm:text-4xl md:text-5xl lg:text-6xl`)

---

## 3. BaseLayout.astro 업데이트

### Before
```html
<body>
  <slot />  <!-- 각 페이지에서 footer, hero 등 중복 작성 -->
</body>
```

### After
```html
<body>
  <Header locale={locale} />
  <slot />              <!-- 페이지별 고유 콘텐츠만 -->
  <Footer locale={locale} />
</body>
```

### 추가된 메타 태그
```html
<meta property="og:title" content="..." />
<meta property="og:description" content="..." />
<meta property="og:type" content="website" />
```

---

## 4. 페이지 업데이트

### ko/index.astro, en/index.astro
- **제거**: 인라인 hero section (단색 `bg-primary-500`)
- **제거**: 인라인 `<footer>`
- **추가**: `<Hero locale={locale} />` 컴포넌트
- **추가**: `id="about"` 섹션 앵커

### ko/news.astro, en/news.astro
- **제거**: 인라인 `<footer>`
- Header/Footer는 BaseLayout에서 자동 제공

---

## 5. i18n 키 추가

### ko.json (7개 추가)
```json
"nav.language": "English",
"nav.menu": "메뉴",
"footer.address.value": "56 Hartford Ave, Wethersfield, CT 06109",
"footer.phone.value": "860-529-1456",
"footer.mobile": "휴대폰",
"footer.mobile.value": "860-519-4650",
"footer.quicklinks": "바로 가기"
```

### en.json (7개 추가)
```json
"nav.language": "한국어",
"nav.menu": "Menu",
"footer.address.value": "56 Hartford Ave, Wethersfield, CT 06109",
"footer.phone.value": "860-529-1456",
"footer.mobile": "Mobile",
"footer.mobile.value": "860-519-4650",
"footer.quicklinks": "Quick Links"
```

---

## 6. 버그 수정

### publish-data.yaml .js → .cjs
- `.github/workflows/publish-data.yaml`에서 `node tools/publish-data.js` → `node tools/publish-data.cjs`
- Phase 0에서 ESM 호환을 위해 `.cjs`로 변경했으나 이 워크플로우는 누락됨

---

## 7. 빌드 검증

```
Build: 4 pages, 1.42s
Output: dist/
├── index.html           (root redirect)
├── ko/index.html        (Header + Hero slider + About + Mass + Footer)
├── ko/news/index.html   (Header + News sections + Footer)
├── en/index.html        (Header + Hero slider + About + Mass + Footer)
├── en/news/index.html   (Header + News sections + Footer)
├── _astro/*.css          (Tailwind + Component styles)
└── _astro/*.js           (Header menu + Hero slider JS)
```

### 검증 항목

| 항목 | 상태 |
|------|------|
| Header 스티키 내비게이션 | 4페이지 모두 포함 |
| 모바일 햄버거 메뉴 | aria-label, toggle 동작 |
| 언어 토글 (KO→EN, EN→KO) | 올바른 경로 생성 |
| 현재 페이지 하이라이트 | Home/News active 확인 |
| Hero 슬라이더 (5 images) | 메인 페이지에만 포함 |
| Footer (주소, 전화, 링크) | 4페이지 모두 포함 |
| OG meta tags | title, description, type |
| hreflang alternates | ko/en 양방향 |
| 인라인 footer 제거 | 모든 페이지에서 제거 |

---

## 8. 수정된 파일 목록

| 파일 | 변경 내용 |
|------|----------|
| `src/components/Header.astro` | **신규** — 스티키 헤더 + 모바일 메뉴 + 언어 토글 |
| `src/components/Footer.astro` | **신규** — 교회 정보 + 빠른 링크 + 저작권 |
| `src/components/Hero.astro` | **신규** — 5장 이미지 슬라이더 + 자동 재생 |
| `src/layouts/BaseLayout.astro` | Header/Footer 통합, OG 메타 추가 |
| `src/pages/ko/index.astro` | Hero 컴포넌트 사용, 인라인 footer 제거 |
| `src/pages/en/index.astro` | Hero 컴포넌트 사용, 인라인 footer 제거 |
| `src/pages/ko/news.astro` | 인라인 footer 제거 |
| `src/pages/en/news.astro` | 인라인 footer 제거 |
| `src/i18n/ko.json` | 7개 키 추가 (nav.language, footer.*) |
| `src/i18n/en.json` | 7개 키 추가 (nav.language, footer.*) |
| `.github/workflows/publish-data.yaml` | `.js` → `.cjs` 버그 수정 |

---

## AI 대화 요약

### 수행 작업
1. 프로젝트 탐색 에이전트 실행 (현재 구조, 데이터, 이미지 파일 파악)
2. 기존 사이트(index.html)에서 교회 주소/전화번호 확인
   - 주소: 56 Hartford Ave, Wethersfield, CT 06109
   - 전화: 860-529-1456, 휴대폰: 860-519-4650
3. i18n JSON 양쪽에 7개 키 추가 (footer 정보, 언어 토글)
4. Header.astro 구현 (스티키, 반응형, 햄버거, 언어 토글)
5. Footer.astro 구현 (2컬럼, 교회 정보, 빠른 링크)
6. Hero.astro 구현 (5장 슬라이더, 크로스페이드, 자동 재생)
7. BaseLayout.astro 업데이트 (Header/Footer 통합, OG 메타)
8. 4개 페이지 업데이트 (인라인 hero/footer 제거, 컴포넌트 사용)
9. publish-data.yaml 버그 수정 (.js → .cjs)
10. 빌드 테스트: 성공 (4 pages, 1.42s)
11. 출력 HTML 검증: Header, Hero, Footer, 언어 토글, OG 태그 모두 정상

### 기술적 결정
- Hero 슬라이더: CSS `opacity` transition 사용 (JS framework 불필요)
- Header: `backdrop-blur-sm` + `bg-white/95` 프로스티드 글래스 효과
- 내비 해시 링크: 항상 full path + hash (`/ko/#about`) → 뉴스 페이지에서도 동작
- 언어 토글: URL에서 locale 부분만 교체하는 방식
- Cross 아이콘: SVG path로 라틴 십자가 구현

## 다음 단계
Phase 2: 메인 페이지 섹션 컴포넌트 구현 (PriestCard, MassSchedule, MapSection)
