import { auth, db } from './firebase-config.js';
import { 
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { 
    doc, setDoc, getDoc
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// ==================== شاشة تسجيل الدخول ====================
const authHTML = `
<div id="auth-overlay" style="
    position: fixed; top: 0; left: 0;
    width: 100%; height: 100%;
    background: linear-gradient(135deg, #000 0%, #1a0508 50%, #2d0a1e 100%);
    z-index: 20000;
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
        <div style="font-size: 4rem; margin-bottom: 10px; animation: heartbeat 2s infinite;">💝</div>
        <h1 style="
            font-size: 1.8rem; margin-bottom: 6px;
            background: linear-gradient(135deg, #ffd700, #ff69b4);
            -webkit-background-clip: text; -webkit-text-fill-color: transparent;
            font-family: 'Amiri';
        ">مساحتنا الخاصة</h1>
        <p style="color: #ffcccc; margin-bottom: 25px; font-size: 0.9rem;">سجّل دخولك للمتابعة ✨</p>

        <!-- Tabs -->
        <div style="display: flex; gap: 10px; margin-bottom: 20px;">
            <button id="tab-login" onclick="showTab('login')" style="
                flex: 1; padding: 12px; border-radius: 12px; border: none; cursor: pointer;
                background: linear-gradient(135deg, #730d1e, #ff69b4);
                color: white; font-family: 'Cairo'; font-size: 0.95rem; font-weight: 700;
            ">تسجيل الدخول</button>
            <button id="tab-register" onclick="showTab('register')" style="
                flex: 1; padding: 12px; border-radius: 12px;
                border: 2px solid rgba(255,255,255,0.2);
                background: transparent; color: white;
                font-family: 'Cairo'; font-size: 0.95rem; cursor: pointer;
            ">إنشاء حساب</button>
        </div>

        <!-- Login Form -->
        <div id="form-login">
            <input id="login-email" type="email" placeholder="البريد الإلكتروني" style="
                width: 100%; padding: 13px; border-radius: 12px; margin-bottom: 10px;
                background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2);
                color: white; font-family: 'Cairo'; font-size: 0.95rem; box-sizing: border-box;
            ">
            <input id="login-password" type="password" placeholder="كلمة المرور" style="
                width: 100%; padding: 13px; border-radius: 12px; margin-bottom: 18px;
                background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2);
                color: white; font-family: 'Cairo'; font-size: 0.95rem; box-sizing: border-box;
            ">
            <button onclick="handleLogin()" style="
                width: 100%; padding: 15px; border-radius: 15px; border: none; cursor: pointer;
                background: linear-gradient(135deg, #730d1e, #ff69b4);
                color: white; font-family: 'Cairo'; font-size: 1rem; font-weight: 700;
                box-shadow: 0 8px 25px rgba(255,105,180,0.4);
            ">دخول 💕</button>
        </div>

        <!-- Register Form -->
        <div id="form-register" style="display: none;">
            <input id="reg-name" type="text" placeholder="اسمك" style="
                width: 100%; padding: 13px; border-radius: 12px; margin-bottom: 10px;
                background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2);
                color: white; font-family: 'Cairo'; font-size: 0.95rem; box-sizing: border-box;
            ">
            <input id="reg-email" type="email" placeholder="البريد الإلكتروني" style="
                width: 100%; padding: 13px; border-radius: 12px; margin-bottom: 10px;
                background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2);
                color: white; font-family: 'Cairo'; font-size: 0.95rem; box-sizing: border-box;
            ">
            <input id="reg-password" type="password" placeholder="كلمة المرور (6 أحرف على الأقل)" style="
                width: 100%; padding: 13px; border-radius: 12px; margin-bottom: 18px;
                background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2);
                color: white; font-family: 'Cairo'; font-size: 0.95rem; box-sizing: border-box;
            ">
            <button onclick="handleRegister()" style="
                width: 100%; padding: 15px; border-radius: 15px; border: none; cursor: pointer;
                background: linear-gradient(135deg, #9b59b6, #3498db);
                color: white; font-family: 'Cairo'; font-size: 1rem; font-weight: 700;
                box-shadow: 0 8px 25px rgba(155,89,182,0.4);
            ">إنشاء حساب ✨</button>
        </div>

        <p id="auth-error" style="color: #ff6b6b; margin-top: 12px; min-height: 20px; font-size: 0.85rem;"></p>
        <p id="auth-loading" style="color: #ffd700; margin-top: 8px; display: none; font-size: 0.9rem;">جاري التحميل... ⏳</p>
    </div>
</div>

<style>
    @keyframes heartbeat {
        0%, 100% { transform: scale(1); }
        25% { transform: scale(1.3); }
        75% { transform: scale(1.15); }
    }
    #auth-overlay input::placeholder { color: rgba(255,255,255,0.4); }
    #auth-overlay input:focus { outline: none; border-color: #ffd700 !important; }
</style>
`;

// ==================== إضافة شاشة Auth ====================
document.body.insertAdjacentHTML('beforeend', authHTML);

// ==================== انتظر ما يخلص الـ Gatekeeper ====================
function showAuthWhenReady() {
    const gatekeeper = document.getElementById('gatekeeper');
    const preloader  = document.getElementById('preloader');

    // إذا الـ gatekeeper مخفي = المستخدم أدخل التاريخ الصح
    const observer = new MutationObserver(() => {
        const gateHidden = !gatekeeper || 
                           gatekeeper.style.display === 'none' || 
                           gatekeeper.style.opacity === '0';
        const preloaderHidden = !preloader || preloader.style.display === 'none';

        if (gateHidden && preloaderHidden) {
            observer.disconnect();
            initAuth();
        }
    });

    if (gatekeeper) {
        observer.observe(gatekeeper, { attributes: true, attributeFilter: ['style'] });
        observer.observe(document.body, { childList: true, subtree: true });
    }

    // إذا مفيش gatekeeper أصلاً
    if (!gatekeeper) initAuth();
}

// ==================== تشغيل Auth ====================
function initAuth() {
    onAuthStateChanged(auth, (user) => {
        const overlay = document.getElementById('auth-overlay');
        if (user) {
            if (overlay) overlay.style.display = 'none';
        } else {
            if (overlay) overlay.style.display = 'flex';
        }
    });
}

// ==================== تبديل Tabs ====================
window.showTab = function(tab) {
    const loginForm    = document.getElementById('form-login');
    const registerForm = document.getElementById('form-register');
    const loginTab     = document.getElementById('tab-login');
    const registerTab  = document.getElementById('tab-register');

    if (tab === 'login') {
        loginForm.style.display    = 'block';
        registerForm.style.display = 'none';
        loginTab.style.background    = 'linear-gradient(135deg, #730d1e, #ff69b4)';
        loginTab.style.border        = 'none';
        registerTab.style.background = 'transparent';
        registerTab.style.border     = '2px solid rgba(255,255,255,0.2)';
    } else {
        loginForm.style.display    = 'none';
        registerForm.style.display = 'block';
        registerTab.style.background = 'linear-gradient(135deg, #9b59b6, #3498db)';
        registerTab.style.border     = 'none';
        loginTab.style.background    = 'transparent';
        loginTab.style.border        = '2px solid rgba(255,255,255,0.2)';
    }
};

// ==================== تسجيل الدخول ====================
window.handleLogin = async function() {
    const email    = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;
    const errorEl  = document.getElementById('auth-error');
    const loadingEl= document.getElementById('auth-loading');

    if (!email || !password) { errorEl.textContent = '⚠️ أدخل البريد وكلمة المرور'; return; }

    loadingEl.style.display = 'block';
    errorEl.textContent = '';

    try {
        await signInWithEmailAndPassword(auth, email, password);
        loadingEl.style.display = 'none';
    } catch (error) {
        loadingEl.style.display = 'none';
        if      (error.code === 'auth/user-not-found')   errorEl.textContent = '❌ الحساب غير موجود';
        else if (error.code === 'auth/wrong-password')   errorEl.textContent = '❌ كلمة المرور خاطئة';
        else if (error.code === 'auth/invalid-email')    errorEl.textContent = '❌ البريد غير صحيح';
        else if (error.code === 'auth/invalid-credential') errorEl.textContent = '❌ البريد أو كلمة المرور خاطئة';
        else errorEl.textContent = '❌ ' + error.message;
    }
};

// ==================== إنشاء حساب ====================
window.handleRegister = async function() {
    const name     = document.getElementById('reg-name').value.trim();
    const email    = document.getElementById('reg-email').value.trim();
    const password = document.getElementById('reg-password').value;
    const errorEl  = document.getElementById('auth-error');
    const loadingEl= document.getElementById('auth-loading');

    if (!name || !email || !password) { errorEl.textContent = '⚠️ أدخل كل البيانات'; return; }
    if (password.length < 6)          { errorEl.textContent = '⚠️ كلمة المرور 6 أحرف على الأقل'; return; }

    loadingEl.style.display = 'block';
    errorEl.textContent = '';

    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        await setDoc(doc(db, 'users', user.uid), {
            name: name,
            email: email,
            createdAt: new Date().toISOString(),
            relationshipId: null
        });

        loadingEl.style.display = 'none';
    } catch (error) {
        loadingEl.style.display = 'none';
        if      (error.code === 'auth/email-already-in-use') errorEl.textContent = '❌ البريد مستخدم مسبقاً';
        else if (error.code === 'auth/weak-password')        errorEl.textContent = '❌ كلمة المرور ضعيفة';
        else errorEl.textContent = '❌ ' + error.message;
    }
};

// ==================== ابدأ ====================
// انتظر ما يخلص الـ Gatekeeper أولاً
document.addEventListener('DOMContentLoaded', showAuthWhenReady);
if (document.readyState !== 'loading') showAuthWhenReady();