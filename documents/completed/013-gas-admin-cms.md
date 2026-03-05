# 013 — GAS HTML Service 관리자 CMS 구현

**날짜**: 2026-03-04
**작업 유형**: Feature 구현

---

## 프롬프트

GAS HTML Service 기반 관리자 CMS 구축: 비기술 사용자가 관리자 패널에서 공지사항을 CRUD하고, 이미지를 첨부할 수 있도록 구현.

## 작업 내용

### 생성된 파일

#### 1. `tools/gas-webapp-code.js` (신규, ~320줄)
GAS 백엔드 코드 — GAS 프로젝트에 복사하여 사용.

- **Public API** (기존 호환):
  - `?type=ann` — 공지사항 (모든 `공지사항*` 시트에서 읽기)
  - `?type=bulletin` — 주보 (Drive 폴더 스캔)
  - `?type=albums` — 앨범 (Drive 폴더 스캔)
- **Admin Panel**: `?mode=admin` → HTML Service 렌더링
- **CRUD Functions**:
  - `createPost_()` — 새 공지사항 추가
  - `updatePost_()` — 기존 공지사항 수정 (date+title로 식별)
  - `deletePost_()` — 공지사항 삭제
  - `uploadImage_()` — Google Drive에 이미지 업로드 (base64)
- **자동 인덱싱**: 10,000행 초과 시 `공지사항_001`, `_002` ... 새 시트 생성
- **GitHub 연동**: `checkAndDispatch_()` — CRUD 후 자동 repository_dispatch
- **HTML Service Bridge**: `processAdminRequest()` — 클라이언트→서버 통신

#### 2. `tools/gas-admin-panel.html` (신규, ~320줄)
관리자 패널 UI.

- **로그인**: 비밀번호 인증 (sessionStorage로 세션 유지)
- **목록 뷰**: 공지사항 카드 리스트 (긴급 배지, 날짜, 미리보기)
- **편집 뷰**: 날짜, 제목, 내용, 링크, 긴급 토글, 이미지 첨부
- **이미지**: 파일 선택 → base64 업로드 → Drive 저장 → 미리보기 표시
- **반응형**: 모바일 지원
- **디자인**: 성당 Primary 컬러 (#3A66B0) 기반

#### 3. `tools/gas-setup-guide.md` (신규)
비기술자용 한국어 설정 가이드.

- GAS 프로젝트 열기
- 코드/HTML 파일 추가
- Script Properties 설정 (ADMIN_PASSWORD, GH_TOKEN, GH_REPO)
- GitHub Token 생성 방법
- 스프레드시트 F열(images) 추가
- 웹앱 배포 방법
- 시간 기반 트리거 설정
- 문제 해결 섹션

### 삭제된 파일

#### 4. `tools/gas-trigger-example.js` (삭제)
`checkAndDispatch()` 및 `computeDataHash_()` 기능이 `gas-webapp-code.js`에 통합되어 별도 파일 불필요.

### 수정된 파일

#### 5. `tools/publish-data.cjs`
공지사항 이미지 필드 처리 추가.

- `processAnnouncements()` 함수 추가
  - `images` 배열의 Drive URL에서 파일 ID 추출
  - `lh3.googleusercontent.com/d/{fileId}=w800`으로 다운로드
  - `public/images/announcements/{fileId}.jpg`에 저장
  - JSON에는 로컬 경로만 포함 (Drive URL 제거)
- `annImagesDir` 디렉토리 생성 로직 추가
- 빌드 로그에 이미지 다운로드 수 표시

#### 6. `src/components/AnnouncementList.astro`
이미지 표시 기능 추가.

- `Announcement` 인터페이스에 `images?: string[]` 추가
- 펼친 카드 내 이미지 갤러리 렌더링
  - `flex-wrap` 레이아웃, 반응형 크기 (w-32/sm:w-40)
  - 클릭 시 원본 크기로 새 탭 열기
  - `loading="lazy"` 적용
  - 이미지와 링크 사이에 배치

## 보안 모델

```
+-------------------+     +------------------+
| Admin Panel       |     | Script Props     |
| (HTML Service)    |     | (GAS only)       |
+-------------------+     +------------------+
| sessionStorage    |     | ADMIN_PASSWORD   |
| (tab close=logout)|     | GH_TOKEN         |
+--------+----------+     | GH_REPO          |
         |                 +------------------+
         | POST body (password)
         v
+-------------------+
| processAdmin      |
| Request()         |
| - verify pw       |
| - CRUD sheets     |
| - upload to Drive |
+-------------------+
         |
         | repository_dispatch
         v
+-------------------+
| GitHub Actions    |
| - publish-data    |
| - Astro build     |
| - Deploy          |
+-------------------+
```

- 비밀번호: Script Properties에 저장 (GAS 편집자만 변경)
- POST body에만 비밀번호 전송 (URL 미노출)
- sessionStorage 사용 (탭 닫으면 로그아웃)
- 피해 범위: 공지사항 Sheet CRUD + Drive 이미지 업로드만

## 데이터 흐름 (이미지 포함)

```
Admin Panel
  |-- create/update post (with image base64)
  |     |
  |     v
  |   GAS: uploadImage_() -> Drive folder -> return fileId
  |   GAS: createPost_() -> Sheet F column = ["fileId1", "fileId2"]
  |     |
  |     v
  |   checkAndDispatch_() -> GitHub repository_dispatch
  |     |
  v     v
GitHub Actions
  |-- publish-data.cjs
  |     |-- fetch ?type=ann (JSON with images: ["drive.google.com/..."])
  |     |-- processAnnouncements()
  |     |     |-- extract fileId from each Drive URL
  |     |     |-- download lh3.googleusercontent.com/d/{fileId}=w800
  |     |     |-- save to public/images/announcements/{fileId}.jpg
  |     |     |-- replace Drive URL with /ctkorean/images/announcements/{fileId}.jpg
  |     |
  |     v
  |   public/data/announcements.json (images = local paths only)
  |     |
  v     v
Astro build -> AnnouncementList.astro -> <img src="/ctkorean/images/announcements/...">
```

## Google Drive 폴더 ID

| 항목 | 폴더 ID |
|------|---------|
| 공지사항 이미지 | `1kxntITty41lImTQs8nw_ddT2OSU34urb` |
| 앨범 | `1TCbyyWEBZr3Tifid8yhqMg7F-FbQkX3X` |
| 주보 | `1rkKcIU165hbu-ovgbjVKKKijAZI9LXpq` |

## 스프레드시트 스키마

| 열 | 필드 | 타입 | 비고 |
|----|------|------|------|
| A | date | Date | 날짜 |
| B | title | String | 제목 |
| C | body | String | 본문 (줄바꿈 포함) |
| D | link | String | 외부 링크 (선택) |
| E | urgent | Number/String | 1 = 긴급 |
| F | images | String (JSON) | `["fileId1","fileId2"]` 형태 |

## 검증

- [x] `npm run build` 성공
- [ ] GAS `?type=ann` 응답 확인 (GAS 배포 후)
- [ ] `?mode=admin` 관리자 패널 접속 (GAS 배포 후)
- [ ] 로컬 `npm run publish-data` + 이미지 다운로드 확인 (이미지 등록 후)

## AI 대화 요약

1. 기존 파일 탐색: `publish-data.cjs`, `gas-trigger-example.js`, `AnnouncementList.astro`, `announcements.json`, i18n JSON, `astro.config.mjs` 분석
2. GAS 백엔드 구현: doGet/doPost, CRUD, 이미지 업로드, 자동 인덱싱, GitHub dispatch 통합
3. 관리자 패널 UI 구현: 로그인, 목록, 편집, 이미지 첨부, 반응형
4. `processAdminRequest()` 브릿지 함수 추가 (HTML Service → 서버 통신)
5. 설정 가이드 작성: 비기술자용 한국어, 스크린샷 없이 단계별
6. `gas-trigger-example.js` 삭제 (통합 완료)
7. `publish-data.cjs` 수정: `processAnnouncements()` 추가, 이미지 다운로드 + URL 스트리핑
8. `AnnouncementList.astro` 수정: `images` 필드 표시, 반응형 갤러리
9. 빌드 검증: `npm run build` 성공
