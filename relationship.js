import { auth, db } from './firebase-config.js';
import {
    doc, setDoc, getDoc, updateDoc, onSnapshot
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

// ==================== توليد كود عشوائي ====================
function generateCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = 'ARAMI-';
    for (let i = 0; i < 4; i++) {
        code += chars[Math.floor(Math.random() * chars.length)];
    }
    return code;
}

// ==================== شاشة العلاقة ====================
const relationshipHTML = `
<div id="relationship-overlay" style="
    position: fixed; top: 0; left: 0;
    width: 100%; height: 100%;
    background: linear-gradient(135deg, #000 0%, #1a0508 50%, #2d0a1e 100%);
    z-index: 19000;
    display: none;
    justify-content: center; align-items: center;
    font-family: 'Cairo', sans-serif;
    padding: 20px; box-sizing: border-box;
    overflow-y: auto;
">
    <div style="
        background: rgba(255,255,255,0.08);
        backdrop-filter: blur(30px);
        border-radius: 30px;
        padding: 40px 35px;
        border: 2px solid rgba(255,255,255,0.15);
        box-shadow: 0 20px 60px rgba(0,0,0,0.5);
        text-align: center;
        width: 100%; max-width: 420px;
        margin: auto;
    ">
        <div style="font-size: 3.5rem; margin-bottom: 12px;">💑</div>
        <h2 style="
            font-size: 1.7rem; margin-bottom: 8px;
            background: linear-gradient(135deg, #ffd700, #ff69b4);
            -webkit-background-clip: text; -webkit-text-fill-color: transparent;
            font-family: 'Amiri';
        ">ابدأ علاقتك</h2>
        <p style="color: #ffcccc; margin-bottom: 25px; font-size: 0.85rem;">
            أنشئ علاقة جديدة أو انضم لعلاقة موجودة
        </p>

        <button onclick="createRelationship()" style="
            width: 100%; padding: 15px; border-radius: 15px; border: none;
            background: linear-gradient(135deg, #730d1e, #ff69b4);
            color: white; font-family: 'Cairo'; font-size: 1rem;
            font-weight: 700; cursor: pointer; margin-bottom: 15px;
            box-shadow: 0 8px 25px rgba(255,105,180,0.4);
        ">💝 إنشاء علاقة جديدة</button>

        <div style="color: rgba(255,255,255,0.3); margin: 12px 0; font-size: 0.85rem;">─── أو ───</div>

        <input id="invite-code-input" type="text"
            placeholder="أدخل كود الدعوة (مثال: ARAMI-7X3K)"
            style="
                width: 100%; padding: 13px; border-radius: 12px;
                background: rgba(255,255,255,0.1);
                border: 1px solid rgba(255,255,255,0.2);
                color: white; font-family: 'Cairo'; font-size: 0.9rem;
                box-sizing: border-box; margin-bottom: 10px;
                text-align: center; letter-spacing: 2px;
            "
        >
        <button onclick="joinRelationship()" style="
            width: 100%; padding: 15px; border-radius: 15px; border: none;
            background: linear-gradient(135deg, #9b59b6, #3498db);
            color: white; font-family: 'Cairo'; font-size: 1rem;
            font-weight: 700; cursor: pointer;
            box-shadow: 0 8px 25px rgba(155,89,182,0.4);
        ">🔗 الانضمام للعلاقة</button>

        <p id="rel-error" style="color: #ff6b6b; margin-top: 12px; min-height: 20px; font-size: 0.85rem;"></p>
        <p id="rel-loading" style="color: #ffd700; margin-top: 8px; display: none; font-size: 0.9rem;">جاري المعالجة... ⏳</p>
    </div>
</div>

<!-- شاشة عرض الكود -->
<div id="code-display-overlay" style="
    position: fixed; top: 0; left: 0;
    width: 100%; height: 100%;
    background: linear-gradient(135deg, #000 0%, #1a0508 50%, #2d0a1e 100%);
    z-index: 19001;
    display: none;
    justify-content: center; align-items: center;
    font-family: 'Cairo', sans-serif;
    padding: 20px; box-sizing: border-box;
    overflow-y: auto;
">
    <div style="
        background: rgba(255,255,255,0.08);
        backdrop-filter: blur(30px);
        border-radius: 30px;
        padding: 40px 35px;
        border: 2px solid rgba(255,215,0,0.3);
        box-shadow: 0 20px 60px rgba(0,0,0,0.5);
        text-align: center;
        width: 100%; max-width: 420px;
        margin: auto;
    ">
        <div style="font-size: 3.5rem; margin-bottom: 12px;">🎉</div>
        <h2 style="
            font-size: 1.7rem; margin-bottom: 8px;
            background: linear-gradient(135deg, #ffd700, #ff69b4);
            -webkit-background-clip: text; -webkit-text-fill-color: transparent;
            font-family: 'Amiri';
        ">تم إنشاء العلاقة!</h2>
        <p style="color: #ffcccc; margin-bottom: 20px; font-size: 0.85rem;">
            أرسل هذا الكود للشخص الثاني
        </p>

        <div id="generated-code" onclick="copyCode()" style="
            background: linear-gradient(135deg, rgba(255,215,0,0.15), rgba(255,105,180,0.15));
            border: 2px solid rgba(255,215,0,0.5);
            border-radius: 20px; padding: 22px;
            font-size: 1.8rem; font-weight: 700;
            color: #ffd700; letter-spacing: 4px;
            margin-bottom: 12px; cursor: pointer;
        ">ARAMI-XXXX</div>

        <p style="color: rgba(255,255,255,0.4); font-size: 0.75rem; margin-bottom: 18px;">
            اضغط على الكود لنسخه 📋
        </p>

        <div id="waiting-status" style="
            background: rgba(255,255,255,0.05);
            border-radius: 15px; padding: 15px;
            margin-bottom: 18px;
        ">
            <div style="font-size: 1.3rem; margin-bottom: 6px;">⏳</div>
            <p style="color: #ffcccc; font-size: 0.85rem;">في انتظار انضمام الشخص الثاني...</p>
        </div>

        <button onclick="skipWaiting()" style="
            width: 100%; padding: 13px; border-radius: 15px; border: none;
            background: rgba(255,255,255,0.08);
            color: white; font-family: 'Cairo'; font-size: 0.9rem;
            cursor: pointer; border: 1px solid rgba(255,255,255,0.15);
        ">دخول الموقع الآن ← (سيتصل لاحقاً)</button>
    </div>
</div>
`;

// ==================== شاشة إعداد العلاقة ====================
const setupHTML = `
<div id="setup-overlay" style="
    position: fixed; top: 0; left: 0;
    width: 100%; height: 100%;
    background: linear-gradient(135deg, #000 0%, #1a0508 50%, #2d0a1e 100%);
    z-index: 19002;
    display: none;
    justify-content: center; align-items: center;
    font-family: 'Cairo', sans-serif;
    padding: 20px; box-sizing: border-box;
    overflow-y: auto;
">
    <div style="
        background: rgba(255,255,255,0.08);
        backdrop-filter: blur(30px);
        border-radius: 30px;
        padding: 40px 35px;
        border: 2px solid rgba(255,215,0,0.2);
        box-shadow: 0 20px 60px rgba(0,0,0,0.5);
        text-align: center;
        width: 100%; max-width: 420px;
        margin: auto;
    ">
        <div style="font-size: 3.5rem; margin-bottom: 12px;">💑</div>
        <h2 style="
            font-size: 1.7rem; margin-bottom: 8px;
            background: linear-gradient(135deg, #ffd700, #ff69b4);
            -webkit-background-clip: text; -webkit-text-fill-color: transparent;
            font-family: 'Amiri';
        ">أخبرنا عن علاقتكم</h2>
        <p style="color: #ffcccc; margin-bottom: 25px; font-size: 0.85rem;">
            هالمعلومات ستظهر في موقعكم الخاص 🌸
        </p>

        <input id="setup-partner-name" type="text" placeholder="اسم شريكتك / شريكك ❤️" style="
            width: 100%; padding: 13px; border-radius: 12px; margin-bottom: 12px;
            background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2);
            color: white; font-family: 'Cairo'; font-size: 0.95rem; box-sizing: border-box;
            text-align: center;
        ">

        <input id="setup-my-name" type="text" placeholder="اسمك أنت 🙂" style="
            width: 100%; padding: 13px; border-radius: 12px; margin-bottom: 12px;
            background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2);
            color: white; font-family: 'Cairo'; font-size: 0.95rem; box-sizing: border-box;
            text-align: center;
        ">

        <label style="color: rgba(255,255,255,0.6); font-size: 0.8rem; display: block; margin-bottom: 6px;">
            📅 تاريخ تعارفكم
        </label>
        <input id="setup-date" type="date" style="
            width: 100%; padding: 13px; border-radius: 12px; margin-bottom: 20px;
            background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2);
            color: white; font-family: 'Cairo'; font-size: 0.95rem; box-sizing: border-box;
        ">

        <button onclick="saveSetup()" style="
            width: 100%; padding: 15px; border-radius: 15px; border: none;
            background: linear-gradient(135deg, #730d1e, #ff69b4);
            color: white; font-family: 'Cairo'; font-size: 1rem;
            font-weight: 700; cursor: pointer;
            box-shadow: 0 8px 25px rgba(255,105,180,0.4);
        ">ابدأ رحلتكم معاً 💕</button>

        <p id="setup-error" style="color: #ff6b6b; margin-top: 12px; min-height: 20px; font-size: 0.85rem;"></p>
    </div>
</div>
`;

// ==================== إضافة الشاشات ====================
document.body.insertAdjacentHTML('beforeend', relationshipHTML);
document.body.insertAdjacentHTML('beforeend', setupHTML);

// ==================== تحقق من حالة المستخدم ====================
onAuthStateChanged(auth, async (user) => {
    if (!user) return;

    const userDoc = await getDoc(doc(db, 'users', user.uid));
    if (!userDoc.exists()) return;

    const userData = userDoc.data();

    if (!userData.relationshipId) {
        document.getElementById('relationship-overlay').style.display = 'flex';
    } else {
        document.getElementById('relationship-overlay').style.display = 'none';

        // شيك إذا إعداد العلاقة مكتمل
        const relDoc = await getDoc(doc(db, 'relationships', userData.relationshipId));
        if (relDoc.exists()) {
            const relData = relDoc.data();
            // إذا ما في إعداد بعد، أظهر شاشة الإعداد
            if (!relData.partnerName && !userData.setupDone) {
                document.getElementById('setup-overlay').style.display = 'flex';
            } else {
                // حدّث الموقع ببيانات العلاقة
                applyRelationshipData(relData, userData);
            }
        }
    }
});

// ==================== إنشاء علاقة ====================
window.createRelationship = async function() {
    const user = auth.currentUser;
    if (!user) return;

    const loadingEl = document.getElementById('rel-loading');
    const errorEl   = document.getElementById('rel-error');
    loadingEl.style.display = 'block';
    errorEl.textContent = '';

    try {
        const code = generateCode();

        await setDoc(doc(db, 'relationships', code), {
            code: code,
            partner1: user.uid,
            partner2: null,
            createdAt: new Date().toISOString(),
            startDate: null,
            status: 'waiting'
        });

        await updateDoc(doc(db, 'users', user.uid), {
            relationshipId: code
        });

        loadingEl.style.display = 'none';
        document.getElementById('relationship-overlay').style.display = 'none';
        document.getElementById('generated-code').textContent = code;
        document.getElementById('code-display-overlay').style.display = 'flex';

        // مراقبة انضمام الشخص الثاني
        const unsubscribe = onSnapshot(doc(db, 'relationships', code), (snap) => {
            if (snap.data()?.partner2) {
                document.getElementById('waiting-status').innerHTML = `
                    <div style="font-size: 1.3rem; margin-bottom: 6px;">🎉</div>
                    <p style="color: #2ecc71; font-size: 0.95rem; font-weight: bold;">
                        انضم الشخص الثاني! مرحباً بكم معاً ❤️
                    </p>
                `;
                setTimeout(() => {
                    document.getElementById('code-display-overlay').style.display = 'none';
                    unsubscribe();
                }, 2500);
            }
        });

    } catch (error) {
        loadingEl.style.display = 'none';
        errorEl.textContent = '❌ خطأ: ' + error.message;
    }
};

// ==================== الانضمام لعلاقة ====================
window.joinRelationship = async function() {
    const user = auth.currentUser;
    if (!user) return;

    const code      = document.getElementById('invite-code-input').value.trim().toUpperCase();
    const errorEl   = document.getElementById('rel-error');
    const loadingEl = document.getElementById('rel-loading');

    if (!code) { errorEl.textContent = '⚠️ أدخل كود الدعوة'; return; }

    loadingEl.style.display = 'block';
    errorEl.textContent = '';

    try {
        const relRef = doc(db, 'relationships', code);
        const relDoc = await getDoc(relRef);

        if (!relDoc.exists()) {
            loadingEl.style.display = 'none';
            errorEl.textContent = '❌ الكود غير موجود';
            return;
        }

        const relData = relDoc.data();

        if (relData.partner2) {
            loadingEl.style.display = 'none';
            errorEl.textContent = '🔒 هذه العلاقة ممتلئة';
            return;
        }

        if (relData.partner1 === user.uid) {
            loadingEl.style.display = 'none';
            errorEl.textContent = '⚠️ لا تستطيع الانضمام لعلاقتك الخاصة';
            return;
        }

        await updateDoc(relRef, {
            partner2: user.uid,
            startDate: new Date().toISOString(),
            status: 'active'
        });

        await updateDoc(doc(db, 'users', user.uid), {
            relationshipId: code
        });

        loadingEl.style.display = 'none';
        document.getElementById('relationship-overlay').style.display = 'none';

    } catch (error) {
        loadingEl.style.display = 'none';
        errorEl.textContent = '❌ خطأ: ' + error.message;
    }
};

// ==================== نسخ الكود ====================
window.copyCode = function() {
    const code = document.getElementById('generated-code').textContent;
    navigator.clipboard.writeText(code).then(() => {
        const el = document.getElementById('generated-code');
        el.style.borderColor = '#2ecc71';
        el.style.color = '#2ecc71';
        setTimeout(() => {
            el.style.borderColor = 'rgba(255,215,0,0.5)';
            el.style.color = '#ffd700';
        }, 1500);
    });
};

// ==================== حفظ إعداد العلاقة ====================
window.saveSetup = async function() {
    const user        = auth.currentUser;
    const partnerName = document.getElementById('setup-partner-name').value.trim();
    const myName      = document.getElementById('setup-my-name').value.trim();
    const setupDate   = document.getElementById('setup-date').value;
    const errorEl     = document.getElementById('setup-error');

    if (!partnerName || !myName || !setupDate) {
        errorEl.textContent = '⚠️ أدخل كل البيانات';
        return;
    }

    try {
        const userDoc   = await getDoc(doc(db, 'users', user.uid));
        const relId     = userDoc.data().relationshipId;

        // حفظ في العلاقة
        await updateDoc(doc(db, 'relationships', relId), {
            partnerName: partnerName,
            startDate: setupDate,
            status: 'active'
        });

        // حفظ في المستخدم
        await updateDoc(doc(db, 'users', user.uid), {
            myName: myName,
            setupDone: true
        });

        // تطبيق البيانات على الموقع
        const relDoc = await getDoc(doc(db, 'relationships', relId));
        applyRelationshipData(relDoc.data(), { myName });

        document.getElementById('setup-overlay').style.display = 'none';

    } catch (error) {
        errorEl.textContent = '❌ خطأ: ' + error.message;
    }
};

// ==================== تطبيق بيانات العلاقة على الموقع ====================
function applyRelationshipData(relData, userData) {
    if (!relData) return;

    // تحديث تاريخ البداية
    if (relData.startDate && window.updateStartDate) {
        window.updateStartDate(relData.startDate);
    }

    // تحديث اسم الشريك في الواجهة
    if (relData.partnerName) {
        // تحديث العنوان الرئيسي
        const welcomeTitle = document.querySelector('.welcome-title');
        if (welcomeTitle) {
            welcomeTitle.textContent = `مرحباً ${relData.partnerName} ❤️`;
        }

        // تحديث تاريخ الميلاد في التقويم إذا موجود
        if (relData.partnerBirthday) {
            window._partnerBirthday = relData.partnerBirthday;
        }
    }

    // تحديث عداد الأيام
    if (relData.startDate) {
        const days = Math.floor((new Date() - new Date(relData.startDate)) / (1000 * 60 * 60 * 24));
        const el = document.getElementById('days-together');
        if (el) el.textContent = days;
    }
}

// نصدّر الدالة عالمياً
window.applyRelationshipData = applyRelationshipData;

// ==================== تخطي الانتظار ====================
window.skipWaiting = function() {
    document.getElementById('code-display-overlay').style.display = 'none';
};