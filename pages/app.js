import { initializeApp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";
import {
  getFirestore, collection, addDoc, query, where, getDocs, orderBy
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";
import {
  getAuth, onAuthStateChanged, signInWithCustomToken
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";
import {
  getStorage, ref, uploadBytes, getDownloadURL
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-storage.js";

// === ✅ YOUR Firebase Config ===
const firebaseConfig = {
  apiKey: "AIzaSyBXpKSAN_M9ilv7eLaHVseTTOF3dA9WETE",
  authDomain: "grade10-8e31f.firebaseapp.com",
  projectId: "grade10-8e31f",
  storageBucket: "grade10-8e31f.appspot.com",
  messagingSenderId: "131660391159",
  appId: "1:131660391159:web:f9820d244b027e5a2029f2"
};

// === ✅ Initialize Firebase ===
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);

// === ✅ Auth State ===
onAuthStateChanged(auth, user => {
  if (user) {
    console.log("✅ Signed in:", user.displayName || user.uid);
  } else {
    console.log("❌ Not signed in");
    // Try Discord login if code exists
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    if (code) {
      // Call your Vercel function
      fetch(`/api/discord-login?code=${code}`)
        .then(res => res.json())
        .then(async data => {
          if (data.customToken) {
            await signInWithCustomToken(auth, data.customToken);
            console.log("✅ Discord linked!");
            window.history.replaceState({}, document.title, "/");
          } else {
            console.error(data);
          }
        });
    }
  }
});

// === ✅ Player Reports ===
const reportForm = document.getElementById("reportForm");
if (reportForm) {
  reportForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const text = document.getElementById("reportText").value;
    const user = auth.currentUser;

    if (!user) {
      alert("Please sign in with Discord first.");
      return;
    }

    await addDoc(collection(db, "playerReports"), {
      discordId: user.uid,
      username: user.displayName || "Anonymous",
      reportText: text,
      status: "unsolved",
      timestamp: Date.now()
    });

    document.getElementById("reportStatus").innerText = "✅ Report submitted!";
    reportForm.reset();
  });
}

// === ✅ Load Solved & Unsolved Reports ===
async function loadReports(status) {
  const q = query(collection(db, "playerReports"), where("status", "==", status));
  const snapshot = await getDocs(q);

  let container = document.getElementById(`${status}Reports`);
  if (!container) return;

  snapshot.forEach((doc) => {
    const data = doc.data();
    const div = document.createElement("div");
    div.innerHTML = `<p><strong>${data.username}</strong>: ${data.reportText}</p>`;
    container.appendChild(div);
  });
}

if (document.getElementById("solvedReports")) loadReports("solved");
if (document.getElementById("unsolvedReports")) loadReports("unsolved");

// === ✅ Player Blog ===
const blogForm = document.getElementById("blogForm");
if (blogForm) {
  blogForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const content = document.getElementById("blogPost").value;
    const user = auth.currentUser;
    if (!user) { alert("Login first"); return; }
    await addDoc(collection(db, "playerBlogs"), {
      discordId: user.uid,
      username: user.displayName || "Anonymous",
      content: content,
      timestamp: Date.now()
    });
    blogForm.reset();
  });
}

async function loadBlogPosts() {
  const q = query(collection(db, "playerBlogs"), orderBy("timestamp", "desc"));
  const snapshot = await getDocs(q);
  const container = document.getElementById("blogPosts");
  if (!container) return;

  snapshot.forEach(doc => {
    const data = doc.data();
    const div = document.createElement("div");
    div.innerHTML = `<p><strong>${data.username}</strong>: ${data.content}</p>`;
    container.appendChild(div);
  });
}
if (document.getElementById("blogPosts")) loadBlogPosts();

// === ✅ Gallery Upload ===
const uploadBtn = document.getElementById("uploadBtn");
if (uploadBtn) {
  uploadBtn.addEventListener("click", async () => {
    const file = document.getElementById("galleryUpload").files[0];
    const storageRef = ref(storage, `gallery/${file.name}`);
    await uploadBytes(storageRef, file);
    const url = await getDownloadURL(storageRef);
    await addDoc(collection(db, "galleryImages"), {
      imageUrl: url,
      timestamp: Date.now()
    });
    alert("✅ Uploaded!");
  });
}

// === ✅ Load Gallery ===
async function loadGallery() {
  const snapshot = await getDocs(query(collection(db, "galleryImages"), orderBy("timestamp", "desc")));
  const container = document.getElementById("galleryGrid");
  if (!container) return;

  snapshot.forEach(doc => {
    const data = doc.data();
    const img = document.createElement("img");
    img.src = data.imageUrl;
    img.style.width = "300px";
    img.style.margin = "1em";
    container.appendChild(img);
  });
}
if (document.getElementById("galleryGrid")) loadGallery();
