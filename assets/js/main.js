// Function to create a post card (same as before)
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
  datePara.textContent = date 
    ? date.split('-').reverse().join('.') 
    : today.toISOString().split("T")[0].split('-').reverse().join('.');

  card.appendChild(heading);
  card.appendChild(summaryPara);
  card.appendChild(datePara);

  return card;
}

// Helper to fetch and parse HTML, then extract title and summary
async function fetchPostMeta(url) {
  const res = await fetch(url);
  const text = await res.text();
  const parser = new DOMParser();
  const doc = parser.parseFromString(text, "text/html");
  const title = doc.querySelector('h1')?.textContent || "No Title";
  const summary = doc.querySelector('meta[name="post-summary"]')?.getAttribute('content') || "No Summary";
  
  // Optionally extract date if you add it similarly
  // For now, we hardcode or default
  const date = null; 
  return { title, summary, date };
}

document.addEventListener("DOMContentLoaded", async () => {
  const container = document.querySelector(".card-container");

  // Fetch metadata for post 1 dynamically
  const post1Meta = await fetchPostMeta("blog/post-1.html");
  const post1Card = createPostCard(post1Meta.title, post1Meta.summary, post1Meta.date, "blog/post-1.html");
  container.appendChild(post1Card);

  // For post 2, you can still hardcode or replicate this fetching process
  const post2 = createPostCard(
    "Stress Analysis in Composites",
    "Understanding how FEM helps analyze composite materials.",
    null,
    "blog/post-2.html"
  );
  container.appendChild(post2);
});
