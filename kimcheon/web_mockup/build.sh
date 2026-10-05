#!/usr/bin/env bash
# Flutter 앱을 웹으로 빌드해 폰 목업(app/)에 넣는다.
set -euo pipefail
cd "$(dirname "$0")/../app"
rm -rf ../web_mockup/app
flutter build web --release --no-web-resources-cdn --base-href /app/ -o ../web_mockup/app
# 어떤 경로에 올려도 동작하도록 상대 경로로 변경
sed -i '' 's#<base href="/app/">#<base href="./">#' ../web_mockup/app/index.html
echo "done → web_mockup/app"
