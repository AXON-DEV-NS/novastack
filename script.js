// نظام الـ 20 لغة وعملة لـ Nevo Stick
const data = {
    langs: ["العربية", "English", "日本語", "Français", "Deutsch", "Español", "Italiano", "Русский", "中文", "한국어", "Türkçe", "हिन्दी", "Português", "Tiếng Việt", "Polski", "Nederlands", "Svenska", "Dansk", "Norsk", "Suomi"],
    currs: ["EGP", "USD", "SAR", "AED", "KWD", "QAR", "BHD", "OMR", "JPY", "EUR", "GBP", "CAD", "AUD", "CNY", "TRY", "INR", "RUB", "CHF", "ZAR", "BRL"]
};

window.onload = function() {
    const lSel = document.getElementById('langSelect');
    const cSel = document.getElementById('currSelect');
    if(lSel) data.langs.forEach(l => lSel.add(new Option(l, l)));
    if(cSel) data.currs.forEach(c => cSel.add(new Option(c, c)));
};

function sendOrder() {
    const email = document.getElementById('userEmail').value;
    const note = document.getElementById('userNote').value;
    const extras = Array.from(document.querySelectorAll('.extra:checked')).map(e => e.value).join(' + ');

    if(!email) return alert("أدخل الجيميل أولاً!");

    const msg = `🔔 طلب جديد: ${email}\n📝 ملحوظة: ${note}\n➕ إضافات: ${extras}\n💰 الحالة: تم الدفع`;
    
    // استبدل الـ Token والـ ID ببياناتك من تليجرام
    fetch(`https://api.telegram.org/botYOUR_TOKEN/sendMessage?chat_id=YOUR_ID&text=${encodeURIComponent(msg)}`);
    
    let orders = JSON.parse(localStorage.getItem('axon_orders')) || [];
    orders.push({ email, note, extras });
    localStorage.setItem('axon_orders', JSON.stringify(orders));
    alert("تم الإرسال بنجاح!");
}
