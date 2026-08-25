# 친구렌즈

Apps-in-Toss production version `20260821-3` was released on 2026-08-21. Production entry uses `intoss://friend-lens`.

## App concept

내가 보는 나와 친구들이 보는 나를 익명 집계로 비교해 공통점과 차이를 발견하는 Apps-in-Toss 미니앱입니다.

## What this app is for

친구에게 직접 평가를 부탁하는 부담 없이 초대 링크를 공유하고, 최소 세 명의 응답이 모였을 때만 개인을 추정하기 어려운 집계 결과를 확인하도록 돕습니다. 방 만들기는 2~3분, 친구 응답은 1분 안에 끝나는 가벼운 자기이해 경험을 목표로 합니다.

## Core loop

1. 표시 이름을 입력하고 `우당탕 찐친 모먼트`, `친구만 아는 반전 매력`, `우리 모임 속 내 캐릭터`, `따뜻한 친구 렌즈` 중 하나를 고릅니다.
2. 선택한 8개 질문으로 바로 시작하거나 질문과 사진을 직접 다듬습니다.
3. 질문을 이해하는 데 도움이 되는 사진을 최대 3장까지 선택하고 자기인식 질문에 답합니다.
4. Toss 공유창으로 30일 동안 유효한 친구렌즈 링크를 보냅니다.
5. 친구는 로그인이나 실명 입력 없이 방 주인을 떠올리며 같은 질문에 익명으로 답합니다.
6. 답변을 마친 친구는 같은 맥락에서 자신의 친구렌즈 만들기로 자연스럽게 이어집니다.
7. 세 명 이상 응답하면 자기인식과 친구 평균을 비교합니다.
8. 방 주인은 최근 30일 동안 만든 여러 방과 결과를 모아보고, 기존 기록을 유지한 채 새 방을 추가합니다.
9. 필요한 방만 선택해 연결된 모든 응답과 함께 즉시 삭제합니다.

## Product analytics

Apps-in-Toss SDK가 `/`와 `/invite` 같은 실제 경로 진입을 자동 기록합니다. 방 만들기는 한 경로 안에서 상태로 화면을 바꾸므로 아래 노출 이벤트를 추가로 기록합니다.

| 이벤트 | 의미 |
| --- | --- |
| `owner_intro_view` | 이름 입력 화면 노출 |
| `owner_template_view` | 템플릿 선택 화면 노출 |
| `owner_self_survey_view` | 내 답변 화면 노출 |
| `owner_room_view` | 방 화면 노출. `room_entry_source=created`만 새 방 생성 완료로 집계 |
| `owner_template_select_click` | 템플릿 선택. `template_id`로 선택률 비교 |
| `owner_template_start_click` | 선택한 템플릿으로 바로 시작 |
| `owner_custom_questions_start_click` | 질문을 직접 다듬은 뒤 시작 |
| `invite_intro_view` | 초대 안내 화면 노출 |
| `invite_response_start_click` | 친구 답변 시작 |
| `invite_survey_view` | 친구 답변 화면 노출 |
| `invite_submitted_view` | 친구 답변 제출 완료 |
| `invite_creator_cta_click` | 답변 완료·기응답 화면에서 내 친구렌즈 만들기 선택 |
| `invite_already_answered_view` | 이미 답변한 친구의 재진입 |

데이터는 실제 출시 환경에서만 수집되며 다음 날부터 Apps-in-Toss 콘솔의 **분석하기 → 이벤트**에서 확인합니다. 생성 퍼널은 `owner_intro_view → owner_template_view → owner_self_survey_view → owner_room_view(room_entry_source=created)` 순서로 봅니다. 초대 응답자의 생성 전환은 `invite_submitted_view → invite_creator_cta_click → owner_intro_view → owner_template_view → owner_self_survey_view → owner_room_view` 순서로 보고, 홈 이후 이벤트의 `creator_entry_source=invite_submitted`과 마지막 이벤트의 `room_entry_source=created`를 필터링합니다. 샌드박스와 QR 테스트 이벤트는 집계되지 않습니다.

이벤트에는 표시 이름, 방 ID, 초대 토큰, 질문 문장 같은 사용자 데이터는 넣지 않고 퍼널 단계, 템플릿 ID, 진입 출처만 기록합니다.

## Data and storage

데이터는 Supabase에 서버 저장됩니다. 방, 해시된 초대 토큰, 해시된 방 주인 식별키, 방 주인이 작성한 질문, 선택한 질문 이미지, 1~5점 객관식 응답, 생성·만료 시각을 저장합니다. 친구 이름, 연락처와 자유서술 답변은 수집하지 않습니다. 질문 이미지는 선택 기능이며 최대 폭 360px로 자동 축소한 뒤 최대 3장, 장당 약 300KB로 제한하고 공개 Storage URL을 만들지 않은 채 방 데이터 안에 보관합니다. 방 주인은 비게임 미니앱용 Toss `getAnonymousKey`로 식별해 기기를 바꿔도 최근 기록을 복구하고, 친구 응답자는 화면이 없는 Supabase 익명 세션으로만 중복 제출을 완화합니다.

친구별 원본 답변은 방 소유자에게 직접 공개하지 않고 최소 세 명의 평균만 반환합니다. 방, 질문 이미지와 응답은 30일 뒤 매일 실행되는 서버 정리 작업으로 함께 물리 삭제되며, 소유자가 그 전에 방별로 즉시 삭제할 수도 있습니다. Toss 식별키 원문은 데이터베이스·기기 저장소·로그에 남기지 않고 서버에는 SHA-256 해시만 저장합니다. 초대 토큰은 이 기기의 Apps-in-Toss `Storage`에 보관하며 다른 기기에서 다시 공유할 때 기존 만료일을 유지한 새 토큰을 발급합니다.

클라이언트에는 Supabase publishable key만 사용합니다. `service_role` 키와 데이터베이스 비밀번호는 앱에 포함하지 않습니다.

## Brand assets

- 표시 이름: `친구렌즈`
- Apps-in-Toss `appName`: `friend-lens` (워크스페이스 25195에 등록 완료)
- 앱 아이콘: `assets/brand/friend-lens-icon.png` (600×600 PNG, 불투명 배경)
- 공유 썸네일: `assets/brand/friend-lens-thumbnail.png` (1932×828 PNG)
- 콘솔 아이콘 URL: `https://static.toss.im/appsintoss/25195/f14c302d-21c2-4cb0-8121-a588edd34f4b.png`
- 공개 썸네일 URL: `https://adzlrugwedlveuzuroyz.supabase.co/storage/v1/object/public/friend-lens-brand/friend-lens-thumbnail.png`

공유 썸네일은 공개 읽기 전용 Supabase Storage 버킷에 있으며 클라이언트 쓰기 정책은 없습니다. 앱 아이콘은 Apps-in-Toss 콘솔에 업로드된 공식 URL을 사용합니다. 이름 검토 과정과 선택 이유는 `BRANDING.md`에 기록했습니다.

## Backend setup

- Supabase project ref: `adzlrugwedlveuzuroyz`
- 리전: Tokyo (`ap-northeast-1`)
- 원격 스키마는 `supabase/migrations/`와 동일하게 적용되어 있습니다.
- 인증된 익명 사용자에게 필요한 `SECURITY DEFINER` RPC만 열고, 각 함수에서 `auth.uid()`, 소유권, 만료 토큰과 입력 범위를 검사합니다.
- 방 주인 RPC는 Toss 식별키의 SHA-256 해시로 최근 30일 방의 목록·결과·삭제 권한을 확인하고, 기존 단일 방은 최초 실행 기기에서 새 식별 방식에 연결합니다.
- `perception_responses` 직접 읽기와 쓰기는 차단되어 있습니다.
- Supabase Dashboard의 **Authentication → Sign In / Providers → Allow anonymous sign-ins**가 활성화되어 있습니다.

`getAnonymousKey`는 별도 로그인·동의 없이 미니앱별 안정적인 식별값을 제공하지만 샌드박스에서는 mock 값을 반환합니다. 교차 기기 복구는 콘솔 QR로 연 실제 Toss 앱에서 확인합니다. mTLS 기반 식별키 유효성 검증 API는 현재 호출하지 않으며, 결제·회원정보 같은 고위험 데이터로 범위를 넓힐 때 별도 서버 검증을 추가해야 합니다.

## Development

```sh
npm run typecheck
npm run lint
npm test -- --runInBand
npm run build
```

실제 Toss 공유 링크는 앱 출시 후 `intoss://friend-lens/...` 딥링크가 등록돼야 열립니다. 출시 전에는 Apps-in-Toss 콘솔의 테스트용 `intoss-private://` 링크와 샌드박스 앱으로 확인합니다. 콘솔과 `granite.config.ts`의 식별자는 모두 변경 불가 값 `friend-lens`로 맞춰져 있습니다.

## Monetization

현재 광고와 결제는 없습니다. 향후 수익화를 검토하더라도 방 생성, 친구 응답, 기본 결과 확인을 광고로 막지 않습니다.
