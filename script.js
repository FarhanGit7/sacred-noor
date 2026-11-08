// SACRED NOOR — Vanilla JavaScript
// Public data services: AlQuran Cloud (Quran) and AlAdhan (prayer/Hijri dates).
const $ = (id) => document.getElementById(id);
const toast = (message) => { const el=$("toast"); el.textContent=message; el.classList.add("show"); setTimeout(()=>el.classList.remove("show"),2200); };
$("year").textContent = new Date().getFullYear();

// Mobile navigation
$("menuToggle").addEventListener("click",()=> $("mainNav").classList.toggle("open"));
document.querySelectorAll("#mainNav a").forEach(a=>a.addEventListener("click",()=> $("mainNav").classList.remove("open")));

// Prayer times and Hijri date
function renderPrayer(data){
  const timings=data.timings, names=["Fajr","Dhuhr","Asr","Maghrib","Isha"];
  $("prayerGrid").innerHTML=names.map(n=>`<div class="prayer-card"><span>${n}</span><strong>${String(timings[n]||"—").split(" ")[0]}</strong></div>`).join("");
  const h=data.date?.hijri;
  if(h){const label=`${h.day} ${h.month.en} ${h.year} AH`; $("topHijri").textContent=label; $("calendarHijri").textContent=label;}
  $("gregorianDate").textContent=data.date?.readable || new Date().toDateString();
}
async function loadPrayerByCity(){
  const city=$("cityInput").value.trim(), country=$("countryInput").value.trim();
  if(!city||!country){toast("Enter a city and country.");return;}
  $("prayerStatus").textContent="Fetching prayer times…";
  try{
    const url=`https://api.aladhan.com/v1/timingsByCity?city=${encodeURIComponent(city)}&country=${encodeURIComponent(country)}&method=3&school=1`;
    const res=await fetch(url); if(!res.ok) throw new Error("Prayer service unavailable");
    const json=await res.json(); if(json.code!==200) throw new Error(json.status||"Could not load times");
    renderPrayer(json.data); $("prayerStatus").textContent=`Showing calculated times for ${city}, ${country}. Method: Muslim World League · Asr: Hanafi.`;
  }catch(e){$("prayerStatus").textContent="Could not load prayer times. Check your connection or try another city."; $("prayerGrid").innerHTML='<div class="loading-card">Prayer times unavailable right now.</div>'; }
}
async function loadPrayerByCoords(lat,lon){
  $("prayerStatus").textContent="Finding prayer times for your location…";
  try{const res=await fetch(`https://api.aladhan.com/v1/timings?latitude=${lat}&longitude=${lon}&method=3&school=1`);
    const json=await res.json(); if(json.code!==200) throw new Error(); renderPrayer(json.data);
    $("prayerStatus").textContent="Showing calculated times for your current location. Method: Muslim World League · Asr: Hanafi.";
  }catch(e){$("prayerStatus").textContent="Unable to retrieve location-based prayer times. Try entering your city.";}
}
$("loadPrayer").addEventListener("click",loadPrayerByCity);
$("useLocation").addEventListener("click",()=>{
  if(!navigator.geolocation){toast("Location is not supported by this browser.");return;}
  navigator.geolocation.getCurrentPosition(p=>loadPrayerByCoords(p.coords.latitude,p.coords.longitude),()=>toast("Location permission was not granted."));
});
loadPrayerByCity();

// Quran explorer
let surahs=[];
async function initQuran(){
  try{
    const r=await fetch("https://api.alquran.cloud/v1/surah"); const j=await r.json();
    if(j.code!==200) throw new Error(); surahs=j.data;
    $("surahSelect").innerHTML=surahs.map(s=>`<option value="${s.number}">${s.number}. ${s.englishName} (${s.name})</option>`).join("");
    $("surahSelect").value="1"; loadSurah();
  }catch(e){$("surahSelect").innerHTML='<option value="">Could not load Surahs</option>'; $("ayahList").textContent="Quran service unavailable. Please try again later.";}
}
async function loadSurah(){
  const n=$("surahSelect").value, edition=$("translationSelect").value; if(!n)return;
  $("ayahList").innerHTML='<div class="loading-card">Loading verses…</div>';
  try{
    const r=await fetch(`https://api.alquran.cloud/v1/surah/${n}/editions/quran-uthmani,${edition}`); const j=await r.json();
    if(j.code!==200) throw new Error();
    const arabic=j.data[0], trans=j.data[1], meta=surahs.find(s=>s.number===Number(n));
    $("surahIntro").innerHTML=`<div class="arabic-title">${arabic.name}</div><p>${meta.englishName} · ${meta.englishNameTranslation} · ${meta.numberOfAyahs} verses</p>`;
    $("ayahList").innerHTML=arabic.ayahs.map((a,i)=>`<article class="ayah"><div class="ayah-top"><span class="ayah-number">${a.numberInSurah}</span><span class="muted small">VERSE ${a.numberInSurah}</span></div><div class="ayah-arabic" lang="ar">${a.text}</div><div class="ayah-translation">${trans.ayahs[i].text}</div></article>`).join("");
  }catch(e){$("ayahList").innerHTML='<div class="empty-state">Unable to load this Surah. Please try again.</div>';}
}
$("loadSurah").addEventListener("click",loadSurah);
$("surahSelect").addEventListener("change",loadSurah);
$("translationSelect").addEventListener("change",loadSurah);
initQuran();

// Tasbeeh
const dhikrData={subhan:["سُبْحَانَ اللَّهِ","SubhanAllah"],hamd:["الْحَمْدُ لِلَّهِ","Alhamdulillah"],akbar:["اللَّهُ أَكْبَرُ","Allahu Akbar"],istighfar:["أَسْتَغْفِرُ اللَّهَ","Astaghfirullah"],custom:["","Custom Dhikr"]};
let count=Number(localStorage.getItem("sn-tasbeeh-count")||0);
function showCount(){$("tasbeehCount").textContent=count;}
showCount();
$("countButton").addEventListener("click",()=>{count++;showCount();localStorage.setItem("sn-tasbeeh-count",count);});
$("resetCount").addEventListener("click",()=>{count=0;showCount();localStorage.setItem("sn-tasbeeh-count",0);toast("Counter reset.");});
$("dhikrSelect").addEventListener("change",e=>{
 const key=e.target.value; $("customDhikr").classList.toggle("hidden",key!=="custom");
 $("dhikrArabic").textContent=dhikrData[key][0]||"اُذْكُرِ اللَّهَ";
});
$("customDhikr").addEventListener("input",e=>$("dhikrArabic").textContent=e.target.value||"اُذْكُرِ اللَّهَ");

// Hadith: concise English meanings with collection references; verify full wording in cited source.
const hadiths=[
 {text:"The one who does not show mercy will not be shown mercy.",source:"Sahih al-Bukhari 6013 · English meaning"},
 {text:"A good word is charity.",source:"Sahih al-Bukhari 2989; Sahih Muslim 1009 · English meaning"},
 {text:"Modesty is a branch of faith.",source:"Sahih al-Bukhari 9; Sahih Muslim 35 · English meaning"},
 {text:"The most beloved deeds to Allah are those done regularly, even if they are few.",source:"Sahih al-Bukhari 6464; Sahih Muslim 783 · English meaning"},
 {text:"Whoever believes in Allah and the Last Day should speak good or remain silent.",source:"Sahih al-Bukhari 6018; Sahih Muslim 47 · English meaning"}
];
let hadithIndex=Math.floor(Date.now()/86400000)%hadiths.length;
function showHadith(){const h=hadiths[hadithIndex];$("hadithText").textContent=h.text;$("hadithSource").textContent=h.source+" · paraphrased meaning";}
showHadith();$("anotherHadith").addEventListener("click",()=>{hadithIndex=(hadithIndex+1)%hadiths.length;showHadith();});

// Dua library: Quranic supplications and widely cited daily supplications.
const duas=[
 {title:"Good in this life and the next",type:"quran",arabic:"رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ",meaning:"Our Lord, grant us good in this world and good in the Hereafter, and protect us from the punishment of the Fire.",ref:"Quran 2:201"},
 {title:"Ask for beneficial knowledge",type:"quran",arabic:"رَبِّ زِدْنِي عِلْمًا",meaning:"My Lord, increase me in knowledge.",ref:"Quran 20:114"},
 {title:"For ease and clear speech",type:"quran",arabic:"رَبِّ اشْرَحْ لِي صَدْرِي ۝ وَيَسِّرْ لِي أَمْرِي ۝ وَاحْلُلْ عُقْدَةً مِنْ لِسَانِي ۝ يَفْقَهُوا قَوْلِي",meaning:"My Lord, expand my chest, ease my task, and untie the knot from my tongue so they may understand my speech.",ref:"Quran 20:25–28"},
 {title:"For forgiveness and mercy",type:"quran",arabic:"رَبَّنَا ظَلَمْنَا أَنْفُسَنَا وَإِنْ لَمْ تَغْفِرْ لَنَا وَتَرْحَمْنَا لَنَكُونَنَّ مِنَ الْخَاسِرِينَ",meaning:"Our Lord, we have wronged ourselves. If You do not forgive us and have mercy on us, we will surely be among the losers.",ref:"Quran 7:23"},
 {title:"For steadfast hearts",type:"quran",arabic:"رَبَّنَا لَا تُزِغْ قُلُوبَنَا بَعْدَ إِذْ هَدَيْتَنَا وَهَبْ لَنَا مِنْ لَدُنْكَ رَحْمَةً",meaning:"Our Lord, do not let our hearts deviate after You have guided us, and grant us mercy from Yourself.",ref:"Quran 3:8"},
 {title:"Before sleeping",type:"daily",arabic:"بِاسْمِكَ اللَّهُمَّ أَمُوتُ وَأَحْيَا",meaning:"In Your name, O Allah, I die and I live.",ref:"Sahih al-Bukhari 6324 · English meaning"},
 {title:"When leaving home",type:"daily",arabic:"بِسْمِ اللَّهِ، تَوَكَّلْتُ عَلَى اللَّهِ، وَلَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ",meaning:"In the name of Allah; I place my trust in Allah. There is no power and no strength except through Allah.",ref:"Sunan Abi Dawud 5095; Jami at-Tirmidhi 3426"},
 {title:"For forgiveness",type:"daily",arabic:"أَسْتَغْفِرُ اللَّهَ وَأَتُوبُ إِلَيْهِ",meaning:"I seek Allah's forgiveness and repent to Him.",ref:"Sahih al-Bukhari 6307 · wording commonly reported"}
];
function renderDuas(filter="all"){
 $("duaGrid").innerHTML=duas.filter(d=>filter==="all"||d.type===filter).map(d=>`<article class="dua-card"><h3>${d.title}</h3><div class="arabic" lang="ar">${d.arabic}</div><p class="meaning">${d.meaning}</p><div class="reference">${d.ref}</div></article>`).join("");
}
renderDuas();
$("duaFilters").addEventListener("click",e=>{const b=e.target.closest("button[data-filter]");if(!b)return;document.querySelectorAll(".filter").forEach(x=>x.classList.remove("active"));b.classList.add("active");renderDuas(b.dataset.filter);});

// 99 Names — commonly used list; translations are concise approximations.
const namesRaw=[
["الرَّحْمَٰنُ","Ar-Rahman","The Most Merciful"],["الرَّحِيمُ","Ar-Raheem","The Especially Merciful"],["الْمَلِكُ","Al-Malik","The King"],["الْقُدُّوسُ","Al-Quddus","The Most Holy"],["السَّلَامُ","As-Salam","The Source of Peace"],["الْمُؤْمِنُ","Al-Mu'min","The Giver of Faith"],["الْمُهَيْمِنُ","Al-Muhaymin","The Guardian"],["الْعَزِيزُ","Al-Aziz","The Almighty"],["الْجَبَّارُ","Al-Jabbar","The Compeller"],["الْمُتَكَبِّرُ","Al-Mutakabbir","The Supreme"],["الْخَالِقُ","Al-Khaliq","The Creator"],["الْبَارِئُ","Al-Bari","The Originator"],["الْمُصَوِّرُ","Al-Musawwir","The Fashioner"],["الْغَفَّارُ","Al-Ghaffar","The Constant Forgiver"],["الْقَهَّارُ","Al-Qahhar","The All-Subduing"],["الْوَهَّابُ","Al-Wahhab","The Bestower"],["الرَّزَّاقُ","Ar-Razzaq","The Provider"],["الْفَتَّاحُ","Al-Fattah","The Opener"],["الْعَلِيمُ","Al-Alim","The All-Knowing"],["الْقَابِضُ","Al-Qabid","The Withholder"],["الْبَاسِطُ","Al-Basit","The Extender"],["الْخَافِضُ","Al-Khafid","The Abaser"],["الرَّافِعُ","Ar-Rafi","The Exalter"],["الْمُعِزُّ","Al-Mu'izz","The Giver of Honour"],["الْمُذِلُّ","Al-Mudhill","The Humiliator"],["السَّمِيعُ","As-Sami","The All-Hearing"],["الْبَصِيرُ","Al-Basir","The All-Seeing"],["الْحَكَمُ","Al-Hakam","The Judge"],["الْعَدْلُ","Al-Adl","The Utterly Just"],["اللَّطِيفُ","Al-Latif","The Subtle One"],["الْخَبِيرُ","Al-Khabir","The All-Aware"],["الْحَلِيمُ","Al-Halim","The Forbearing"],["الْعَظِيمُ","Al-Azim","The Magnificent"],["الْغَفُورُ","Al-Ghafur","The All-Forgiving"],["الشَّكُورُ","Ash-Shakur","The Appreciative"],["الْعَلِيُّ","Al-Ali","The Most High"],["الْكَبِيرُ","Al-Kabir","The Most Great"],["الْحَفِيظُ","Al-Hafiz","The Preserver"],["الْمُقِيتُ","Al-Muqit","The Sustainer"],["الْحَسِيبُ","Al-Hasib","The Reckoner"],["الْجَلِيلُ","Al-Jalil","The Majestic"],["الْكَرِيمُ","Al-Karim","The Generous"],["الرَّقِيبُ","Ar-Raqib","The Watchful"],["الْمُجِيبُ","Al-Mujib","The Responsive"],["الْوَاسِعُ","Al-Wasi","The All-Encompassing"],["الْحَكِيمُ","Al-Hakim","The All-Wise"],["الْوَدُودُ","Al-Wadud","The Most Loving"],["الْمَجِيدُ","Al-Majid","The Glorious"],["الْبَاعِثُ","Al-Ba'ith","The Resurrector"],["الشَّهِيدُ","Ash-Shahid","The Witness"],["الْحَقُّ","Al-Haqq","The Truth"],["الْوَكِيلُ","Al-Wakil","The Trustee"],["الْقَوِيُّ","Al-Qawiyy","The All-Strong"],["الْمَتِينُ","Al-Matin","The Firm"],["الْوَلِيُّ","Al-Waliyy","The Protecting Friend"],["الْحَمِيدُ","Al-Hamid","The Praiseworthy"],["الْمُحْصِي","Al-Muhsi","The Enumerator"],["الْمُبْدِئُ","Al-Mubdi","The Originator"],["الْمُعِيدُ","Al-Muid","The Restorer"],["الْمُحْيِي","Al-Muhyi","The Giver of Life"],["الْمُمِيتُ","Al-Mumit","The Creator of Death"],["الْحَيُّ","Al-Hayy","The Ever-Living"],["الْقَيُّومُ","Al-Qayyum","The Self-Subsisting"],["الْوَاجِدُ","Al-Wajid","The Finder"],["الْمَاجِدُ","Al-Majid","The Noble"],["الْوَاحِدُ","Al-Wahid","The One"],["الْأَحَدُ","Al-Ahad","The Unique One"],["الصَّمَدُ","As-Samad","The Eternal Refuge"],["الْقَادِرُ","Al-Qadir","The All-Powerful"],["الْمُقْتَدِرُ","Al-Muqtadir","The Determiner"],["الْمُقَدِّمُ","Al-Muqaddim","The Expediter"],["الْمُؤَخِّرُ","Al-Mu'akhkhir","The Delayer"],["الْأَوَّلُ","Al-Awwal","The First"],["الْآخِرُ","Al-Akhir","The Last"],["الظَّاهِرُ","Az-Zahir","The Manifest"],["الْبَاطِنُ","Al-Batin","The Hidden"],["الْوَالِي","Al-Wali","The Governor"],["الْمُتَعَالِي","Al-Muta'ali","The Most Exalted"],["الْبَرُّ","Al-Barr","The Source of Goodness"],["التَّوَّابُ","At-Tawwab","The Accepter of Repentance"],["الْمُنْتَقِمُ","Al-Muntaqim","The Avenger"],["الْعَفُوُّ","Al-Afuww","The Pardoner"],["الرَّؤُوفُ","Ar-Ra'uf","The Most Kind"],["مَالِكُ الْمُلْكِ","Malik-ul-Mulk","Master of the Kingdom"],["ذُو الْجَلَالِ وَالْإِكْرَامِ","Dhul-Jalali wal-Ikram","Lord of Majesty and Honour"],["الْمُقْسِطُ","Al-Muqsit","The Equitable"],["الْجَامِعُ","Al-Jami","The Gatherer"],["الْغَنِيُّ","Al-Ghani","The Self-Sufficient"],["الْمُغْنِي","Al-Mughni","The Enricher"],["الْمَانِعُ","Al-Mani","The Preventer"],["الضَّارُّ","Ad-Darr","The Distresser"],["النَّافِعُ","An-Nafi","The Benefactor"],["النُّورُ","An-Nur","The Light"],["الْهَادِي","Al-Hadi","The Guide"],["الْبَدِيعُ","Al-Badi","The Incomparable Originator"],["الْبَاقِي","Al-Baqi","The Everlasting"],["الْوَارِثُ","Al-Warith","The Inheritor"],["الرَّشِيدُ","Ar-Rashid","The Guide to the Right Way"],["الصَّبُورُ","As-Sabur","The Patient"] ];
function renderNames(q=""){
 const filtered=namesRaw.map((n,i)=>({...{arabic:n[0],latin:n[1],meaning:n[2],number:i+1}})).filter(n=>(n.latin+" "+n.meaning+" "+n.arabic).toLowerCase().includes(q.toLowerCase()));
 $("namesGrid").innerHTML=filtered.map(n=>`<article class="name-card"><div class="arabic" lang="ar">${n.arabic}</div><strong>${n.number}. ${n.latin}</strong><small>${n.meaning}</small></article>`).join("");
 $("nameCount").textContent=`${filtered.length} of ${namesRaw.length} names`;
}
renderNames();$("nameSearch").addEventListener("input",e=>renderNames(e.target.value));

// Islamic knowledge quiz
const questions=[
 {q:"How many Surahs are in the Quran?",o:["99","110","114","120"],a:2,why:"The Quran contains 114 Surahs."},
 {q:"Which month is the month of fasting?",o:["Muharram","Ramadan","Rajab","Shawwal"],a:1,why:"Fasting in Ramadan is one of the Five Pillars of Islam."},
 {q:"How many obligatory daily prayers are there?",o:["Three","Four","Five","Six"],a:2,why:"Muslims are obligated to perform five daily prayers."},
 {q:"Which is the first Surah of the Quran?",o:["Al-Baqarah","Al-Fatiha","Al-Ikhlas","An-Nas"],a:1,why:"Al-Fatiha is the opening Surah of the Quran."},
 {q:"Which angel brought revelation to Prophet Muhammad ﷺ?",o:["Mikail","Israfil","Jibril","Malik"],a:2,why:"Angel Jibril (Gabriel) conveyed revelation."},
 {q:"What is the direction Muslims face during Salah called?",o:["Mihrab","Qiblah","Minbar","Maqam"],a:1,why:"The Qiblah is the direction toward the Ka'bah in Makkah."},
 {q:"Which is the obligatory charity pillar of Islam?",o:["Sadaqah","Zakat","Fidyah","Kaffarah"],a:1,why:"Zakat is the obligatory almsgiving pillar, subject to its conditions."},
 {q:"Which Surah is known as Umm al-Kitab?",o:["Al-Fatiha","Al-Mulk","Yasin","Al-Kahf"],a:0,why:"Al-Fatiha is known as Umm al-Kitab (Mother of the Book)."}
];
let quizIndex=0,quizScore=0,answered=false;
function renderQuestion(){
 const q=questions[quizIndex];answered=false;
 $("quizProgress").textContent=`Question ${quizIndex+1} of ${questions.length}`;
 $("progressBar").style.width=`${quizIndex/questions.length*100}%`;
 $("quizQuestion").textContent=q.q;$("quizFeedback").textContent="";
 $("quizOptions").innerHTML=q.o.map((o,i)=>`<button class="quiz-option" data-index="${i}">${String.fromCharCode(65+i)}. ${o}</button>`).join("");
 $("quizOptions").querySelectorAll("button").forEach(b=>b.addEventListener("click",()=>answerQuestion(Number(b.dataset.index))));
 $("nextQuestion").disabled=true;$("nextQuestion").textContent=quizIndex===questions.length-1?"See results":"Next question →";
 $("quizScore").textContent=`Score: ${quizScore}`;
}
function answerQuestion(index){
 if(answered)return;answered=true;const q=questions[quizIndex];const buttons=[...$("quizOptions").querySelectorAll("button")];
 buttons.forEach((b,i)=>{b.disabled=true;if(i===q.a)b.classList.add("correct");else if(i===index)b.classList.add("wrong");});
 if(index===q.a){quizScore++;$("quizFeedback").textContent="Correct — "+q.why;}else{$("quizFeedback").textContent="Not quite. "+q.why;}
 $("quizScore").textContent=`Score: ${quizScore}`;$("nextQuestion").disabled=false;
}
$("nextQuestion").addEventListener("click",()=>{
 if(!answered)return;
 if(quizIndex<questions.length-1){quizIndex++;renderQuestion();}
 else{$("progressBar").style.width="100%";$("quizQuestion").textContent=`You scored ${quizScore} out of ${questions.length}.`; $("quizOptions").innerHTML="";$("quizFeedback").textContent="Keep learning and revising. May Allah increase us in beneficial knowledge."; $("nextQuestion").textContent="Try again";$("nextQuestion").disabled=false;$("nextQuestion").onclick=()=>{quizIndex=0;quizScore=0;$("nextQuestion").onclick=null;renderQuestion();};}
});
renderQuestion();

// Hijri calendar: API date; local browser date as fallback.
function fallbackHijri(){
 try{return new Intl.DateTimeFormat("en-u-ca-islamic", {day:"numeric",month:"long",year:"numeric"}).format(new Date());}
 catch(e){return "Use the prayer-times section to load Hijri date.";}
}
$("calendarHijri").textContent=fallbackHijri();$("topHijri").textContent=fallbackHijri();
$("refreshCalendar").addEventListener("click",async()=>{await loadPrayerByCity();toast("Calendar date refreshed.");});
