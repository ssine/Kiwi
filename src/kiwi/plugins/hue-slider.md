<input type="range" min="0" max="360" value="180" id="kiwi-hue-slider">
<style>
#kiwi-hue-slider {
  -webkit-appearance: none;
  width: 100%;
  height: 10px;
  border-radius: 5px;
  background: linear-gradient(to right, #ff3232 0%, #ff9900 10%, #ffff00 17%, #ccff00 20%, #32ff00 30%, #00ff65 40%, #00ffff 50%, #0065ff 60%, #3300ff 70%, #cb00ff 81%, #ff0098 90%, #ff0004 100%);
}
#kiwi-hue-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 20px;
  height: 20px;
  border-radius: 20px;
  background: var(--primaryColor);
  cursor: pointer;
}
#kiwi-hue-slider:focus {
  outline: none;
}
</style>
<script>
  (async () => {
    let saved = true
    let slider = document.getElementById('kiwi-hue-slider')
    slider.value = (await itemManager.getThemeHue()) * 360
    slider.oninput = (value) => {
      if (saved) {
        saved = false;
        setTimeout(async () => {
          itemManager.saveItem({uri: 'kiwi/config/primary-color', editedItem: {content: kiwiTools.RGBtoCSSColor(kiwiTools.HSVtoRGB({h: slider.value / 360, s: 1, v: 1}))}})
          saved = true
        }, 2000);
      }
      itemManager.setThemeHue(slider.value / 360)
    }
  })()
</script>