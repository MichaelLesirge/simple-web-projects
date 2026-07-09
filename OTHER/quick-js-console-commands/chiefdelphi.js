const stream = document.querySelector(".post-stream");
const seenPosts = new Set();
const posts = [];
let isScrolling = true;

function collectPosts() {
  stream.querySelectorAll(".topic-post").forEach((post) => {
    const name = post.querySelector(".names")?.innerText;
    const content = post.querySelector(".cooked")?.innerText;
    
    if (!name || !content) return;
    
    const postId = name + '::' + content.substring(0, 100);
    
    if (!seenPosts.has(postId)) {
      posts.push([name, content].join("\n"));
      seenPosts.add(postId);
    }
  });
}

function autoScroll() {
  if (!isScrolling) return;
  
  window.scrollBy(0, 500);
  collectPosts();
  
  setTimeout(autoScroll, 300);
}

async function run() {
  console.log("Starting collection... scrolling for 10 seconds");
  
  autoScroll();
  
  await new Promise(resolve => setTimeout(resolve, 10000));
  
  isScrolling = false;
  
  const keepGoing = confirm(`Collected ${posts.length} posts so far. Continue scrolling?`);
  
  if (keepGoing) {
    isScrolling = true;
    await run();
  } else {
    console.log("\n" + "=".repeat(60));
    console.log("COLLECTION COMPLETE");
    console.log("=".repeat(60));
    console.log(`\nTotal posts collected: ${posts.length}\n`);
    console.log("=".repeat(60) + "\n");
    console.log(posts.join("\n---\n\n"));
    console.log("\n" + "=".repeat(60));
  }
}

run();  