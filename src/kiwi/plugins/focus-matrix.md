<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css">
<div id="{{currentURI}}">
  <div class="iue">
    <div class="control">
      <span class="icon"></span>
      <input type="text" class="input-frame" placeholder="New important but not urgent item">
      <button class="input-btn"><i class="fa fa-plus"></i></button>
    </div>
    <div class="list">
      <div class="unfinished"></div>
      <div class="finished"></div>
    </div>
  </div>
  <div class="ie">
    <div class="control">
      <span class="icon"></span>
      <input type="text" class="input-frame" placeholder="New important and urgent item">
      <button class="input-btn"><i class="fa fa-plus"></i></button>
    </div>
    <div class="list">
      <div class="unfinished"></div>
      <div class="finished"></div>
    </div>
  </div>
  <div class="uiue">
    <div class="control">
      <span class="icon"></span>
      <input type="text" class="input-frame" placeholder="New not important and not urgent item">
      <button class="input-btn"><i class="fa fa-plus"></i></button>
    </div>
    <div class="list">
      <div class="unfinished"></div>
      <div class="finished"></div>
    </div>
  </div>
  <div class="uie">
    <div class="control">
      <span class="icon"></span>
      <input type="text" class="input-frame" placeholder="New not important but urgent item">
      <button class="input-btn"><i class="fa fa-plus"></i></button>
    </div>
    <div class="list">
      <div class="unfinished"></div>
      <div class="finished"></div>
    </div>
  </div>
</div>

<script>
(async function(){

let data = null

async function getData() {
  let item = await itemManager.getItemFromURI('{{currentURI}}')
  let reg = /<div id="\{\{currentURI\}\}-data" hidden>([\s\S]*?)<\/div>/gm
  let res = reg.exec(item.content)
  if (res !== null) {
    try {
      data = JSON.parse(res[1])
    } catch {}
  }
  if (data === null) data = {};
  ['ie', 'uie', 'iue', 'uiue'].forEach((className) => {
    if (data[className] === undefined) {
      data[className] = {
        'unfinished': [],
        'finished': []
      }
    } else {
      if (data[className]['finished'] === undefined) data[className]['finished'] = []
      if (data[className]['unfinished'] === undefined) data[className]['unfinished'] = []
    }
  })
}

function render() {
  function getListItemHTML(v, idx, type) {
    let icon = `<i class="fa fa-${type === 'finished' ? 'check-square-o' : 'square-o'}"></i>`
    return `<li pos="${idx}">${icon}<label>${v}</label><button class="delete"><i class="fa fa-close"></i></button></li>`
  }
  ['ie', 'uie', 'iue', 'uiue'].forEach((className) => {
    function switchItem(type, idx) {
      let switchedType = 'finished'
      if (type === 'finished') switchedType = 'unfinished'
      data[className][switchedType].splice(0, 0, data[className][type][idx])
      data[className][type].splice(idx, 1)
      render()
      saveData()
    }
    function deleteItem(type, idx) {
      data[className][type].splice(idx, 1)
      render()
      saveData()
    }
    const selectorPrefix = String.raw`#{{cssesc(currentURI)}} > .${className}`
    document.querySelector(`${selectorPrefix} .finished`).innerHTML =
      data[className]['finished'].map((v, idx) => getListItemHTML(v, idx, 'finished')).join('\n')
    document.querySelector(`${selectorPrefix} .unfinished`).innerHTML =
      data[className]['unfinished'].map((v, idx) => getListItemHTML(v, idx, 'uninished')).join('\n')
    document.querySelectorAll(`${selectorPrefix} .finished li`).forEach(el => {
      el.addEventListener('mousedown', () => {el.setAttribute('style', 'background-color:var(--blockColorLight);')})
      el.addEventListener('mouseup', () => {el.setAttribute('style', '')})
      el.addEventListener('mouseout', () => {el.setAttribute('style', '')})
      el.addEventListener('click', () => {
        switchItem('finished', parseInt(el.getAttribute('pos')))
      })
    })
    document.querySelectorAll(`${selectorPrefix} .unfinished li`).forEach(el => {
      el.addEventListener('mousedown', () => {el.setAttribute('style', 'background-color:var(--blockColorLight);')})
      el.addEventListener('mouseup', () => {el.setAttribute('style', '')})
      el.addEventListener('mouseout', () => {el.setAttribute('style', '')})
      el.addEventListener('click', () => {
        switchItem('unfinished', parseInt(el.getAttribute('pos')))
      })
    })
    document.querySelectorAll(`${selectorPrefix} .finished .delete`).forEach(el => {
      el.addEventListener('click', (evt) => {
        deleteItem('finished', parseInt(el.parentElement.getAttribute('pos')))
        evt.stopPropagation()
      })
    })
    document.querySelectorAll(`${selectorPrefix} .unfinished .delete`).forEach(el => {
      el.addEventListener('click', (evt) => {
        deleteItem('unfinished', parseInt(el.parentElement.getAttribute('pos')))
        evt.stopPropagation()
      })
    })
  })
}

await getData()
render()

async function saveData() {
  let item = await itemManager.getItemFromURI('{{currentURI}}')
  let reg = /<div id="\{\{currentURI\}\}-data" hidden>[\s\S]*?<\/div>/gm
  let strToSave = `<div id="\{\{currentURI\}\}-data" hidden>${JSON.stringify(data)}</div>`
  let res = reg.exec(item.content)
  if (res === null) {
    item.content += `\n${strToSave}`
  } else {
    item.content = item.content.substring(0, res.index) + strToSave + item.content.substr(res.index+res[0].length)
  }
  itemManager.finalizeItemEdit('{{currentURI}}', false)
}

['ie', 'uie', 'iue', 'uiue'].forEach((className) => {
  const selectorPrefix = String.raw`#{{cssesc(currentURI)}} > .${className}`

  let inputEl = document.querySelector(`${selectorPrefix} .input-frame`)
  function addListItem() {
    if (inputEl.value === '') return
    data[className]['unfinished'].push(inputEl.value)
    inputEl.value = ''
    render()
    saveData()
  }

  document.querySelector(`${selectorPrefix} .input-btn`).addEventListener('click', addListItem)
  inputEl.addEventListener('keypress', (evt) => {
    if (evt.key === 'Enter') addListItem()
  })
})

})()
</script>

<style>
#{{cssesc(currentURI)}} {
  display: flex;
  flex-wrap: wrap;
  width: 100%;
  height: {{typeof height === 'undefined' ? '500px' : height}};
}
#{{cssesc(currentURI)}} ::-webkit-scrollbar {
  width: 3px;
}
#{{cssesc(currentURI)}} ::-webkit-scrollbar-track {
  background-color: var(--blockColorLighter);
}
#{{cssesc(currentURI)}} ::-webkit-scrollbar-thumb {
  background-color: var(--lineColor);
}
#{{cssesc(currentURI)}} > div {
  width: calc(50% - 10px);
  height: calc(50% - 10px);
  margin: 5px;
  display: flex;
  flex-direction: column;
}
#{{cssesc(currentURI)}} .control {
  display: flex;
  margin-bottom: 10px;
  height: 25px;
}
#{{cssesc(currentURI)}} .input-frame {
  flex-grow: 1;
  margin-left: 10px;
  margin-right: 10px;
  border: none;
  border-bottom: solid 2px var(--lineColor);
}
#{{cssesc(currentURI)}} .icon::before {
  content: "✎";
}
#{{cssesc(currentURI)}} .input-btn {
  width: 30px;
  height: 25px;
}
#{{cssesc(currentURI)}} button {
  background-color: white;
  border: none;
  text-align: center;
  vertical-align: middle;
}
#{{cssesc(currentURI)}} .input-btn:hover {
  background-color: var(--blockColorLight);
}
#{{cssesc(currentURI)}} .input-btn:active {
  background-color: var(--blockColor);
}
#{{cssesc(currentURI)}} .input-btn:focus {
  outline: none;
}
#{{cssesc(currentURI)}} .delete:hover {
  background-color: palevioletred;
}
#{{cssesc(currentURI)}} .delete:active {
  background-color: rgb(235, 47, 172);
}
#{{cssesc(currentURI)}} .delete:focus {
  outline: none;
}
#{{cssesc(currentURI)}} .list {
  overflow: auto;
}
#{{cssesc(currentURI)}} .list li {
  list-style-type: none;
  height: 25px;
  line-height: 25px;
}
#{{cssesc(currentURI)}} .list li:hover {
  background-color: var(--blockColorLighter);
}
#{{cssesc(currentURI)}} .list li > i {
  padding-left: 5px;
  padding-right: 10px;
}
#{{cssesc(currentURI)}} .list .finished label {
  text-decoration: line-through;
  color: gray;
}
#{{cssesc(currentURI)}} .list button {
  float: right;
  height: 25px;
}
</style>