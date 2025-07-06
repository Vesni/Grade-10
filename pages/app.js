// ✅ Import Firebase modules from CDN
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";
import { getFirestore, collection, addDoc } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";
import { getAuth, signInWithCustomToken } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";

// ✅ Your Firebase config (replace if needed!)
const firebaseConfig = {
  apiKey: "AIzaSyBXpKSAN_M9ilv7eLaHVseTTOF3dA9WETE",
  authDomain: "grade10-8e31f.firebaseapp.com",
  projectId: "grade10-8e31f",
  storageBucket: "grade10-8e31f.appspot.com",
  messagingSenderId: "131660391159",
  appId: "1:131660391159:web:f9820d244b027e5a2029f2"
};

// ✅ Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

console.log("✅ Firebase initialized");

// =============================
// Example: Firestore write
// =============================

const exampleBtn = document.getElementById("exampleBtn");

if (exampleBtn) {
  exampleBtn.addEventListener("click", async () => {
    try {
      const docRef = await addDoc(collection(db, "testCollection"), {
        name: "Grade10SMP",
        timestamp: Date.now()
      });
      console.log("✅ Document written with ID: ", docRef.id);
      alert("Document added: " + docRef.id);
    } catch (e) {
      console.error("❌ Error adding document: ", e);
    }
  });
}

// =============================
// Example: Handle Discord login
// =============================

async function handleDiscordLogin() {
  // 1. Get the code from URL
  const urlParams = new URLSearchParams(window.location.search);
  const code = urlParams.get('code');

  if (code) {
    console.log("✅ Discord code found:", code);

    // 2. Call your Vercel serverless function to exchange code for custom Firebase token
    const response = await fetch(`/api/discord-login?code=${code}`);
    const data = await response.json();

    if (data.customToken) {
      console.log("✅ Got custom Firebase token:", data.customToken);

      // 3. Sign in with Firebase
      signInWithCustomToken(auth, data.customToken)
        .then(() => {
          console.log("✅ Signed in with Firebase using Discord login!");
        })
        .catch((error) => {
          console.error("❌ Error signing in:", error);
        });
    } else {
      console.error("❌ No custom token received:", data);
    }
  }
}

// Call this when page loads
handleDiscordLogin();

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
      username: user.displayName,
      reportText: text,
      status: "unsolved",
      timestamp: Date.now()
    });

    document.getElementById("reportStatus").innerText = "✅ Report submitted!";
    reportForm.reset();
  });
}
async function loadReports(status) {
  const q = query(collection(db, "playerReports"), where("status", "==", status));
  const querySnapshot = await getDocs(q);

  let container = document.getElementById(`${status}Reports`);
  querySnapshot.forEach((doc) => {
    const data = doc.data();
    const div = document.createElement("div");
    div.innerHTML = `<p><strong>${data.username}</strong>: ${data.reportText}</p>`;
    container.appendChild(div);
  });
}

if (document.getElementById("solvedReports")) loadReports("solved");
if (document.getElementById("unsolvedReports")) loadReports("unsolved");
