<input id="{{currentURI}}-filename" type="text" placeholder="asset/new-file.pdf" />
<br/>
<input id="{{currentURI}}-input" type="file" />
<br/>
<button id="{{currentURI}}-button">Upload</button>
<script>
document.getElementById('{{currentURI}}-button').addEventListener('click', () => {
  const input = document.getElementById('{{currentURI}}-input')
  const [uri, item] = kiwi.createItem(document.getElementById('{{currentURI}}-filename').value)
  const file = input.files[0]
  item.type = file.type
  kiwi.saveItem(uri, item, file)
})
</script>
