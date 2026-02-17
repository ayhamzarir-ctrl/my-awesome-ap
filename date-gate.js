import { db } from './firebase-config.js';
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const SPECIAL_DATE = '2025-10-24'; // التاريخ المميز لأيهم وأرام

// ==================== التحقق من التاريخ ====================
export async function checkDate(dateString) {
    // التاريخ المميز - دخول مباشر
    if (dateString === SPECIAL_DATE) {
        return { exists: true, isSpecial: true, needsPassword: false };
    }

    // تواريخ أخرى - شيك في Firebase
    const dateDoc = await getDoc(doc(db, 'relationships_by_date', dateString));
    
    if (dateDoc.exists()) {
        return { exists: true, isSpecial: false, needsPassword: true, data: dateDoc.data() };
    }

    return { exists: false };
}

// ==================== عرض شاشة كلمة المرور ====================
export function showPasswordScreen(dateString, onSuccess) {
    const html = `
    <div id="password-overlay" style="
        position: fixed; top: 0; left: 0;
        width: 100%; height: 100%;
        background: linear-gradient(135deg, #000 0%, #1a0508 50%, #2d0a1e 100%);
        z-index: 30000;
        display: flex;
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
            width: 100%; max-width: 400px;
        ">
            <div style="font-size: 3.5rem; margin-bottom: 15px;">🔐</div>
            <h2 style="
                font-size: 1.7rem; margin-bottom: 8px;
                background: linear-gradient(135deg, #ffd700, #ff69b4);
                -webkit-background-clip: text; -webkit-text-fill-color: transparent;
                font-family: 'Amiri';
            ">أدخل كلمة المرور</h2>
            <p style="color: #ffcccc; margin-bottom: 25px; font-size: 0.85rem;">
                للدخول إلى مساحتكم الخاصة 💕
            </p>

            <input id="pwd-input" type="password" placeholder="كلمة المرور" style="
                width: 100%; padding: 15px; border-radius: 12px; margin-bottom: 15px;
                background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2);
                color: white; font-family: 'Cairo'; font-size: 1rem; box-sizing: border-box;
                text-align: center;
            ">

            <button id="pwd-submit" style="
                width: 100%; padding: 15px; border-radius: 15px; border: none;
                background: linear-gradient(135deg, #730d1e, #ff69b4);
                color: white; font-family: 'Cairo'; font-size: 1rem;
                font-weight: 700; cursor: pointer;
                box-shadow: 0 8px 25px rgba(255,105,180,0.4);
            ">دخول 💝</button>

            <p id="pwd-error" style="color: #ff6b6b; margin-top: 12px; font-size: 0.85rem;"></p>
        </div>
    </div>
    `;

    document.body.insertAdjacentHTML('beforeend', html);

    const input = document.getElementById('pwd-input');
    const btn = document.getElementById('pwd-submit');
    const errorEl = document.getElementById('pwd-error');

    const submit = async () => {
        const password = input.value.trim();
        if (!password) {
            errorEl.textContent = '⚠️ أدخل كلمة المرور';
            return;
        }

        // شيك كلمة المرور في Firebase Auth
        try {
            // نستخدم إيميل وهمي مبني على التاريخ
            const email = `${dateString.replace(/-/g, '')}@arami.local`;
            await import('./firebase-config.js').then(module => {
                return import("https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js").then(authModule => {
                    return authModule.signInWithEmailAndPassword(module.auth, email, password);
                });
            });

            // نجح الدخول
            document.getElementById('password-overlay').remove();
            onSuccess();
        } catch (error) {
            errorEl.textContent = '❌ كلمة المرور خاطئة';
        }
    };

    btn.onclick = submit;
    input.onkeypress = (e) => { if (e.key === 'Enter') submit(); };
    input.focus();
}