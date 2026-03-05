# 성당 관리자 CMS 설정 가이드

Google Apps Script(GAS) 기반 관리자 패널 설정 방법입니다.

---

## 1단계: Google Apps Script 프로젝트 열기

1. [Google Apps Script](https://script.google.com) 접속
2. 기존 GAS 프로젝트 열기 (성당 데이터 스프레드시트에 연결된 프로젝트)
   - 스프레드시트 → **확장 프로그램** → **Apps Script** 클릭

## 2단계: 코드 파일 추가

### 서버 코드 (Code.gs)

1. 기존 `Code.gs` 파일의 내용을 모두 삭제
2. `tools/gas-webapp-code.js`의 전체 내용을 복사하여 붙여넣기
3. **저장** (Ctrl+S)

### 관리자 패널 HTML

1. 왼쪽 파일 목록에서 **+** 버튼 클릭 → **HTML** 선택
2. 파일 이름을 `gas-admin-panel`로 입력 (확장자 `.html`은 자동 추가)
3. `tools/gas-admin-panel.html`의 전체 내용을 복사하여 붙여넣기
4. **저장** (Ctrl+S)

## 3단계: Script Properties 설정

1. 왼쪽 메뉴에서 **⚙️ 프로젝트 설정** 클릭
2. 아래로 스크롤하여 **스크립트 속성** 섹션 찾기
3. **스크립트 속성 추가** 클릭하여 다음 4개 추가:

| 속성 | 값 | 설명 |
|------|-----|------|
| `SPREADSHEET_ID` | (스프레드시트 ID) | 공지사항 스프레드시트 URL의 `/d/여기/edit` 부분 |
| `ADMIN_PASSWORD` | (원하는 비밀번호) | 관리자 로그인 비밀번호 |
| `GH_TOKEN` | `ghp_xxxxx...` | GitHub Personal Access Token |
| `GH_REPO` | `communications-ct/ctkorean` | GitHub 저장소 |

### 스프레드시트 ID 찾기

스프레드시트 URL에서 `/d/` 와 `/edit` 사이의 긴 문자열이 ID입니다:
```
https://docs.google.com/spreadsheets/d/여기가_스프레드시트_ID/edit
```

### GitHub Token 만들기

1. [GitHub Token 생성 페이지](https://github.com/settings/tokens/new) 접속
2. **Note**: `성당 CMS` 입력
3. **Expiration**: `No expiration` 선택 (또는 원하는 기간)
4. **Scopes**: `repo` 체크
5. **Generate token** 클릭
6. 생성된 토큰(`ghp_`로 시작)을 복사하여 Script Properties에 입력

> ⚠️ 토큰은 생성 직후에만 볼 수 있습니다. 반드시 바로 복사하세요.

## 4단계: 스프레드시트 준비

공지사항 시트가 아래 형식인지 확인:

| A열 (date) | B열 (title) | C열 (body) | D열 (link) | E열 (urgent) | F열 (images) |
|------------|-------------|------------|------------|--------------|--------------|
| 2026-03-04 | 미사시간 | 매주일 10:30am | | 1 | |

- 시트 이름: `공지사항` (정확히 일치해야 함)
- 1행은 헤더 (date, title, body, link, urgent, images)
- F열(images)은 새로 추가된 열: 이미지 파일 ID가 JSON 배열로 저장됨

> 기존 시트에 F열(images)이 없다면, F1셀에 `images`를 입력하세요.

## 5단계: 웹앱 배포

1. GAS 편집기에서 **배포** → **새 배포** 클릭
2. **유형 선택** 옆 ⚙️ 아이콘 → **웹 앱** 선택
3. 설정:
   - **설명**: `성당 CMS v1`
   - **다음 사용자 인증정보로 실행**: `나` (본인 계정)
   - **액세스 권한이 있는 사용자**: `모든 사용자`
4. **배포** 클릭
5. 표시되는 **웹 앱 URL**을 복사하여 저장

> URL 형식: `https://script.google.com/macros/s/AKfycb.../exec`

### 기존 배포 업데이트 시

1. **배포** → **배포 관리** 클릭
2. ✏️ (수정) 아이콘 클릭
3. **버전**: `새 버전` 선택
4. **배포** 클릭

## 6단계: 시간 기반 트리거 설정

데이터 변경을 자동 감지하여 웹사이트를 업데이트합니다.

1. GAS 편집기 왼쪽 메뉴에서 **⏰ 트리거** 클릭
2. **+ 트리거 추가** 클릭
3. 설정:
   - **실행할 함수 선택**: `checkAndDispatch`
   - **이벤트 소스 선택**: `시간 기반`
   - **시간 기반 트리거 유형**: `분 타이머`
   - **분 간격 선택**: `5분마다`
4. **저장** 클릭

## 7단계: 관리자 패널 접속

웹 앱 URL 뒤에 `?mode=admin`을 붙여 접속:

```
https://script.google.com/macros/s/AKfycb.../exec?mode=admin
```

1. 설정한 비밀번호로 로그인
2. **+ 새 공지** 버튼으로 공지사항 작성
3. 이미지 첨부 가능 (10MB 이하)
4. 저장하면 자동으로 GitHub에 알림 → 웹사이트 업데이트 (5~20분)

---

## 문제 해결

### "비밀번호가 올바르지 않습니다"

- Script Properties에서 `ADMIN_PASSWORD` 값 확인
- 앞뒤 공백이 없는지 확인

### 공지사항이 안 보임

- 시트 이름이 정확히 `공지사항`인지 확인
- 1행에 헤더(date, title, body, link, urgent, images)가 있는지 확인

### GitHub 자동 업데이트가 안 됨

- Script Properties에서 `GH_TOKEN` 값 확인
- GAS 편집기 → **실행** 메뉴 → `checkAndDispatch` 수동 실행
- **실행 로그**에서 오류 메시지 확인

### 이미지 업로드 실패

- 10MB 이하 파일인지 확인
- Google Drive 저장 용량이 충분한지 확인

### 웹앱 접속 시 오류

- **배포 관리**에서 최신 버전으로 업데이트했는지 확인
- 코드 수정 후에는 반드시 **새 버전**으로 배포해야 함

---

## 보안 참고사항

- 비밀번호는 Script Properties에 저장 (GAS 편집자만 변경 가능)
- POST 요청 본문에만 비밀번호 포함 (URL에 노출되지 않음)
- 탭을 닫으면 자동 로그아웃 (sessionStorage 사용)
- 관리자 패널 접근 가능한 작업: 공지사항 CRUD + 이미지 업로드만
- Google 계정이나 서버에 대한 접근 권한은 없음
