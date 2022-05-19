const { execSync } = require("child_process");

execSync("cd studio && npm run build:ext");
execSync("rmdir studio-dist");
execSync("mkdir studio-dist");
execSync("cp ./studio/build/static/js/main.js ./studio-dist");
execSync("cp ./studio/build/static/css/main.css ./studio-dist");
