# 010 - Phase 4: i18n 감사 및 수정

**작업일**: 2026-03-04
**작업 유형**: i18n 품질 개선
**상태**: 완료

---

## 사용된 프롬프트

```
Phase 4 진행해줘
```

---

## 1. Phase 4 목표

전체 프로젝트 i18n 감사 후 발견된 문제점 수정:
- 하드코딩된 텍스트를 i18n 키로 전환
- SEO 관련 hreflang/canonical/OG 태그 수정
- `t()` 함수에 보간(interpolation) 지원 추가

---

## 2. 감사 결과 (15개 항목)

### HIGH 우선순위

| # | 문제 | 파일 | 수정 방법 |
|---|------|------|-----------|
| 1 | hreflang 상대 URL | BaseLayout.astro | `getAbsoluteLocalizedPath()` 사용 |
| 2 | x-default hreflang 없음 | BaseLayout.astro | x-default 태그 추가 |
| 3 | `t()` 보간 미지원 | utils.ts | `params` 파라미터 추가 |

### MEDIUM 우선순위

| # | 문제 | 파일 | 수정 방법 |
|---|------|------|-----------|
| 4 | canonical 링크 없음 | BaseLayout.astro | `<link rel="canonical">` 추가 |
| 5 | og:locale, og:url 없음 | BaseLayout.astro | OG 메타 태그 추가 |
| 6 | Hero alt 하드코딩 | Hero.astro | `hero.photoAlt` i18n 키 사용 |
| 7 | Hero aria-label 하드코딩 | Hero.astro | `hero.slide` i18n 키 사용 |
| 8 | Map iframe title 하드코딩 | MapSection.astro | `directions.mapTitle` i18n 키 사용 |
| 9 | genLabel() 하드코딩 (KO) | ko/index.astro | `t()` 보간 사용 |
| 10 | genLabel() 하드코딩 (EN) | en/index.astro | `ordinal()` + `t()` 보간 사용 |

### LOW 우선순위 (향후 정리)

| # | 문제 | 상태 |
|---|------|------|
| 11-15 | 미사용 키, 불필요 함수 등 | 향후 정리 |

---

## 3. 핵심 코드 변경

### utils.ts — `t()` 보간 지원 추가

```typescript
// Before
export function t(locale: string, key: string): string { ... }

// After
export function t(locale: string, key: string, params?: Record<string, string | number>): string {
  let value = translations[lang]?.[key] || translations[defaultLocale][key] || key;
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      value = value.replace(`{${k}}`, String(v));
    }
  }
  return value;
}
```

### utils.ts — `getAbsoluteLocalizedPath()` 추가

```typescript
export function getAbsoluteLocalizedPath(path: string, locale: Locale): string {
  const site = (import.meta.env.SITE || '').replace(/\/$/, '');
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  const cleanPath = path.replace(/^\/?/, '');
  return `${site}${base}/${locale}/${cleanPath}`;
}
```

### utils.ts — `ordinal()` 추가

```typescript
export function ordinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}
```

### BaseLayout.astro — SEO 태그 완성

```
Before:
  <link rel="alternate" hreflang="ko" href="/ctkorean/ko/..." />  (relative)

After:
  <link rel="canonical" href="https://...absolute..." />
  <meta property="og:locale" content="ko_KR" />
  <meta property="og:url" content="https://...absolute..." />
  <link rel="alternate" hreflang="ko" href="https://...absolute..." />
  <link rel="alternate" hreflang="en" href="https://...absolute..." />
  <link rel="alternate" hreflang="x-default" href="https://...absolute..." />
```

### i18n 키 추가 (3개씩)

| 키 | KO | EN |
|----|----|----|
| `hero.photoAlt` | 성당 사진 {n} | Church photo {n} |
| `hero.slide` | 슬라이드 {n} | Slide {n} |
| `directions.mapTitle` | Google 지도 | Google Maps |

### en.json 키 수정

| 키 | Before | After |
|----|--------|-------|
| `priests.generation` | `{n}th Pastor` | `{n} Pastor` |

(ordinal 함수가 "1st", "2nd", "3rd" 등을 생성하여 `{n}`에 삽입)

---

## 4. 수정된 파일 목록

| 파일 | 변경 내용 |
|------|-----------|
| `src/i18n/utils.ts` | `t()` 보간, `getAbsoluteLocalizedPath()`, `ordinal()` 추가 |
| `src/i18n/ko.json` | 3개 키 추가 (hero.photoAlt, hero.slide, directions.mapTitle) |
| `src/i18n/en.json` | 3개 키 추가 + priests.generation 수정 |
| `src/layouts/BaseLayout.astro` | canonical, og:locale, og:url, 절대 hreflang, x-default |
| `src/components/Hero.astro` | alt, aria-label → i18n 키 사용 |
| `src/components/MapSection.astro` | iframe title → i18n 키 사용 |
| `src/pages/ko/index.astro` | genLabel() → `t()` 보간 사용 |
| `src/pages/en/index.astro` | genLabel() → `ordinal()` + `t()` 보간, ordinals 맵 제거 |

---

## 5. 빌드 검증

```
Build: 4 pages, 709ms ✓
```

### 검증 결과

| 항목 | KO | EN |
|------|-----|-----|
| Hero alt | "성당 사진 1~5" | "Church photo 1~5" |
| Hero aria-label | "슬라이드 1~5" | "Slide 1~5" |
| Map title | "Google 지도" | "Google Maps" |
| Priest 세대 | "제1대~제11대 주임 신부" | "1st~11th Pastor" |
| hreflang | 절대 URL ✓ | 절대 URL ✓ |
| x-default | → /ko/ ✓ | — |
| canonical | 절대 URL ✓ | 절대 URL ✓ |
| og:locale | ko_KR | en_US |
| og:url | 절대 URL ✓ | 절대 URL ✓ |

---

## AI 대화 요약

### 수행 작업
1. 탐색 에이전트로 전체 프로젝트 i18n 감사 (15개 문제 발견)
2. `t()` 함수에 `params` 보간 지원 추가 → `{n}` 플레이스홀더 사용 가능
3. `getAbsoluteLocalizedPath()` 추가 → SEO 절대 URL 생성
4. `ordinal()` 추가 → 영어 서수 (1st, 2nd, 3rd, ...)
5. BaseLayout.astro SEO 태그 완성 (canonical, og:locale, og:url, 절대 hreflang, x-default)
6. Hero.astro alt/aria-label i18n 전환
7. MapSection.astro iframe title i18n 전환
8. 양쪽 index.astro genLabel() → `t()` 보간 사용 (EN은 ordinal 적용)
9. i18n JSON에 3개 키 추가, 1개 수정
10. 빌드 성공 (709ms), 전체 검증 완료

### 핵심 기술 결정
- **t() 보간**: `{key}` 형식 플레이스홀더 → 단순 문자열 치환 (라이브러리 불필요)
- **ordinal()**: 수학적 서수 계산 (11th, 12th, 13th 예외 처리 포함)
- **hreflang 절대 URL**: `import.meta.env.SITE` + `BASE_URL` 조합 → Google SEO 요구사항 충족
- **x-default**: 기본 언어(ko)로 설정 → 검색엔진 fallback

## 다음 단계
Phase 5: 데이터 동기화 설정 (Live GAS + repository_dispatch)
