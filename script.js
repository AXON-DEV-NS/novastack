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
    { id: "sa", name: "Saudi Arabia 🇸🇦", rate: 3.75, cur: "ر.س", lang: "ar" },
    { id: "ae", name: "UAE 🇦🇪", rate: 3.67, cur: "د.إ", lang: "ar" },
    { id: "kw", name: "Kuwait 🇰🇼", rate: 0.31, cur: "د.ك", lang: "ar" },
    { id: "qa", name: "Qatar 🇶🇦", rate: 3.64, cur: "ر.ق", lang: "ar" },
    { id: "om", name: "Oman 🇴🇲", rate: 0.38, cur: "ر.ع", lang: "ar" },
    { id: "bh", name: "Bahrain 🇧🇭", rate: 0.37, cur: "د.ب", lang: "ar" },
    { id: "jo", name: "Jordan 🇯🇴", rate: 0.71, cur: "د.أ", lang: "ar" },
    { id: "iq", name: "Iraq 🇮🇶", rate: 1310, cur: "د.ع", lang: "ar" },
    { id: "lb", name: "Lebanon 🇱🇧", rate: 89000, cur: "ل.ل", lang: "ar" },
    { id: "ly", name: "Libya 🇱🇾", rate: 4.80, cur: "د.ل", lang: "ar" },
    { id: "ma", name: "Morocco 🇲🇦", rate: 10, cur: "د.م", lang: "ar" },
    { id: "dz", name: "Algeria 🇩🇿", rate: 134, cur: "د.ج", lang: "ar" },
    { id: "us", name: "USA 🇺🇸", rate: 1, cur: "USD", lang: "en" },
    { id: "uk", name: "UK 🇬🇧", rate: 0.79, cur: "GBP", lang: "en" },
    { id: "eu", name: "Europe 🇪🇺", rate: 0.92, cur: "EUR", lang: "en" },
    { id: "jp", name: "Japan 🇯🇵", rate: 150, cur: "JPY", lang: "en" },
    { id: "ca", name: "Canada 🇨🇦", rate: 1.35, cur: "CAD", lang: "en" },
    { id: "au", name: "Australia 🇦🇺", rate: 1.52, cur: "AUD", lang: "en" },
    { id: "tr", name: "Turkey 🇹🇷", rate: 31, cur: "TRY", lang: "en" }
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
    document.querySelectorAll('.addon-txt').forEach(span => {
        const parent = span.parentElement.querySelector('input');
        span.innerText = isAr ? parent.dataset.ar : parent.dataset.en;
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
            if(isAdmin) document.getElementById('toggle-site-btn').innerText = isOnline ? "الموقع مفتوح ✅" : "الموقع مغلق 🚨";
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

// إرسال الطلب (تجميع الإضافات)
document.getElementById('order-tg-btn').onclick = () => {
    const isAr = countries.find(x => x.id === langSelect.value).lang === "ar";
    const type = document.getElementById('site-type').selectedOptions[0].dataset[isAr ? 'ar' : 'en'];
    let adds = "";
    document.querySelectorAll('.addon:checked').forEach(a => adds += `• ${a.dataset[isAr ? 'ar' : 'en']}\n`);
    const price = document.getElementById('total-price').innerText;
    const msg = isAr ? `🚀 طلب جديد\n📧 إيميل: ${auth.currentUser.email}\n📂 النوع: ${type}\n🛠 الإضافات:\n${adds || "لا يوجد"}\n💰 السعر: ${price}$` : 
                       `🚀 New Order\n📧 Email: ${auth.currentUser.email}\n📂 Type: ${type}\n🛠 Addons:\n${adds || "None"}\n💰 Price: ${price}$`;
    window.open(`https://t.me/NOVASTACK_NS?text=${encodeURIComponent(msg)}`, "_blank");
};

// تأكيد الدفع مع الرسالة التلقائية
document.getElementById('client-confirm-pay').onclick = async () => {
    const file = document.getElementById('pay-screenshot').files[0];
    if(!file) return alert("ارفع الصورة أولاً!");
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async (e) => {
        await updateDoc(doc(db, "orders", auth.currentUser.email.replace(/\./g, "_")), { screenshot: e.target.result });
        const msg = `✅ تم الدفع وإرفاق صورة الشاشة\n📧 العميل: ${auth.currentUser.email}\nيرجى المراجعة يا AXON.`;
        window.open(`https://t.me/NOVASTACK_NS?text=${encodeURIComponent(msg)}`, "_blank");
    };
};

document.getElementById('toggle-site-btn').onclick = async () => {
    const isOnline = document.getElementById('toggle-site-btn').innerText.includes("مغلق");
    await setDoc(doc(db, "settings", "global"), { isOnline: isOnline }, { merge: true });
};

document.getElementById('adm-send-btn').onclick = async () => {
    const email = document.getElementById('adm-email').value;
    await setDoc(doc(db, "orders", email.replace(/\./g, "_")), { clientEmail: email, status: document.getElementById('adm-status').value, siteLink: document.getElementById('adm-link').value }, { merge: true });
    alert("تم التحديث ✅");
};

langSelect.onchange = updateUI;
document.getElementById('site-type').onchange = updateUI;
document.querySelectorAll('.addon').forEach(a => a.onchange = updateUI);
document.getElementById('googleSignIn').onclick = () => signInWithPopup(auth, provider);
document.getElementById('logoutBtn').onclick = () => signOut(auth).then(()=>location.reload());
document.getElementById('admin-logout').onclick = () => signOut(auth).then(()=>location.reload());
updateUI();
