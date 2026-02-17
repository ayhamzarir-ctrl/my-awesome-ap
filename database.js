import { db, auth } from './firebase-config.js';
import {
    collection, addDoc, onSnapshot, query,
    orderBy, doc, getDoc, updateDoc
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

let currentRelationshipId = null;

// ==================== جلب معرف العلاقة ====================
onAuthStateChanged(auth, async (user) => {
    if (!user) return;

    const userDoc = await getDoc(doc(db, 'users', user.uid));
    if (!userDoc.exists()) return;

    currentRelationshipId = userDoc.data().relationshipId;
    if (!currentRelationshipId) return;

    // ابدأ مزامنة البيانات
    syncMessages();
    syncWishes();
    syncJournal();
    syncStartDate();
});

// ==================== الرسائل ====================
async function addMessageToFirebase(text) {
    if (!currentRelationshipId) return;
    const user = auth.currentUser;

    await addDoc(collection(db, 'relationships', currentRelationshipId, 'messages'), {
        text: text,
        author: user.displayName || user.email,
        authorId: user.uid,
        date: new Date().toISOString()
    });
}

function syncMessages() {
    const q = query(
        collection(db, 'relationships', currentRelationshipId, 'messages'),
        orderBy('date', 'desc')
    );

    onSnapshot(q, (snapshot) => {
        const messages = [];
        snapshot.forEach(doc => {
            messages.push({ id: doc.id, ...doc.data() });
        });

        const container = document.getElementById('messages-container');
        if (!container) return;

        if (messages.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: var(--text-light); padding: 40px;">لا توجد رسائل بعد. كن أول من يبدأ! 💕</p>';
            return;
        }

        container.innerHTML = messages.map(msg => `
            <div class="message-item">
                <div class="message-text">${msg.text}</div>
                <div class="message-meta">
                    <span>${msg.author}</span>
                    <span>${formatDate(msg.date)}</span>
                </div>
            </div>
        `).join('');

        const totalEl = document.getElementById('total-messages');
        if (totalEl) totalEl.textContent = messages.length;

        const statEl = document.getElementById('stat-messages');
        if (statEl) statEl.textContent = messages.length;
    });
}

// ==================== الأمنيات ====================
async function addWishToFirebase(text) {
    if (!currentRelationshipId) return;

    await addDoc(collection(db, 'relationships', currentRelationshipId, 'wishes'), {
        text: text,
        completed: false,
        date: new Date().toISOString()
    });
}

async function toggleWishInFirebase(id, completed) {
    if (!currentRelationshipId) return;

    await updateDoc(
        doc(db, 'relationships', currentRelationshipId, 'wishes', id),
        { completed: !completed }
    );
}

function syncWishes() {
    const q = query(
        collection(db, 'relationships', currentRelationshipId, 'wishes'),
        orderBy('date', 'desc')
    );

    onSnapshot(q, (snapshot) => {
        const wishes = [];
        snapshot.forEach(doc => {
            wishes.push({ id: doc.id, ...doc.data() });
        });

        const container = document.getElementById('wishes-container');
        if (!container) return;

        if (wishes.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: var(--text-light); padding: 40px;">لا توجد أمنيات بعد. أضف أمنيتك الأولى! ✨</p>';
            return;
        }

        container.innerHTML = wishes.map(wish => `
            <div class="wish-card ${wish.completed ? 'completed' : ''}"
                 onclick="window.toggleWishFirebase('${wish.id}', ${wish.completed})">
                <h3 style="margin-bottom: 10px;">${wish.text}</h3>
                <p style="font-size: 0.85rem; color: var(--text-light);">${formatDate(wish.date)}</p>
                ${wish.completed ? '<p style="color: var(--green); margin-top: 10px; font-weight: bold;">✓ تحققت!</p>' : ''}
            </div>
        `).join('');

        const totalEl = document.getElementById('total-wishes');
        if (totalEl) totalEl.textContent = wishes.length;

        const statEl = document.getElementById('stat-wishes');
        if (statEl) statEl.textContent = wishes.filter(w => w.completed).length;
    });
}

// ==================== اليوميات ====================
async function addJournalToFirebase(mood, text) {
    if (!currentRelationshipId) return;
    const user = auth.currentUser;

    await addDoc(collection(db, 'relationships', currentRelationshipId, 'journal'), {
        mood: mood,
        text: text,
        author: user.displayName || user.email,
        date: new Date().toISOString()
    });
}

function syncJournal() {
    const q = query(
        collection(db, 'relationships', currentRelationshipId, 'journal'),
        orderBy('date', 'desc')
    );

    onSnapshot(q, (snapshot) => {
        const entries = [];
        snapshot.forEach(doc => {
            entries.push({ id: doc.id, ...doc.data() });
        });

        const container = document.getElementById('journal-container');
        if (!container) return;

        if (entries.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: var(--text-light); padding: 40px;">لا توجد يوميات بعد. ابدأ بكتابة يومك! 📝</p>';
            return;
        }

        container.innerHTML = entries.map(entry => `
            <div class="journal-entry">
                <div class="journal-date">${formatDate(entry.date)} — ${entry.author}</div>
                <div class="journal-mood">${entry.mood}</div>
                <div class="journal-text">${entry.text}</div>
            </div>
        `).join('');

        const totalEl = document.getElementById('total-memories');
        if (totalEl) totalEl.textContent = entries.length;

        const statEl = document.getElementById('stat-journal');
        if (statEl) statEl.textContent = entries.length;
    });
}

// ==================== تاريخ البداية من Firebase ====================
async function syncStartDate() {
    if (!currentRelationshipId) return;

    const relDoc = await getDoc(doc(db, 'relationships', currentRelationshipId));
    if (!relDoc.exists()) return;

    const relData = relDoc.data();
    const startDate = relData.startDate;

    if (startDate && window.updateStartDate) {
        window.updateStartDate(startDate);
    }

    // تحديث عداد الأيام في الصفحة الرئيسية
    if (startDate) {
        const days = Math.floor((new Date() - new Date(startDate)) / (1000 * 60 * 60 * 24));
        const el = document.getElementById('days-together');
        if (el) el.textContent = days;
    }
}

// ==================== تسجيل الدوال عالمياً ====================
window.firebaseAddMessage  = addMessageToFirebase;
window.firebaseAddWish     = addWishToFirebase;
window.firebaseAddJournal  = addJournalToFirebase;
window.toggleWishFirebase  = async (id, completed) => {
    await toggleWishInFirebase(id, completed);
};

// ==================== مساعد التاريخ ====================
function formatDate(dateString) {
    const date = new Date(dateString);
    const now  = new Date();
    const diffMs   = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours= Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins  <  1) return 'الآن';
    if (diffMins  < 60) return `منذ ${diffMins} دقيقة`;
    if (diffHours < 24) return `منذ ${diffHours} ساعة`;
    if (diffDays  <  7) return `منذ ${diffDays} يوم`;
    return date.toLocaleDateString('ar-SA');
}