// Function to create a post
function createPostCard(title, summary, date = null, url = "#") {
  const card = document.createElement("a");
  card.className = "card";
  card.href = url;

  const heading = document.createElement("h2");
  heading.textContent = title;

  const summaryPara = document.createElement("p");
  summaryPara.textContent = summary;

  const datePara = document.createElement("p");
  datePara.className = "post-date";
  const today = new Date();
  datePara.textContent = date || today.toISOString().split("T")[0];

  card.appendChild(heading);
  card.appendChild(summaryPara);
  card.appendChild(datePara);

  return card;
}

// Example usage:
document.addEventListener("DOMContentLoaded", () => {
  const container = document.querySelector(".card-container");

  const post1 = createPostCard(
    "Exploring the Dynamics of FEM",
    "An introductory dive into the finite element method and its modern applications.",
    "2024-12-10",
    "blog/post-1.html"
  );
  const post2 = createPostCard(
    "Stress Analysis in Composites",
    "Understanding how FEM helps analyze composite materials.",
    null, // uses today's date
    "blog/post-2.html"
  );

  container.appendChild(post1);
  container.appendChild(post2);
});
