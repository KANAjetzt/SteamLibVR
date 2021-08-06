(async () => {
  const appId = 1455840

  const res = await fetch('http://localhost:3000/data/gameInfo.json')
  const data = await res.json()
  const gameInfo = data[appId].data

  document.querySelector('.back__systemReq--min').innerHTML = gameInfo.pc_requirements.minimum
  document.querySelector('.back__systemReq--max').innerHTML = gameInfo.pc_requirements.recommended
})()



