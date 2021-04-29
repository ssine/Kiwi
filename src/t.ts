import * as fs from 'fs'
;(async () => {
  const s = fs.createReadStream('package.json')
  const as = fs.createWriteStream('package1.json')
  s.pipe(as)
})()
