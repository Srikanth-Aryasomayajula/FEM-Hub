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
    ? date.split('-').reverse().join('.') 
    : today.toISOString().split("T")[0].split('-').reverse().join('.');

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
  let readTime = Math.max(1, Math.ceil(wordCount / 200)); // Average 200 wpm
  
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
		<span>${readTime ? readTime + ' min read' : ''}</span>
	</p>
	
	<div class="post-content">${content}</div>

    <div class="like-comment-section">
      <button onclick="toggleLike('${url}')" id="likeBtn">❤️ Like</button>
      <span id="likeCount">0</span> Likes
	  <br/><button onclick="sharePost('${url}')" id="shareBtn">🔗 Share</button>
    </div>

    <h3>Comments</h3>
    <div id="commentsContainer"></div>
    <textarea id="newComment" placeholder="Add a comment..." rows="3"></textarea><br/>
    <button onclick="addComment('${url}')">Post Comment</button>

  `;

  container.appendChild(card);

  // Restore likes
  document.getElementById("likeBtn").textContent = "❤️ Like";


  // Load saved likes
  updateLikeCount(url);
  
  // Track current post URL
  currentPostUrl = url;

  // Load saved comments
  await loadComments(url);

}

async function toggleLike(postUrl, overrideName = null) {
  const name = overrideName || prompt("Enter your name:");
  if (!name) return;

  const likesRef = window.db.collection("likes");

  const existing = await likesRef
    .where("postUrl", "==", postUrl)
    .where("name", "==", name)
    .limit(1)
    .get();

  const likeBtn = document.getElementById("likeBtn");

  if (!existing.empty) {
    const isYou = confirm(`"${name}" has already liked this post. Is it you?\nClick "OK" for Yes, "Cancel" for No.`);
    if (isYou) {
      const confirmUnlike = confirm('Do you want to unlike this post?\nClick "OK" for Yes, "Cancel" for No.');
      if (confirmUnlike) {
        existing.forEach(doc => doc.ref.delete());
        likeBtn.textContent = "❤️ Like";
      }
    } else {
      const newName = prompt("Please enter a different name (e.g., add a number):", name + "1");
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

  updateLikeCount(postUrl);
}

async function updateLikeCount(postUrl) {
  const likesRef = window.db.collection("likes");
  const snapshot = await likesRef.where("postUrl", "==", postUrl).get();
  const likeCount = snapshot.size;
  document.getElementById("likeCount").textContent = likeCount;
  document.getElementById("likeCount").nextSibling.textContent = ` ${likeCount === 1 ? 'Like' : 'Likes'}`;

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

function renderComment(comment, allComments, indent = 0) {
  const wrapper = document.createElement("div");
  wrapper.className = "comment";
  wrapper.id = `comment-${comment.id}`;
  wrapper.style.marginLeft = `${indent}px`;

  wrapper.innerHTML = `
    <div class="comment-header">
      <span class="comment-name">${comment.name}</span>
      <span class="comment-time">${new Date(comment.timestamp.toDate()).toLocaleString()}</span>
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
      const childEl = renderComment(child, allComments, indent + 30);
      wrapper.appendChild(childEl);
    });
  }

  return wrapper;
}

async function loadComments(postUrl) {
  const container = document.getElementById("commentsContainer");
  container.innerHTML = "<p>Loading likes and comments...</p>";

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

  Object.values(allReplies).forEach(reply => {
    const parentId = reply.parentId;
    if (comments[parentId]) {
      comments[parentId].children.push(reply);
    } else if (allReplies[parentId]) {
      allReplies[parentId].children.push(reply);
    }
  });

  container.innerHTML = "";

  Object.values(comments)
    .forEach(c => container.appendChild(renderComment(c, comments)));

  // Wait a tick for DOM to render the comments
  return new Promise(resolve => {
    // Use requestAnimationFrame or setTimeout 0 to wait for rendering
    requestAnimationFrame(() => {
      resolve();
    });
  });
}



async function addComment(postUrl) {
  const text = document.getElementById("newComment").value.trim();
  const name = prompt("Enter your name:");
  if (!name || !text) return;

  await window.db.collection("comments").add({
    postUrl,
    name,
    text,
    timestamp: new Date(),
    likes: 0,
    dislikes: 0
  });


  document.getElementById("newComment").value = '';
  loadComments(postUrl);
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
  const isNested = commentId.includes("_");
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

    const isYou = confirm(`"${name}" already ${data.type === "like" ? "liked" : "disliked"} this comment. Do you want to ${data.type === "dislike" ? "liked" : "disliked"}?\nClick "OK" for Yes, "Cancel" for No.`);
    if (isYou) {
      if (data.type === actionType) {
        // Toggle off
        await existingDoc.ref.delete();
        countChange = -1;
      } else {
        // Switch like <-> dislike
        await existingDoc.ref.update({ type: actionType, timestamp: new Date() });
        countChange = 1;
        // Decrease count of opposite action
        await updateCommentField(commentId, oppositeAction + "s", -1, isNested);
      }
    } else {
      const newName = prompt("Enter a different name (e.g., append a number):", name + "1");
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
    <button onclick="submitReply('${parentId}', this)">Post Reply</button>
  `;

  parentComment.appendChild(replyBox);
}

async function submitReply(parentId, button) {
  const container = button.closest('.reply-input');
  const textarea = container.querySelector('textarea');
  const text = textarea.value.trim();
  const name = prompt("Enter your name:");

  if (!text || !name) return;

  await window.db.collection("nestedComments").add({
    postUrl: currentPostUrl,
    name,
    text,
    timestamp: new Date(),
    likes: 0,
    dislikes: 0,
    parentId
  });

  loadComments(currentPostUrl);
}

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: "smooth" });
}

let currentPostUrl = "";

// Main code 
document.addEventListener("DOMContentLoaded", async () => {
  // Map container class to relevant posts
  const containerMap = {
    "general-card-container": [
      { url: "blog/general_post-1.html", date: null },   //date: "10.12.2021" for manual date
      { url: "blog/general_post-2.html", date: null },
      { url: "blog/general_post-3.html", date: null },   //date: null for today's date
      { url: "blog/general_post-4.html", date: null },
      { url: "blog/general_post-5.html", date: null },
      { url: "blog/general_post-6.html", date: null },
	  { url: "blog/general_post-7.html", date: null },
	  { url: "blog/general_post-8.html", date: null },
	  { url: "blog/general_post-9.html", date: null }
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


  // Auto-open post if ?post=... is in URL
  const params = new URLSearchParams(window.location.search);
  const postToOpen = params.get("post");
  const commentToHighlight = params.get("comment");
  
  if (postToOpen) {
    const rawDate = new Date().toISOString().split('T')[0];
    await openPostCard(postToOpen, rawDate);
    
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