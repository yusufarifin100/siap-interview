// Global State
let state = {
  sessionId: null,
  roleTitle: "Digital Marketing Specialist",
  persona: "hrd",
  language: "id",
  questions: [],
  currentIndex: 0,
  answers: [],
  atsResult: null,
  tokens: 3,
  isRecording: false,
  recognition: null,
  timerInterval: null,
  secondsElapsed: 0
};

// Demo Data Presets
const DEMO_PRESETS = {
  marketing: {
    role: "Digital Marketing Specialist",
    cv: `Nama: Budi Pratama
Pendidikan: S1 Manajemen Bisnis (IPK 3.65)
Pengalaman:
1. Junior Social Media & Content Specialist di PT Media Kreatif (2023 - 2024)
   - Mengelola akun Instagram dan TikTok dengan total 80.000 followers.
   - Meningkatkan engagement rate rata-rata sebesar 35% melalui konten edukatif dan reels trend.
   - Berkolaborasi dengan 15 micro-influencer untuk kampanye peluncuran produk baru.
   - Membuat copywriting promosi, caption harian, dan desain grafis dasar menggunakan Canva.
Keahlian:
- Social Media Management (Instagram, TikTok)
- Copywriting & Content Planning
- Canva, Google Analytics, CapCut
- Komunikasi, Kolaborasi Tim, Problem Solving`,
    jd: `Lowongan: Digital Marketing Specialist (Full-Time)
Perusahaan: PT Retail Nusantara
Tanggung Jawab:
- Merancang dan mengeksekusi strategi digital marketing untuk meningkatkan brand awareness dan penjualan produk ritel.
- Mengelola kampanye berbayar (Meta Ads, Google Ads, TikTok Ads) dengan fokus pada ROI positif.
- Menganalisis metrik funnel pemasaran digital (CTR, CPA, ROAS, conversion rate) secara mingguan.
- Berkolaborasi dengan tim desain grafis dan tim penjualan untuk materi promosi musiman.
Kualifikasi:
- Pengalaman minimal 1-2 tahun di bidang digital marketing atau media sosial.
- Menguasai tools analitik (Google Analytics, Meta Business Suite).
- Kemampuan copywriting yang kuat dan pemahaman SEO dasar.
- Pribadi proaktif, memiliki inisiatif tinggi, dan problem-solving yang baik.`
  },
  tech: {
    role: "Junior Frontend Developer",
    cv: `Nama: Sarah Amanda
Pendidikan: D3 Teknik Informatika
Pengalaman:
1. Web Developer Intern di Startup Finansial (6 bulan)
   - Mengembangkan antarmuka web responsive menggunakan React, Tailwind CSS, dan Next.js.
   - Mengintegrasikan API backend RESTful untuk fitur dashboard analitik pengguna.
   - Mengoptimalkan waktu loading halaman landing page hingga 40% lebih cepat.
   - Melakukan version control menggunakan Git & GitHub dalam tim agile (Scrum).
Keahlian Teknis:
- JavaScript (ES6+), TypeScript, React, HTML5, CSS3, Tailwind CSS
- Git, GitHub, RESTful APIs, Postman, Figma to Code
- Problem Solving, Debugging, Teamwork`,
    jd: `Lowongan: Junior Frontend Developer
Perusahaan: PT Solusi Teknologi Asia
Deskripsi Pekerjaan:
- Membangun dan merawat aplikasi web modern yang cepat, aman, dan responsive untuk platform e-commerce.
- Bekerja sama erat dengan UI/UX Designer untuk menerjemahkan mockup Figma menjadi kode siap produksi.
- Mengintegrasikan API GraphQL dan RESTful dengan state management modern.
- Menulis kode yang bersih, terdokumentasi, dan melakukan testing dasar (unit test).
Syarat:
- Lulusan IT/Sistem Informasi atau Bootcamp relevan.
- Menguasai modern JavaScript, React.js, dan framework CSS (Tailwind/Bootstrap).
- Paham konsep asynchronous programming, DOM manipulation, dan responsive design.
- Mampu berkomunikasi dengan baik dan terbuka terhadap masukan code review.`
  }
};

// Initialize Speech Recognition
function initSpeechRecognition() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    console.warn("Web Speech Recognition tidak didukung di browser ini.");
    return null;
  }
  const recog = new SpeechRecognition();
  recog.continuous = true;
  recog.interimResults = true;
  recog.lang = state.language === "en" ? "en-US" : "id-ID";

  recog.onresult = (event) => {
    let transcript = "";
    for (let i = event.resultIndex; i < event.results.length; ++i) {
      transcript += event.results[i][0].transcript;
    }
    const current = document.getElementById("answer-text").value;
    if (event.results[0].isFinal) {
      document.getElementById("answer-text").value = (current ? current + " " : "") + transcript;
    } else {
      document.getElementById("mic-status-label").innerText = `Mendengarkan: "${transcript.slice(-40)}..."`;
    }
  };

  recog.onerror = (e) => {
    console.error("Speech recog error:", e);
    stopMic();
    showToast("Mic error atau izin ditolak. Anda bisa langsung mengetik jawaban.");
  };

  recog.onend = () => {
    if (state.isRecording) {
      stopMic();
    }
  };

  return recog;
}

// UI Helpers
function showToast(msg) {
  const toast = document.getElementById("toast");
  const msgEl = document.getElementById("toast-message");
  msgEl.innerText = msg;
  toast.classList.remove("hidden");
  setTimeout(() => toast.classList.add("hidden"), 3500);
}

function fillDemoData(presetKey) {
  const preset = DEMO_PRESETS[presetKey];
  if (!preset) return;
  document.getElementById("role-title").value = preset.role;
  document.getElementById("cv-text").value = preset.cv;
  document.getElementById("jd-text").value = preset.jd;
  showToast(`Contoh ${preset.role} berhasil dimuat!`);
}

function selectPersona(persona) {
  state.persona = persona;
  document.querySelectorAll(".persona-option").forEach(el => {
    if (el.dataset.persona === persona) {
      el.classList.add("border-indigo-500", "bg-indigo-50/40");
      el.classList.remove("border-slate-200");
      el.querySelector("input").checked = true;
    } else {
      el.classList.remove("border-indigo-500", "bg-indigo-50/40");
      el.classList.add("border-slate-200");
      el.querySelector("input").checked = false;
    }
  });
}

function setLanguage(lang) {
  state.language = lang;
  const btnId = document.getElementById("btn-lang-id");
  const btnEn = document.getElementById("btn-lang-en");
  if (lang === "id") {
    btnId.className = "py-2 px-3 rounded-xl text-xs font-bold border-2 border-indigo-600 bg-indigo-50 text-indigo-700 transition";
    btnEn.className = "py-2 px-3 rounded-xl text-xs font-bold border border-slate-200 text-slate-600 hover:bg-slate-50 transition";
  } else {
    btnEn.className = "py-2 px-3 rounded-xl text-xs font-bold border-2 border-indigo-600 bg-indigo-50 text-indigo-700 transition";
    btnId.className = "py-2 px-3 rounded-xl text-xs font-bold border border-slate-200 text-slate-600 hover:bg-slate-50 transition";
  }
}

// File Upload Handler
async function handleFileUpload(event) {
  const file = event.target.files[0];
  if (!file) return;

  const formData = new FormData();
  formData.append("file", file);

  showToast("Membaca dokumen PDF CV Anda...");
  try {
    const res = await fetch("/api/extract-cv", {
      method: "POST",
      body: formData
    });
    const data = await res.json();
    if (data.success && data.cv_text) {
      document.getElementById("cv-text").value = data.cv_text;
      document.getElementById("file-upload-status").classList.remove("hidden");
      document.getElementById("file-upload-name").innerText = `${file.name} (${Math.round(file.size / 1024)} KB) berhasil dibaca`;
      showToast("CV berhasil diekstrak!");
    } else {
      showToast(data.detail || "Gagal membaca PDF.");
    }
  } catch (err) {
    showToast("Gagal mengunggah file. Silakan tempel teks CV manual.");
  }
}

// Start Interview Session
async function startInterviewSession() {
  const role = document.getElementById("role-title").value.trim() || "Posisi yang Dilamar";
  const cv = document.getElementById("cv-text").value.trim();
  const jd = document.getElementById("jd-text").value.trim();

  if (!cv && !jd) {
    fillDemoData("marketing");
  }

  state.roleTitle = role;

  const btnStart = document.getElementById("btn-start");
  btnStart.disabled = true;
  btnStart.innerHTML = `<span class="animate-spin mr-2">⏳</span> Mempersiapkan Pertanyaan...`;

  try {
    const res = await fetch("/api/start-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        role_title: role,
        persona: state.persona,
        language: state.language,
        cv_text: document.getElementById("cv-text").value,
        jd_text: document.getElementById("jd-text").value
      })
    });
    const data = await res.json();

    if (data.success) {
      state.sessionId = data.session_id;
      state.questions = data.questions;
      state.atsResult = data.ats_result;
      state.currentIndex = 0;
      state.answers = [];

      // Switch view
      document.getElementById("view-setup").classList.add("hidden");
      document.getElementById("view-interview").classList.remove("hidden");
      document.getElementById("view-scorecard").classList.add("hidden");

      // Setup Interview Persona Details
      setupInterviewerUI();
      loadCurrentQuestion();
      startTimer();
    }
  } catch (err) {
    showToast("Gagal memulai sesi. Coba lagi.");
  } finally {
    btnStart.disabled = false;
    btnStart.innerHTML = `<i data-lucide="play" class="w-4 h-4 fill-current"></i><span>Mulai Wawancara Sekarang</span>`;
    lucide.createIcons();
  }
}

function setupInterviewerUI() {
  document.getElementById("session-role-badge").innerText = `Posisi: ${state.roleTitle}`;
  if (state.persona === "hrd") {
    document.getElementById("interviewer-name").innerText = "Bu Rina";
    document.getElementById("interviewer-role").innerText = "HRD & Talent Acquisition";
    document.getElementById("avatar-icon").innerText = "👩‍💼";
  } else {
    document.getElementById("interviewer-name").innerText = "Pak Dimas";
    document.getElementById("interviewer-role").innerText = "User Lead & Technical Manager";
    document.getElementById("avatar-icon").innerText = "👨‍💻";
  }
}

function loadCurrentQuestion() {
  const q = state.questions[state.currentIndex];
  if (!q) return;

  document.getElementById("question-progress").innerText = `Pertanyaan ${state.currentIndex + 1} dari ${state.questions.length}`;
  document.getElementById("question-category").innerText = q.category;
  document.getElementById("current-question-text").innerText = q.question;
  document.getElementById("star-tip-content").innerText = q.tip;
  document.getElementById("star-tip-box").classList.add("hidden");

  // Reset answer console
  document.getElementById("answer-text").value = "";
  document.getElementById("current-eval-card").classList.add("hidden");
  document.getElementById("btn-submit-answer").disabled = false;
  document.getElementById("btn-submit-answer").classList.remove("hidden");

  // Auto speak the question aloud
  setTimeout(() => playQuestionSpeech(), 400);
}

// Text-to-Speech using Browser Native SpeechSynthesis
function playQuestionSpeech() {
  if (!('speechSynthesis' in window)) return;

  window.speechSynthesis.cancel();
  const q = state.questions[state.currentIndex];
  if (!q) return;

  const utterance = new SpeechSynthesisUtterance(q.question);
  utterance.lang = state.language === "en" ? "en-US" : "id-ID";
  utterance.rate = 1.0;
  utterance.pitch = state.persona === "hrd" ? 1.05 : 0.95;

  const waveBars = document.getElementById("speech-wave-bars");
  const avatarRing = document.getElementById("avatar-ring");

  utterance.onstart = () => {
    waveBars.classList.remove("hidden");
    avatarRing.classList.add("border-indigo-400", "scale-105");
  };

  utterance.onend = () => {
    waveBars.classList.add("hidden");
    avatarRing.classList.remove("border-indigo-400", "scale-105");
  };

  utterance.onerror = () => {
    waveBars.classList.add("hidden");
    avatarRing.classList.remove("border-indigo-400", "scale-105");
  };

  // Find preferred voice
  const voices = window.speechSynthesis.getVoices();
  const match = voices.find(v => v.lang.startsWith(state.language === "en" ? "en" : "id"));
  if (match) utterance.voice = match;

  window.speechSynthesis.speak(utterance);
}

// Mic Recording Handler
function toggleMicRecording() {
  if (state.isRecording) {
    stopMic();
  } else {
    startMic();
  }
}

function startMic() {
  state.recognition = initSpeechRecognition();
  if (!state.recognition) {
    showToast("Browser tidak mendukung mic speech recognition. Anda dapat mengetik jawaban.");
    return;
  }

  try {
    state.recognition.start();
    state.isRecording = true;
    document.getElementById("btn-toggle-mic").classList.add("recording-pulse", "bg-rose-600");
    document.getElementById("mic-status-label").innerText = "🔴 Mendengarkan... Bicaralah sekarang!";
  } catch (err) {
    console.error(err);
  }
}

function stopMic() {
  if (state.recognition) {
    try { state.recognition.stop(); } catch(e) {}
  }
  state.isRecording = false;
  document.getElementById("btn-toggle-mic").classList.remove("recording-pulse", "bg-rose-600");
  document.getElementById("mic-status-label").innerText = "Klik Mikrofon untuk Menjawab dengan Suara";
}

function toggleTip() {
  const box = document.getElementById("star-tip-box");
  box.classList.toggle("hidden");
}

// Submit Answer for Instant Evaluation
async function submitAnswer() {
  stopMic();
  const ans = document.getElementById("answer-text").value.trim();
  if (!ans) {
    showToast("Silakan berikan jawaban terlebih dahulu (bicara via mic atau ketik).");
    return;
  }

  const btn = document.getElementById("btn-submit-answer");
  btn.disabled = true;
  btn.innerHTML = `<span class="animate-spin mr-1">⏳</span> Menganalisis STAR...`;

  const q = state.questions[state.currentIndex];

  try {
    const res = await fetch("/api/evaluate-answer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        session_id: state.sessionId,
        question_id: q.id,
        question: q.question,
        answer: ans,
        role_title: state.roleTitle,
        language: state.language
      })
    });
    const data = await res.json();

    if (data.success) {
      const evalData = data.evaluation;
      state.answers.push({
        question_id: q.id,
        category: q.category,
        question: q.question,
        answer: ans,
        score: evalData.score,
        kelebihan: evalData.kelebihan,
        kelemahan: evalData.kelemahan,
        model_answer: evalData.model_answer,
        star_status: evalData.star_status
      });

      // Show current evaluation card
      document.getElementById("eval-score-badge").innerText = evalData.score;
      document.getElementById("eval-kelebihan").innerText = evalData.kelebihan;
      document.getElementById("eval-kelemahan").innerText = evalData.kelemahan;
      document.getElementById("eval-model-answer").innerText = evalData.model_answer;
      document.getElementById("current-eval-card").classList.remove("hidden");
      btn.classList.add("hidden");
      lucide.createIcons();
    }
  } catch (err) {
    showToast("Gagal mengevaluasi jawaban. Coba lagi.");
  } finally {
    btn.disabled = false;
  }
}

function goToNextQuestion() {
  state.currentIndex++;
  if (state.currentIndex < state.questions.length) {
    loadCurrentQuestion();
  } else {
    finishInterview();
  }
}

// Finish & Generate Final Scorecard
async function finishInterview() {
  stopTimer();
  stopMic();
  window.speechSynthesis.cancel();

  showToast("Menyusun Laporan & Audit ATS...");

  try {
    const res = await fetch("/api/finalize-scorecard", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        session_id: state.sessionId,
        answers: state.answers
      })
    });
    const data = await res.json();

    if (data.success) {
      // Deduct token
      state.tokens = Math.max(0, state.tokens - 1);
      document.getElementById("token-count").innerText = `${state.tokens} Sesi`;

      // Render Final Scorecard
      renderFinalScorecard(data);

      // Switch view
      document.getElementById("view-setup").classList.add("hidden");
      document.getElementById("view-interview").classList.add("hidden");
      document.getElementById("view-scorecard").classList.remove("hidden");

      // Trigger celebration confetti
      if (typeof confetti === 'function') {
        confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
      }
    }
  } catch (err) {
    showToast("Gagal memproses scorecard final.");
  }
}

function renderFinalScorecard(data) {
  document.getElementById("final-overall-score").innerText = data.overall_score;
  document.getElementById("final-verdict-badge").innerText = data.verdict;
  document.getElementById("final-summary-text").innerText = data.summary;

  // ATS Keywords
  const ats = data.ats_result || {};
  document.getElementById("ats-match-percent").innerText = `${ats.match_percentage || 80}% Kesesuaian`;

  const matchedContainer = document.getElementById("ats-matched-tags");
  matchedContainer.innerHTML = (ats.matched_keywords || []).map(k => 
    `<span class="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-semibold">✓ ${k}</span>`
  ).join("") || `<span class="text-slate-400 text-[11px]">-</span>`;

  const missingContainer = document.getElementById("ats-missing-tags");
  missingContainer.innerHTML = (ats.missing_keywords || []).map(k => 
    `<span class="px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 border border-rose-200 text-[11px] font-semibold">✕ ${k}</span>`
  ).join("") || `<span class="text-emerald-600 text-[11px] font-semibold">Semua kata kunci utama sudah lengkap!</span>`;

  // Questions Review List
  const listEl = document.getElementById("questions-review-list");
  listEl.innerHTML = "";

  (data.answers_breakdown || []).forEach((item, idx) => {
    const card = document.createElement("div");
    card.className = "border border-slate-200 rounded-xl p-4 bg-slate-50/50 space-y-3";
    card.innerHTML = `
      <div class="flex items-start justify-between gap-3">
        <div>
          <span class="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-indigo-100 text-indigo-700">${item.category || `Pertanyaan ${idx+1}`}</span>
          <h4 class="text-xs sm:text-sm font-bold text-slate-800 mt-1">${item.question}</h4>
        </div>
        <span class="px-2.5 py-1 rounded-full bg-indigo-600 text-white text-xs font-black flex-shrink-0">${item.score}/100</span>
      </div>

      <div class="p-3 bg-white rounded-lg border border-slate-200 text-xs">
        <span class="text-slate-400 block text-[10px] font-bold uppercase mb-0.5">Jawaban Anda:</span>
        <p class="text-slate-700 italic">${item.answer}</p>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
        <div class="p-2.5 rounded-lg bg-emerald-50/60 border border-emerald-100">
          <strong class="text-emerald-800 block text-[11px]">Kelebihan:</strong>
          <span class="text-slate-700">${item.kelebihan}</span>
        </div>
        <div class="p-2.5 rounded-lg bg-amber-50/60 border border-amber-100">
          <strong class="text-amber-800 block text-[11px]">Saran Perbaikan:</strong>
          <span class="text-slate-700">${item.kelemahan}</span>
        </div>
      </div>

      <div class="p-3 bg-indigo-50/40 rounded-lg border border-indigo-100 text-xs">
        <strong class="text-indigo-900 block text-[11px] font-bold">✨ Rekomendasi Jawaban STAR:</strong>
        <p class="text-indigo-950/80 leading-relaxed">${item.model_answer}</p>
      </div>
    `;
    listEl.appendChild(card);
  });

  lucide.createIcons();
}

function restartSetup() {
  document.getElementById("view-setup").classList.remove("hidden");
  document.getElementById("view-interview").classList.add("hidden");
  document.getElementById("view-scorecard").classList.add("hidden");
}

// Timer Functions
function startTimer() {
  state.secondsElapsed = 0;
  clearInterval(state.timerInterval);
  state.timerInterval = setInterval(() => {
    state.secondsElapsed++;
    const mins = String(Math.floor(state.secondsElapsed / 60)).padStart(2, '0');
    const secs = String(state.secondsElapsed % 60).padStart(2, '0');
    document.getElementById("timer-display").innerText = `${mins}:${secs}`;
  }, 1000);
}

function stopTimer() {
  clearInterval(state.timerInterval);
}

// QRIS Micro-SaaS Payment Simulation Modal
function openQRISModal() {
  document.getElementById("qris-modal").classList.remove("hidden");
}

function closeQRISModal() {
  document.getElementById("qris-modal").classList.add("hidden");
}

async function simulateSuccessfulPayment() {
  closeQRISModal();
  showToast("Mengonfirmasi pembayaran QRIS...");

  try {
    const res = await fetch("/api/qris-verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ package: "pejuang_loker" })
    });
    const data = await res.json();
    if (data.success) {
      state.tokens += 5;
      document.getElementById("token-count").innerText = `${state.tokens} Sesi`;
      showToast("🎉 Pembayaran Berhasil! +5 Kuota Sesi Ditambahkan.");
      if (typeof confetti === 'function') {
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      }
    }
  } catch(e) {
    showToast("Gagal memverifikasi pembayaran.");
  }
}

// Pre-load voices on startup
if ('speechSynthesis' in window) {
  window.speechSynthesis.onvoiceschanged = () => {
    window.speechSynthesis.getVoices();
  };
}
