cd studio && npm run build:ext
cd ..

mkdir -p studio-dist

cp ./studio/build/static/js/main.js ./studio-dist
cp ./studio/build/static/css/main.css ./studio-dist
