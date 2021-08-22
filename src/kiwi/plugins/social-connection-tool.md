One item per line

<br/>

<textarea id="{{kiwi.uri}}-person" rows="6" style="width: 100%;resize: vertical" placeholder="Michael Jackson&#10;Leslie Cheung"></textarea>
<button id="{{kiwi.uri}}-person-button" style="width: 100%" onclick="kiwiAddConnectionNodes('{{kiwiConnectionPrefix}}')">Add Persons</button>

<br/>

<textarea id="{{kiwi.uri}}-organization" rows="6" style="width: 100%;resize: vertical" placeholder="SME&#10;Rock Records"></textarea>
<button id="{{kiwi.uri}}-organization-button" style="width: 100%" onclick="kiwiAddConnectionOrganizations('{{kiwiConnectionPrefix}}')">Add Organizations</button>

<br/>

<textarea id="{{kiwi.uri}}-relationship" rows="6" style="width: 100%;resize: vertical" placeholder="SME -> Michael Jackson&#10;Leslie Cheung <- Rock Records&#10;Michael Jackson -- Leslie Cheung: friend"></textarea>
<button id="{{kiwi.uri}}-relationship-button" style="width: 100%" onclick="kiwiAddConnectionRelationships('{{kiwiConnectionPrefix}}')">Add Relationships</button>

<script>
{
async function kiwiAddConnectionPersons(prefix) {
  const text = document.getElementById("{{kiwi.uri}}-person").value
  for (let line of text.split('\n')) {
    const uri = line.trim()
    const fullUri = `${prefix}/person/${uri}`
    const prev = kiwi.getItemUnsafe(fullUri)
    if (prev) return
    await kiwi.saveItem(fullUri, {title: uri, header: {}, content: '', type: 'text/markdown'})
  }
}
async function kiwiAddConnectionOrganizations(prefix) {
  const text = document.getElementById("{{kiwi.uri}}-organization").value
  for (let line of text.split('\n')) {
    const uri = line.trim()
    const fullUri = `${prefix}/organization/${uri}`
    const prev = kiwi.getItemUnsafe(fullUri)
    if (prev) return
    await kiwi.saveItem(fullUri, {title: uri, header: {}, content: '', type: 'text/markdown'})
  }
}

const addEdgeLabels = (origin, newLabel) => {
  if (!newLabel) return origin
  const labels = Array.isArray(newLabel) ? newLabel : [newLabel]
  return origin.concat(labels.filter(l => !(l in origin)))
}

async function kiwiAddConnectionRelationships(prefix) {
  const text = document.getElementById("{{kiwi.uri}}-relationship").value
  for (let line of text.split('\n')) {
    const match = /(.+?)(--|->|<-)([^:]+)(:.*)?/.exec(line.trim())
    if (!match) {
      console.log(`${line.trim()} format not valid!`)
      continue
    }
    const from = match[1].trim()
    const rel = match[2]
    const to = match[3].trim()
    const label = match[4] ? match[4].substr(1).trim() : ''
    const lastUri = `[${from}]-[${to}]`
    const fullUri = `${prefix}/relationship/${lastUri}`
    const prev = kiwi.getItemUnsafe(fullUri)
    if (prev) {
      if (rel === '--') prev.header.both = addEdgeLabels(prev.header.both || [], label)
      if (rel === '->') prev.header.to = addEdgeLabels(prev.header.to || [], label)
      if (rel === '<-') prev.header.from = addEdgeLabels(prev.header.from || [], label)
      return
    }
    const item = {title: lastUri, header: {}, content: '', type: 'text/markdown'}
    if (rel === '--') item.header.both = addEdgeLabels([], label)
    if (rel === '->') item.header.to = addEdgeLabels([], label)
    if (rel === '<-') item.header.from = addEdgeLabels([], label)
    await kiwi.saveItem(fullUri, item)
  }
}

document.getElementById('{{kiwi.uri}}-person-button').onclick = () => kiwiAddConnectionPersons('{{kiwiConnectionPrefix}}')
document.getElementById('{{kiwi.uri}}-organization-button').onclick = () => kiwiAddConnectionOrganizations('{{kiwiConnectionPrefix}}')
document.getElementById('{{kiwi.uri}}-relationship-button').onclick = () => kiwiAddConnectionRelationships('{{kiwiConnectionPrefix}}')
}
</script>
