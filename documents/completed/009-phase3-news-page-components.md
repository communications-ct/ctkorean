# 009 - Phase 3: 뉴스 페이지 컴포넌트 구현

**작업일**: 2026-03-04
**작업 유형**: Feature 구현
**상태**: 완료

---

## 사용된 프롬프트

```
Phase 3 진행해줘
```

---

## 1. Phase 3 목표

뉴스 페이지의 3가지 데이터 섹션을 빌드 타임 렌더링으로 구현:
- **AnnouncementList.astro**: 공지사항 (expand/collapse, urgent 강조)
- **BulletinList.astro**: 주보 PDF 카드 그리드
- **AlbumGallery.astro**: 앨범 썸네일 갤러리

---

## 2. 핵심 설계 결정

### Build-time 렌더링 (JS 0KB 달성)

```
Before (old site):
  Browser → fetch(/data/*.json) → JS renders DOM → 200+ lines JS

After (Astro):
  Astro build → fs.readFileSync(public/data/*.json) → Static HTML
  → 0 JS for data rendering
  → <details>/<summary> for expand/collapse (native HTML)
```

| 기능 | 방식 | JS 필요 |
|------|------|---------|
| 데이터 렌더링 | Build-time (fs.readFileSync) | No |
| 공지 펼치기/접기 | `<details>`/`<summary>` HTML | No |
| 날짜 포맷 | Build-time (`toLocaleDateString`) | No |
| URL 자동 링크 | Build-time (regex) | No |
| 앨범 링크 | `<a>` 태그 (albumId → Drive URL) | No |
| 주보 보기 | `<a target="_blank">` (로컬 PDF) | No |

---

## 3. 생성된 컴포넌트

### AnnouncementList.astro

```
+---------------------------------------------------+
| [긴급] 미사시간                    2026년 3월 4일  v |
+---------------------------------------------------+
| 제목 클릭 → 본문 펼침 (details/summary)            |
|                                                     |
| 매주일 10:30am                                      |
| (URL 자동 링크, \n → <br>)                          |
| 원문 → (link 있을 때만)                              |
+---------------------------------------------------+
```

**주요 기능:**
- `<details>`/`<summary>` 네이티브 HTML (JS 불필요)
- Urgent 공지: `border-l-4 border-red-500` + 빨간 뱃지
- Urgent 우선 정렬, 그 다음 날짜 내림차순
- `escapeHtml()` XSS 방어 후 `\n → <br>` 변환
- URL 자동 감지 → `<a>` 링크로 변환
- 셰브론 아이콘 (`group-open:rotate-180`)
- `link` 필드가 있으면 "원문 →" 링크 표시

### BulletinList.astro

```
+------------------+
| [PDF icon]       |
| 연중제22주일 주보 |
| 2026년 3월 4일   |
| [주보 보기]      |
+------------------+
```

**주요 기능:**
- `card-accent` 카드 (border-top 강조)
- PDF 아이콘 (SVG)
- 날짜 포맷 (locale별)
- `btn-primary` "주보 보기" → 로컬 PDF 새 탭

### AlbumGallery.astro

```
+-----------------------+
| [thumbnail image]     |
| 4:3 aspect ratio      |
| hover: scale 105%     |
+-----------------------+
| Album Title           |
| 2025년 3월 3일        |
+-----------------------+
→ 클릭 시 Drive 폴더 새 탭
```

**주요 기능:**
- `card` 카드 전체가 `<a>` 링크
- `aspect-[4/3]` 고정 비율 썸네일
- `group-hover:scale-105` 줌 효과
- `albumId → https://drive.google.com/drive/folders/` URL 조합
- `loading="lazy"` 이미지 지연 로드

---

## 4. 데이터 처리

### Build-time JSON 읽기

```astro
---
import fs from 'node:fs';

function readJson(filename: string): any[] {
  try {
    return JSON.parse(fs.readFileSync(`public/data/${filename}`, 'utf8'));
  } catch {
    return [];
  }
}

const announcements = readJson('announcements.json');
const bulletins = readJson('bulletins.json');
const albums = readJson('albums.json');
---
```

### 날짜 포맷 (`formatDate` 유틸 추가)

`src/i18n/utils.ts`에 추가:
```typescript
export function formatDate(dateStr: string, locale: string): string {
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  return locale === 'en'
    ? date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
    : date.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });
}
```

**결과:**
- KO: "2026년 3월 4일"
- EN: "Mar 4, 2026"

---

## 5. i18n 키 추가

### 추가된 키 (ko.json + en.json, 7개씩)

| 키 | KO | EN |
|----|----|----|
| `news.urgent` | 긴급 | Urgent |
| `news.original` | 원문 | Original |
| `news.viewPdf` | 주보 보기 | View Bulletin |
| `news.openAlbum` | 앨범 열기 | Open Album |
| `news.noAnnouncements` | 공지사항이 없습니다. | No announcements. |
| `news.noBulletins` | 주보가 없습니다. | No bulletins available. |
| `news.noAlbums` | 앨범이 없습니다. | No albums available. |

---

## 6. 빌드 검증

```
Build: 4 pages, 556ms ✓
```

### 검증 결과

| 항목 | KO | EN |
|------|-----|-----|
| 공지사항 (`<details>`) | 4개 | 4개 |
| Urgent 뱃지 | 1개 ("긴급") | 1개 ("Urgent") |
| 주보 카드 | 1개 + "주보 보기" | 1개 + "View Bulletin" |
| 앨범 카드 | 9개 Drive 링크 | 9개 Drive 링크 |
| 앨범 썸네일 | 9개 로컬 이미지 | 9개 로컬 이미지 |
| 날짜 포맷 (KO) | "2026년 3월 4일" | — |
| 날짜 포맷 (EN) | — | "Mar 4, 2026" |
| 클라이언트 JS | 0 (데이터 렌더링) | 0 |

---

## 7. 수정된 파일 목록

| 파일 | 변경 내용 |
|------|----------|
| `src/components/AnnouncementList.astro` | **신규** — 공지사항 details/summary 리스트 |
| `src/components/BulletinList.astro` | **신규** — 주보 PDF 카드 그리드 |
| `src/components/AlbumGallery.astro` | **신규** — 앨범 썸네일 갤러리 |
| `src/pages/ko/news.astro` | Build-time JSON 읽기 + 3 컴포넌트 사용 |
| `src/pages/en/news.astro` | 동일 구조, locale='en' |
| `src/i18n/utils.ts` | `formatDate()` 함수 추가 |
| `src/i18n/ko.json` | 7개 키 추가 (urgent, viewPdf, empty states) |
| `src/i18n/en.json` | 7개 키 추가 |

---

## AI 대화 요약

### 수행 작업
1. 탐색 에이전트 실행 — 기존 news.html JS 로직 분석, JSON 데이터 구조 확인
2. 설계 결정: 클라이언트 JS fetch 대신 **Build-time 렌더링** 채택
   - JS 0KB 목표 달성 (데이터 렌더링에 JS 불필요)
   - `<details>/<summary>` 네이티브 HTML로 expand/collapse
   - `fs.readFileSync`로 빌드 시 JSON 읽기
3. `formatDate()` 유틸 함수 추가 (i18n 날짜 포맷)
4. i18n 양쪽 7개 키 추가
5. AnnouncementList.astro 구현 (urgent 정렬, XSS 방어, URL 자동 링크)
6. BulletinList.astro 구현 (PDF 아이콘, 로컬 PDF 링크)
7. AlbumGallery.astro 구현 (썸네일 갤러리, Drive 폴더 링크)
8. ko/news.astro, en/news.astro 재작성 (build-time 데이터 + 컴포넌트)
9. 빌드 성공 (556ms), 출력 검증 완료

### 핵심 기술 결정
- **Build-time vs Client-side**: Build-time 선택 → JS 0KB, SEO 최적, 빠른 로딩
- **Expand/Collapse**: `<details>/<summary>` HTML 네이티브 (JS 0줄)
- **XSS 방어**: `escapeHtml()` 후 `set:html` → 안전한 HTML 삽입
- **URL 자동 링크**: 정규식으로 `https://...` 감지 → `<a>` 변환
- **Pagination**: 현재 데이터량 (4+1+9)으로 불필요, 향후 데이터 증가 시 추가

## 다음 단계
Phase 4: i18n 다국어 설정 (이미 대부분 구현됨, 마무리 작업)
