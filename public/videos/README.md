# 랜딩 화상회의 영상 슬롯

랜딩 페이지(`components/landing/LandingContent.tsx`)의 화상회의 목업에서
카메라 ON 참가자 타일에 재생되는 영상 파일입니다.

아래 파일명으로 영상을 넣으면 해당 타일의 아바타 위에 자동 재생됩니다
(`autoplay · muted · loop · playsInline`, `object-fit: cover`).

| 참가자 | 파일 경로 |
| ------ | --------- |
| 민준   | `public/videos/minjun.mp4` |
| 서연   | `public/videos/seoyeon.mp4` |
| 도운   | `public/videos/doun.mp4` |

## 권장 사양

- 비율 16:10 (타일 비율) 또는 가까운 가로형. `object-fit: cover`로 잘립니다.
- 짧은 루프(수 초), 무음. `muted`라서 자동재생됩니다.
- 가능하면 720p 이하로 가볍게 (`.mp4` H.264 권장, `.webm`도 가능 — 확장자 바꾸면 경로도 함께 수정).

파일이 없으면 `onError` 폴백으로 영상 요소가 숨겨지고 아바타 이니셜이 표시됩니다.
