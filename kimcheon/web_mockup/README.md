# 웹 폰 목업

Flutter 앱을 웹으로 빌드해 CSS border로 만든 iPhone 프레임 안(iframe)에 띄운 페이지입니다.
화면·동작은 실제 앱과 동일한 코드이며, 브라우저에서 클릭·스크롤(마우스 드래그/휠)로 조작할 수 있습니다.

## 보기

```bash
cd web_mockup
python3 -m http.server 8765
# http://localhost:8765
```

> `index.html`을 파일로 직접 열면(file://) 동작하지 않습니다. 반드시 웹 서버로 열어주세요.
> 정적 호스팅(nginx, GitHub Pages, S3 등)에 폴더째 올려도 됩니다.

## 시작 상태

왼쪽 패널의 **시작 상태** 버튼으로 전환합니다. 주소에도 반영되어 링크로 공유할 수 있습니다.

| 버튼 | 주소 | 시작 화면 |
|---|---|---|
| 로그인 전 | `?start=` | 스플래시 → 권한 안내 → 본인인증 |
| 로그인 후 (기본) | `?start=home` | 본인인증 완료된 홈 (샘플 9/18 인증) |
| 전체 완등 | `?start=complete` | 로그인 + 전체 완등 (인증 신청 가능) |

## 앱 수정 후 다시 빌드

```bash
./web_mockup/build.sh
```

## 구성

- `index.html` – 폰 프레임(베젤·다이내믹 아일랜드·상태표시줄·홈 인디케이터), 안내 패널, `처음부터 다시` / `화면 맞춤` 버튼
- `app/` – `flutter build web` 결과물 (iframe `app/index.html?device=mock`)
- `?device=mock` 파라미터가 있으면 앱이 상태표시줄(47px)·홈 인디케이터(34px) 안전영역을 확보합니다 (`app/lib/main.dart`)
- 화면 폭 900px 미만에서는 안내 패널을 숨기고 폰만 표시합니다
