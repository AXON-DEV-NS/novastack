import { initializeApp } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-auth.js";
import { getFirestore, doc, onSnapshot, updateDoc, setDoc } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyBTgqG_FogbYSj6f9RyJ5-9VtnCpQmYjMM",
    authDomain: "novastack-599e7.firebaseapp.com",
    projectId: "novastack-599e7",
    storageBucket: "novastack-599e7.firebasestorage.app",
    messagingSenderId: "182571951309",
    appId: "1:182571951309:web:a092d84a87f094bb3f3584"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();

const countries = [
    { id: "eg", name: "Egypt 🇪🇬", rate: 50, cur: "ج.م", lang: "ar" },
    { id: "sa", name: "Saudi 🇸🇦", rate: 3.75, cur: "ر.س", lang: "ar" },
    { id: "us", name: "USA 🇺🇸", rate: 1, cur: "USD", lang: "en" },
    { id: "ae", name: "UAE 🇦🇪", rate: 3.67, cur: "د.إ", lang: "ar" },
    { id: "kw", name: "Kuwait 🇰🇼", rate: 0.31, cur: "د.ك", lang: "ar" }
    // يمكنك إضافة الـ 20 دولة هنا بنفس النمط
];

const langSelect = document.getElementById('lang-select');
countries.forEach(c => {
    let opt = document.createElement('option');
    opt.value = c.id; opt.innerText = c.name;
    langSelect.appendChild(opt);
});

function updateUI() {
    const c = countries.find(x => x.id === langSelect.value);
    const isAr = c.lang === "ar";
    document.body.dir = isAr ? "rtl" : "ltr";
    document.getElementById('calc-h').innerText = isAr ? "🛠️ حاسبة المشاريع" : "🛠️ Project Calc";
    document.getElementById('currency-name').innerText = c.cur;
    
    document.querySelectorAll('#site-type option').forEach(opt => {
        opt.innerText = (isAr ? opt.dataset.ar : opt.dataset.en) + ` ($${opt.value})`;
    });

    let usd = parseInt(document.getElementById('site-type').value);
    document.querySelectorAll('.addon:checked').forEach(a => usd += parseInt(a.value));
    document.getElementById('total-price').innerText = usd;
    document.getElementById('total-local').innerText = (usd * c.rate).toLocaleString();
}

onAuthStateChanged(auth, user => {
    if(user) {
        document.getElementById('login-container').style.display = 'none';
        const isAdmin = user.email === "youssef257210@gmail.com";
        
        onSnapshot(doc(db, "settings", "global"), snap => {
            const isOnline = snap.exists() ? snap.data().isOnline : true;
            document.getElementById('maintenance-overlay').style.display = (!isOnline && !isAdmin) ? 'flex' : 'none';
            if(isAdmin) document.getElementById('toggle-site-btn').innerText = isOnline ? "الموقع يعمل ✅" : "الموقع مغلق 🚨";
        });

        if(isAdmin) {
            document.getElementById('admin-panel').style.display = 'block';
        } else {
            document.getElementById('main-content').style.display = 'block';
            onSnapshot(doc(db, "orders", user.email.replace(/\./g, "_")), snap => {
                if(snap.exists()){
                    const d = snap.data();
                    document.getElementById('payment-ui').style.display = (d.status === "paid" && !d.screenshot) ? "block" : "none";
                    document.getElementById('royal-link-box').style.display = (d.status === "confirmed") ? "block" : "none";
                    if(d.status === "confirmed") document.getElementById('final-link-input').value = d.siteLink;
                }
            });
        }
    }
});

document.getElementById('order-tg-btn').onclick = () => {
    const type = document.getElementById('site-type').selectedOptions[0].dataset.ar;
    const price = document.getElementById('total-price').innerText;
    const msg = `🚀 طلب جديد\n📧 الإيميل: ${auth.currentUser.email}\n📂 النوع: ${type}\n💰 السعر: ${price}$`;
    window.open(`https://t.me/NOVASTACK_NS?text=${encodeURIComponent(msg)}`, "_blank");
};

document.getElementById('client-confirm-pay').onclick = async () => {
    const file = document.getElementById('pay-screenshot').files[0];
    if(!file) return alert("ارفع الصورة!");
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async (e) => {
        await updateDoc(doc(db, "orders", auth.currentUser.email.replace(/\./g, "_")), { screenshot: e.target.result });
        window.open(`https://t.me/NOVASTACK_NS?text=${encodeURIComponent("✅ تم الدفع من: " + auth.currentUser.email)}`, "_blank");
    };
};

document.getElementById('toggle-site-btn').onclick = async () => {
    const isOnline = document.getElementById('toggle-site-btn').innerText.includes("مغلق");
    await setDoc(doc(db, "settings", "global"), { isOnline: isOnline }, { merge: true });
};

document.getElementById('adm-send-btn').onclick = async () => {
    const email = document.getElementById('adm-email').value;
    await setDoc(doc(db, "orders", email.replace(/\./g, "_")), { 
        clientEmail: email, status: document.getElementById('adm-status').value, siteLink: document.getElementById('adm-link').value 
    }, { merge: true });
    alert("تم التحديث ✅");
};

langSelect.onchange = updateUI;
document.getElementById('site-type').onchange = updateUI;
document.querySelectorAll('.addon').forEach(a => a.onchange = updateUI);
document.getElementById('googleSignIn').onclick = () => signInWithPopup(auth, provider);
document.getElementById('logoutBtn').onclick = () => signOut(auth).then(()=>location.reload());
updateUI();
