import { initializeApp } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-auth.js";
import { getFirestore, doc, onSnapshot, updateDoc, setDoc, collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-firestore.js";

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

const langLib = {
    "ar-eg": { rate: 50, cur: "ج.م", calc: "🛠️ حاسبة المشاريع", pay: "💰 تأكيد الدفع", wait: "🚀 جاري المراجعة...", s1: "طلبك", s2: "تنفيذ", s3: "دفع", s4: "تسليم", addl: "لغات متعددة", adda: "لوحة مدير", adds: "SEO", addp: "سرعة" },
    "en-us": { rate: 1, cur: "USD", calc: "🛠️ Project Calc", pay: "💰 Payment", wait: "🚀 Reviewing...", s1: "Order", s2: "Work", s3: "Pay", s4: "Done", addl: "Languages", adda: "Admin Panel", adds: "SEO", addp: "Speed" },
    "ar-sa": { rate: 3.75, cur: "ر.س", calc: "🛠️ حاسبة المشاريع", pay: "💰 تأكيد الدفع", wait: "🚀 جاري المراجعة...", s1: "طلبك", s2: "تنفيذ", s3: "دفع", s4: "تسليم", addl: "لغات متعددة", adda: "لوحة مدير", adds: "SEO", addp: "سرعة" }
};

function updateUI() {
    const langKey = document.getElementById('lang-select').value;
    const l = langLib[langKey] || langLib["en-us"];
    
    document.getElementById('calc-h').innerText = l.calc;
    document.getElementById('txt-pay-title').innerText = l.pay;
    document.getElementById('txt-wait').innerText = l.wait;
    document.getElementById('currency-name').innerText = l.cur;
    document.getElementById('txt-step1').innerText = l.s1;
    document.getElementById('txt-step2').innerText = l.s2;
    document.getElementById('txt-step3').innerText = l.s3;
    document.getElementById('txt-step4').innerText = l.s4;
    document.getElementById('add-l').innerText = l.addl;
    document.getElementById('add-a').innerText = l.adda;
    document.getElementById('add-s').innerText = l.adds;
    document.getElementById('add-p').innerText = l.addp;

    let usd = parseInt(document.getElementById('site-type').value);
    document.querySelectorAll('.addon').forEach(addon => { if(addon.checked) usd += parseInt(addon.value); });
    
    document.getElementById('total-price').innerText = usd;
    document.getElementById('total-local').innerText = (usd * l.rate).toLocaleString();
}

async function compressImg(file) {
    return new Promise((res) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (e) => {
            const img = new Image();
            img.src = e.target.result;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const scale = 600 / img.width;
                canvas.width = 600; canvas.height = img.height * scale;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                res(canvas.toDataURL('image/jpeg', 0.4));
            };
        };
    });
}

// مراقبة الدخول وحالة الموقع
onAuthStateChanged(auth, user => {
    if(user) {
        document.getElementById('login-container').style.display = 'none';
        const isAdmin = user.email === "youssef257210@gmail.com";
        onSnapshot(doc(db, "settings", "global"), (snap) => {
            if (snap.exists()) {
                const isOnline = snap.data().isOnline;
                document.getElementById('maintenance-overlay').style.display = (!isOnline && !isAdmin) ? 'flex' : 'none';
                if (isAdmin) {
                    const btn = document.getElementById('toggle-site-btn');
                    btn.innerText = isOnline ? "الموقع: يعمل ✅" : "الموقع: متوقف 🚨";
                    btn.style.background = isOnline ? "#28a745" : "#ff4b2b";
                }
            }
        });
        if(isAdmin) {
            document.getElementById('admin-panel').style.display = 'block';
            onSnapshot(query(collection(db, "orders"), where("screenshot", "!=", "")), snap => {
                const list = document.getElementById('received-images-list');
                list.innerHTML = "";
                snap.forEach(d => {
                    const data = d.data();
                    list.innerHTML += `<div style="background:#111; padding:8px; margin-top:5px; border-radius:10px; border-right:3px solid gold;">
                        <span style="font-size:11px; color:gold;">${data.clientEmail}</span><br>
                        <button style="padding:4px;" onclick="window.open('${data.screenshot}')">عرض 🖼</button>
                    </div>`;
                });
            });
        } else {
            document.getElementById('main-content').style.display = 'block';
            onSnapshot(doc(db, "orders", user.email.replace(/\./g, "_")), snap => {
                if(snap.exists()) {
                    const d = snap.data();
                    const sMap = {"pending":2, "paid":3, "confirmed":4};
                    for(let i=1; i<=4; i++) document.getElementById(`step-${i}`).classList.toggle('active', i <= (sMap[d.status] || 1));
                    document.getElementById('user-interaction-zone').style.display = 'block';
                    document.getElementById('payment-ui').style.display = (d.status === "paid" && !d.screenshot) ? "block" : "none";
                    document.getElementById('wait-msg-ui').style.display = (d.status === "paid" && d.screenshot) ? "block" : "none";
                    document.getElementById('royal-link-box').style.display = (d.status === "confirmed") ? "block" : "none";
                    if(d.status === "confirmed") document.getElementById('final-link-input').value = d.siteLink;
                }
            });
        }
    }
});

// إرسال سكرين الدفع
document.getElementById('client-confirm-pay').onclick = async () => {
    const file = document.getElementById('pay-screenshot').files[0];
    if(!file) return alert("ارفع الصورة!");
    const compressed = await compressImg(file);
    const time = new Date().toLocaleString('ar-EG');
    await updateDoc(doc(db, "orders", auth.currentUser.email.replace(/\./g, "_")), { screenshot: compressed, payTime: time });
    const msg = `✅ تم الدفع\n📧 ${auth.currentUser.email}\n🕒 ${time}\nيرجى المراجعة يا AXON.`;
    window.open(`https://t.me/NOVASTACK_NS?text=${encodeURIComponent(msg)}`, "_blank");
};

// طلب المشروع تليجرام (الإصلاح الجديد هنا)
document.getElementById('order-tg-btn').onclick = () => {
    const email = auth.currentUser.email;
    const type = document.getElementById('site-type').options[document.getElementById('site-type').selectedIndex].text;
    const price = document.getElementById('total-price').innerText;
    
    let addons = "";
    document.querySelectorAll('.addon:checked').forEach(a => {
        addons += `- ${a.nextElementSibling.innerText}\n`;
    });

    const msg = `📧 طلب جديد من: ${email}\n📌 النوع: ${type}\n🛠 الإضافات:\n${addons || "لا يوجد"}\n💰 السعر النهائي: ${price}$`;
    window.open(`https://t.me/NOVASTACK_NS?text=${encodeURIComponent(msg)}`, "_blank");
};

// وظائف المدير
document.getElementById('adm-send-btn').onclick = async () => {
    const email = document.getElementById('adm-email').value;
    await setDoc(doc(db, "orders", email.replace(/\./g, "_")), { clientEmail: email, status: document.getElementById('adm-status').value, siteLink: document.getElementById('adm-link').value, screenshot: "" }, { merge: true });
    alert("تم التحديث ✅");
};

document.getElementById('toggle-site-btn').onclick = async () => {
    const isOnline = document.getElementById('toggle-site-btn').innerText.includes("متوقف");
    await setDoc(doc(db, "settings", "global"), { isOnline: isOnline }, { merge: true });
};

document.getElementById('clear-all-images').onclick = async () => {
    if(!confirm("تفريغ الأرشيف؟")) return;
    const q = query(collection(db, "orders"), where("screenshot", "!=", ""));
    const snap = await getDocs(q);
    snap.forEach(d => updateDoc(doc(db, "orders", d.id), { screenshot: "" }));
    alert("تم التنظيف 🧹");
};

document.getElementById('lang-select').onchange = updateUI;
document.querySelectorAll('.addon, #site-type').forEach(el => el.onchange = updateUI);
document.getElementById('googleSignIn').onclick = () => signInWithPopup(auth, provider);
document.getElementById('logoutBtn').onclick = () => signOut(auth).then(()=>location.reload());
document.getElementById('admin-logout').onclick = () => signOut(auth).then(()=>location.reload());
document.getElementById('copy-btn').onclick = () => { navigator.clipboard.writeText(document.getElementById('final-link-input').value); alert("تم النسخ 👑"); };
updateUI();
