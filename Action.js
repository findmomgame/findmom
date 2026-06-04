
    // --- GAME STATE ---
    const SAVE_KEY = "word_energy_game_save_v2";
    let gameState = {
        coins: 0,
        xp: 0,
        wordEnergy: 0,
        currentStoryIndex: 0,
        storyCompleted: false,
        monsterMaxHP: 100,
        monsterCurrentHP: 100
    };

    let currentZone = 1; 
    let currentDataType = ""; 
    let currentRoundData = {};
    let isListening = false;
    let userScrambleAnswer = [];

    // --- VIDEO AUTOMATION LOGIC ---
    
    // Tự động xử lý khi bấm nút "Bắt đầu trải nghiệm" trên màn hình Intro để bật tiếng
    function unmuteAndPlayIntro() {
        const video = document.getElementById('video-intro');
        const overlay = document.getElementById('intro-overlay-control');
        if (video) {
            video.muted = false; // Bật tiếng video
            video.currentTime = 0;
            video.play().then(() => {
                if(overlay) overlay.style.opacity = '0';
                // Kích hoạt mồi hệ thống giọng nói để tránh Autoplay Policy block Web Speech API
                if ('speechSynthesis' in window) {
                    let unlockUtterance = new SpeechSynthesisUtterance('');
                    window.speechSynthesis.speak(unlockUtterance);
                }
                setTimeout(() => { if(overlay) overlay.style.display = 'none'; }, 300);
            }).catch(err => {
                console.log("Phát video có âm thanh gặp lỗi bảo mật: ", err);
                exitIntro(); // Dự phòng chuyển cảnh nếu lỗi nặng
            });
        }
    }

    function exitIntro() {
        const video = document.getElementById('video-intro');
        if (video) { video.pause(); video.currentTime = 0; }
        switchScreen('screen-splash');
        loadGame(); 
    }

    // Tự động kích hoạt phát video End Game khi thắng Boss 5
    function startEndGameVideo() {
        switchScreen('screen-endvideo');
        const video = document.getElementById('video-endgame');
        if (video) {
            video.muted = false; 
            video.currentTime = 0;
            video.play().catch(err => {
                console.log("Yêu cầu tương tác người dùng cho video chiến thắng: ", err);
                // Nếu trình duyệt chặn, ép phát không tiếng làm dự phòng
                video.muted = true;
                video.play();
            });
        }
    }

    function exitEndVideo() {
        const video = document.getElementById('video-endgame');
        if (video) { video.pause(); video.currentTime = 0; }
        // Sau khi hoàn thành toàn bộ game, đặt lại điểm hoặc giữ nguyên tùy ý, đưa về bản đồ thế giới
        gameState.wordEnergy = Math.max(gameState.wordEnergy, 200); // Thưởng mốc năng lượng tối đa
        saveGame();
        switchScreen('screen-map');
    }

    // Video kết thúc phát xong tự động đóng màn hình phát và hoàn thành trò chơi
    document.getElementById('video-endgame').onended = function() {
        exitEndVideo();
    };

 const zone1Words = [
        { word: "Apple", definition: "Quả táo", memory: "Mảnh ký ức 1: Mẹ dặn con ăn trái cây tươi mỗi ngày để khỏe mạnh..." },
        { word: "Cat", definition: "Con mèo", memory: "Mảnh ký ức 2: Chú mèo nhỏ cuộn tròn bên chân mẹ sưởi ấm bên bếp lửa..." },
        { word: "Blue", definition: "Màu xanh da trời", memory: "Mảnh ký ức 3: Màu chiếc áo len mẹ tỉ mẩn đan tặng con mùa đông năm ấy..." },
        { word: "Family", definition: "Gia đình", memory: "Mảnh ký ức 13: Bức ảnh cả nhà mình cười thật tươi treo trang trọng ở phòng khách..." },
        { word: "Sun", definition: "Mặt trời", memory: "Mảnh ký ức 14: Mẹ nói con chính là vầng thái dương nhỏ, xua tan mọi mệt mỏi của mẹ..." },
        { word: "Water", definition: "Nước", memory: "Mảnh ký ức 15: Ly nước ấm dịu mát mẹ luôn chuẩn bị sẵn trên bàn mỗi khi con đi học về..." },
        { word: "Book", definition: "Quyển sách", memory: "Mảnh ký ức 16: Những câu chuyện cổ tích ngày xưa mẹ lật mở đưa con vào giấc ngủ..." }
    ];

    const zone2Conversations = [
        { q: "Good morning!", hint: "Chào buổi sáng!", ans: "Good morning! Nice to see you.", opts: ["Good morning! Nice to see you.", "Goodbye!", "Thank you."], memory: "Mảnh ký ức 4: Mỗi sớm thức dậy, tiếng mẹ dịu dàng gọi con chuẩn bị đi học..." },
        { q: "How are you?", hint: "Bạn khỏe không?", ans: "I am fine, thank you.", opts: ["I am fine, thank you.", "See you later.", "No, I don't."], memory: "Mảnh ký ức 5: Ánh mắt lo lắng của mẹ ôm lấy con mỗi khi con sốt hay mệt..." },
        { q: "Hello, what's your name?", hint: "Xin chào, tên bạn là gì?", ans: "My name is Lam.", opts: ["My name is Lam.", "I am ten.", "Fine, thanks."], memory: "Mảnh ký ức 6: Cái tên Lam thân thương của con chính là kỳ vọng và niềm tự hào lớn nhất đời mẹ..." },
        { q: "Nice to meet you!", hint: "Rất vui được gặp bạn!", ans: "Nice to meet you too.", opts: ["Nice to meet you too.", "I'm sorry.", "You're welcome."], memory: "Mảnh ký ức 17: Nụ cười hiền hậu của mẹ khi đón tiếp những người bạn thân thiết đến chơi nhà..." },
        { q: "Thank you so much for your help.", hint: "Cảm ơn bạn rất nhiều vì đã giúp đỡ.", ans: "You are welcome.", opts: ["You are welcome.", "No, problem.", "Yes, please."], memory: "Mảnh ký ức 18: Mẹ luôn dạy con phải biết nói lời cảm ơn và trân trọng lòng tốt của người khác..." },
        { q: "Where are you from?", hint: "Bạn từ đâu đến?", ans: "I am from Vietnam.", opts: ["I am from Vietnam.", "I am a student.", "I like pizza."], memory: "Mảnh ký ức 19: Tình yêu quê hương xứ sở và những món ăn đậm đà vị quê mà mẹ thường nấu..." }
    ];

    const zone3Library = [
        { word: "Library", definition: "Thư viện (Phá băng)", memory: "Mảnh ký ức 7: Cuốn sách cũ lấp lánh phép thuật nằm im lìm trên bàn của mẹ..." },
        { word: "Knowledge", definition: "Tri thức (Phá băng)", memory: "Mảnh ký ức 8: Mẹ nói tri thức là ngọn đèn duy nhất soi rọi đêm tối..." },
        { word: "Listen", definition: "Lắng nghe (Phá băng)", memory: "Mảnh ký ức 9: Tiếng mẹ khuyên bảo luôn ấm áp và bao dung vô bờ bến..." },
        { word: "Education", definition: "Giáo dục (Phá băng)", memory: "Mảnh ký ức 20: Dù vất vả thế nào, mẹ cũng luôn ưu tiên dành những điều tốt nhất cho việc học của con..." },
        { word: "History", definition: "Lịch sử (Phá băng)", memory: "Mảnh ký ức 21: Những câu chuyện kể về nguồn cội qua giọng kể trầm ấm của mẹ..." },
        { word: "Remember", definition: "Ghi nhớ (Phá băng)", memory: "Mảnh ký ức 22: Lời hứa của hai mẹ con dưới hiên nhà, rằng chúng ta sẽ không bao giờ quên nhau..." },
        { word: "Future", definition: "Tương lai (Phá băng)", memory: "Mảnh ký ức 23: Ánh mắt hy vọng của mẹ nhìn về con đường phía trước, nơi con sẽ trưởng thành vững vàng..." },
        { word: "Unbelievable", definition: "Không thể tin nổi", memory: "Mảnh ký ức 27: Mẹ bất ngờ khóc òa hạnh phúc khi chứng kiến con tự bước đi những bước đầu tiên trong đời..." },
        { word: "Challenge", definition: "Thử thách / Thách thức", memory: "Mảnh ký ức 28: Mẹ dặn: Khó khăn không phải để lùi bước, mà để chứng minh con kiên cường thế nào." },
        { word: "Environment", definition: "Môi trường sống", memory: "Mảnh ký ức 29: Ký ức về mảnh vườn xanh ngát mẹ trồng đầy hoa dại và cây thuốc nam mát rượi..." },
        { word: "Experience", definition: "Kinh nghiệm / Trải nghiệm", memory: "Mảnh ký ức 30: Vết sẹo nhỏ trên tay con và cái thổi phù dịu dàng từ đôi môi ấm áp của mẹ để dỗ dành..." },
        { word: "Opportunity", definition: "Cơ hội / Thời cơ", memory: "Mảnh ký ức 31: Mẹ khích lệ con tham gia những cuộc thi lớn, luôn là hậu phương vững chắc cho con." },
        { word: "Responsibility", definition: "Trách nhiệm", memory: "Mảnh ký ức 32: Bài học về sự tự lập, tự chịu trách nhiệm với những lỗi lầm nhỏ khi con còn thơ bé..." }
    ];

    const zone4Scramble = [
        { hint: "Tôi thích tiếng Anh", target: "I LIKE ENGLISH", words: ["LIKE", "I", "ENGLISH"], memory: "Mảnh ký ức 10: Ước mơ vươn ra thế giới của con luôn có bóng hình mẹ phía sau cổ vũ..." },
        { hint: "Mẹ là tất cả", target: "MOTHER IS MY EVERYTHING", words: ["MY", "IS", "MOTHER", "EVERYTHING"], memory: "Mảnh ký ức 11: Sự bình yên của mẹ chính là hạnh phúc trọn vẹn lớn nhất của đời con..." },
        { hint: "Chúng ta sẽ về nhà", target: "WE WILL GO HOME", words: ["GO", "WE", "HOME", "WILL"], memory: "Mảnh ký ức 12: Phá vỡ bóng tối, con nhất định đưa mẹ trở về ngôi nhà hạnh phúc của chúng ta!" },
        { hint: "Mẹ yêu con rất nhiều", target: "MY MOTHER LOVES ME SO MUCH", words: ["SO", "ME", "LOVES", "MY", "MOTHER", "MUCH"], memory: "Mảnh ký ức 24: Cái ôm ấm áp và những giọt nước mắt hạnh phúc của mẹ mỗi khi con đạt thành tích tốt..." },
        { hint: "Học tập mỗi ngày giúp bạn thông minh hơn", target: "STUDYING EVERY DAY MAKES YOU SMARTER", words: ["SMARTER", "EVERY", "MAKES", "DAY", "STUDYING", "YOU"], memory: "Mảnh ký ức 25: Những đêm dài mẹ thức cùng con bên ánh đèn bàn, dịu dàng quạt mát cho con học bài..." },
        { hint: "Tôi sẽ không bao giờ bỏ cuộc", target: "I WILL NEVER GIVE UP", words: ["GIVE", "NEVER", "WILL", "I", "UP"], memory: "Mảnh ký ức 26: Ý chí kiên cường mẹ truyền lại, giúp con đứng vững trước mọi giông bão cuộc đời..." },
        { hint: "Thời gian trôi qua rất nhanh", target: "TIME GOES BY VERY FAST", words: ["FAST", "GOES", "VERY", "TIME", "BY"], memory: "Mảnh ký ức 33: Mẹ vuốt tóc con, thốt lên rằng con trai của mẹ lớn nhanh quá, chẳng còn là em bé nũng nịu." },
        { hint: "Gia đình luôn đứng về phía bạn", target: "FAMILY ALWAYS STANDS BY YOUR SIDE", words: ["STANDS", "YOUR", "FAMILY", "ALWAYS", "SIDE", "BY"], memory: "Mảnh ký ức 34: Dù thế giới ngoài kia có quay lưng, mái nhà và vòng tay mẹ vẫn luôn rộng mở che chở Duy." },
        { hint: "Hãy làm việc chăm chỉ vì tương lai của bạn", target: "WORK HARD FOR YOUR FUTURE", words: ["FOR", "WORK", "YOUR", "FUTURE", "HARD"], memory: "Mảnh ký ức 35: Lời dặn dò nghiêm khắc nhưng đong đầy tình thương của mẹ trước mỗi kỳ thi quan trọng." },
        { hint: "Lắng nghe trái tim bạn", target: "LISTEN TO YOUR HEART", words: ["TO", "HEART", "YOUR", "LISTEN"], memory: "Mảnh ký ức 36: Khi con phân vân trước những ngã rẽ cuộc đời, mẹ nói hãy chọn điều làm con thanh thản nhất." },
        { hint: "Kiến thức là sức mạnh tối thượng", target: "KNOWLEDGE IS THE ULTIMATE POWER", words: ["POWER", "ULTIMATE", "THE", "KNOWLEDGE", "IS"], memory: "Mảnh ký ức 37: Cuốn sổ tay ghi chép những mẹo vặt, bài học hay mà mẹ tích lũy cả đời để lại cho con." }
    ];

    const zone5BossPools = {
        speech: [
            { word: "Transformation", definition: "Sự biến đổi (Thanh tẩy cốt lõi)", memory: "Mảnh ký ức vĩnh cửu: Mẹ ôm lấy con, bóng tối tan biến hoàn toàn dưới ánh bình minh." },
            { word: "Reunion", definition: "Sự đoàn tụ (Ký ức tối hậu)", memory: "Mảnh ký ức vĩnh cửu: Gia đình mình lại quây quần bên mâm cơm ấm cúng như ngày xưa." },
            { word: "Determination", definition: "Sự quyết tâm cao độ", memory: "Mảnh ký ức vĩnh cửu: Ánh mắt kiên định của Duy xuyên thấu tâm can quái vật bóng tối." },
            { word: "Enthusiasm", definition: "Sự hăng hái / Lòng nhiệt huyết", memory: "Mảnh ký ức vĩnh cửu: Ngọn lửa đam mê tri thức bùng cháy, thiêu rụi xiềng xích ma thuật." },
            { word: "Affection", definition: "Tình cảm chân thành / Lòng yêu thương", memory: "Mảnh ký ức vĩnh cửu: Sức mạnh vĩ đại nhất vũ trụ chính là tình mẫu tử thiêng liêng." },
            { word: "Perseverance", definition: "Sự kiên trì / Bền chí", memory: "Mảnh ký ức vĩnh cửu: Đi qua hàng trăm thử thách gian nan, Duy đã chứng minh mình xứng đáng." }
        ],
        quiz: [
            { q: "We have finally broken the curse, Mom!", hint: "Phá vỡ lời nguyền rồi mẹ ơi!", ans: "Yes, I am so proud of you, Lam.", opts: ["Yes, I am so proud of you, Lam.", "It is a big monster.", "No, it is freezing."] },
            { q: "Do you remember who I am, Mom?", hint: "Mẹ có nhớ con là ai không mẹ?", ans: "You are Lam, my beloved son.", opts: ["You are Lam, my beloved son.", "I am very tired.", "This is a dangerous place."] },
            { q: "What is the most powerful magic in the world?", hint: "Phép thuật mạnh nhất thế giới là gì?", ans: "It is the love of our family.", opts: ["It is the love of our family.", "It is fire magic.", "It is money and gold."] },
            { q: "Will we ever be separated again?", hint: "Chúng ta có bao giờ bị chia cắt nữa không?", ans: "Never, we will stay together forever.", opts: ["Never, we will stay together forever.", "Yes, tomorrow.", "I don't know the way."] },
            { q: "How did you survive in the dark, Mom?", hint: "Mẹ đã sống sót thế nào trong bóng tối?", ans: "By thinking about your beautiful smile.", opts: ["By thinking about your beautiful smile.", "By eating apples.", "By reading magic books."] }
        ],
        scramble: [
            { hint: "Ánh sáng tri thức đã chiến thắng bóng tối", target: "THE LIGHT OF KNOWLEDGE WON THE DARKNESS", words: ["DARKNESS", "THE", "KNOWLEDGE", "WON", "LIGHT", "OF", "THE"] },
            { hint: "Tình mẫu tử có thể chữa lành mọi vết thương", target: "MOTHER LOVE CAN HEAL ALL WOUNDS", words: ["HEAL", "LOVE", "WOUNDS", "CAN", "MOTHER", "ALL"] },
            { hint: "Tôi sẽ luôn bảo vệ gia đình mình", target: "I WILL ALWAYS PROTECT MY FAMILY", words: ["ALWAYS", "FAMILY", "PROTECT", "I", "MY", "WILL"] },
            { hint: "Bóng tối không thể tồn tại nơi có ánh sáng", target: "DARKNESS CANNOT EXIST WHERE LIGHT SHINES", words: ["SHINES", "EXIST", "DARKNESS", "LIGHT", "CANNOT", "WHERE"] },
            { hint: "Hành trình vạn dặm bắt đầu từ một bước chân", target: "A JOURNEY OF THOUSAND MILES BEGINS WITH A STEP", words: ["BEGINS", "A", "MILES", "STEP", "JOURNEY", "THOUSAND", "WITH", "OF"] }
        ]
    };
    const storySteps = [
        { speaker: "Hệ thống", text: "Một đêm bão bùng gầm rú, sấm chớp rạch ngang trời, bầu không khí u ám bao trùm ngôi nhà...", graphic: "⛈️" },
        { speaker: "Mẹ", text: "Con ơi, nhớ phải rèn luyện tri thức mỗi ngày, vững vàng bước đi con nhé...", graphic: "👩👦" },
        { speaker: "Quái vật", text: "Kha kha... Năng lượng tiêu cực đã chín muồi. Người mẹ này phải đi theo ta!", graphic: "👾" },
        { speaker: "Mẹ", text: "Con ơi! Hãy tích lũy năng lượng từ ngữ (Word Energy) để tìm và cứu mẹ...", graphic: "🌀" },
        { speaker: "Tinh linh", text: "Đừng sợ! Tôi là Tinh linh Hướng dẫn. Hãy dùng tiếng Anh thật chuẩn xác để phá vỡ các phong ấn ma thuật!", graphic: "🧚♂️", storm: false }
    ];

    // --- SAVE / LOAD GAME ---
    function saveGame() {
        localStorage.setItem(SAVE_KEY, JSON.stringify(gameState));
        updateHUD();
    }

    function loadGame() {
        const localData = localStorage.getItem(SAVE_KEY);
        if (localData) {
            try {
                gameState = JSON.parse(localData);
                updateHUD(); 
                const btnContinue = document.getElementById('btn-continue');
                if (btnContinue && (gameState.storyCompleted || gameState.currentStoryIndex > 0 || gameState.xp > 0)) {
                    btnContinue.disabled = false;
                }
            } catch (e) { console.error(e); }
        }
    }

    function updateHUD() {
        if(document.getElementById('val-coin')) document.getElementById('val-coin').innerText = gameState.coins;
        if(document.getElementById('val-xp')) document.getElementById('val-xp').innerText = gameState.xp;
        if(document.getElementById('val-energy')) document.getElementById('val-energy').innerText = gameState.wordEnergy;
        
        // Tính năng sáng tạo: Hệ thống Danh hiệu Học thuật tự động theo tiến trình XP
        let rankName = "Tập Sự";
        if (gameState.xp >= 300) rankName = "🔮Pháp Sư";
        else if (gameState.xp >= 150) rankName = "📜Học Giả";
        else if (gameState.xp >= 50) rankName = "⚔️Chiến Binh";
        
        if(document.getElementById('val-rank')) document.getElementById('val-rank').innerText = rankName;

        const nc = document.getElementById('node-city');
        const nl = document.getElementById('node-library');
        const ns = document.getElementById('node-station');
        const nf = document.getElementById('node-final');

        if (nc && gameState.wordEnergy >= 0) { nc.classList.remove('locked'); document.getElementById('lbl-city').innerText = "SẴN SÀNG"; }
        if (nl && gameState.wordEnergy >= 0) { nl.classList.remove('locked'); document.getElementById('lbl-library').innerText = "SẴN SÀNG"; }
        if (ns && gameState.wordEnergy >= 0) { ns.classList.remove('locked'); document.getElementById('lbl-station').innerText = "SẴN SÀNG"; }
        if (nf && gameState.wordEnergy >= 0) { nf.classList.remove('locked'); document.getElementById('lbl-final').innerText = "SẴN SÀNG"; }
    }

    // --- SCREEN NAVIGATION WITH TRANSITION ---
    function switchScreen(screenId) {
        const screens = document.querySelectorAll('.screen');
        screens.forEach(s => s.classList.remove('active'));
        
        const targetScreen = document.getElementById(screenId);
        if (targetScreen) {
            targetScreen.classList.add('active');
        }

        if (recognition && isListening) recognition.stop();
        if (window.speechSynthesis) window.speechSynthesis.cancel();
    }

    function startNewGame() {
        gameState = { coins: 0, xp: 0, wordEnergy: 0, currentStoryIndex: 0, storyCompleted: false, monsterMaxHP: 100, monsterCurrentHP: 100 };
        saveGame();
        switchScreen('screen-story');
        renderStoryStep();
    } 

    function continueGame() {
        if (gameState.storyCompleted) switchScreen('screen-map');
        else { switchScreen('screen-story'); renderStoryStep(); }
    }

    function goToHome() {
        if (confirm("Quay về màn hình chính?")) { switchScreen('screen-splash'); loadGame(); }
    }

    // --- STORY MECHANICS ---
    function renderStoryStep() {
        let data = storySteps[gameState.currentStoryIndex];
        document.getElementById('story-speaker').innerText = data.speaker;
        document.getElementById('story-text').innerText = data.text;
        document.getElementById('story-graphic').innerText = data.graphic;
    }

    function nextStoryStep() {
        gameState.currentStoryIndex++;
        if (gameState.currentStoryIndex < storySteps.length) {
            saveGame(); renderStoryStep();
        } else {
            gameState.storyCompleted = true; saveGame();
            switchScreen('screen-map');
        }
    }

// --- BATTLE MECHANICS CONTROLLER ---
function startBattleZone(zoneId) {
    
    zoneId = parseInt(zoneId, 10);

    currentZone = zoneId - 1; 
    
    switchScreen('screen-battle');

    const names = ["FOREST OF WORDS", "CITY OF ECHOES", "FROZEN LIBRARY", "SHADOW STATION", "⚡ FINAL GATE ⚡"];
    const icons = ["👾", "🔥", "❄️", "👺", "👑"];

    const zoneTitleEl = document.getElementById('battle-title-zone');
    if (zoneTitleEl) zoneTitleEl.innerText = names[currentZone];
    
    const subTitleEl = document.querySelector('.zone-display-header') || document.getElementById('sub-title-zone');
    if (subTitleEl) subTitleEl.innerText = names[currentZone];

    const monsterImgEl = document.getElementById('monster-img');
    if (monsterImgEl) monsterImgEl.innerText = icons[currentZone];

    if(currentZone === 4) { // Màn 5 (5 - 1 = 4) là Boss cuối
        gameState.monsterMaxHP = 300; 
        const badge = document.getElementById('boss-mechanic-badge');
        if (badge) badge.style.display = 'block';
    } else {
        gameState.monsterMaxHP = 100;
        const badge = document.getElementById('boss-mechanic-badge');
        if (badge) badge.style.display = 'none';
    }
    
    // Reset và khởi tạo máu
    gameState.monsterCurrentHP = gameState.monsterMaxHP;
    setupMonsterUI();
    generateRoundChallenge();
}

function setupMonsterUI() {
    let pct = (gameState.monsterCurrentHP / gameState.monsterMaxHP) * 100;
    
    const hpFill = document.getElementById('monster-hp-fill');
    if(hpFill) hpFill.style.width = pct + "%";
    
    const hpText = document.getElementById('monster-hp-text');
    if(hpText) hpText.innerText = `Khiên bảo vệ: ${gameState.monsterCurrentHP}/${gameState.monsterMaxHP}`;
}

function generateRoundChallenge() {
    document.querySelectorAll('.game-view-panel').forEach(p => p.classList.remove('active-panel'));

    let mode = "speech";
    if (currentZone === 0) mode = "speech";       // Màn 1: FOREST OF WORDS
    else if (currentZone === 1) mode = "quiz";     // Màn 2: CITY OF ECHOES
    else if (currentZone === 2) mode = "speech";   // Màn 3: FROZEN LIBRARY
    else if (currentZone === 3) mode = "scramble"; // Màn 4: SHADOW STATION
    else if (currentZone === 4) {                  // Màn 5: FINAL GATE (Boss)
        let rand = Math.random();
        mode = rand < 0.34 ? "speech" : (rand < 0.67 ? "quiz" : "scramble");
    }
    currentDataType = mode;

    if (mode === "speech") {
        const panel = document.getElementById('panel-speech');
        if (panel) panel.classList.add('active-panel');
        
        let pool = currentZone === 2 ? zone3Library : zone1Words;
        if (currentZone === 4) pool = zone5BossPools.speech;
        
        if (pool && pool.length > 0) {
            currentRoundData = pool[Math.floor(Math.random() * pool.length)];
            document.getElementById('target-word').innerText = currentRoundData.word;
            document.getElementById('target-meaning').innerText = currentRoundData.definition;
        }
        
        const msg = document.getElementById('speech-feedback-msg');
        if (msg) {
            msg.innerText = "Sẵn sàng nhận diện mic...";
            msg.className = "speech-feedback feedback-neutral";
        }
    } 
    else if (mode === "quiz") {
        const panel = document.getElementById('panel-quiz');
        if (panel) panel.classList.add('active-panel');
        
        let pool = currentZone === 4 ? zone5BossPools.quiz : zone2Conversations;
        
        if (pool && pool.length > 0) {
            currentRoundData = pool[Math.floor(Math.random() * pool.length)];
            document.getElementById('quiz-question-text').innerText = currentRoundData.q;
            document.getElementById('quiz-meaning-text').innerText = currentRoundData.hint;
        }
        
        const msg = document.getElementById('quiz-feedback-msg');
        if (msg) {
            msg.innerText = "Hãy phản hồi hội thoại chuẩn xác!";
            msg.className = "speech-feedback feedback-neutral";
        }

        let box = document.getElementById('quiz-options-box');
        if (box && currentRoundData && currentRoundData.opts) {
            box.innerHTML = "";
            currentRoundData.opts.forEach(opt => {
                let btn = document.createElement('button');
                btn.className = "btn-quiz-option";
                btn.innerText = opt;
                btn.onclick = () => {
                    if(opt === currentRoundData.ans) {
                        applyDamage(100, 'quiz-feedback-msg', "Phản xạ giao tiếp cực kỳ chuẩn xác!");
                    } else {
                        handleWrongAnswer('quiz-feedback-msg', "Câu trả lời sai! Boss cuối hồi khiên!");
                    }
                };
                box.appendChild(btn);
            });
        }
    } 
    else if (mode === "scramble") {
        const panel = document.getElementById('panel-scramble');
        if (panel) panel.classList.add('active-panel');
        
        let pool = currentZone === 4 ? zone5BossPools.scramble : zone4Scramble;
        
        if (pool && pool.length > 0) {
            currentRoundData = pool[Math.floor(Math.random() * pool.length)];
            document.getElementById('scramble-hint').innerText = currentRoundData.hint;
        }
        
        const msg = document.getElementById('scramble-feedback-msg');
        if (msg) {
            msg.innerText = "Sắp xếp từ để hoàn thiện câu.";
            msg.className = "speech-feedback feedback-neutral";
        }
        
        userScrambleAnswer = [];
        if (currentRoundData && currentRoundData.words) {
            let shuffled = [...currentRoundData.words].sort(() => Math.random() - 0.5);
            
            let slotsBox = document.getElementById('scramble-slots');
            let poolBox = document.getElementById('scramble-pool');
            if (slotsBox) slotsBox.innerHTML = "";
            if (poolBox) poolBox.innerHTML = "";

            for(let i=0; i<currentRoundData.words.length; i++) {
                let sl = document.createElement('div'); sl.className = "scramble-empty-slot"; sl.id = "sc-slot-" + i;
                if (slotsBox) slotsBox.appendChild(sl);
            }

            shuffled.forEach(w => {
                let btn = document.createElement('button');
                btn.className = "btn-scramble-word";
                btn.innerText = w;
                btn.onclick = () => {
                    if (userScrambleAnswer.length < currentRoundData.words.length) {
                        btn.classList.add('used');
                        userScrambleAnswer.push({ word: w, btnRef: btn });
                        updateScrambleUI();
                    }
                };
                if (poolBox) poolBox.appendChild(btn);
            });
        }
    }
}

    function updateScrambleUI() {
        for(let i=0; i<currentRoundData.words.length; i++) {
            let el = document.getElementById("sc-slot-" + i);
            if(el) el.innerText = userScrambleAnswer[i] ? userScrambleAnswer[i].word : "";
        }

        if(userScrambleAnswer.length === currentRoundData.words.length) {
            let constructedSentence = userScrambleAnswer.map(item => item.word).join(' ').trim().toUpperCase();
            let targetSentence = currentRoundData.target.trim().toUpperCase();
            
            if(constructedSentence === targetSentence) {
                applyDamage(100, 'scramble-feedback-msg', "Ghép từ chuẩn cấu trúc ngữ pháp!");
            } else {
                handleWrongAnswer('scramble-feedback-msg', "Cấu trúc chưa chính xác! Thử lại Bạn nhé.");
            }
        }
    }

    function handleWrongAnswer(feedbackId, msg) {
        // Tích hợp rung lắc màn hình khi trả lời sai kịch tính
        triggerScreenShake();
        // Hiện số điểm trừ hoặc cảnh báo bay lên
        triggerFloatingText("MISSED!", false);
        let fb = document.getElementById(feedbackId);
        if (fb) {
            fb.innerText = msg;
            fb.className = "speech-feedback feedback-error";
        }
        if(currentZone === 5) {
            gameState.monsterCurrentHP = Math.min(gameState.monsterCurrentHP + 30, gameState.monsterMaxHP);
            setupMonsterUI();
        }
    }

    function resetScrambleSentence() {
        userScrambleAnswer = [];
        document.querySelectorAll('.scramble-empty-slot').forEach(slot => slot.innerText = "");
        document.querySelectorAll('.btn-scramble-word').forEach(btn => btn.classList.remove('used'));
    }

    function applyDamage(amount, feedbackId, msg) {
        // Kích hoạt số sát thương chí mạng bay vọt lên màn hình cực đẹp
        triggerFloatingText(`CRITICAL -${amount} HP`, true);
        gameState.monsterCurrentHP = Math.max(gameState.monsterCurrentHP - amount, 0);
        setupMonsterUI();

        let fb = document.getElementById(feedbackId);
        if (fb) {
            fb.innerText = msg;
            fb.className = "speech-feedback feedback-success";
        }

        if (gameState.monsterCurrentHP <= 0) {
            setTimeout(() => { triggerVictoryPopup(); }, 600);
        } else {
            setTimeout(() => { generateRoundChallenge(); }, 1200);
        }
    }

    function playTargetAudio() {
        if (!currentRoundData || !currentRoundData.word) return;
        let textToSpeak = currentRoundData.word;
        
        let audioUrl = "https://dict.youdao.com/speech?audio=" + encodeURIComponent(textToSpeak) + "&le=eng";
        
        try {

            let audioPlayer = document.getElementById('game-universal-audio');
            if (!audioPlayer) {
                audioPlayer = document.createElement('audio');
                audioPlayer.id = 'game-universal-audio';
                audioPlayer.setAttribute('preload', 'auto');
                audioPlayer.style.display = 'none';
                document.body.appendChild(audioPlayer);
            }
            
            audioPlayer.src = audioUrl;
            
            audioPlayer.load();
            let playPromise = audioPlayer.play();
            
            if (playPromise !== undefined) {
                playPromise.catch(function(error) {
                    console.log("Audio play mồi thất bại, chuyển sang phương án dự phòng 2:", error);
                    fallbackSpeechSynthesis(textToSpeak);
                });
            }
        } catch (e) {
            console.error("Lỗi Audio gốc, chuyển qua SpeechSynthesis:", e);
            fallbackSpeechSynthesis(textToSpeak);
        }
    }

    
    // Tính năng sáng tạo: Tạo hiệu ứng pháo hoa hạt ma thuật (Magic Particle Burst) ăn mừng điểm cao
    
    // --- HỆ THỐNG HIỆU ỨNG SÁNG TẠO  ---
    
    // 1. Hiệu ứng Rung chuyển màn hình kịch tính (Screen Shake)
    function triggerScreenShake() {
        const container = document.getElementById('game-container');
        if (!container) return;
        container.style.transition = 'none';
        let intensity = 8;
        let count = 0;
        let shakeInterval = setInterval(() => {
            let x = (Math.random() - 0.5) * intensity;
            let y = (Math.random() - 0.5) * intensity;
            container.style.transform = `translate(${x}px, ${y}px)`;
            count++;
            if (count > 6) {
                clearInterval(shakeInterval);
                container.style.transform = 'none';
                container.style.transition = 'all 0.3s ease';
            }
        }, 50);
    }

    // 2. Hiệu ứng Số Sát Thương / Điểm số bay lên sinh động (Floating Text Popup)
    function triggerFloatingText(text, isCritical = false) {
        const container = document.getElementById('game-container');
        if (!container) return;
        const pop = document.createElement('div');
        pop.innerText = text;
        pop.style.position = 'absolute';
        pop.style.left = '50%';
        pop.style.top = '40%';
        pop.style.transform = 'translate(-50%, -50%)';
        pop.style.fontSize = isCritical ? '28px' : '22px';
        pop.style.fontWeight = '900';
        pop.style.color = isCritical ? '#eab308' : '#ef4444';
        pop.style.textShadow = '0 0 10px #000, 0 0 20px ' + (isCritical ? '#eab308' : '#ff4444');
        pop.style.zIndex = '1000';
        pop.style.pointerEvents = 'none';
        
        container.appendChild(pop);
        
        pop.animate([
            { transform: 'translate(-50%, -50%) scale(0.5)', opacity: 0 },
            { transform: 'translate(-50%, -120px) scale(1.2)', opacity: 1, offset: 0.3 },
            { transform: 'translate(-50%, -200px) scale(1)', opacity: 0 }
        ], {
            duration: 1000,
            easing: 'ease-out',
            fill: 'forwards'
        });
        
        setTimeout(() => pop.remove(), 1100);
    }

    // 3. Hệ thống Đốm bụi ma thuật lơ lửng nền (Cinematic Floating Background Orbs)
    function initBackgroundOrbs() {
        const container = document.getElementById('game-container');
        if (!container) return;
        // Giới hạn tối đa 12 hạt lơ lửng để tối ưu hiệu năng tuyệt đối
        for (let i = 0; i < 12; i++) {
            const orb = document.createElement('div');
            orb.className = 'ambient-orb';
            orb.style.position = 'absolute';
            orb.style.width = Math.random() * 40 + 20 + 'px';
            orb.style.height = orb.style.width;
            orb.style.backgroundColor = ['rgba(6, 182, 212, 0.15)', 'rgba(168, 85, 247, 0.12)', 'rgba(34, 197, 94, 0.1)'][Math.floor(Math.random() * 3)];
            orb.style.borderRadius = '50%';
            orb.style.filter = 'blur(15px)';
            orb.style.pointerEvents = 'none';
            orb.style.zIndex = '0';
            
            // Vị trí xuất phát ngẫu nhiên
            orb.style.left = Math.random() * 100 + '%';
            orb.style.top = Math.random() * 100 + '%';
            
            container.appendChild(orb);
            
            // Chuyển động lơ lửng mượt mà vô tận
            orb.animate([
                { transform: 'translate(0, 0) scale(1)', opacity: 0.3 },
                { transform: `translate(${(Math.random() - 0.5) * 60}px, ${(Math.random() - 0.5) * 60}px) scale(1.2)`, opacity: 0.7, offset: 0.5 },
                { transform: 'translate(0, 0) scale(1)', opacity: 0.3 }
            ], {
                duration: Math.random() * 6000 + 6000,
                iterations: Infinity,
                easing: 'ease-in-out'
            });
        }
    }

    function createMagicSparks() {
        const container = document.getElementById('game-container');
        if (!container) return;
        for (let i = 0; i < 25; i++) {
            const spark = document.createElement('div');
            spark.style.position = 'absolute';
            spark.style.width = Math.random() * 8 + 4 + 'px';
            spark.style.height = spark.style.width;
            spark.style.backgroundColor = ['#06b6d4', '#a855f7', '#22c55e', '#eab308', '#ff4444'][Math.floor(Math.random() * 5)];
            spark.style.borderRadius = '50%';
            spark.style.left = '50%';
            spark.style.top = '60%';
            spark.style.zIndex = '999';
            spark.style.pointerEvents = 'none';
            spark.style.boxShadow = '0 0 10px ' + spark.style.backgroundColor;
            
            // Tính toán hướng bay ngẫu nhiên dạng pháo hoa
            const angle = Math.random() * Math.PI * 2;
            const velocity = Math.random() * 120 + 60;
            const destX = Math.cos(angle) * velocity;
            const destY = Math.sin(angle) * velocity - 30; // Hơi hướng lên trên
            
            container.appendChild(spark);
            
            spark.animate([
                { transform: 'translate(0, 0) scale(1)', opacity: 1 },
                { transform: `translate(${destX}px, ${destY}px) scale(0)`, opacity: 0 }
            ], {
                duration: Math.random() * 600 + 600,
                easing: 'cubic-bezier(0.1, 0.8, 0.3, 1)',
                fill: 'forwards'
            });
            
            setTimeout(() => spark.remove(), 1200);
        }
    }

    function fallbackSpeechSynthesis(text) {
        if ('speechSynthesis' in window) {
            let utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'en-US';
            utterance.rate = 0.85;
            utterance.pitch = 1.0;
            
            let voices = window.speechSynthesis.getVoices();
            if (voices.length > 0) {
                let enVoice = voices.find(v => v.lang.includes('en-US') || v.lang.includes('en-'));
                if (enVoice) utterance.voice = enVoice;
            }
            window.speechSynthesis.speak(utterance);
        }
    }

    
    function calculateSimilarity(str1, str2) {
        let s1 = str1.trim().toLowerCase();
        let s2 = str2.trim().toLowerCase();
        if (s1 === s2) return 100;
        if (s1.includes(s2) || s2.includes(s1)) {
          
            let base = Math.round(85 + Math.random() * 13);
            return Math.min(base, 100);
        }
       
        let track = Array(s2.length + 1).fill(null).map(() => Array(s1.length + 1).fill(null));
        for (let i = 0; i <= s1.length; i += 1) track[0][i] = i;
        for (let j = 0; j <= s2.length; j += 1) track[j][0] = j;
        for (let j = 1; j <= s2.length; j += 1) {
            for (let i = 1; i <= s1.length; i += 1) {
                let indicator = s1[i - 1] === s2[j - 1] ? 0 : 1;
                track[j][i] = Math.min(
                    track[j][i - 1] + 1, 
                    track[j - 1][i] + 1, 
                    track[j - 1][i - 1] + 1 
                );
            }
        }
        let distance = track[s2.length][s1.length];
        let maxLength = Math.max(s1.length, s2.length);
        if (maxLength === 0) return 100;
        let pct = Math.round(((maxLength - distance) / maxLength) * 100);
        return Math.max(0, pct);
    }

    let recognition;
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        recognition = new SpeechRecognition();
        recognition.lang = 'en-US';
        
        recognition.onstart = function() {
            isListening = true;
            if(document.getElementById('mic-btn')) document.getElementById('mic-btn').classList.add('recording');
        };
        recognition.onerror = function() {
            isListening = false;
            if(document.getElementById('mic-btn')) document.getElementById('mic-btn').classList.remove('recording');
        };
        recognition.onend = function() { 
            isListening = false; 
            if(document.getElementById('mic-btn')) document.getElementById('mic-btn').classList.remove('recording'); 
        };
        recognition.onresult = function(event) {
            const resultText = event.results[0][0].transcript.trim().toLowerCase();
            const targetText = currentRoundData.word.trim().toLowerCase();
            
            // Lấy độ tin cậy chất giọng thực tế từ hệ thống nhận diện (từ 0.0 đến 1.0)
            let speechConfidence = event.results[0][0].confidence || 0.85;
            
            // Tính độ tương đồng từ vựng dựa trên khoảng cách ký tự
            let textSimilarity = calculateSimilarity(resultText, targetText);
            
            // Tỷ lệ chính xác cuối cùng phụ thuộc trực tiếp vào chất giọng người đọc và độ khớp từ
            let accuracyPct = 0;
            
            if (resultText === targetText) {
                // Đọc đúng từ, số điểm dao động từ 85% - 100% hoàn toàn dựa vào chất giọng/độ rõ âm của mic
                accuracyPct = Math.round(85 + (speechConfidence * 15));
            } else if (resultText.includes(targetText)) {
                // Đọc có chứa từ mục tiêu nhưng bị lẫn âm khác, dao động từ 75% - 90% dựa theo chất giọng
                accuracyPct = Math.round(75 + (speechConfidence * 15));
            } else {
                // Đọc lệch từ, tính theo độ tương đồng ký tự thực tế kết hợp trọng số chất giọng
                accuracyPct = Math.round(textSimilarity * (0.4 + speechConfidence * 0.6));
            }
            
            // Đảm bảo giá trị nằm trong khoảng từ 0% đến 100%
            accuracyPct = Math.max(0, Math.min(100, accuracyPct));
            
            // Điều kiện vượt qua thử thách: Đọc đúng từ hoặc tỷ lệ chất giọng đạt từ 78% trở lên
            if (resultText === targetText || resultText.includes(targetText) || accuracyPct >= 78) {
                applyDamage(100, 'speech-feedback-msg', `Phát âm chính xác! Bạn đã đọc đúng ${accuracyPct}%.`);
            } else {
                handleWrongAnswer('speech-feedback-msg', `Hệ thống ghi nhận: "${resultText}". Bạn đã đọc đúng ${accuracyPct}%. Thử lại nào!`);
            }
        };
    }

    function toggleSpeechRecognition() {
        if (!recognition) {
            let simulate = confirm("[MÔ PHỎNG] Trình duyệt không hỗ trợ mic. Bấm OK để báo ĐÚNG.");
            if (simulate) {
                let mockPct = Math.round(92 + Math.random() * 8); 
                applyDamage(100, 'speech-feedback-msg', `Đọc chính xác! Bạn đã đọc đúng ${mockPct}%.`);
            }
            return;
        }
        if (isListening) recognition.stop();
        else { try { recognition.start(); } catch(e){} }
    }

    function triggerVictoryPopup() {
        if(currentZone === 5) {

            startEndGameVideo();
        } else {
            document.getElementById('reward-title-header').innerText = "Quái Vật Đã Bị Thanh Tẩy!";
            document.getElementById('reward-memory-text').innerText = currentRoundData.memory || "Bạn đã nhớ lại một phần cuộc sống ấm áp bên người mẹ thân yêu.";
            switchScreen('screen-reward');
        }
    }

    function claimRewards() {
        gameState.coins += 25;
        gameState.xp += 50;
        gameState.wordEnergy += 20;
        saveGame();
        switchScreen('screen-map');
    }

    function unlockMobileSpeech() {
        if ('speechSynthesis' in window) {
            let u = new SpeechSynthesisUtterance('');
            u.lang = 'en-US';
            u.volume = 0; 
            window.speechSynthesis.speak(u);

            document.removeEventListener('click', unlockMobileSpeech);
            document.removeEventListener('touchstart', unlockMobileSpeech);
        }
    }
    document.addEventListener('click', unlockMobileSpeech);
    document.addEventListener('touchstart', unlockMobileSpeech);

    if ('speechSynthesis' in window && window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = function() {
            window.speechSynthesis.getVoices();
        };
    }

    
    // Hàm đóng màn hình Splash ma thuật mở đầu mượt mà
    function startMainGameJourney() {
        const splash = document.getElementById('custom-magic-splash');
        if (splash) {
            splash.style.opacity = '0';
            splash.style.visibility = 'hidden';
            setTimeout(() => {
                splash.remove();                
                if (introVid) {
                    introVid.play().catch(e => console.log("Chờ tương tác người dùng để phát video"));
                }
            }, 800);
        }
    }

    // Khởi tạo các hạt sáng ma thuật di chuyển chậm rãi trên nền Splash
    function initSplashAmbientParticles() {
        const pContainer = document.getElementById('splash-particle-ambient');
        if (!pContainer) return;
        for (let i = 0; i < 15; i++) {
            const part = document.createElement('div');
            part.style.position = 'absolute';
            part.style.width = Math.random() * 5 + 2 + 'px';
            part.style.height = part.style.width;
            part.style.backgroundColor = Math.random() > 0.5 ? '#06b6d4' : '#a855f7';
            part.style.borderRadius = '50%';
            part.style.filter = 'blur(1px)';
            part.style.opacity = Math.random() * 0.6 + 0.2;
            part.style.left = Math.random() * 100 + '%';
            part.style.top = Math.random() * 100 + '%';
            pContainer.appendChild(part);

            part.animate([
                { transform: 'translate(0, 0)', opacity: part.style.opacity },
                { transform: `translate(${(Math.random() - 0.5) * 40}px, ${(Math.random() - 0.5) * 40}px)`, opacity: 0.1, offset: 0.5 },
                { transform: 'translate(0, 0)', opacity: part.style.opacity }
            ], {
                duration: Math.random() * 4000 + 4000,
                iterations: Infinity,
                easing: 'ease-in-out'
            });
        }
    }
    
    // Kích hoạt nạp hạt sau khi DOM sẵn sàng
    setTimeout(initSplashAmbientParticles, 100);

    window.onload = function() { 
        loadGame(); 
        // Khởi động các đốm bụi ma thuật lơ lửng không gian nền siêu đẹp
        initBackgroundOrbs();
    };
