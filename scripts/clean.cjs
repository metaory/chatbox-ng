const fs = require('fs')
const path = require('path')

if (require.main !== module) return

const root = path.join(__dirname, '..')
for (const folder of ['release/app/dist', 'release/app/node_modules', 'release/build']) {
  fs.rmSync(path.join(root, folder), { recursive: true, force: true })
}
