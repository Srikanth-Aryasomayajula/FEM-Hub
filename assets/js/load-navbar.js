// assets/js/load-navbar.js

document.addEventListener("DOMContentLoaded", function () {
  // Load header
  fetch("/FEM-Hub/includes/header.html")
    .then(response => response.text())
    .then(data => {
      document.getElementById("header").innerHTML = data;
    });

  // Load footer
  fetch("/FEM-Hub/includes/footer.html")
    .then(response => response.text())
    .then(data => {
      document.getElementById("footer").innerHTML = data;
    });
});