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
    z-index: 99998;
    display: none;
    justify-content: center; align-items: center;
    font-family: 'Cairo', sans-serif;
    padding: 20px; box-sizing: border-box;
">
    <div style="
        background: rgba(255,255,255,0.08);
        backdrop-filter: blur(30px);
        border-radius: 30px;
        padding: 40px 35px;
        border: 2px solid rgba(255,255,255,0.15);
        box-shadow: 0 20px 60px rgba(0,0,0,0.5);
        text-align: center;
        width: 100%; max-width: 450px;
    ">
        <div style="font-size: 4rem; margin-bottom: 15px;">💑</div>
        <h2 style="
            font-size: 1.8rem; margin-bottom: 8px;
            background: linear-gradient(135deg, #ffd700, #ff69b4);
            -webkit-background-clip: text; -webkit-text-fill-color: transparent;
        ">ابدأ علاقتك</h2>
        <p style="color: #ffcccc; margin-bottom: 30px; font-size: 0.9rem;">
            أنشئ علاقة جديدة أو انضم لعلاقة موجودة
        </p>

        <!-- زر إنشاء علاقة -->
        <button onclick="createRelationship()" style="
            width: 100%; padding: 16px; border-radius: 15px; border: none;
            background: linear-gradient(135deg, #730d1e, #ff69b4);
            color: white; font-family: 'Cairo'; font-size: 1rem;
            font-weight: 700; cursor: pointer; margin-bottom: 15px;
            box-shadow: 0 8px 25px rgba(255,105,180,0.4);
        ">💝 إنشاء علاقة جديدة</button>

        <div style="color: rgba(255,255,255,0.4); margin: 10px 0; font-size: 0.9rem;">
            ─── أو ───
        </div>

        <!-- حقل إدخال الكود -->
        <input id="invite-code-input" type="text" 
            placeholder="أدخل كود الدعوة (مثال: ARAMI-7X3K)"
            style="
                width: 100%; padding: 14px; border-radius: 12px;
                background: rgba(255,255,255,0.1);
                border: 1px solid rgba(255,255,255,0.2);
                color: white; font-family: 'Cairo'; font-size: 0.95rem;
                box-sizing: border-box; margin-bottom: 12px;
                text-align: center; letter-spacing: 2px;
            "
        >
        <button onclick="joinRelationship()" style="
            width: 100%; padding: 16px; border-radius: 15px; border: none;
            background: linear-gradient(135deg, #9b59b6, #3498db);
            color: white; font-family: 'Cairo'; font-size: 1rem;
            font-weight: 700; cursor: pointer;
            box-shadow: 0 8px 25px rgba(155,89,182,0.4);
        ">🔗 الانضمام للعلاقة</button>

        <p id="rel-error" style="color: #ff6b6b; margin-top: 15px; min-height: 20px; font-size: 0.9rem;"></p>
        <p id="rel-loading" style="color: #ffd700; margin-top: 10px; display: none;">جاري المعالجة... ⏳</p>
    </div>
</div>

<!-- شاشة عرض الكود بعد الإنشاء -->
<div id="code-display-overlay" style="
    position: fixed; top: 0; left: 0;
    width: 100%; height: 100%;
    background: linear-gradient(135deg, #000 0%, #1a0508 50%, #2d0a1e 100%);
    z-index: 99999;
    display: none;
    justify-content: center; align-items: center;
    font-family: 'Cairo', sans-serif;
    padding: 20px; box-sizing: border-box;
">
    <div style="
        background: rgba(255,255,255,0.08);
        backdrop-filter: blur(30px);
        border-radius: 30px;
        padding: 40px 35px;
        border: 2px solid rgba(255,215,0,0.3);
        box-shadow: 0 20px 60px rgba(0,0,0,0.5);
        text-align: center;
        width: 100%; max-width: 450px;
    ">
        <div style="font-size: 4rem; margin-bottom: 15px;">🎉</div>
        <h2 style="
            font-size: 1.8rem; margin-bottom: 10px;
            background: linear-gradient(135deg, #ffd700, #ff69b4);
            -webkit-background-clip: text; -webkit-text-fill-color: transparent;
        ">تم إنشاء العلاقة!</h2>
        <p style="color: #ffcccc; margin-bottom: 25px; font-size: 0.9rem;">
            أرسل هذا الكود للشخص الثاني
        </p>

        <!-- الكود -->
        <div id="generated-code" style="
            background: linear-gradient(135deg, rgba(255,215,0,0.15), rgba(255,105,180,0.15));
            border: 2px solid rgba(255,215,0,0.5);
            border-radius: 20px; padding: 25px;
            font-size: 2rem; font-weight: 700;
            color: #ffd700; letter-spacing: 4px;
            margin-bottom: 20px; cursor: pointer;
        " onclick="copyCode()">
            ARAMI-XXXX
        </div>

        <p style="color: rgba(255,255,255,0.5); font-size: 0.8rem; margin-bottom: 20px;">
            اضغط على الكود لنسخه 📋
        </p>

        <!-- حالة الانتظار -->
        <div id="waiting-status" style="
            background: rgba(255,255,255,0.05);
            border-radius: 15px; padding: 15px;
            margin-bottom: 20px;
        ">
            <div style="font-size: 1.5rem; margin-bottom: 8px;">⏳</div>
            <p style="color: #ffcccc; font-size: 0.9rem;">
                في انتظار انضمام الشخص الثاني...
            </p>
        </div>

        <button onclick="skipWaiting()" style="
            width: 100%; padding: 14px; border-radius: 15px; border: none;
            background: rgba(255,255,255,0.1);
            color: white; font-family: 'Cairo'; font-size: 0.95rem;
            cursor: pointer; border: 1px solid rgba(255,255,255,0.2);
        ">دخول الموقع الآن ← (سيتصل لاحقاً)</button>
    </div>
</div>
`;

// ==================== إضافة الشاشات للصفحة ====================
document.body.insertAdjacentHTML('beforeend', relationshipHTML);

// ==================== التحقق من حالة المستخدم ====================
onAuthStateChanged(auth, async (user) => {
    if (!user) return;

    const userDoc = await getDoc(doc(db, 'users', user.uid));
    if (!userDoc.exists()) return;

    const userData = userDoc.data();

    if (!userData.relationshipId) {
        // ما عنده علاقة - أظهر شاشة إنشاء/انضمام
        document.getElementById('relationship-overlay').style.display = 'flex';
    } else {
        // عنده علاقة - اسمح بدخول الموقع
        document.getElementById('relationship-overlay').style.display = 'none';
    }
});

// ==================== إنشاء علاقة جديدة ====================
window.createRelationship = async function() {
    const user = auth.currentUser;
    if (!user) return;

    const loadingEl = document.getElementById('rel-loading');
    const errorEl = document.getElementById('rel-error');
    loadingEl.style.display = 'block';
    errorEl.textContent = '';

    try {
        const code = generateCode();

        // حفظ العلاقة في Firestore
        await setDoc(doc(db, 'relationships', code), {
            code: code,
            partner1: user.uid,
            partner2: null,
            createdAt: new Date().toISOString(),
            startDate: null,
            status: 'waiting'
        });

        // ربط المستخدم بالعلاقة
        await updateDoc(doc(db, 'users', user.uid), {
            relationshipId: code
        });

        // عرض الكود
        loadingEl.style.display = 'none';
        document.getElementById('relationship-overlay').style.display = 'none';
        document.getElementById('generated-code').textContent = code;
        document.getElementById('code-display-overlay').style.display = 'flex';

        // مراقبة انضمام الشخص الثاني
        const unsubscribe = onSnapshot(doc(db, 'relationships', code), (snap) => {
            if (snap.data()?.partner2) {
                document.getElementById('waiting-status').innerHTML = `
                    <div style="font-size: 1.5rem; margin-bottom: 8px;">🎉</div>
                    <p style="color: #2ecc71; font-size: 1rem; font-weight: bold;">
                        انضم الشخص الثاني! مرحباً بكم معاً ❤️
                    </p>
                `;
                setTimeout(() => {
                    document.getElementById('code-display-overlay').style.display = 'none';
                    unsubscribe();
                }, 2000);
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

    const code = document.getElementById('invite-code-input').value.trim().toUpperCase();
    const errorEl = document.getElementById('rel-error');
    const loadingEl = document.getElementById('rel-loading');

    if (!code) {
        errorEl.textContent = '⚠️ أدخل كود الدعوة';
        return;
    }

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

        // ربط الشخص الثاني
        await updateDoc(relRef, {
            partner2: user.uid,
            startDate: new Date().toISOString(),
            status: 'active'
        });

        await updateDoc(doc(db, 'users', user.uid), {
            relationshipId: code
        });

        loadingEl.style.display = 'none';

        // إخفاء الشاشة والدخول للموقع
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
        document.getElementById('generated-code').style.borderColor = '#2ecc71';
        setTimeout(() => {
            document.getElementById('generated-code').style.borderColor = 'rgba(255,215,0,0.5)';
        }, 1000);
    });
};

// ==================== تخطي الانتظار ====================
window.skipWaiting = function() {
    document.getElementById('code-display-overlay').style.display = 'none';
};