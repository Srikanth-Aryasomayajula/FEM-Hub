// Function to create a post card (same as before)
function createPostCard(title, summary, date = null, url = "#", readTime = null) {
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
  
  const readTimePara = document.createElement("p");
  readTimePara.className = "read-time";
  readTimePara.textContent = `${readTime} min read`;

  const infoWrapper = document.createElement("div");
  infoWrapper.className = "card-info";
  infoWrapper.appendChild(datePara);
  infoWrapper.appendChild(readTimePara);

  card.appendChild(infoWrapper);

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
  
  const content = doc.querySelector('main.post')?.textContent || "";
  const wordCount = content.trim().split(/\s+/).length;
  let readTime = Math.ceil(wordCount / 200); // Average 200 wpm
  
  // Optionally extract date if you add it similarly
  const date = null; 
  
  // Allow override
  const customTime = doc.querySelector('meta[name="read-time"]')?.getAttribute('content');
  if (customTime) readTime = customTime;
  
  return { title, summary, date, readTime };
}

document.addEventListener("DOMContentLoaded", async () => {
  const container = document.querySelector(".general-card-container");
  if (!container) return; // Avoids errors if the container doesn't exist

  const posts = [
    { url: "blog/general_post-1.html", date: null },  //to change the date manually, use date: "10.12.2021"
    { url: "blog/general_post-2.html", date: null }, 
	{ url: "blog/general_post-3.html", date: null },
	{ url: "blog/general_post-4.html", date: null },
	{ url: "blog/general_post-5.html", date: null },
	{ url: "blog/general_post-6.html", date: null }
  ];

  const results = await Promise.all(posts.map(async ({ url, date }) => {
    try {
      const meta = await fetchPostMeta(url);
      return createPostCard(meta.title, meta.summary, date || meta.date, url, meta.readTime);
    } catch (err) {
      console.error("Failed to load:", url, err);
      return null;
    }
  }));

  results.forEach(card => {
    if (card) container.appendChild(card);
  });
});


