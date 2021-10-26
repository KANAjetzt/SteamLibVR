(async () => {
  const appId = document.querySelector("body").dataset.appid;

  const res = await fetch(`http://localhost:3000/gameInfo/${appId}`);
  const data = await res.json();
  const gameInfo = data.data[0];
  console.log(gameInfo);

  document.querySelector(".back__systemReq--min").innerHTML =
    gameInfo.pc_requirements.minimum;
  if (gameInfo.pc_requirements.recommended) {
    document.querySelector(".back__systemReq--max").innerHTML =
      gameInfo.pc_requirements.recommended;
  }
})();
