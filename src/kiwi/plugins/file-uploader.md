<input id="{{currentURI}}-filename" type="text" placeholder="asset/new-file.pdf" />
<br/>
<input id="{{currentURI}}-input" type="file" />
<br/>
<button id="{{currentURI}}-button">Upload</button>
<script>
document.getElementById('{{currentURI}}-button').addEventListener('click', () => {
  var input = document.getElementById('{{currentURI}}-input')
  postFile(document.getElementById('{{currentURI}}-filename').value, input.files[0])
})
</script>
