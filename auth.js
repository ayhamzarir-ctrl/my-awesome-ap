import { auth, db } from './firebase-config.js';
import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { 
  doc, setDoc, getDoc, collection, query, where, getDocs
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// ==================== شاشة تسجيل الدخول ====================
const authHTML = `
<div id="auth-overlay" style="
  position: fixed; top: 0; left: 0;
  width: 100%; height: 100%;
  background: linear-gradient(135deg, #000 0%, #1a0508 50%, #2d0a1e 100%);
  z-index: 99999;
  display: flex; justify-content: center; align-items: center;
  font-family: 'Cairo', sans-serif;
">
  <div style="
    background: rgba(255,255,255,0.08);
    backdrop-filter: blur(30px);
    border-radius: 30px;
    padding: 50px 40px;
    border: 2px solid rgba(255,255,255,0.15);
    box-shadow: 0 20px 60px rgba(0,0,0,0.5);
    text-align: center;
    width: 90%; max-width: 450px;
  ">
    <div style="font-size: 4rem; margin-bottom: 15px; animation: heartbeat 2s infinite;">💝</div>
    <h1 style="
      font-size: 2rem; margin-bottom: 8px;
      background: linear-gradient(135deg, #ffd700, #ff69b4);
      -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    ">مساحتنا الخاصة</div>
    <p style="color: #ffcccc; margin-bottom: 30px; font-size: 0.95rem;">سجّل دخولك للمتابعة ✨</p>

    <!-- Tabs -->
    <div style="display: flex; gap: 10px; margin-bottom: 25px;">
      <button id="tab-login" onclick="showTab('login')" style="
        flex: 1; padding: 12px; border-radius: 12px; border: none; cursor: pointer;
        background: linear-gradient(135deg, #730d1e, #ff69b4);
        color: white; font-family: 'Cairo'; font-size: 1rem; font-weight: 700;
      ">تسجيل الدخول</button>
      <button id="tab-register" onclick="showTab('register')" style="
        flex: 1; padding: 12px; border-radius: 12px; border: 2px solid rgba(255,255,255,0.2);
        background: transparent; color: white; font-family: 'Cairo'; font-size: 1rem; cursor: pointer;
      ">إنشاء حساب</button>
    </div>

    <!-- Login Form -->
    <div id="form-login">
      <input id="login-email" type="email" placeholder="البريد الإلكتروني" style="
        width: 100%; padding: 14px; border-radius: 12px; margin-bottom: 12px;
        background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2);
        color: white; font-family: 'Cairo'; font-size: 1rem; box-sizing: border-box;
      ">
      <input id="login-password" type="password" placeholder="كلمة المرور" style="
        width: 100%; padding: 14px; border-radius: 12px; margin-bottom: 20px;
        background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2);
        color: white; font-family: 'Cairo'; font-size: 1rem; box-sizing: border-box;
      ">
      <button onclick="handleLogin()" style="
        width: 100%; padding: 16px; border-radius: 15px; border: none; cursor: pointer;
        background: linear-gradient(135deg, #730d1e, #ff69b4);
        color: white; font-family: 'Cairo'; font-size: 1.1rem; font-weight: 700;
        box-shadow: 0 8px 25px rgba(255,105,180,0.4);
      ">دخول 💕</button>
    </div>

    <!-- Register Form -->
    <div id="form-register" style="display: none;">
      <input id="reg-name" type="text" placeholder="اسمك" style="
        width: 100%; padding: 14px; border-radius: 12px; margin-bottom: 12px;
        background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2);
        color: white; font-family: 'Cairo'; font-size: 1rem; box-sizing: border-box;
      ">
      <input id="reg-email" type="email" placeholder="البريد الإلكتروني" style="
        width: 100%; padding: 14px; border-radius: 12px; margin-bottom: 12px;
        background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2);
        color: white; font-family: 'Cairo'; font-size: 1rem; box-sizing: border-box;
      ">
      <input id="reg-password" type="password" placeholder="كلمة المرور" style="
        width: 100%; padding: 14px; border-radius: 12px; margin-bottom: 12px;
        background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2);
        color: white; font-family: 'Cairo'; font-size: 1rem; box-sizing: border-box;
      ">
      <input id="reg-invite" type="text" placeholder="كود الدعوة (اختياري)" style="
        width: 100%; padding: 14px; border-radius: 12px; margin-bottom: 20px;
        background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2);
        color: white; font-family: 'Cairo'; font-size: 1rem; box-sizing: border-box;
      ">
      <button onclick="handleRegister()" style="
        width: 100%; padding: 16px; border-radius: 15px; border: none; cursor: pointer;
        background: linear-gradient(135deg, #9b59b6, #3498db);
        color: white; font-family: 'Cairo'; font-size: 1.1rem; font-weight: 700;
        box-shadow: 0 8px 25px rgba(155,89,182,0.4);
      ">إنشاء حساب ✨</button>
    </div>

    <p id="auth-error" style="color: #ff6b6b; margin-top: 15px; min-height: 20px; font-size: 0.9rem;"></p>
    <p id="auth-loading" style="color: #ffd700; margin-top: 10px; display: none;">جاري التحميل... ⏳</p>
  </div>
</div>

<style>
  @keyframes heartbeat {
    0%, 100% { transform: scale(1); }
    25% { transform: scale(1.3); }
    75% { transform: scale(1.15); }
  }
  #auth-overlay input::placeholder { color: rgba(255,255,255,0.5); }
  #auth-overlay input:focus { outline: none; border-color: #ffd700 !important; }
</style>
`;

// ==================== إضافة شاشة Auth للصفحة ====================
document.body.insertAdjacentHTML('beforeend', authHTML);

// ==================== التحقق من حالة تسجيل الدخول ====================
onAuthStateChanged(auth, (user) => {
  const overlay = document.getElementById('auth-overlay');
  if (user) {
    // مسجل دخول - أخفي الشاشة
    if (overlay) overlay.style.display = 'none';
    console.log('✅ مرحباً:', user.email);
  } else {
    // غير مسجل - أظهر شاشة الدخول
    if (overlay) overlay.style.display = 'flex';
  }
});

// ==================== تبديل بين Login و Register ====================
window.showTab = function(tab) {
  const loginForm = document.getElementById('form-login');
  const registerForm = document.getElementById('form-register');
  const loginTab = document.getElementById('tab-login');
  const registerTab = document.getElementById('tab-register');

  if (tab === 'login') {
    loginForm.style.display = 'block';
    registerForm.style.display = 'none';
    loginTab.style.background = 'linear-gradient(135deg, #730d1e, #ff69b4)';
    loginTab.style.border = 'none';
    registerTab.style.background = 'transparent';
    registerTab.style.border = '2px solid rgba(255,255,255,0.2)';
  } else {
    loginForm.style.display = 'none';
    registerForm.style.display = 'block';
    registerTab.style.background = 'linear-gradient(135deg, #9b59b6, #3498db)';
    registerTab.style.border = 'none';
    loginTab.style.background = 'transparent';
    loginTab.style.border = '2px solid rgba(255,255,255,0.2)';
  }
};

// ==================== تسجيل الدخول ====================
window.handleLogin = async function() {
  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;
  const errorEl = document.getElementById('auth-error');
  const loadingEl = document.getElementById('auth-loading');

  if (!email || !password) {
    errorEl.textContent = '⚠️ أدخل البريد وكلمة المرور';
    return;
  }

  loadingEl.style.display = 'block';
  errorEl.textContent = '';

  try {
    await signInWithEmailAndPassword(auth, email, password);
    loadingEl.style.display = 'none';
  } catch (error) {
    loadingEl.style.display = 'none';
    if (error.code === 'auth/user-not-found') errorEl.textContent = '❌ الحساب غير موجود';
    else if (error.code === 'auth/wrong-password') errorEl.textContent = '❌ كلمة المرور خاطئة';
    else if (error.code === 'auth/invalid-email') errorEl.textContent = '❌ البريد الإلكتروني غير صحيح';
    else errorEl.textContent = '❌ خطأ: ' + error.message;
  }
};

// ==================== إنشاء حساب ====================
window.handleRegister = async function() {
  const name = document.getElementById('reg-name').value.trim();
  const email = document.getElementById('reg-email').value.trim();
  const password = document.getElementById('reg-password').value;
  const inviteCode = document.getElementById('reg-invite').value.trim();
  const errorEl = document.getElementById('auth-error');
  const loadingEl = document.getElementById('auth-loading');

  if (!name || !email || !password) {
    errorEl.textContent = '⚠️ أدخل كل البيانات المطلوبة';
    return;
  }

  if (password.length < 6) {
    errorEl.textContent = '⚠️ كلمة المرور يجب أن تكون 6 أحرف على الأقل';
    return;
  }

  loadingEl.style.display = 'block';
  errorEl.textContent = '';

  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // حفظ بيانات المستخدم في Firestore
    await setDoc(doc(db, 'users', user.uid), {
      name: name,
      email: email,
      createdAt: new Date().toISOString(),
      relationshipId: null
    });

    // إذا عنده invite code، ربطه بالعلاقة
    if (inviteCode) {
      const relRef = doc(db, 'relationships', inviteCode);
      const relDoc = await getDoc(relRef);
      
      if (relDoc.exists() && !relDoc.data().partner2) {
        await setDoc(relRef, { partner2: user.uid }, { merge: true });
        await setDoc(doc(db, 'users', user.uid), { relationshipId: inviteCode }, { merge: true });
      }
    }

    loadingEl.style.display = 'none';
  } catch (error) {
    loadingEl.style.display = 'none';
    if (error.code === 'auth/email-already-in-use') errorEl.textContent = '❌ البريد مستخدم مسبقاً';
    else if (error.code === 'auth/weak-password') errorEl.textContent = '❌ كلمة المرور ضعيفة';
    else errorEl.textContent = '❌ خطأ: ' + error.message;
  }
};