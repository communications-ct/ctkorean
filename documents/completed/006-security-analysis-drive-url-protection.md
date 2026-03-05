# 006 - 보안 분석: GitHub Pages Private Repo + Google Drive URL 보호

**작업일**: 2026-03-04
**작업 유형**: 보안 분석 / 설계 / 구현
**상태**: 완료

---

## 사용된 프롬프트

```
한가지만 더 확인 하자, github team 플랜이면 내 repository 를 private으로 두고
github.io 에서 public service 가 가능 한거야? json등 실질적인 google doc 에
대한 실질적인 링크나 이런 부분들을 숨길수 있는 부분도 확인이 안되었는데
이 부분 확인 하고 방안 강구 해봐 강구 한후 설계 문서에도 업데이트 해보고
```

```
링크가 오픈 되더라도 github 어카운트에만 오픈 될수 있으면 크게 문제는 안되.
이 방안도 찾아봐
```

---

## 1. GitHub Team + Private Repo + Pages 분석

### 핵심 사실

| 질문 | 답변 |
|------|------|
| Private repo에서 Pages 서비스 가능? | **가능** (Team 플랜 이상) |
| Non-Profit Team도 동일? | **동일** |
| Pages 사이트 비공개 가능? | **불가** — Enterprise Cloud만 가능 ($21/user/월) |
| "GitHub 계정만" 접근 제한? | **불가** — Enterprise Cloud도 "repo collaborator만" |
| JSON 파일 공개 여부? | **공개** — dist/ 내 모든 파일 HTTP 접근 가능 |

### 결론
- Private repo: 소스 코드 보호 가능
- GitHub Pages 사이트: 항상 공개
- `/data/*.json` 파일: 누구나 URL로 직접 접근 가능

---

## 2. Google Drive URL 보호 방안 비교

7가지 방안을 분석한 결과:

| 방안 | 실제 URL 숨김? | 복잡도 | 비용 | GitHub Pages 호환 |
|------|---------------|--------|------|-------------------|
| **Build-time 다운로드** | **Yes (이미지/PDF)** | **Low** | **Free** | **Yes** |
| Cloudflare Worker 프록시 | Yes | Medium | Free | Yes (커스텀 도메인 필수) |
| Cloudflare Access + OAuth | Yes | Medium | Free (50명) | Yes (커스텀 도메인 필수) |
| GAS 바이너리 프록시 | No | High | Free | Yes |
| Base64 난독화 | No | Low | Free | Yes |
| iframe 임베드 | No (더 노출) | Low | Free | Yes |
| Drive 서명 URL | Partial | High | Free | No |

### "GitHub 계정만 오픈" 가능한 방법
- **Cloudflare Access + GitHub OAuth**: 유일한 실용적 방법
  - 커스텀 도메인 필수, 50명 무료
  - `/data/*` 경로만 선택적 보호 가능
  - 현재 DNS가 다른 제공자에 있어 Cloudflare로 이전 필요

---

## 3. 사용자 결정

**Option A: Build-time Download 선택**

| 항목 | 결정 |
|------|------|
| Thumbnail 이미지 | Build 시 다운로드 → `/images/thumbs/` 로컬 서빙 |
| Bulletin PDF | Build 시 다운로드 → `/data/pdfs/` 로컬 서빙 |
| Album 폴더 링크 | ID만 저장, JS에서 URL 조립 |
| Cloudflare Access | 현재 미적용 (필요 시 추후 검토) |

---

## 4. 구현 내역

### publish-data.cjs 주요 변경사항

1. **파일명 변경**: `.js` → `.cjs` (ES module 환경에서 CommonJS 호환)
2. **썸네일 다운로드**: `lh3.googleusercontent.com/d/FILE_ID=w400` → `public/images/thumbs/`
3. **PDF 다운로드**: `drive.google.com/uc?export=download&id=FILE_ID` → `public/data/pdfs/`
4. **URL 스트리핑**: `albumUrl`, `thumbUrl`, `previewUrl`, `fileUrl`의 Drive URL 제거
5. **ID 변환**: `albumId` (폴더 ID만), `thumbUrl` (로컬 경로), `fileUrl` (로컬 PDF)

### 변환 결과 (Before → After)

**albums.json:**
```json
// Before (Drive URL 노출)
{
  "albumUrl": "https://drive.google.com/drive/folders/1OUg.../...",
  "thumbUrl": "https://drive.google.com/file/d/11IA.../view"
}

// After (URL 제거됨)
{
  "albumId": "1OUgJ2dI2fvaGvUM4i-XGDCBjR9FoG0ux",
  "thumbUrl": "/ctkorean/images/thumbs/11IA7tjP1AItTXnwCtEQPjOhJ0r_YrVMS.jpg"
}
```

**bulletins.json:**
```json
// Before
{
  "previewUrl": "https://drive.google.com/file/d/1dDZ.../preview",
  "fileUrl": "https://drive.google.com/file/d/1dDZ.../view"
}

// After
{
  "fileUrl": "/ctkorean/data/pdfs/1dDZaF7TOyVbPw3ZmXhgc4P2t3Ui40FYG.pdf",
  "previewUrl": "/ctkorean/data/pdfs/1dDZaF7TOyVbPw3ZmXhgc4P2t3Ui40FYG.pdf"
}
```

### 검증
- `grep -r "drive.google.com" public/data/*.json` → **0건**
- 썸네일 9개 다운로드 완료 (총 409KB)
- PDF 1개 다운로드 완료 (550KB)

---

## 5. 보안 수준 평가

```
+------------------------------------------+----------+
| What is protected?                       | Status   |
+------------------------------------------+----------+
| Source code (GAS URL, config)            | Private repo |
| Thumbnail images                         | Local serving |
| Bulletin PDFs                            | Local serving |
| Album folder IDs                         | Exposed* |
| Announcement content                     | Public   |
+------------------------------------------+----------+
  * Album folder IDs are in the JSON but not
    as full Drive URLs. A user who knows the
    Google Drive URL pattern can reconstruct
    the folder URL from the ID.
```

### 잔여 리스크
- `albumId`는 JSON에 포함됨 → `https://drive.google.com/drive/folders/{albumId}` 재구성 가능
- 그러나 Drive 폴더는 이미 "링크가 있는 사용자" 공유 설정이므로, ID 노출이 추가 리스크를 만들지 않음
- 앨범 클릭 시 Drive 폴더로 이동해야 하므로 폴더 URL 노출은 불가피

---

## 6. 수정된 파일

| 파일 | 변경 내용 |
|------|----------|
| `tools/publish-data.cjs` | Build-time 다운로드 + URL 스트리핑 (신규 로직) |
| `package.json` | `publish-data` script 경로 `.cjs`로 변경 |

---

## AI 대화 요약

### 수행 작업
1. 3개 리서치 에이전트 실행 (GitHub Pages 정책, Drive URL 숨김 7방안, GitHub OAuth 인증)
2. GitHub Team Plan의 Pages 제한 확인 (항상 공개)
3. Cloudflare Access + GitHub OAuth 방안 조사 (50명 무료, 경로별 보호)
4. 사용자 결정: Option A (Build-time Download) 선택
5. `publish-data.cjs` 구현 (다운로드 + URL 스트리핑)
6. 테스트 실행: 9 썸네일 + 1 PDF 다운로드 성공, Drive URL 0건 확인

### 핵심 결론
- GitHub Pages는 어떤 플랜에서도 비공개 불가 (Enterprise Cloud 제외)
- Build-time 다운로드가 가장 실용적 (무료, 추가 인프라 불필요)
- Cloudflare Access는 향후 필요 시 커스텀 도메인과 함께 적용 가능
