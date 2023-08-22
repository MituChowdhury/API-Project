function loader() {
  let ld = document.getElementById("ld");
  ld.classList.add("d-none");
}

function fadeOut() {
  setInterval(loader, 1000);
}

window.onload = fadeOut;
