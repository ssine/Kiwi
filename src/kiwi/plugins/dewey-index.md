{{d
const css = `
<style>
.dewey-container {
  font-family: "Times New Roman", Times, serif;
}
.dewey-primary-class {
  display: inline-block;
  font-weight: bold;
}
.dewey-secondary-class {
  display: inline-block;
}
.dewey-digit {
  display: inline-block;
  font-family: Courier New;
  width: 0.5em;
}
.dewey-digit-before {
  color: lightgrey;
}
.dewey-digit-active {
  color: black;
}
.dewey-digit-after {
  color: lightgrey;
}
.dewey-padding {
  display: inline-block;
  width: 0.5em;
}
.dewey-indent {
  display: inline-block;
  width: 0.5em;
}
.mel-link:hover {
  border-bottom: 2px solid var(--lineColor);
}
</style>
`

const renderDeweyIndex = (deweyEntries, kiwiEntries) => {
  deweyEntries = new Map(deweyEntries)
  kiwiEntries = kiwiEntries.sort((a, b) => a[0] - b[0])

  const keys = Array.from(deweyEntries.keys())
  const len = keys.length
  const firstActives = []
  const processKey = (prev, cur, next, maxLen) => {
    let state = 'before'  // before, active and after
    const curLen = cur.length
    prev = prev.padEnd(maxLen, ' ')
    cur = cur.padEnd(maxLen, ' ')
    next = next.padEnd(maxLen, ' ')
    let html = ''
    let faPushed = false
    const befores = []
    const actives = []
    const afters = []
    for (let i = 0; i < maxLen; i++) {
      switch (state) {
        case 'before': {
          if (prev[i] != cur[i]) {
            state = 'active'
            i -= 1
            break
          }
          befores.push(cur[i])
          break
        }
        case 'active': {
          if (!faPushed) {
            firstActives.push(i)
            faPushed = true
          }
          if (cur[i] != '.' && next[i] != ' ' && cur[i] != next[i]) {
            state = 'after'
          }
          actives.push(cur[i])
          break
        }
        case 'after': {
          afters.push(cur[i])
          break
        }
      }
    }
    const getDigitDiv = (ds, c) => {
      return ds.map(d => `<div class="dewey-digit dewey-digit-${c}">${d}</div>`)
    }
    const arr = [].concat(getDigitDiv(befores, 'before'), getDigitDiv(actives, 'active'), getDigitDiv(afters, 'after'))
    const links = arr.filter(s => !s.match(/> </))
    const others = arr.filter(s => s.match(/> </))
    if (links.length > 0) {
      html += `<a href="https://www.librarything.com/mds/${cur.trim()}" class="mel-link">` + links.join('') + `</a>`
    }
    html += others.join('')
    html += '<div class="dewey-padding"></div>'
    for (let i = 0; i < firstActives[firstActives.length - 1]; i++) {
      html += '<div class="dewey-indent"></div>'
    }
    return html
  }

  let ents = []
  let classes = []
  const maxLen = Math.max(...keys.map((v) => v.length))
  for (let i = 0; i < len; i++) {
    ents.push(processKey(i > 0 ? keys[i - 1] : '', keys[i], i < len - 1 ? keys[i + 1] : '', maxLen))
    const cls = keys[i].length === 3 && keys[i][1] === '0' && keys[i][2] === '0' ? 'dewey-primary-class' : 'dewey-secondary-class'
    classes.push(`<div class="${cls}">${deweyEntries.get(keys[i])}</div>`)
  }

  let res = ents.map((e, i) => e + classes[i])
  for (let [key, config] of kiwiEntries.reverse()) {
    let replaceMode = !!config.replace
    delete config.replace
    let replaceFirst = true
    let replaceIdx = 0
    for (let name in config) {
      let prefix = ents[keys.indexOf(key)]
      if (replaceMode) {
        if (!replaceFirst) {
          prefix = prefix.replace(/<a.*?>(.*?)<\/a>/, '$1').replace(/[\.\d]/g, ' ')
        }
        res.splice(keys.indexOf(key) + replaceIdx, replaceFirst ? 1 : 0, prefix + `<a href="${config[name]}">${name}📄</a>`)
        replaceFirst = false
        replaceIdx++
      } else {
        prefix = prefix.replace(/<a.*?>(.*?)<\/a>/, '$1').replace(/[\.\d]/g, ' ')
        res.splice(keys.indexOf(key) + 1, 0, prefix + `<div class="dewey-indent"></div><a href="${config[name]}">${name}📄</a>`)
      }
    }
  }

  return `<div class="dewey-container">${res.join('<br/>')}</div>${css}`
}
}}
