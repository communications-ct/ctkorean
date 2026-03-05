# 008 - Phase 2: 메인 페이지 섹션 컴포넌트 구현

**작업일**: 2026-03-04
**작업 유형**: Feature 구현
**상태**: 완료

---

## 사용된 프롬프트

```
Phase 2 진행해줘
```

---

## 1. Phase 2 목표

메인 페이지의 모든 콘텐츠 섹션을 구현:
- **About Section**: 2단 레이아웃 (이미지 + 텍스트 2문단)
- **PriestCard.astro**: 현임/역대 사제 카드 컴포넌트
- **MassSchedule.astro**: 9개 미사/성사 안내 카드 그리드
- **MapSection.astro**: Google Maps 임베드 + 연락처

---

## 2. 메인 페이지 섹션 구조

```
+------------------------------------------+
|              Hero Slider                  |  (Phase 1)
+------------------------------------------+
|           About (Image + Text)            |  #about
+------------------------------------------+
|         Priests (Current + Former)        |  #priests
+------------------------------------------+
|       Mass Schedule (9 cards grid)        |  #mass
+------------------------------------------+
|      Directions (Contact + Map)           |  #directions
+------------------------------------------+
|              Footer                       |  (Phase 1)
+------------------------------------------+
```

---

## 3. 생성된 컴포넌트

### PriestCard.astro

```
[Highlight Mode]                [Normal Mode]
+---------------------+        +----------+
|                     |        |  [photo] |
|    [photo 128px]    |        |  80x80   |
|                     |        +----------+
| [Current Pastor]    |        | Name     |
| Name (lg)           |        | BaptName |
| BaptismalName       |        | Gen/Term |
| Generation          |        +----------+
| Tenure              |
+---------------------+
```

**Props:**
- `name`, `baptismalName?`, `generationLabel`, `tenure`, `image?`
- `highlight: boolean` — 현임 신부용 큰 카드
- `currentLabel?: string` — "현임 주임 신부" 뱃지

**사진 없는 사제:** SVG person 실루엣 플레이스홀더

### 사제 데이터 (`src/data/priests.ts`)

11명의 역대 사제 정보:
| 대수 | 이름 | 세례명 | 재임기간 | 사진 |
|------|------|--------|---------|------|
| 11 | 이상선 | 요셉 | 2022.04 ~ 현재 | 11_p.png |
| 10 | 이계천 | 세례자 요한 | 2017.11 ~ 2022.02 | 10_p.jpg |
| 9 | 이철 | 니콜라오 | 2013.02 ~ 2017.10 | 09_p.jpg |
| 8 | 김훈겸 | 세례자 요한 | 2008.03 ~ 2013.02 | 08_p.png |
| 7 | 전영준 | — | 2005 ~ 2008.03 | 07_p.jpeg |
| 6 | 박명근 | — | 2002.08 ~ 2004.03 | 06_p.jpeg |
| 5 | 이상일 | — | 1999.08 ~ 2002.08 | — |
| 4 | 김성호 | — | 1997 ~ 1999.08 | — |
| 3 | 안승길 | — | 1994.04 ~ 1996.04 | — |
| 2 | 조규덕 | — | 1994 ~ 1994 | — |
| 1 | 변희섭 | — | 1992.08 ~ 1994 | — |

### MassSchedule.astro

9개 미사/성사 항목을 `card-accent` 카드 그리드로 표시:
- 그리드: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`
- 각 카드: `border-t-4 border-primary-500` 상단 강조
- 모든 텍스트 i18n 처리

| 항목 | KO | EN |
|------|----|----|
| 주일미사 | 오전 10시 30분 | 10:30 AM |
| 수요미사 | 오후 8시 00분 | 8:00 PM |
| 성시간 | 매월 첫 금요일 오후 8시 | First Friday, 8:00 PM |
| 고해성사 | 미사 시작 전 20분 | 20 min before Mass |
| 병자성사 | 항시 가능 | Available anytime |
| 유아세례 | 3,6,9,12월 첫째 주일 | 1st Sun of Mar/Jun/Sep/Dec |
| 사제 면담 | 예약 후 방문 | By appointment |
| 축복 | 항시 가능 | Available anytime |
| 장례/연도 | 사무실 문의 | Contact office |

### MapSection.astro

```
+------------------------+---------------------+
| Address                |                     |
| 56 Hartford Ave...     |   [Google Maps      |
|                        |    iframe embed]     |
| Phone: 860-529-1456    |                     |
| Mobile: 860-519-4650   |                     |
|                        |                     |
| [View on Google Maps]  |                     |
+------------------------+---------------------+
```

- 2/5 + 3/5 비율 (`md:grid-cols-5`)
- 전화번호: `tel:` 링크
- Google Maps 버튼: 외부 링크 (`target="_blank"`)
- iframe: `loading="lazy"`, `referrerpolicy="no-referrer-when-downgrade"`

---

## 4. About 섹션 개선

### Before (Phase 1 스켈레톤)
```
[Title]
[Single paragraph, centered text]
```

### After
```
+-----------------+------------------+
|                 |                  |
|   [01.jpg]      |  Paragraph 1     |
|   교회 사진     |  Paragraph 2     |
|                 |                  |
+-----------------+------------------+
```

- 2컬럼 (`md:grid-cols-2`)
- 이미지: `01.jpg`, `rounded-lg shadow-md`, `object-cover`
- 텍스트: 2문단, 기존 홈페이지 콘텐츠 기반으로 업데이트

---

## 5. i18n 키 추가

### 추가된 키 (ko.json + en.json)

| 카테고리 | 키 수 | 예시 |
|---------|------|------|
| about | 1 (description2) | "저희 성당은 커네티컷 웨덜스필드에..." |
| priests | 4 | current, former, generation, present |
| mass schedule | 18 (9 title + 9 time) | mass.sunday / mass.sunday.time |
| directions | 1 (viewMap) | "Google 지도에서 보기" |
| **합계** | **24개 추가** | |

### about.description 수정
- KO: "트럼블" → "웨덜스필드" (실제 주소에 맞게 수정, 2문단으로 확장)
- EN: Trumbull → Wethersfield (실제 주소에 맞게 수정, 2문단으로 확장)

---

## 6. 빌드 검증

```
Build: 4 pages, 509ms ✓
```

### 검증 결과

| 항목 | KO | EN |
|------|-----|-----|
| #about 섹션 | 이미지 + 2문단 | Image + 2 paragraphs |
| #priests — 현임 (highlight) | 이상선 요셉 | Lee Sang-Sun Joseph |
| #priests — 역대 (10명 grid) | 이름 11명 전원 | 11 names total |
| 사제 이미지 (6개) | 11_p ~ 06_p | Same |
| 사진 없는 사제 (5명) | SVG 플레이스홀더 | SVG placeholder |
| #mass — 9개 카드 | card-accent x9 | card-accent x9 |
| #directions — 지도 | Maps iframe | Maps iframe |
| #directions — 연락처 | 주소, 전화, 휴대폰 | Address, Phone, Mobile |

---

## 7. 수정된 파일 목록

| 파일 | 변경 내용 |
|------|----------|
| `src/data/priests.ts` | **신규** — 11명 사제 데이터 (이름, 세례명, 대수, 재임기간, 이미지) |
| `src/components/PriestCard.astro` | **신규** — 사제 카드 (highlight/normal 2모드) |
| `src/components/MassSchedule.astro` | **신규** — 9개 미사/성사 카드 그리드 |
| `src/components/MapSection.astro` | **신규** — Google Maps 임베드 + 연락처 |
| `src/pages/ko/index.astro` | 전체 재작성 — About 2단, Priests, Mass, Map 추가 |
| `src/pages/en/index.astro` | 전체 재작성 — 동일 구조, EN 번역 |
| `src/i18n/ko.json` | 24개 키 추가 + about.description 수정 |
| `src/i18n/en.json` | 24개 키 추가 + about.description 수정 |

---

## AI 대화 요약

### 수행 작업
1. 탐색 에이전트 실행 — 기존 사이트 콘텐츠 전체 추출 (사제 11명, 미사 9항목, 주소/전화, 지도 URL)
2. `src/data/priests.ts` 데이터 파일 생성 (11명 사제 정보)
3. i18n JSON 양쪽 24개 키 추가 (미사 스케줄, 사제 라벨, about 확장)
4. PriestCard.astro 컴포넌트 구현 (highlight/normal 2모드, SVG 플레이스홀더)
5. MassSchedule.astro 컴포넌트 구현 (9개 card-accent 그리드)
6. MapSection.astro 컴포넌트 구현 (Google Maps iframe + 연락처)
7. ko/index.astro 전체 재작성 (Hero → About → Priests → Mass → Map)
8. en/index.astro 전체 재작성 (영문 ordinal 변환 포함)
9. 빌드 테스트: 성공 (4 pages, 509ms)
10. 출력 HTML 검증: 모든 섹션, 데이터, 번역 정상

### 기술적 결정
- 사제 데이터: 별도 `src/data/priests.ts` 파일로 분리 (재사용성)
- 사제 이름: 한국어 고유명사이므로 양 언어 동일 (번역 불필요)
- 대수 표기: KO "제N대", EN ordinals (1st, 2nd, 3rd...)
- 미사 스케줄: Font Awesome 제거, `card-accent` 패턴으로 대체
- 지도: 2/5 + 3/5 비율 그리드 (연락처가 좁고 지도가 넓음)
- about 이미지: `01.jpg` 사용 (기존 사이트와 동일)

## 다음 단계
Phase 3: 뉴스 페이지 컴포넌트 구현 (AnnouncementList, BulletinCard, AlbumGallery)
