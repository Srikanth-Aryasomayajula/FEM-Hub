// Map container class to relevant posts
const containerMap = {
  "general-card-container": [
    { url: "blog/general_post-1.html", date: "10.12.2021" },   //date: "10.12.2021" for manual date
    { url: "blog/general_post-2.html", date: null },
    { url: "blog/general_post-3.html", date: null },   //date: null for today's date
    { url: "blog/general_post-4.html", date: null },
    { url: "blog/general_post-5.html", date: "08.12.2021" },
    { url: "blog/general_post-6.html", date: null },
	{ url: "blog/general_post-7.html", date: null },
	{ url: "blog/general_post-8.html", date: null },
	{ url: "blog/general_post-9.html", date: null }
  ],
  "engineering-card-container": [
    { url: "blog/engineering_post-1.html", date: null },
    { url: "blog/engineering_post-2.html", date: null },
	{ url: "blog/engineering_post-3.html", date: "11.12.2021" },
	{ url: "blog/engineering_post-4.html", date: null },
	{ url: "blog/engineering_post-5.html", date: null }
    // Add more engineering posts here
  ],
  "ls-dyna-card-container": [
    { url: "blog/ls-dyna_post-1.html", date: null },
    { url: "blog/ls-dyna_post-2.html", date: null },
	{ url: "blog/ls-dyna_post-3.html", date: null },
	{ url: "blog/ls-dyna_post-4.html", date: null },
	{ url: "blog/ls-dyna_post-5.html", date: "20.12.2021" },
	{ url: "blog/ls-dyna_post-6.html", date: null },
	{ url: "blog/ls-dyna_post-7.html", date: null }
  ]
};

// Function to set the date format
function formatDateToDDMMMYYYY(dateStr) {
  // dateStr expected in 'YYYY-MM-DD' or similar standard format
  const d = new Date(dateStr);
  if (isNaN(d)) return dateStr; // fallback if invalid date
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

// Function to create a post card (same as before)
function createPostCard(title, summary, date = null, url = "#", readTime = null) {
  const card = document.createElement("a");
  card.className = "card";
  
  card.addEventListener("click", async (e) => {
    e.preventDefault();
    const rawDate = date 
      ? date.split('.').reverse().join('-') 
      : new Date().toISOString().split('T')[0];
    await openPostCard(url, rawDate, readTime);
  });

  const heading = document.createElement("h2");
  heading.textContent = title;

  const summaryPara = document.createElement("p");
  summaryPara.textContent = summary;

  const datePara = document.createElement("p");
  datePara.className = "post-date";
  const today = new Date();
  datePara.textContent = date
    ? formatDateToDDMMMYYYY(date.split('.').reverse().join('-'))
    : formatDateToDDMMMYYYY(today.toISOString().split("T")[0]);

  card.appendChild(heading);
  card.appendChild(summaryPara);
  
  const readTimePara = document.createElement("p");
  readTimePara.className = "read-time";
  readTimePara.textContent = readTime ? `${readTime} min read` : '';

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
  let readTime = Math.max(1, Math.ceil(wordCount / 175)); // Average 175 wpm
  
  // Optionally extract date if you add it similarly
  const date = null; 
  
  // Allow override
  const customTime = doc.querySelector('meta[name="read-time"]')?.getAttribute('content');
  if (customTime) readTime = customTime;
  
  return { title, summary, date, readTime };
}

function hideSearchBar() {
  const searchBar = document.querySelector(".search-bar-container");
  if (searchBar) {
    searchBar.style.display = "none";
  }
}

// Insert image in the card
async function insertImage({ name, format, altText, webZoom, mobileZoom }) {

  const isMobile = window.innerWidth <= 768;
  const scale = isMobile ? mobileZoom : webZoom;
  const imagePath = `${window.location.origin}/FEM-Hub/images/${name}.${format}`;
  const targetEl = document.getElementById(name);

  if (!targetEl) {
    console.warn(`insertImage: No element found with id="${name}"`);
    return;
  }

  try {
    const response = await fetch(imagePath, { method: 'HEAD' });
    if (!response.ok) {
      throw new Error(`Image not found at path: ${imagePath}`);
    }
  } catch (error) {
    console.error(error.message);
    return;
  }

  // Create container div
  const container = document.createElement('div');
  container.className = 'post-image-container';
  container.style.setProperty('--container-scale', scale);
  container.style.transform = `scale(${scale})`;
  container.style.transformOrigin = 'center';
  container.setAttribute('onclick', `expandImage('${imagePath}')`);

  // Create img element
  const img = document.createElement('img');
  img.className = 'post-image';
  img.alt = altText;
  img.src = imagePath;
  img.onerror = () => {
    console.error(`Failed to load image: ${img.src}`);
    img.style.border = '2px solid red';
    img.alt = 'Image failed to load';
  };

  // Create button element
  const btn = document.createElement('button');
  btn.className = 'expand-btn';
  btn.style.transform = `scale(${1 / scale})`;
  btn.style.transformOrigin = 'center';
  btn.textContent = 'Expand';

  container.appendChild(img);
  container.appendChild(btn);

  targetEl.replaceWith(container);
}

// Open post in a separate card
async function openPostCard(url, date = "", readTime = null) {
  const container = document.querySelector("main[id$='PostsContainer']");
  const res = await fetch(url);
  const text = await res.text();
  const parser = new DOMParser();
  const doc = parser.parseFromString(text, "text/html");
  
  let displayDate = date;
  if (!date || date.trim() === "") {
    // Try to find a date element or meta tag inside the fetched post HTML
    const metaDate = doc.querySelector('meta[name="post-date"]')?.getAttribute('content');
    if (metaDate) {
      displayDate = metaDate;
    } else {
      // fallback to empty or a fixed string to avoid today's date
      displayDate = "Unknown Date";
    }
  }

  const content = doc.querySelector("main.post")?.innerHTML || "<p>No content found.</p>";
  const title = doc.querySelector("h1")?.textContent || "Untitled";
  document.title = `FEM Hub - ${title}`;
  
  // Update browser URL
  history.pushState(null, '', `?post=${encodeURIComponent(url)}`);
  
  const pageTitle = document.querySelector(".page-title");
  if (pageTitle) {
    pageTitle.textContent = `FEM Hub - ${title}`;
  }

  container.innerHTML = "";
  hideSearchBar();

  const card = document.createElement("div");
  card.className = "post-expanded-card";
  card.innerHTML = `
    <button class="back-button" onclick="goBack('${url}')">Back</button>

	<h2 style="text-align: center; align-self: center;">${title}</h2>
	<p class="post-date-inPost">
		<span>${displayDate === "Unknown Date" ? displayDate : formatDateToDDMMMYYYY(displayDate)}</span>
		<span>${readTime !== null && readTime !== undefined ? readTime + ' min read' : ''}</span>
	</p>
	
	<div class="post-content">${content}</div>

    <div class="like-comment-section">
      <button onclick="toggleLike('${url}')" id="likeBtn">❤️ Like</button>
      <span id="likeWrapper"><span id="likeCount">0</span> Likes</span>
	  <br/><button onclick="sharePost('${url}')" id="shareBtn">🔗 Share</button>
    </div>

    <h3>Discussion Forum</h3>
    <div id="commentsContainer"></div>
    <textarea id="newComment" placeholder="Add a comment..." rows="3"></textarea><br/>
    <button onclick="addComment('${url}')">Post</button>

  `;

  container.appendChild(card);

  // Restore likes
  document.getElementById("likeBtn").textContent = "❤️ Like";


  // Load saved likes
  updateLikeCount(url);
  
  // Track current post URL
  currentPostUrl = url;

  // Insert images dynamically from post content
  const imageDivs = card.querySelectorAll("div[id][data-img-format]");
  for (const div of imageDivs) {
    await insertImage({
      name: div.id,
      format: div.dataset.imgFormat,
      altText: div.dataset.imgAlt || "",
      webZoom: parseFloat(div.dataset.imgWebZoom) || 1.0,
      mobileZoom: parseFloat(div.dataset.imgMobileZoom) || 1.0
    });
  }

  // Load saved comments
  await loadComments(url);

}

function goBack(postUrl) {
  let base = '/FEM-Hub/index.html';
  if (postUrl.includes('general')) {
    base = '/FEM-Hub/general.html';
  } else if (postUrl.includes('engineering')) {
    base = '/FEM-Hub/engineering.html';
  } else if (postUrl.includes('ls-dyna')) {
    base = '/FEM-Hub/ls-dyna.html';
  }
  window.location.href = base;
}

async function toggleLike(postUrl, overrideName = null) {
  const name = overrideName || prompt("Enter your name:");
  if (!name) return;
  
  showStatus("Liking...");

  const likesRef = window.db.collection("likes");

  const existing = await likesRef
    .where("postUrl", "==", postUrl)
    .where("name", "==", name)
    .limit(1)
    .get();

  const likeBtn = document.getElementById("likeBtn");

  if (!existing.empty) {
    const isYou = confirm(`"${name}" has already liked this post. Is it you?\nClick "OK" for Yes, "Cancel" for No.`);
	hideStatus();
    if (isYou) {
      const confirmUnlike = confirm('Do you want to unlike this post?\nClick "OK" for Yes, "Cancel" for No.');
      if (confirmUnlike) {
		showStatus("Disiking...");
        existing.forEach(doc => doc.ref.delete());
        likeBtn.textContent = "❤️ Like";
      }
    } else {
      const newName = prompt("Please enter a different name (e.g., add a number):", name + "1");
	  hideStatus();
      if (newName && newName !== name) {
        return toggleLike(postUrl, newName); // Recursive reattempt with new name
      }
    }
  } else {
    await likesRef.add({
      postUrl,
      name,
      timestamp: new Date()
    });
    likeBtn.textContent = "💔 Unlike";
  }

  await updateLikeCount(postUrl);
  hideStatus();
}

async function updateLikeCount(postUrl) {
  const likesRef = window.db.collection("likes");
  const snapshot = await likesRef.where("postUrl", "==", postUrl).get();
  const likeCount = snapshot.size;

  const likeCountSpan = document.getElementById("likeWrapper");
  likeCountSpan.innerHTML = `<span class="like-full-text">${likeCount} ${likeCount === 1 ? 'Like' : 'Likes'}</span>`;


  // Collect names to show in tooltip
  const names = snapshot.docs.map(doc => doc.data().name);
  likeCountSpan.title = '';
  if (names.length > 0) {
    const tooltipBox = document.createElement('div');
    tooltipBox.className = 'like-tooltip';
    names.forEach(n => {
      const line = document.createElement('div');
      line.textContent = n;
      tooltipBox.appendChild(line);
    });
    likeCountSpan.appendChild(tooltipBox);
  }
}

function sharePost(postUrl) {
  const baseUrl = window.location.origin + '/FEM-Hub/general.html';
  const fullUrl = `${baseUrl}?post=${encodeURIComponent(postUrl)}`;
  
  if (navigator.share) {
    navigator.share({
      title: document.title,
      url: fullUrl
    });
  } else {
    navigator.clipboard.writeText(fullUrl);
    alert("Post link copied to clipboard!");
  }
}

function renderComment(comment, allComments) {
  const wrapper = document.createElement("div");
  wrapper.className = "comment";
  wrapper.id = `comment-${comment.id}`;

  wrapper.innerHTML = `
    <div class="comment-header">
      <span class="comment-name">${comment.name}</span>
      <span class="comment-time">${formatDateToDDMMMYYYY(comment.timestamp.toDate())}, ${new Date(comment.timestamp.toDate()).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}</span>
    </div>
    <div class="comment-text">${comment.text}</div>
    <div class="comment-actions">
      <button onclick="likeComment('${comment.id}')">👍 ${comment.likes || 0}</button>
      <button onclick="dislikeComment('${comment.id}')">👎 ${comment.dislikes || 0}</button>
      <button onclick="replyToComment('${comment.id}', '${comment.name}')">Reply</button>
      <button onclick="shareComment(currentPostUrl, '${comment.id}')">Share</button>
    </div>
  `;

  // Render children (replies)
  if (comment.children && comment.children.length > 0) {
    comment.children.forEach(child => {
      const childEl = renderComment(child, allComments);
      wrapper.appendChild(childEl);
    });
  }

  return wrapper;
}

async function loadComments(postUrl) {
  const container = document.getElementById("commentsContainer");
  
  // Show loading indicator with custom styling
  container.innerHTML = '<div id="loadingIndicator">Loading likes and comments...</div>';

  // Fetch top-level comments
  const commentSnap = await window.db.collection("comments")
    .where("postUrl", "==", postUrl)
    .orderBy("timestamp", "asc")
    .get();

  const comments = {};
  commentSnap.forEach(doc => {
    const data = doc.data();
    comments[doc.id] = { id: doc.id, ...data, children: [] };
  });

  // Fetch replies
  const replySnap = await window.db.collection("nestedComments")
    .where("postUrl", "==", postUrl)
    .orderBy("timestamp", "asc")
    .get();

  const allReplies = {};
  replySnap.forEach(doc => {
    const reply = doc.data();
    reply.id = doc.id;
    reply.children = [];
    allReplies[doc.id] = reply;
  });

  // Link replies to parents
  Object.values(allReplies).forEach(reply => {
    const parentId = reply.parentId;
    if (comments[parentId]) {
      comments[parentId].children.push(reply);
    } else if (allReplies[parentId]) {
      allReplies[parentId].children.push(reply);
    }
  });

  // Clear container for fresh render except loader
  container.innerHTML = '<div id="loadingIndicator">Loading likes and comments...</div>';

  // Render all top-level comments
  const fragment = document.createDocumentFragment();

  for (const c of Object.values(comments)) {
    const commentEl = await renderComment(c, comments);
    fragment.appendChild(commentEl);
  }

  // Add all comments at once, then remove loader
  const loader = document.getElementById("loadingIndicator");
  if (loader) loader.remove();
  container.appendChild(fragment);
}

async function addComment(postUrl) {
  const text = document.getElementById("newComment").value.trim();
  const name = prompt("Enter your name:");
  if (!name || !text) return;
  
  showStatus("Posting...");

  await window.db.collection("comments").add({
    postUrl,
    name,
    text,
    timestamp: new Date(),
    likes: 0,
    dislikes: 0
  });


  document.getElementById("newComment").value = '';
  await loadComments(postUrl);
  
  hideStatus();
}

function shareComment(postUrl, commentId) {
  const baseUrl = window.location.origin + '/FEM-Hub/general.html';
  const fullUrl = `${baseUrl}?post=${encodeURIComponent(postUrl)}&comment=${encodeURIComponent(commentId)}`;
  
  if (navigator.share) {
    navigator.share({
      title: "Check out this comment",
      url: fullUrl
    });
  } else {
    navigator.clipboard.writeText(fullUrl);
    alert("Comment link copied to clipboard!");
  }
}

async function likeComment(commentId) {
  const name = prompt("Enter your name:");
  if (!name) return;

  await toggleLikeDislike(commentId, name, "like");
}

async function dislikeComment(commentId) {
  const name = prompt("Enter your name:");
  if (!name) return;

  await toggleLikeDislike(commentId, name, "dislike");
}

async function findCommentRef(commentId) {
  let ref = window.db.collection("comments").doc(commentId);
  const doc = await ref.get();
  if (doc.exists) return ref;

  // Try nestedComments if not found in comments
  ref = window.db.collection("nestedComments").doc(commentId);
  const nestedDoc = await ref.get();
  return nestedDoc.exists ? ref : null;
}

async function toggleLikeDislike(commentId, name, actionType) {
	
  showStatus(actionType === "like" ? "Liking..." : "Disliking...");
  
  const isNested = await isNestedComment(commentId);
  const collectionName = isNested ? "nestedActions" : "commentActions";
  const oppositeAction = actionType === "like" ? "dislike" : "like";

  const existing = await window.db.collection(collectionName)
    .where("commentId", "==", commentId)
    .where("name", "==", name)
    .get();

  let countChange = 0;

  if (!existing.empty) {
    const existingDoc = existing.docs[0];
    const data = existingDoc.data();
	hideStatus();

    const isYou = confirm(`"${name}" already ${data.type === "like" ? "liked" : "disliked"} this comment. Do you want to ${data.type === "dislike" ? "like" : "dislike"} it?\nClick "OK" for Yes, "Cancel" for No.`);
    if (isYou) {
      if (data.type === actionType) {
        showStatus(data.type === "like" ? "Disliking..." : "Liking...");
		// Toggle off
        await existingDoc.ref.delete();
        countChange = -1;
      } else {
        // Switch like <-> dislike
		showStatus(actionType === "like" ? "Liking..." : "Disliking...");
        await existingDoc.ref.update({ type: actionType, timestamp: new Date() });
        countChange = 1;
        // Decrease count of opposite action
        await updateCommentField(commentId, oppositeAction + "s", -1, isNested);
      }
    } else {
      const newName = prompt("Enter a different name (e.g., append a number):", name + "1");
	  hideStatus();
	  
      if (newName && newName !== name) {
        return toggleLikeDislike(commentId, newName, actionType); // Recursive retry
      }
      return;
    }
  } else {
    // First time like/dislike
    await window.db.collection(collectionName).add({
      commentId,
      name,
      type: actionType,
      timestamp: new Date()
    });
    countChange = 1;
  }

  if (countChange !== 0) {
    await updateCommentField(commentId, actionType + "s", countChange, isNested);
    await loadComments(currentPostUrl);
  }
  
  hideStatus();
}

async function isNestedComment(commentId) {
  const nestedRef = window.db.collection("nestedComments").doc(commentId);
  const nestedDoc = await nestedRef.get();
  return nestedDoc.exists;
}

async function updateCommentField(commentId, field, change, isNested) {
  const ref = window.db.collection(isNested ? "nestedComments" : "comments").doc(commentId);
  await ref.update({
    [field]: firebase.firestore.FieldValue.increment(change)
  });
}

function replyToComment(parentId, parentName) {
  const parentComment = document.getElementById(`comment-${parentId}`);
  
  // Avoid creating multiple reply boxes
  if (parentComment.querySelector('.reply-input')) return;

  const replyBox = document.createElement("div");
  replyBox.className = "reply-input";
  replyBox.style.marginTop = "10px";
  replyBox.innerHTML = `
    <textarea rows="2" placeholder="Reply..." style="width: 90%; margin-bottom: 5px;"></textarea><br/>
    <button onclick="submitReply('${parentId}', this)">Post</button>
    <button onclick="this.parentElement.remove()">Cancel</button>
  `;

  parentComment.appendChild(replyBox);

  // Focus the textarea
  const textarea = replyBox.querySelector("textarea");
  textarea.focus();
}

async function submitReply(parentId, button) {
  const container = button.closest('.reply-input');
  const textarea = container.querySelector('textarea');
  const text = textarea.value.trim();
  const name = prompt("Enter your name:");

  if (!text || !name) return;
  
  showStatus("Posting...");

  await window.db.collection("nestedComments").add({
    postUrl: currentPostUrl,
    name,
    text,
    timestamp: new Date(),
    likes: 0,
    dislikes: 0,
    parentId
  });

  await loadComments(currentPostUrl);
  hideStatus();
}

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: "smooth" });
}

async function getActionNames(commentId, actionType, isNested) {
  const collectionName = isNested ? "nestedActions" : "commentActions";
  const snapshot = await window.db.collection(collectionName)
    .where("commentId", "==", commentId)
    .where("type", "==", actionType)
    .get();

  return snapshot.docs.map(doc => doc.data().name);
}

// Modify renderComment to async and add tooltips
async function renderComment(comment, allComments, indent = 0) {
  const wrapper = document.createElement("div");
  wrapper.className = "comment";
  wrapper.id = `comment-${comment.id}`;
  wrapper.style.marginLeft = `${indent}px`;

  // Default likes and dislikes count
  const likesCount = comment.likes || 0;
  const dislikesCount = comment.dislikes || 0;

  // Determine if nested comment
  const isNested = comment.parentId !== undefined;

  // Fetch names asynchronously for tooltips
  const likeNames = await getActionNames(comment.id, "like", isNested);
  const dislikeNames = await getActionNames(comment.id, "dislike", isNested);

  wrapper.innerHTML = `
    <div class="comment-header">
      <span class="comment-name">${comment.name}</span>
      <span class="comment-time">${formatDateToDDMMMYYYY(comment.timestamp.toDate())}, ${new Date(comment.timestamp.toDate()).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}</span>
    </div>
    <div class="comment-text">${comment.text}</div>
    <div class="comment-actions">
	
	<span class="like-wrapper">
	  <button onclick="likeComment('${comment.id}')">👍 ${likesCount}</button>
	  ${likeNames.length ? `<div class="like-tooltip">${likeNames.map(n => `<div>${n}</div>`).join('')}</div>` : ''}
	</span>
	<span class="like-wrapper">
	  <button onclick="dislikeComment('${comment.id}')">👎 ${dislikesCount}</button>
	  ${dislikeNames.length ? `<div class="like-tooltip">${dislikeNames.map(n => `<div>${n}</div>`).join('')}</div>` : ''}
	</span>
	  
	  <button onclick="replyToComment('${comment.id}', '${comment.name}')">Reply</button>
      <button onclick="shareComment(currentPostUrl, '${comment.id}')">Share</button>
    </div>
  `;

  // Render children (replies)
  if (comment.children && comment.children.length > 0) {
    for (const child of comment.children) {
      const childEl = await renderComment(child, allComments, indent + 30);
      wrapper.appendChild(childEl);
    }
  }

  return wrapper;
}

function getDateFromContainerMap(url) {
  for (const posts of Object.values(containerMap)) {
    const found = posts.find(post => post.url === decodeURIComponent(url));
    if (found) return found.date;
  }
  return null;
}

function showStatus(message) {
  const el = document.getElementById("actionStatus");
  if (!el) return;
  el.textContent = message;
  el.style.display = "block";
}

function hideStatus() {
  const el = document.getElementById("actionStatus");
  if (!el) return;
  el.style.display = "none";
}

// Enable toggle menu for the mobile site
function setupMobileMenu() {
  const toggleBtn = document.getElementById("menuToggleBtn");
  const navLinks = document.getElementById("navMenu");

  if (toggleBtn && navLinks) {
    toggleBtn.addEventListener("click", () => {
      navLinks.classList.toggle("show");
    });

    // Close when clicking outside
    document.addEventListener("click", (event) => {
      if (
        navLinks.classList.contains("show") &&
        !navLinks.contains(event.target) &&
        !toggleBtn.contains(event.target)
      ) {
        navLinks.classList.remove("show");
      }
    });
  }
}

function expandImage(src) {
  const overlay = document.createElement("div");
  overlay.className = "expanded-image-overlay";

  overlay.innerHTML = `
    <button class="close-expanded" onclick="document.body.removeChild(this.parentElement)">✕</button>
    <img src="${src}" alt="Expanded Image" />
  `;

  // Clicking the overlay outside the image closes the expanded view
  overlay.addEventListener("click", (event) => {
    // If the click target is the overlay itself (not the image or button)
    if (event.target === overlay) {
      document.body.removeChild(overlay);
    }
  });

  document.body.appendChild(overlay);
}

// Main code 
let currentPostUrl = "";

document.addEventListener("DOMContentLoaded", async () => {
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


  // Auto-open post if ?post=... is in URL
  const params = new URLSearchParams(window.location.search);
  const postToOpen = params.get("post");
  const commentToHighlight = params.get("comment");
  
  if (postToOpen) {
	try {
		const meta = await fetchPostMeta(postToOpen);
		
		let rawDate = getDateFromContainerMap(postToOpen) || meta.date || "Unknown Date";
		if (/^\d{2}\.\d{2}\.\d{4}$/.test(rawDate)) {
			const [dd, mm, yyyy] = rawDate.split(".");
			rawDate = `${yyyy}-${mm}-${dd}`;
		}
				
		const readTime = meta.readTime || null;

		// Fallback if nothing is returned
		await openPostCard(postToOpen, rawDate, readTime);
	} catch (err) {
		console.error("Failed to open shared post:", err);
	}
    
    if (commentToHighlight) {
      await loadComments(postToOpen); // ensure comments loaded again if needed (or rely on previous await in openPostCard)
      
      const commentEl = document.getElementById(`comment-${commentToHighlight}`);
      if (commentEl) {
        commentEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        commentEl.style.transition = "background-color 2s ease";
        commentEl.style.backgroundColor = "#ffff99"; // highlight color
    
        setTimeout(() => {
          commentEl.style.backgroundColor = "";
        }, 3000);
      }
    }
  }

});