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
  const posts = [
    { url: "blog/post-1.html", date: null },
    { url: "blog/post-2.html", date: "10.12.2021" }
  ];

  const results = await Promise.all(posts.map(async ({ url, date }) => {
    try {
      const meta = await fetchPostMeta(url);
      return createPostCard(meta.title, meta.summary, date || meta.date, url);
    } catch (err) {
      console.error("Failed to load:", url, err);
      return null;
    }
  }));

  results.forEach(card => {
    if (card) container.appendChild(card);
  });
});


