// Function to create a post card (same as before)
function createPostCard(title, summary, date = null, url = "#", readTime = null) {
  const card = document.createElement("a");
  card.className = "card";
  card.addEventListener("click", async (e) => {
    e.preventDefault();
    await openPostCard(url, datePara.textContent, readTime);
  });

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

// Open post in a separate card
async function openPostCard(url, date = "", readTime = null) {
  const container = document.getElementById("generalPostsContainer");
  const res = await fetch(url);
  const text = await res.text();
  const parser = new DOMParser();
  const doc = parser.parseFromString(text, "text/html");

  const content = doc.querySelector("main.post")?.innerHTML || "<p>No content found.</p>";
  const title = doc.querySelector("h1")?.textContent || "Untitled";

  container.innerHTML = "";

  const card = document.createElement("div");
  card.className = "post-expanded-card";
  card.innerHTML = `
    <button onclick="location.reload()" style="font-size: 1rem; font-weight: bold; padding: 10px 30px; margin-left: -30px;">Back</button>
	
	<h2 style="text-align: center; align-self: center;">${title}</h2>
	<p class="post-date-inPost">
		<span>${new Date(date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
		<span>${readTime} min read</span>
	</p>


	
	<div class="post-content">${content}</div>

    <div class="like-comment-section">
      <button onclick="toggleLike('${url}')" id="likeBtn">❤️ Like</button>
      <span id="likeCount">0</span> Like(s)
    </div>

    <h3>Comments</h3>
    <div id="commentsContainer"></div>
    <textarea id="newComment" placeholder="Add a comment..." rows="3"></textarea><br/>
    <button onclick="addComment('${url}')">Post Comment</button>

    <button onclick="scrollToTop()">↑ Scroll to Top</button>
  `;

  container.appendChild(card);

  // Restore like state
  const likes = JSON.parse(localStorage.getItem("likes") || "{}");
  const liked = likes[url];
  document.getElementById("likeCount").textContent = liked ? "1" : "0";
  document.getElementById("likeBtn").textContent = liked ? "💔 Unlike" : "❤️ Like";

  // Load saved comments
  const comments = JSON.parse(localStorage.getItem("comments") || "{}")[url] || [];
  const commentsContainer = document.getElementById("commentsContainer");
  comments.forEach(c => {
    const comment = document.createElement("div");
    comment.className = "comment";
    comment.textContent = c;
    commentsContainer.appendChild(comment);
  });
}

function toggleLike(postUrl) {
  const countSpan = document.getElementById("likeCount");
  const button = document.getElementById("likeBtn");

  let liked = JSON.parse(localStorage.getItem("likes") || "{}");
  const isLiked = liked[postUrl] || false;

  liked[postUrl] = !isLiked;
  localStorage.setItem("likes", JSON.stringify(liked));

  countSpan.textContent = liked[postUrl] ? "1" : "0";
  button.textContent = liked[postUrl] ? "💔 Unlike" : "❤️ Like";
}

function addComment(postUrl) {
  const text = document.getElementById("newComment").value.trim();
  if (!text) return;

  const container = document.getElementById("commentsContainer");

  const comment = document.createElement("div");
  comment.className = "comment";
  comment.textContent = text;

  container.appendChild(comment);
  document.getElementById("newComment").value = "";

  // Save to localStorage
  let comments = JSON.parse(localStorage.getItem("comments") || "{}");
  comments[postUrl] = comments[postUrl] || [];
  comments[postUrl].push(text);
  localStorage.setItem("comments", JSON.stringify(comments));
}


function scrollToTop() {
  window.scrollTo({ top: 0, behavior: "smooth" });
}

// Main code 
document.addEventListener("DOMContentLoaded", async () => {
  // Map container class to relevant posts
  const containerMap = {
    "general-card-container": [
      { url: "blog/general_post-1.html", date: null },   //date: "10.12.2021" for manual date
      { url: "blog/general_post-2.html", date: null },
      { url: "blog/general_post-3.html", date: null },
      { url: "blog/general_post-4.html", date: null },
      { url: "blog/general_post-5.html", date: null },
      { url: "blog/general_post-6.html", date: null }
    ],
    "engineering-card-container": [
      { url: "blog/engineering_post-1.html", date: null },
      { url: "blog/engineering_post-2.html", date: null },
	  { url: "blog/engineering_post-3.html", date: null },
	  { url: "blog/engineering_post-4.html", date: null },
	  { url: "blog/engineering_post-5.html", date: null }
      // Add more engineering posts here
    ],
    "ls-dyna-card-container": [
      { url: "blog/ls-dyna_post-1.html", date: null },
      { url: "blog/ls-dyna_post-2.html", date: null },
	  { url: "blog/ls-dyna_post-3.html", date: null },
	  { url: "blog/ls-dyna_post-4.html", date: null },
	  { url: "blog/ls-dyna_post-5.html", date: null },
	  { url: "blog/ls-dyna_post-6.html", date: null },
	  { url: "blog/ls-dyna_post-7.html", date: null }
    ]
  };

  // Loop through each known container
  for (const [className, posts] of Object.entries(containerMap)) {
    const container = document.querySelector(`.${className}`);
    if (!container) continue; // If this container doesn't exist on the page, skip

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
  }
  
  // Make Search Work
  const searchInput = document.getElementById("searchInput");
  if (searchInput) {
    searchInput.addEventListener("input", function () {
		const search = this.value.toLowerCase();
		document.querySelectorAll(".card").forEach(card => {
		  const text = card.textContent.toLowerCase();
		  card.style.display = text.includes(search) ? "block" : "none";
		});
    });
  }

  // Scroll-to-top button functionality
  const scrollToTopBtn = document.getElementById('scroll-to-top');
  
  if (scrollToTopBtn) {
    // Show or hide the button based on scroll position
    window.addEventListener('scroll', () => {
      if (window.scrollY > 10) {
        scrollToTopBtn.classList.add('visible');
        scrollToTopBtn.classList.remove('hidden');
      } else {
        scrollToTopBtn.classList.add('hidden');
        scrollToTopBtn.classList.remove('visible');
      }
    });
  
    // Attach click handler (optional if you want to keep your existing scrollToTop function)
    scrollToTopBtn.addEventListener('click', scrollToTop);
  }

});


