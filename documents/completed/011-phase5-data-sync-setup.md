# 011 - Phase 5: 데이터 동기화 설정

**작업일**: 2026-03-04
**작업 유형**: Infrastructure / DevOps
**상태**: 완료

---

## 사용된 프롬프트

```
Phase 5 진행해줘
```

---

## 1. Phase 5 목표

GAS(Google Apps Script) ↔ GitHub ↔ GitHub Pages 전체 데이터 동기화 파이프라인 완성:
- 빌드 시 에셋 캐싱으로 배포 속도 개선
- `.gitignore` 정리로 바이너리 에셋 보호
- GAS → GitHub `repository_dispatch` 트리거 코드 작성
- 워크플로우 개선 및 문서화

---

## 2. 데이터 동기화 아키텍처

### 전체 파이프라인

```
+-------------------+     5min trigger      +------------------+
| Google Sheets     | ===================>  | GAS (Apps Script)|
| (Announcements,   |                       | REST endpoints   |
|  Bulletins,        |                       | ?type=ann/bul/   |
|  Albums)           |                       |       albums     |
+-------------------+                       +--------+---------+
                                                     |
                         repository_dispatch         |
                    +--------------------------------+
                    |
                    v
+-------------------+     push to main      +------------------+
| GitHub Actions    | ===================>  | GitHub Pages     |
| deploy.yaml       |                       | Static HTML      |
|  1. publish-data  |                       | JS 0KB           |
|  2. astro build   |                       +------------------+
|  3. deploy        |
+-------------------+
```

### 트리거 종류 (3가지)

| 트리거 | 워크플로우 | 지연 시간 | 설명 |
|--------|-----------|-----------|------|
| Push to main | deploy.yaml | ~2분 | 코드 변경 시 자동 |
| repository_dispatch | deploy.yaml | ~5-20분 | GAS 데이터 변경 감지 시 |
| 매주 월요일 09:00 UTC | publish-data.yaml | 주 1회 | 정기 데이터 백업 + 재빌드 |
| workflow_dispatch | 양쪽 | 수동 | 수동 트리거 |

### 데이터 처리 흐름

```
GAS REST API
    |
    v
publish-data.cjs
    |
    +-- announcements.json  (passthrough, no Drive URLs)
    |
    +-- bulletins.json
    |     +-- fileId extract → PDF download → public/data/pdfs/
    |     +-- Drive URL strip → local path
    |
    +-- albums.json
    |     +-- thumbId extract → lh3 download → public/images/thumbs/
    |     +-- Drive URL strip → albumId only
    |
    v
public/data/*.json  (Astro build-time read)
data/*.json         (git-tracked backup)
    |
    v
Astro build → Static HTML (fs.readFileSync at build time)
```

---

## 3. 변경 사항

### 3a. `.gitignore` 업데이트

```diff
+ # Astro cache
+ .astro/
+
+ # Generated binary assets (downloaded at build time by publish-data.cjs)
+ public/images/thumbs/
+ public/data/pdfs/
```

**이유**: 썸네일(jpg)과 주보 PDF는 빌드 시마다 `publish-data.cjs`가 다운로드. 바이너리 파일은 git에 커밋하면 repo 크기 증가 + 불필요한 diff.

### 3b. `deploy.yaml` 개선 — 에셋 캐싱 추가

```yaml
- name: Cache downloaded assets
  uses: actions/cache@v4
  with:
    path: |
      public/images/thumbs
      public/data/pdfs
    key: gas-assets-${{ github.sha }}
    restore-keys: |
      gas-assets-
```

**효과**:
- 첫 배포: 모든 썸네일 + PDF 다운로드 (9 thumbs + 1 PDF)
- 이후 배포: 캐시에서 복원 → 새 파일만 다운로드
- `publish-data.cjs`의 `fs.existsSync()` 체크와 연동 → 이미 있는 파일 스킵

### 3c. `publish-data.yaml` 개선

| 항목 | Before | After |
|------|--------|-------|
| 커밋 범위 | `data/*.json` | `data/*.json` + `public/data/*.json` |
| diff 체크 | `git diff --quiet` | `git diff --staged --quiet` (정확) |
| 에셋 캐싱 | 없음 | `actions/cache@v4` 추가 |
| PR body | 간략 | 상세 설명 |

### 3d. GAS `repository_dispatch` 트리거 코드

`tools/gas-trigger-example.js` — Google Apps Script에서 사용할 참조 코드:

```javascript
function checkAndDispatch() {
  // 1. Script Properties에서 GitHub PAT, repo 이름 읽기
  // 2. 현재 데이터 해시 계산 (Sheets 데이터 → MD5)
  // 3. 이전 해시와 비교
  // 4. 변경 시 GitHub API 호출:
  //    POST https://api.github.com/repos/{owner}/{repo}/dispatches
  //    { event_type: "gas-data-changed" }
  // 5. 새 해시 저장
}
```

**GAS 설정 순서**:
1. GitHub PAT 생성 (classic, `repo` scope) → [링크](https://github.com/settings/tokens/new)
2. GAS Project Settings → Script Properties:
   - `GH_TOKEN` = `ghp_xxxxxxxxxxxxxxxxxxxx`
   - `GH_REPO` = `communications-ct/ctkorean`
3. GAS Triggers → Time-driven → Every 5 minutes → `checkAndDispatch`

---

## 4. 아키텍처 결정: Build-time vs Live GAS

### 원래 계획
```
Browser → Live GAS fetch → 렌더링 (client-side JS)
```

### 현재 결정 (Phase 3에서 확정)
```
GAS → GitHub Actions → Astro build → Static HTML (JS 0KB)
```

**변경 이유**:
- JS 0KB 목표 달성 (클라이언트 JS fetch 불필요)
- SEO: 정적 HTML에 모든 데이터 포함
- 속도: CDN 서빙, API 대기 없음
- 비용: GAS API 호출 최소화
- `repository_dispatch`로 5~20분 내 데이터 갱신 가능

---

## 5. 파일 관리 전략

| 경로 | Git 추적 | 용도 |
|------|----------|------|
| `public/data/*.json` | ✓ (향후) | Astro 빌드 시 읽는 데이터 |
| `data/*.json` | ✓ | 레거시 백업 (publish-data.yaml이 주간 커밋) |
| `public/images/thumbs/*.jpg` | ✗ (.gitignore) | 빌드 시 GAS에서 다운로드 |
| `public/data/pdfs/*.pdf` | ✗ (.gitignore) | 빌드 시 GAS에서 다운로드 |
| `dist/` | ✗ (.gitignore) | Astro 빌드 출력 (GitHub Pages artifact) |

---

## 6. 빌드 검증

```
Build: 4 pages, 640ms ✓
.gitignore: public/images/thumbs/ ✓, public/data/pdfs/ ✓
```

---

## 7. 수정된 파일 목록

| 파일 | 변경 내용 |
|------|-----------|
| `.gitignore` | `.astro/`, `public/images/thumbs/`, `public/data/pdfs/` 추가 |
| `.github/workflows/deploy.yaml` | `actions/cache@v4` 에셋 캐싱 추가 |
| `.github/workflows/publish-data.yaml` | `public/data/*.json` 커밋 추가, 에셋 캐싱, diff 체크 수정 |
| `tools/gas-trigger-example.js` | **신규** — GAS repository_dispatch 참조 코드 |

---

## AI 대화 요약

### 수행 작업
1. 탐색 에이전트 2개 실행 — publish-data.cjs 분석, 워크플로우 분석, 데이터 구조 확인, 문서 확인
2. `.gitignore` 업데이트 — 빌드 시 생성되는 바이너리 에셋 경로 추가
3. `deploy.yaml` 개선 — `actions/cache@v4`로 썸네일/PDF 캐싱 (배포 속도 개선)
4. `publish-data.yaml` 개선 — `public/data/*.json` 커밋 범위 추가, 에셋 캐싱, diff 체크 수정
5. GAS trigger 참조 코드 작성 — `checkAndDispatch()` 함수 (데이터 해시 비교 + repository_dispatch)
6. 빌드 성공 (640ms), .gitignore 검증 완료

### 핵심 기술 결정
- **Build-time rendering 유지**: Phase 3 결정 확인 — Live GAS fetch 대신 repository_dispatch 기반 재빌드
- **에셋 캐싱**: `actions/cache@v4`로 CI 빌드 속도 최적화 (이미 다운로드된 파일 재사용)
- **이중 데이터 저장**: `public/data/` (Astro 사용) + `data/` (git 이력) — 향후 통합 가능
- **GAS 트리거**: 5분 간격 해시 비교 → 변경 시만 repository_dispatch → 불필요한 빌드 방지

## 다음 단계
Phase 6: 배포 및 최종 테스트 (GitHub Pages 설정, 커스텀 도메인, 최종 QA)

### GAS 설정 TODO (수동 작업)
1. [ ] GitHub PAT 생성 (classic, `repo` scope)
2. [ ] GAS Script Properties에 `GH_TOKEN`, `GH_REPO` 설정
3. [ ] `tools/gas-trigger-example.js` 코드를 GAS에 복사
4. [ ] GAS Triggers에서 `checkAndDispatch` 5분 타이머 설정
5. [ ] 테스트: Sheets 수정 → 5분 대기 → GitHub Actions 실행 확인
