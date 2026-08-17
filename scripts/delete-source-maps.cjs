const fs = require('fs')
const path = require('path')

if (require.main !== module) return

const root = path.join(__dirname, '..')

function walk(dir) {
  if (!fs.existsSync(dir)) return
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name)
    if (ent.isDirectory()) walk(p)
    else if (ent.name.endsWith('.map')) fs.rmSync(p)
  }
}

for (const folder of ['release/app/dist', 'out']) walk(path.join(root, folder))
