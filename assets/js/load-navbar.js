// assets/js/load-navbar.js

document.addEventListener("DOMContentLoaded", function () {
  // Load header
  fetch("/FEM-Hub/assets/includes/header.html")
    .then(response => response.text())
    .then(data => {
      document.getElementById("header").innerHTML = data;
    });

  // Load footer
  fetch("/FEM-Hub/assets/includes/footer.html")
    .then(response => response.text())
    .then(data => {
      document.getElementById("footer").innerHTML = data;
    });
});
