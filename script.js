// بيانات البوت الخاص بك (تليجرام)
const BOT_TOKEN = "ضع_توكن_البوت_هنا";
const CHAT_ID = "ضع_ID_حسابك_هنا";

function submitOrder() {
    const email = document.getElementById('userEmail').value;
    const note = document.getElementById('userNote').value;
    const currency = document.getElementById('currency').value;
    const extras = Array.from(document.querySelectorAll('.extra:checked')).map(e => e.value).join(', ');

    if(!email) return alert("من فضلك اكتب الجيميل!");

    const fullMessage = `
📩 طلب جديد من: ${email}
💰 العملة: ${currency}
➕ الإضافات: ${extras}
📝 ملاحظة: ${note}
✅ الحالة: تم الدفع (بإنتظار تأكيد يوسف)
    `;

    // إرسال للتليجرام
    fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage?chat_id=${CHAT_ID}&text=${encodeURIComponent(fullMessage)}`);

    // حفظ الطلب في المتصفح ليظهر في صفحة المدير
    let orders = JSON.parse(localStorage.getItem('myOrders')) || [];
    orders.push({ email, note, extras, currency, status: 'انتظار' });
    localStorage.setItem('myOrders', JSON.stringify(orders));

    alert("تم الإرسال! سيتم مراجعة الدفع فوراً.");
}

// عرض الطلبات في صفحة المدير
if(document.getElementById('adminOrders')) {
    const display = document.getElementById('adminOrders');
    const orders = JSON.parse(localStorage.getItem('myOrders')) || [];
    
    display.innerHTML = orders.map((o, i) => `
        <div class="order-card">
            <h3>جيميل الزبون: ${o.email}</h3>
            <p>الإضافات: ${o.extras} | العملة: ${o.currency}</p>
            <p>الملحوظة: ${o.note}</p>
            <button class="btn-send" style="background:green; width:auto" onclick="action(${i}, 'تأكيد')">تأكيد الاستلام</button>
            <button class="btn-send" style="background:red; width:auto" onclick="action(${i}, 'رفض')">لم يصل شيء - تأكد</button>
        </div>
    `).join('');
}

function action(index, type) {
    alert(type === 'تأكيد' ? "تم التأكيد! الموقع سيظهر للزبون." : "تم إبلاغ الزبون بعدم وصول الفلوس.");
}
