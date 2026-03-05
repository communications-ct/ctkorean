# 012 - Phase 6: 배포 및 최종 테스트

**작업일**: 2026-03-04
**작업 유형**: Deployment / QA
**상태**: 완료

---

## 사용된 프롬프트

```
Phase 6 진행해줘
```

---

## 1. Phase 6 목표

배포 전 최종 품질 감사 + 누락 항목 구현 + 커스텀 도메인 설정:
- 전체 배포 준비 점검 (55개 항목)
- 누락된 Critical/High 항목 수정
- 커스텀 도메인 `ctkoreancatholic.org` 설정
- 레거시 파일 정리

---

## 2. 배포 준비 감사 결과

### 총 55개 항목 점검

| 카테고리 | PASS | MISSING/WARN | 수정 |
|----------|------|-------------|------|
| Pages (6) | 5 | 1 (404 없음) | 수정 완료 |
| Components (9) | 9 | 0 | — |
| Build Output | PASS | — | — |
| Public Assets | PASS | 3 (favicon, robots, CNAME) | 수정 완료 |
| SEO/Meta | 7 PASS | 3 (og:image, twitter, sitemap) | 수정 완료 |
| Accessibility | 5 PASS | 1 (skip-to-content) | 수정 완료 |
| Performance | PASS | 1 WARN (04.jpg 763KB) | 향후 |
| CI/CD | PASS | — | — |
| Data | PASS | — | — |

---

## 3. Critical 수정 사항

### 3a. favicon.svg 추가

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <rect width="32" height="32" rx="4" fill="#3A66B0"/>
  <path d="M16 6v20M8 14h16" stroke="#fff" stroke-width="3" stroke-linecap="round"/>
</svg>
```

- Primary Blue (#3A66B0) 배경 + 흰색 십자가 아이콘
- SVG 형식 → 모든 해상도에서 선명
- BaseLayout.astro에 `<link rel="icon">` 추가

### 3b. 404 페이지 생성

```
+---------------------------+
| Header                    |
+---------------------------+
|                           |
|          404              |
|  (text-8xl, primary-500)  |
|                           |
|  Page Not Found message   |
|  [Back to Home button]    |
|                           |
+---------------------------+
| Footer                    |
+---------------------------+
```

- i18n 지원 (ko/en 번역 키 추가)
- `id="main-content"` 포함 (접근성)
- BaseLayout 사용 (Header/Footer 일관성)

### 3c. og:image + twitter:card 메타 태그

```html
<meta property="og:image" content="https://ctkoreancatholic.org/00.jpg" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content={title} />
<meta name="twitter:description" content={description} />
<meta name="twitter:image" content={ogImage} />
```

**효과**: KakaoTalk, Facebook, iMessage, Twitter 등에서 링크 공유 시 프리뷰 이미지 표시

### 3d. @astrojs/sitemap 설치 및 설정

```
npm install @astrojs/sitemap
```

```javascript
// astro.config.mjs
integrations: [tailwind(), sitemap()],
```

**출력**: `sitemap-index.xml` + `sitemap-0.xml` (5개 URL 포함)

### 3e. robots.txt 생성

```
User-agent: *
Allow: /

Sitemap: https://ctkoreancatholic.org/sitemap-index.xml
```

### 3f. Skip-to-content 접근성 링크

```html
<a href="#main-content" class="sr-only focus:not-sr-only focus:absolute ...">
  본문으로 건너뛰기
</a>
```

- 모든 5개 페이지에 `id="main-content"` 추가
- 키보드 Tab → 첫 번째로 포커스 → 본문으로 바로 이동
- 시각적으로 숨겨져 있다가 포커스 시 나타남

---

## 4. 커스텀 도메인 설정

### 변경 사항

| 항목 | Before | After |
|------|--------|-------|
| `astro.config.mjs` site | `https://communications-ct.github.io` | `https://ctkoreancatholic.org` |
| `astro.config.mjs` base | `/ctkorean` | (제거 — 루트 서빙) |
| `publish-data.cjs` BASE_PATH | `/ctkorean` | `''` (빈 문자열) |
| `robots.txt` Sitemap URL | `communications-ct.github.io/ctkorean/...` | `ctkoreancatholic.org/...` |
| `public/CNAME` | (없음) | `ctkoreancatholic.org` |

### 경로 변경 영향

| 항목 | Before | After |
|------|--------|-------|
| 홈 URL | `/ctkorean/ko/` | `/ko/` |
| hreflang | `communications-ct.github.io/ctkorean/ko/` | `ctkoreancatholic.org/ko/` |
| Hero 이미지 | `/ctkorean/00.jpg` | `/00.jpg` |
| 썸네일 경로 | `/ctkorean/images/thumbs/...` | `/images/thumbs/...` |
| PDF 경로 | `/ctkorean/data/pdfs/...` | `/data/pdfs/...` |
| canonical | `communications-ct.github.io/ctkorean/ko/` | `ctkoreancatholic.org/ko/` |
| og:image | `communications-ct.github.io/ctkorean/00.jpg` | `ctkoreancatholic.org/00.jpg` |

### DNS 설정 (수동 작업 필요)

도메인 등록기(GoDaddy, Namecheap 등)에서 설정:

```
Type    Name    Value
A       @       185.199.108.153
A       @       185.199.109.153
A       @       185.199.110.153
A       @       185.199.111.153
CNAME   www     communications-ct.github.io
```

GitHub 설정:
1. Repository → Settings → Pages
2. Source: GitHub Actions
3. Custom domain: `ctkoreancatholic.org`
4. Enforce HTTPS: ✓ (DNS 전파 후 자동 SSL)

---

## 5. 레거시 파일 정리

| 삭제된 파일 | 설명 |
|-------------|------|
| `/index.html` | 기존 레거시 HTML (Astro `src/pages/index.astro`로 대체) |
| `/news.html` | 기존 레거시 HTML (Astro `src/pages/*/news.astro`로 대체) |
| `/publish-data.yml` | 기존 워크플로우 (`.github/workflows/publish-data.yaml`로 대체) |

---

## 6. i18n 키 추가

| 키 | KO | EN |
|----|----|----|
| `404.title` | 페이지를 찾을 수 없습니다 | Page Not Found |
| `404.description` | 요청하신 페이지가... | The page you requested... |
| `404.backHome` | 홈으로 돌아가기 | Back to Home |
| `a11y.skipToContent` | 본문으로 건너뛰기 | Skip to content |

---

## 7. 빌드 검증

```
Build: 5 pages, 588ms ✓
Sitemap: sitemap-index.xml ✓ (5 URLs)
```

### 최종 빌드 출력

```
dist/
├── 404.html                    ← NEW
├── index.html                  (root redirect)
├── ko/index.html
├── ko/news/index.html
├── en/index.html
├── en/news/index.html
├── sitemap-index.xml           ← NEW
├── sitemap-0.xml               ← NEW
├── robots.txt                  ← NEW
├── favicon.svg                 ← NEW
├── CNAME                       ← NEW
├── _astro/                     (CSS)
├── data/                       (JSON + PDFs)
├── images/thumbs/              (thumbnails)
├── 00.jpg ~ 04.jpg             (hero images)
└── *_p.{jpeg,jpg,png}          (priest photos)
```

### 검증 결과

| 항목 | 상태 |
|------|------|
| 5개 페이지 정상 빌드 | ✓ |
| hreflang → ctkoreancatholic.org | ✓ |
| canonical → ctkoreancatholic.org | ✓ |
| og:image 절대 URL | ✓ |
| twitter:card 메타 태그 | ✓ |
| favicon.svg 포함 | ✓ |
| robots.txt + sitemap 연결 | ✓ |
| CNAME 파일 포함 | ✓ |
| Skip-to-content 링크 (5개 페이지) | ✓ |
| 경로 /ctkorean 접두사 제거 | ✓ |
| 썸네일/PDF 경로 업데이트 | ✓ |

---

## 8. 수정된 파일 목록

| 파일 | 변경 내용 |
|------|-----------|
| `astro.config.mjs` | `site` → ctkoreancatholic.org, `base` 제거, sitemap 추가 |
| `src/layouts/BaseLayout.astro` | og:image, twitter:card, favicon, skip-to-content |
| `src/pages/404.astro` | **신규** — 404 에러 페이지 |
| `src/pages/ko/index.astro` | `id="main-content"` 추가 |
| `src/pages/en/index.astro` | `id="main-content"` 추가 |
| `src/pages/ko/news.astro` | `id="main-content"` 추가 |
| `src/pages/en/news.astro` | `id="main-content"` 추가 |
| `src/i18n/ko.json` | 4개 키 추가 (404, a11y) |
| `src/i18n/en.json` | 4개 키 추가 |
| `tools/publish-data.cjs` | `BASE_PATH: ''` (커스텀 도메인 대응) |
| `public/favicon.svg` | **신규** — 십자가 아이콘 SVG |
| `public/robots.txt` | **신규** — 검색엔진 안내 |
| `public/CNAME` | **신규** — GitHub Pages 커스텀 도메인 |

### 삭제된 파일

| 파일 | 이유 |
|------|------|
| `/index.html` | Astro로 대체됨 |
| `/news.html` | Astro로 대체됨 |
| `/publish-data.yml` | `.github/workflows/` 로 이동됨 |

---

## AI 대화 요약

### 수행 작업
1. 탐색 에이전트로 전체 배포 준비 감사 (55개 항목)
2. `@astrojs/sitemap` 설치 및 설정
3. `favicon.svg` 생성 (Primary Blue 십자가)
4. `robots.txt` 생성
5. `404.astro` 에러 페이지 생성 + i18n 키 추가
6. `og:image` + `twitter:card` 메타 태그 추가 (소셜 공유 프리뷰)
7. Skip-to-content 접근성 링크 + `id="main-content"` (5개 페이지)
8. 커스텀 도메인 `ctkoreancatholic.org` 설정 (CNAME, site, base, BASE_PATH)
9. 레거시 파일 삭제 (index.html, news.html, publish-data.yml)
10. 빌드 성공 (588ms), 전체 검증 완료

### 핵심 기술 결정
- **커스텀 도메인**: `base: '/ctkorean'` 제거 → 루트 서빙 (`/ko/`, `/en/`)
- **og:image**: 히어로 이미지 `00.jpg` 재활용 (별도 OG 이미지 불필요)
- **favicon**: SVG 형식 → 다크모드/라이트모드 대응 가능, 모든 해상도에서 선명
- **sitemap**: `@astrojs/sitemap` 자동 생성 → Google/Naver 인덱싱 지원

---

## 배포 전 TODO (수동 작업)

### DNS 설정
1. [ ] 도메인 등록기에서 A 레코드 4개 추가 (GitHub Pages IP)
2. [ ] www CNAME → communications-ct.github.io
3. [ ] DNS 전파 대기 (최대 48시간, 보통 1-2시간)

### GitHub 설정
4. [ ] Repository Settings → Pages → Source: GitHub Actions
5. [ ] Custom domain: ctkoreancatholic.org
6. [ ] Enforce HTTPS: ✓

### GAS 설정
7. [ ] GitHub PAT 생성 → GAS Script Properties에 저장
8. [ ] `gas-trigger-example.js` 코드를 GAS에 복사
9. [ ] 5분 타이머 트리거 설정

### 검증
10. [ ] `https://ctkoreancatholic.org/ko/` 접속 확인
11. [ ] `https://ctkoreancatholic.org/en/` 접속 확인
12. [ ] 모바일 반응형 확인
13. [ ] KakaoTalk/Facebook 링크 공유 → OG 프리뷰 확인
14. [ ] Google Search Console에 sitemap 제출

## 다음 단계
- 코드 커밋 및 push → GitHub Actions 자동 배포
- DNS 설정 후 커스텀 도메인 확인
- Google Search Console, Naver Webmaster Tools 등록

### 향후 개선 사항 (Post-Launch)
- `04.jpg` 이미지 최적화 (763KB → 200KB 이하)
- Astro `<Image>` 컴포넌트로 자동 이미지 최적화
- apple-touch-icon.png 추가
- Naver 웹마스터 도구 등록
