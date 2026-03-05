# 005 - Phase 0: Astro 프로젝트 초기화 및 Tailwind 통합

**작업일**: 2026-03-03
**작업 유형**: 프로젝트 셋업
**상태**: 완료

---

## 사용된 프롬프트

```
Phase 0 진행해줘
```

---

## 수행 작업

### 1. 의존성 설치
```bash
npm install astro @astrojs/tailwind tailwindcss
```
- astro@5.18.0
- @astrojs/tailwind@6.0.2
- tailwindcss@3.4.19

### 2. 설정 파일 생성

| 파일 | 내용 |
|------|------|
| `package.json` | scripts 추가 (dev, build, preview, publish-data) |
| `astro.config.mjs` | site, base, i18n (ko/en), static output |
| `tailwind.config.mjs` | 교회 테마 (primary 컬러 스케일, liturgical 컬러, Noto Sans KR) |
| `tsconfig.json` | path aliases (@components, @layouts, @i18n, @assets) |
| `.gitignore` | node_modules, dist, .env, .DS_Store |

### 3. 소스 구조 생성

```
src/
├── components/           # (빈 디렉토리 - Phase 1에서 생성)
├── layouts/
│   └── BaseLayout.astro  # 공통 HTML head, meta, i18n alternate links
├── pages/
│   ├── index.astro       # Root → /ko/ 리다이렉트
│   ├── ko/
│   │   ├── index.astro   # 한국어 메인 (스켈레톤)
│   │   └── news.astro    # 한국어 뉴스 (스켈레톤)
│   └── en/
│       ├── index.astro   # 영어 메인 (스켈레톤)
│       └── news.astro    # 영어 뉴스 (스켈레톤)
├── i18n/
│   ├── ko.json           # 한국어 번역 (50+ 키)
│   ├── en.json           # 영어 번역 (50+ 키)
│   └── utils.ts          # t(), getLocaleFromUrl(), getLocalizedPath()
├── styles/
│   └── global.css        # Tailwind directives + base/components/utilities
└── assets/images/        # (빈 디렉토리 - 이미지 이동 예정)
```

### 4. 데이터 파이프라인 수정
- `tools/publish-data.js` 수정: `public/data/`와 `data/` 양쪽에 JSON 저장
- 기존 데이터 파일을 `public/data/`로 복사
- 기존 이미지를 `public/`으로 복사

### 5. GitHub Actions 배포 워크플로우
- `.github/workflows/deploy.yaml` 생성
- Trigger: push to main, repository_dispatch, workflow_dispatch
- Steps: checkout → npm ci → publish-data → astro build → deploy-pages

### 6. 버그 수정
- `BASE_URL` 슬래시 문제: `import.meta.env.BASE_URL` 직접 연결 → `getLocalizedPath()` 유틸 함수 사용으로 수정
- `/ctkoreanko/news` → `/ctkorean/ko/news` 올바르게 생성 확인

---

## 빌드 결과 검증

```
Build: 4 pages, 474ms
Output: dist/
├── index.html           (root redirect)
├── ko/index.html        (lang="ko")
├── ko/news/index.html   (lang="ko")
├── en/index.html        (lang="en")
├── en/news/index.html   (lang="en")
├── data/*.json           (정적 데이터)
├── _astro/*.css          (Tailwind 빌드 CSS)
└── *.jpg, *.webp, *.png  (이미지 자산)
```

- `/ko/` 페이지: `<html lang="ko">` ✓
- `/en/` 페이지: `<html lang="en">` ✓
- 링크: `/ctkorean/ko/news` ✓
- hreflang alternate 링크: ✓
- Tailwind CSS 적용: ✓
- JS 번들: 0KB (순수 HTML 출력) ✓

---

## 생성/수정된 파일

### 신규 생성
- `package.json` (업데이트)
- `astro.config.mjs`
- `tailwind.config.mjs`
- `tsconfig.json`
- `.gitignore`
- `src/styles/global.css`
- `src/i18n/ko.json`
- `src/i18n/en.json`
- `src/i18n/utils.ts`
- `src/layouts/BaseLayout.astro`
- `src/pages/index.astro`
- `src/pages/ko/index.astro`
- `src/pages/ko/news.astro`
- `src/pages/en/index.astro`
- `src/pages/en/news.astro`
- `.github/workflows/deploy.yaml`

### 수정
- `tools/publish-data.js` — `public/data/` 출력 경로 추가

---

## AI 대화 요약

1. `npm install` 실행 → 349 패키지 설치 완료
2. 디렉토리 구조 생성 (src/components, layouts, pages, i18n, styles, assets)
3. 핵심 설정 파일 4종 병렬 생성 (astro, tailwind, tsconfig, package.json)
4. global.css, i18n JSON 2종, i18n utils.ts 병렬 생성
5. 레이아웃 + 페이지 파일 5종 병렬 생성 (BaseLayout, root redirect, ko/en 메인/뉴스)
6. GitHub Actions deploy 워크플로우 생성
7. publish-data.js 수정 (public/data/ 이중 출력)
8. 이미지/데이터 파일 public/으로 복사
9. 빌드 테스트 → 성공 (4 pages, 474ms)
10. BASE_URL 슬래시 버그 발견 → getLocalizedPath() 사용으로 수정
11. 재빌드 → 링크 정상 확인

## 다음 단계
Phase 1: 핵심 레이아웃 컴포넌트 구현 (Header, Footer, Hero, LanguageToggle)
