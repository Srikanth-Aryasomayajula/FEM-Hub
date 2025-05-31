document.addEventListener("DOMContentLoaded", function () {
  fetch("/FEM-Hub/includes/navbar.html")
    .then(response => response.text())
    .then(data => {
      document.getElementById("navbar").innerHTML = data;
    })
    .catch(error => console.error("Navbar load error:", error));
});
