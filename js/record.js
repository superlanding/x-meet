// 錄音相關的全局變量
let mediaRecorder = null;
let audioChunks = [];
let isRecording = false;
let audioContext = null;
let analyser = null;
let animationFrame = null;
let testMediaRecorder = null;
let testAudioChunks = [];
let isTestRecording = false;
let testStream = null;
let hasReachedNormalVolume = false;
let recordingStartTime = null;
let recordingTimer = null;
let audioPlayer = null;
let audioAnalyser = null;

// 錄音相關的 DOM 元素
const startRecordingBtn = document.getElementById('startRecordingBtn');
const uploadAudioBtn = document.getElementById('uploadAudioBtn');
const audioFileInput = document.getElementById('audioFileInput');
const recordingConfirmModalElement = document.getElementById('recordingConfirmModal');
const recordingConfirmModal = new bootstrap.Modal(recordingConfirmModalElement);
const confirmRecordingBtn = document.getElementById('confirmRecordingBtn');
const audioVisualizer = document.getElementById('audioVisualizer');
const testPlayBtn = document.getElementById('testPlayBtn');
const testAudioPlayer = document.getElementById('testAudioPlayer');
const recordingPanel = document.getElementById('recordingPanel');
const recordingVisualizer = document.getElementById('recordingVisualizer');
const recordingTime = document.querySelector('.recording-time');
const stopRecordingBtn = document.getElementById('stopRecordingBtn');
const audioPlayerPanel = document.getElementById('audioPlayer');
const audioWaveform = document.getElementById('audioWaveform');
const playAudioBtn = document.getElementById('playAudioBtn');
const downloadAudioBtn = document.getElementById('downloadAudioBtn');
const currentTimeSpan = document.getElementById('currentTime');
const totalTimeSpan = document.getElementById('totalTime');

// 綁定停止錄音按鈕事件
stopRecordingBtn.addEventListener('click', stopRecording);

// 錄音按鈕點擊事件
async function handleRecordingClick() {
    if (!isRecording) {
        try {
            testStream = await navigator.mediaDevices.getUserMedia({ audio: true });
            await setupAudioVisualizer(testStream);
            recordingConfirmModal.show();
        } catch (error) {
            console.error('無法訪問麥克風:', error);
            alert('無法訪問麥克風，請確認權限設置');
        }
    } else {
        stopRecording();
    }
}

// 綁定錄音按鈕事件
startRecordingBtn.addEventListener('click', handleRecordingClick);

// 測試播放按鈕點擊事件
testPlayBtn.addEventListener('click', async () => {
    if (!isTestRecording) {
        await startTestRecording();
    } else {
        stopTestRecording();
    }
});

// 開始測試錄音
async function startTestRecording() {
    try {
        if (!testStream) {
            testStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        }
        
        testMediaRecorder = new MediaRecorder(testStream);
        testAudioChunks = [];

        testMediaRecorder.ondataavailable = (event) => {
            testAudioChunks.push(event.data);
        };

        testMediaRecorder.onstop = () => {
            const audioBlob = new Blob(testAudioChunks, { type: 'audio/wav' });
            const audioUrl = URL.createObjectURL(audioBlob);
            testAudioPlayer.src = audioUrl;
            testAudioPlayer.play();
            testPlayBtn.innerHTML = '<i class="bi bi-play-circle"></i> 重新錄音';
        };

        testMediaRecorder.start();
        isTestRecording = true;
        testPlayBtn.innerHTML = '<i class="bi bi-stop-circle"></i> 停止錄音';
    } catch (error) {
        console.error('測試錄音失敗:', error);
        alert('無法開始測試錄音，請確認麥克風權限');
    }
}

// 停止測試錄音
function stopTestRecording() {
    if (testMediaRecorder && isTestRecording) {
        testMediaRecorder.stop();
        isTestRecording = false;
    }
}

// 音頻播放器事件
testAudioPlayer.addEventListener('ended', () => {
    testPlayBtn.innerHTML = '<i class="bi bi-play-circle"></i> 重新錄音';
});

// 設置音頻可視化
async function setupAudioVisualizer(stream) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const source = audioContext.createMediaStreamSource(stream);
    analyser = audioContext.createAnalyser();
    analyser.fftSize = 256;
    analyser.smoothingTimeConstant = 0.8;
    source.connect(analyser);
    startVisualization();
}

// 開始音頻可視化
function startVisualization() {
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    const canvas = audioVisualizer;
    const canvasCtx = canvas.getContext('2d');
    const volumeNumber = document.getElementById('volumeNumber');
    const volumeBar = document.getElementById('volumeBar');
    const volumeStatus = document.getElementById('volumeStatus');
    const confirmRecordingBtn = document.getElementById('confirmRecordingBtn');
    const testPlayBtn = document.getElementById('testPlayBtn');

    // 聲音閾值設定
    const MIN_VOLUME = 5;
    const MAX_VOLUME = 95;
    const SILENCE_THRESHOLD = 2;

    function draw() {
        animationFrame = requestAnimationFrame(draw);
        analyser.getByteFrequencyData(dataArray);
        
        const average = dataArray.reduce((a, b) => a + b) / bufferLength;
        const volume = Math.min(100, Math.round((average / 30) * 100));

        volumeNumber.textContent = volume;
        volumeBar.style.width = `${volume}%`;

        if (volume < SILENCE_THRESHOLD) {
            volumeStatus.innerHTML = '<i class="bi bi-volume-mute-fill text-danger me-2"></i>請說話測試麥克風';
            volumeStatus.className = 'mt-2 text-danger';
            if (!hasReachedNormalVolume) {
                confirmRecordingBtn.disabled = true;
                testPlayBtn.disabled = true;
            }
        } else if (volume < MIN_VOLUME) {
            volumeStatus.innerHTML = '<i class="bi bi-volume-down-fill text-warning me-2"></i>聲音有點小，請靠近麥克風';
            volumeStatus.className = 'mt-2 text-warning';
            if (!hasReachedNormalVolume) {
                confirmRecordingBtn.disabled = true;
                testPlayBtn.disabled = true;
            }
        } else if (volume > MAX_VOLUME) {
            volumeStatus.innerHTML = '<i class="bi bi-volume-up-fill text-danger me-2"></i>聲音太大，請調整麥克風距離';
            volumeStatus.className = 'mt-2 text-danger';
            if (!hasReachedNormalVolume) {
                confirmRecordingBtn.disabled = true;
                testPlayBtn.disabled = true;
            }
        } else {
            hasReachedNormalVolume = true;
            volumeStatus.innerHTML = '<i class="bi bi-check-circle-fill text-success me-2"></i>音量正常，可以開始錄音';
            volumeStatus.className = 'mt-2 text-success';
            confirmRecordingBtn.disabled = false;
            testPlayBtn.disabled = false;
        }

        canvasCtx.fillStyle = '#f8f9fa';
        canvasCtx.fillRect(0, 0, canvas.width, canvas.height);

        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const radius = Math.min(centerX, centerY) - 10;
        const barWidth = (2 * Math.PI) / bufferLength;

        canvasCtx.beginPath();
        canvasCtx.strokeStyle = '#6c5ce7';
        canvasCtx.lineWidth = 2;

        for (let i = 0; i < bufferLength; i++) {
            const barHeight = (dataArray[i] / 255) * radius * 0.5;
            const angle = i * barWidth;
            const x = centerX + Math.cos(angle) * (radius + barHeight);
            const y = centerY + Math.sin(angle) * (radius + barHeight);

            if (i === 0) {
                canvasCtx.moveTo(x, y);
            } else {
                canvasCtx.lineTo(x, y);
            }
        }

        canvasCtx.closePath();
        canvasCtx.stroke();

        canvasCtx.beginPath();
        canvasCtx.fillStyle = '#a8a4e6';
        canvasCtx.arc(centerX, centerY, radius * 0.3, 0, 2 * Math.PI);
        canvasCtx.fill();

        const pulseSize = (Math.sin(Date.now() / 200) + 1) * 5;
        canvasCtx.beginPath();
        canvasCtx.strokeStyle = '#6c5ce7';
        canvasCtx.lineWidth = 2;
        canvasCtx.arc(centerX, centerY, radius * 0.3 + pulseSize, 0, 2 * Math.PI);
        canvasCtx.stroke();
    }

    draw();
}

// 停止音頻可視化
function stopVisualization() {
    if (animationFrame) {
        cancelAnimationFrame(animationFrame);
        animationFrame = null;
    }
    if (audioContext) {
        audioContext.close();
        audioContext = null;
    }
}

// Modal 關閉時清理資源
recordingConfirmModalElement.addEventListener('hidden.bs.modal', () => {
    stopVisualization();
    if (testStream) {
        testStream.getTracks().forEach(track => track.stop());
        testStream = null;
    }
    if (testMediaRecorder) {
        testMediaRecorder.stop();
        testMediaRecorder = null;
    }
    if (testAudioPlayer) {
        testAudioPlayer.pause();
        testAudioPlayer.currentTime = 0;
    }
    isTestRecording = false;
    testAudioChunks = [];
    hasReachedNormalVolume = false;
});

// 確認錄音按鈕點擊事件
confirmRecordingBtn.addEventListener('click', async () => {
    recordingConfirmModal.hide();
    stopVisualization();
    if (testStream) {
        testStream.getTracks().forEach(track => track.stop());
    }
    await startRecording();
});

// 開始正式錄音
async function startRecording() {
    try {
        // 隱藏音頻播放器
        audioPlayerPanel.classList.add('d-none');
        
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorder = new MediaRecorder(stream);
        audioChunks = [];
        
        mediaRecorder.ondataavailable = (event) => {
            audioChunks.push(event.data);
        };

        mediaRecorder.onstop = async () => {
            const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
            const audioUrl = URL.createObjectURL(audioBlob);
            
            try {
                // 先刪除舊的音訊檔案
                await Database.deleteRecording(CONFIG.currentMeetingId);
                // 保存新的音訊檔案
                await Database.saveRecording(CONFIG.currentMeetingId, audioBlob);
                showAudioPlayer(audioUrl);
            } catch (error) {
                console.error('儲存錄音失敗:', error);
                alert('儲存錄音失敗，請稍後再試');
            }
            
            stream.getTracks().forEach(track => track.stop());
            if (audioContext) {
                await audioContext.close();
                audioContext = null;
            }
            if (animationFrame) {
                cancelAnimationFrame(animationFrame);
                animationFrame = null;
            }
        };

        await setupRecordingVisualizer(stream);
        
        mediaRecorder.start();
        isRecording = true;
        recordingStartTime = Date.now();
        
        recordingPanel.classList.remove('d-none');
        startRecordingBtn.classList.add('d-none');
        recordingConfirmModal.hide();
        
        updateRecordingTime();
    } catch (error) {
        console.error('開始錄音失敗:', error);
        alert('開始錄音失敗，請稍後再試');
    }
}

// 停止錄音
function stopRecording() {
    if (mediaRecorder && isRecording) {
        mediaRecorder.stop();
        isRecording = false;
        if (recordingTimer) {
            clearInterval(recordingTimer);
            recordingTimer = null;
        }
        stopRecordingBtn.innerHTML = '<i class="bi bi-check-circle"></i> 完成＆儲存錄音';
    }
}

// 設置錄音可視化
async function setupRecordingVisualizer(stream) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const source = audioContext.createMediaStreamSource(stream);
    analyser = audioContext.createAnalyser();
    analyser.fftSize = 256;
    source.connect(analyser);
    
    const canvas = document.getElementById('recordingVisualizer');
    const ctx = canvas.getContext('2d');
    
    function draw() {
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        analyser.getByteFrequencyData(dataArray);
        
        ctx.fillStyle = 'rgb(200, 200, 200)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        const barWidth = (canvas.width / bufferLength) * 2.5;
        let barHeight;
        let x = 0;
        
        for (let i = 0; i < bufferLength; i++) {
            barHeight = dataArray[i] / 2;
            
            ctx.fillStyle = `rgb(${barHeight + 100},50,50)`;
            ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
            
            x += barWidth + 1;
        }
        
        animationFrame = requestAnimationFrame(draw);
    }
    
    draw();
}

// 更新錄音時間
function updateRecordingTime() {
    recordingTimer = setInterval(() => {
        const elapsed = Date.now() - recordingStartTime;
        const minutes = Math.floor(elapsed / 60000);
        const seconds = Math.floor((elapsed % 60000) / 1000);
        recordingTime.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }, 1000);
}

// 顯示音頻播放器
function showAudioPlayer(audioUrl) {
    audioPlayerPanel.classList.remove('d-none');
    recordingPanel.classList.add('d-none');
    
    const audio = new Audio();
    audio.src = audioUrl;
    audioPlayer = audio;
    
    setupAudioWaveform(audioUrl);
    
    playAudioBtn.onclick = () => {
        if (audioPlayer.paused) {
            audioPlayer.play().catch(error => {
                console.error('播放失敗:', error);
                alert('播放失敗，請確認檔案格式是否正確');
            });
            playAudioBtn.innerHTML = '<i class="bi bi-pause-circle"></i>';
        } else {
            audioPlayer.pause();
            playAudioBtn.innerHTML = '<i class="bi bi-play-circle"></i>';
        }
    };
    
    audioPlayer.addEventListener('timeupdate', () => {
        currentTimeSpan.textContent = formatTime(audioPlayer.currentTime);
    });
    
    audioPlayer.addEventListener('loadedmetadata', () => {
        totalTimeSpan.textContent = formatTime(audioPlayer.duration);
    });

    audioPlayer.addEventListener('error', (e) => {
        console.error('音頻載入錯誤:', e);
        alert('音頻載入失敗，請確認檔案格式是否正確');
    });
    
    downloadAudioBtn.onclick = () => {
        const a = document.createElement('a');
        a.href = audioUrl;
        a.download = `meeting-${CONFIG.currentMeetingId}-${new Date().toISOString()}.wav`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    // 檢查是否已經存在產生逐字稿按鈕
    const existingTranscriptBtn = downloadAudioBtn.parentNode.querySelector('button:has(i.bi-text-paragraph)');
    if (!existingTranscriptBtn) {
        // 添加產生逐字稿按鈕
        const generateTranscriptBtn = document.createElement('button');
        generateTranscriptBtn.className = 'btn btn-primary ms-2';
        generateTranscriptBtn.innerHTML = '<i class="bi bi-text-paragraph"></i> 產生逐字稿';
        generateTranscriptBtn.onclick = generateTranscript;
        downloadAudioBtn.parentNode.appendChild(generateTranscriptBtn);
    }
}

// 設置音頻波形
async function setupAudioWaveform(audioUrl) {
    const response = await fetch(audioUrl);
    const arrayBuffer = await response.arrayBuffer();
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    
    const canvas = document.getElementById('audioWaveform');
    const ctx = canvas.getContext('2d');
    
    const data = audioBuffer.getChannelData(0);
    const step = Math.ceil(data.length / canvas.width);
    const amp = canvas.height / 2;
    
    ctx.fillStyle = 'rgb(200, 200, 200)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.beginPath();
    ctx.moveTo(0, amp);
    
    for (let i = 0; i < canvas.width; i++) {
        let min = 1.0;
        let max = -1.0;
        
        for (let j = 0; j < step; j++) {
            const datum = data[(i * step) + j];
            if (datum < min) min = datum;
            if (datum > max) max = datum;
        }
        
        ctx.lineTo(i, (1 + min) * amp);
        ctx.lineTo(i, (1 + max) * amp);
    }
    
    ctx.strokeStyle = 'rgb(0, 0, 0)';
    ctx.stroke();
}

// 格式化時間
function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    seconds = Math.floor(seconds % 60);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

// 跳轉到指定時間並播放
function toTime(timeString) {
    try {
        if (!audioPlayer) {
            throw new Error('沒有可播放的音頻');
        }

        // 解析時間字串 (格式: "MM:SS")
        const [minutes, seconds] = timeString.split(':').map(Number);
        const targetTime = minutes * 60 + seconds;

        // 檢查時間是否有效
        if (isNaN(targetTime) || targetTime < 0 || targetTime > audioPlayer.duration) {
            throw new Error('無效的時間格式或超出音頻長度');
        }

        // 設置播放時間
        audioPlayer.currentTime = targetTime;

        // 如果正在播放，繼續播放；如果暫停，則開始播放
        if (audioPlayer.paused) {
            audioPlayer.play().catch(error => {
                console.error('播放失敗:', error);
                alert('播放失敗，請確認檔案格式是否正確');
            });
            playAudioBtn.innerHTML = '<i class="bi bi-pause-circle"></i>';
        }
    } catch (error) {
        console.error('跳轉時間失敗:', error);
        alert(error.message || '跳轉時間失敗，請稍後再試');
    }
}

// 檔案上傳按鈕點擊事件
uploadAudioBtn.addEventListener('click', () => {
    audioFileInput.click();
});

// 檔案選擇事件
audioFileInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const supportedMimeTypes = [
        'audio/wav',
        'audio/mp3',
        'audio/m4a',
        'audio/ogg',
        'audio/x-m4a',
        'audio/aac',
        'audio/mpeg'
    ];

    const supportedExtensions = ['.wav', '.mp3', '.m4a', '.ogg', '.aac'];
    const fileExtension = '.' + file.name.split('.').pop().toLowerCase();

    if (!supportedMimeTypes.includes(file.type) && !supportedExtensions.includes(fileExtension)) {
        const supportedFormats = CONFIG.app.supportedAudioFormats.extensions.join('、');
        alert(`不支援的檔案格式，請上傳 ${supportedFormats} 格式的音訊檔案`);
        return;
    }

    if (file.size > CONFIG.app.supportedAudioFormats.maxFileSize) {
        const maxSizeMB = CONFIG.app.supportedAudioFormats.maxFileSize / (1024 * 1024);
        alert(`檔案大小超過限制，請上傳小於 ${maxSizeMB}MB 的檔案`);
        return;
    }

    try {
        uploadAudioBtn.disabled = true;
        uploadAudioBtn.innerHTML = '<i class="bi bi-arrow-repeat"></i> 上傳中...';
        
        const loadingOverlay = document.createElement('div');
        loadingOverlay.className = 'position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center bg-dark bg-opacity-50';
        loadingOverlay.style.zIndex = '9999';
        loadingOverlay.innerHTML = `
            <div class="text-white text-center">
                <div class="spinner-border mb-2" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
                <div>正在處理音訊檔案...</div>
            </div>
        `;
        document.body.appendChild(loadingOverlay);

        // 先刪除舊的音訊檔案
        await Database.deleteRecording(CONFIG.currentMeetingId);
        // 保存新的音訊檔案
        await Database.saveRecording(CONFIG.currentMeetingId, file);
        const audioUrl = URL.createObjectURL(file);
        showAudioPlayer(audioUrl);
    } catch (error) {
        console.error('上傳音訊檔案失敗:', error);
        alert('上傳音訊檔案失敗，請稍後再試');
    } finally {
        uploadAudioBtn.disabled = false;
        uploadAudioBtn.innerHTML = '<i class="bi bi-upload"></i> 上傳會議音訊檔';
        
        const loadingOverlay = document.querySelector('.position-fixed');
        if (loadingOverlay) {
            loadingOverlay.remove();
        }
    }
});

// 格式化逐字稿
function formatTranscript(words) {
    let speakers = [];
    let formattedText = '';
    let currentSpeaker = null;
    let currentTimestamp = '';

    words.forEach((word, index) => {
        const startTime = formatTime(word.start / 1000);
        const speaker = `講者${word.speaker}`;
        // 加入講者列表
        if (speakers.indexOf(speaker) === -1) {
            speakers.push(speaker);
        }
        currentTimestamp = startTime;
        
        if (currentSpeaker !== speaker && index !== 0 && currentSpeaker !== null) {
            // 換行 (換講者、飛首行)
            formattedText += "\n"
        }

        // 如果是新的發話者，或是第一個字
        if (currentSpeaker !== speaker) {
            formattedText += `${currentTimestamp} ${speaker}: ${word.text.trim()}`;
        } else {
            // 同一個發話者，繼續加入文字
            formattedText += word.text.trim();
        }

        currentSpeaker = speaker;
    });

    speakers.push("");

    return [
        "【這裡是講者對應的人員】\n",
        speakers.join("代表 ______ \n"),
        "【名詞定義＆修正】\n\n\n\n",
        "\n【以下是會議逐字稿】\n",
        formattedText
    ].join("\n")
}

// 載入逐字稿
async function loadTranscript() {
    try {
        // 檢查 marked 庫是否已加載
        if (typeof marked === 'undefined') {
            console.error('marked 庫未加載');
            return;
        }

        // 檢查是否有有效的會議 ID
        if (!CONFIG.currentMeetingId) {
            return;
        }

        const transcript = await Database.getMeetingTranscript(CONFIG.currentMeetingId);

        if (transcript) {
            // 更新逐字稿內容
            const transcriptContent = document.getElementById('transcriptContent');
            if (transcriptContent) {
                // 將時間格式轉換為可點擊的連結
                let formattedContent = transcript.content
                    // 先將換行符轉換為特殊標記
                    .replace(/\n/g, '{{BR}}')
                    // 將時間格式轉換為可點擊的連結
                    .replace(/(\d{2}:\d{2})/g, '<a href="#" class="text-primary text-decoration-none" onclick="toTime(\'$1\'); return false;">$1</a>')
                    // 將特殊標記轉換回換行標籤
                    .replace(/{{BR}}/g, '<br>');

                transcriptContent.innerHTML = formattedContent;
                // 添加樣式確保換行正確顯示
                transcriptContent.style.whiteSpace = 'pre-wrap';
                transcriptContent.style.lineHeight = '1.5';
                // 添加固定高度和滾動條
                transcriptContent.style.maxHeight = '500px';
                transcriptContent.style.overflowY = 'auto';
                transcriptContent.style.padding = '1rem';
                transcriptContent.style.border = '1px solid #dee2e6';
                transcriptContent.style.borderRadius = '0.375rem';

                // 檢查是否已經存在產生會議記錄按鈕
                const existingSummaryBtn = transcriptContent.parentNode.querySelector('#generateSummaryBtn');
                if (!existingSummaryBtn) {
                    // 只有在按鈕不存在時才創建新按鈕
                    const generateSummaryBtn = document.createElement('button');
                    generateSummaryBtn.id = 'generateSummaryBtn';
                    generateSummaryBtn.className = 'btn btn-primary mt-3';
                    generateSummaryBtn.innerHTML = '<i class="bi bi-file-text"></i> 產生會議紀錄 (from Gemini)';
                    generateSummaryBtn.onclick = generateMeetingSummary;
                    transcriptContent.parentNode.appendChild(generateSummaryBtn);
                }
            }
        }
    } catch (error) {
        console.error('載入逐字稿失敗:', error);
        alert('載入逐字稿失敗，請稍後再試');
    }
}

// 複製 JSON 到剪貼簿
function copyJsonToClipboard(button) {
    const jsonContent = button.parentElement.querySelector('pre').textContent;
    navigator.clipboard.writeText(jsonContent).then(() => {
        const originalText = button.innerHTML;
        button.innerHTML = '<i class="bi bi-check"></i> 已複製';
        setTimeout(() => {
            button.innerHTML = originalText;
        }, 2000);
    });
}

// 產生逐字稿
async function generateTranscript() {
    try {
        // 檢查是否有錄音檔案
        const recording = await Database.getRecording(CONFIG.currentMeetingId);
        if (!recording) {
            throw new Error('找不到錄音檔案，請先上傳或錄製音訊');
        }

        // 檢查設定
        const settings = await Database.getSettings();
        console.log('當前設定:', settings);
        
        if (!settings || !settings.assemblyaiApiKey) {
            throw new Error('未設定 AssemblyAI API Key，請先完成設定');
        }

        // 使用更精確的選擇器來找到「產生逐字稿」按鈕
        const generateTranscriptBtn = document.querySelector('button:has(i.bi-text-paragraph)');
        if (!generateTranscriptBtn) {
            throw new Error('找不到產生逐字稿按鈕');
        }
        
        generateTranscriptBtn.disabled = true;
        generateTranscriptBtn.innerHTML = '<i class="bi bi-arrow-repeat"></i> 處理中...';

        // 創建狀態顯示區域
        const statusContainer = document.createElement('div');
        statusContainer.id = 'statusContainer';
        statusContainer.className = 'position-fixed bottom-0 start-0 w-100 p-3';
        statusContainer.style.zIndex = '9999';
        statusContainer.style.backgroundColor = 'rgba(255, 255, 255, 0.95)';
        statusContainer.style.boxShadow = '0 -2px 10px rgba(0, 0, 0, 0.1)';
        statusContainer.innerHTML = `
            <div class="alert alert-info mb-0">
                <div class="d-flex justify-content-between align-items-center">
                    <div>
                        <i class="bi bi-info-circle"></i> 
                        <span id="summaryStatus">正在處理中...</span>
                    </div>
                    <div>
                        <span id="summaryDateTime"></span>
                    </div>
                </div>
                <div class="progress mt-2" style="height: 5px;">
                    <div class="progress-bar progress-bar-striped progress-bar-animated" 
                         role="progressbar" 
                         style="width: 100%" 
                         id="summaryProgress">
                    </div>
                </div>
            </div>
        `;

        // 將狀態顯示區域添加到頁面最底部
        document.body.appendChild(statusContainer);

        // 更新狀態和時間的函數
        const updateStatus = (status, isError = false) => {
            const statusElement = document.getElementById('summaryStatus');
            const datetimeElement = document.getElementById('summaryDateTime');
            const progressBar = document.getElementById('summaryProgress');
            
            statusElement.textContent = status;
            datetimeElement.textContent = new Date().toLocaleString();
            
            if (isError) {
                statusContainer.querySelector('.alert').className = 'alert alert-danger mb-0';
                progressBar.style.width = '0%';
            }
        };

        updateStatus('正在上傳音訊檔案...');

        // 第一步：上傳音訊檔案
        const uploadResponse = await fetch('https://api.assemblyai.com/v2/upload', {
            method: 'POST',
            headers: {
                'Authorization': settings.assemblyaiApiKey,
                'Content-Type': 'application/octet-stream'
            },
            body: recording.audio
        });

        if (!uploadResponse.ok) {
            const errorData = await uploadResponse.json();
            console.error('上傳音訊檔案失敗:', errorData);
            throw new Error(`上傳音訊檔案失敗: ${JSON.stringify(errorData)}`);
        }

        const uploadResult = await uploadResponse.json();
        console.log('上傳音訊檔案成功:', uploadResult);

        updateStatus('正在生成逐字稿...');

        // 第二步：開始轉錄
        const transcriptResponse = await fetch('https://api.assemblyai.com/v2/transcript', {
            method: 'POST',
            headers: {
                'Authorization': settings.assemblyaiApiKey,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                audio_url: uploadResult.upload_url,
                language_code: 'zh',
                speaker_labels: true
            })
        });

        if (!transcriptResponse.ok) {
            const errorData = await transcriptResponse.json();
            console.error('開始轉錄失敗:', errorData);
            throw new Error(`開始轉錄失敗: ${JSON.stringify(errorData)}`);
        }

        const transcriptResult = await transcriptResponse.json();
        console.log('開始轉錄成功:', transcriptResult);

        // 第三步：輪詢轉錄結果
        let transcriptId = transcriptResult.id;
        let transcriptStatus = transcriptResult.status;
        let transcriptText = '';
        console.log('transcriptId:', transcriptId, transcriptStatus, transcriptText);

        while (transcriptStatus !== 'completed' && transcriptStatus !== 'error') {
            await new Promise(resolve => setTimeout(resolve, 1000)); // 等待 1 秒
            const pollingResponse = await fetch(`https://api.assemblyai.com/v2/transcript/${transcriptId}`, {
                headers: {
                    'Authorization': settings.assemblyaiApiKey
                }
            });

            if (!pollingResponse.ok) {
                const errorData = await pollingResponse.json();
                console.error('輪詢轉錄結果失敗:', errorData);
                throw new Error(`輪詢轉錄結果失敗: ${JSON.stringify(errorData)}`);
            }

            const pollingResult = await pollingResponse.json();
            transcriptStatus = pollingResult.status;

            if (transcriptStatus === 'error') {
                throw new Error(`轉錄失敗: ${pollingResult.error}`);
            }

            // 當轉錄完成時，格式化逐字稿
            if (transcriptStatus === 'completed' && pollingResult.words) {
                transcriptText = formatTranscript(pollingResult.words);
            }

            updateStatus(`正在生成逐字稿... (${transcriptStatus})`);
        }

        // 保存逐字稿到數據庫
        await Database.saveTranscript({
            meetingId: CONFIG.currentMeetingId,
            content: transcriptText,
            rawJson: JSON.stringify(transcriptResult)
        });

        // 更新頁面顯示
        await loadTranscript();

        // 更新狀態為成功
        updateStatus('逐字稿生成成功！');
        statusContainer.querySelector('.alert').className = 'alert alert-success';
        document.getElementById('summaryProgress').style.width = '100%';

        // 恢復按鈕狀態
        generateTranscriptBtn.disabled = false;
        generateTranscriptBtn.innerHTML = '<i class="bi bi-text-paragraph"></i> 產生逐字稿';
        
        // 3秒後移除狀態顯示
        setTimeout(() => {
            statusContainer.remove();
        }, 1500);

    } catch (error) {
        console.error('生成逐字稿失敗:', error);
        alert('生成逐字稿失敗，請稍後再試');
        
        // 恢復按鈕狀態
        const button = document.querySelector('button:has(i.bi-text-paragraph)');
        if (button) {
            button.disabled = false;
            button.innerHTML = '<i class="bi bi-text-paragraph"></i> 產生逐字稿';
        }

        // 移除狀態顯示（如果存在）
        const statusContainer = document.getElementById('statusContainer');
        if (statusContainer) {
            statusContainer.remove();
        }
    }
}

// 生成會議記錄
async function generateMeetingSummary() {
    try {
        // 檢查設定
        const settings = await Database.getSettings();
        console.log('當前設定:', settings);
        
        if (!settings || !settings.geminiApiKey) {
            throw new Error('未設定 Gemini API Key，請先完成設定');
        }

        // 使用 ID 選擇器來找到「產生會議紀錄」按鈕
        const generateSummaryBtn = document.getElementById('generateSummaryBtn');
        if (!generateSummaryBtn) {
            throw new Error('找不到產生會議紀錄按鈕');
        }
        
        generateSummaryBtn.disabled = true;
        generateSummaryBtn.innerHTML = '<i class="bi bi-arrow-repeat"></i> 處理中...';

        // 創建狀態顯示區域
        const statusContainer = document.createElement('div');
        statusContainer.id = 'statusContainer';
        statusContainer.className = 'position-fixed bottom-0 start-0 w-100 p-3';
        statusContainer.style.zIndex = '9999';
        statusContainer.style.backgroundColor = 'rgba(255, 255, 255, 0.95)';
        statusContainer.style.boxShadow = '0 -2px 10px rgba(0, 0, 0, 0.1)';
        statusContainer.innerHTML = `
            <div class="alert alert-info mb-0">
                <div class="d-flex justify-content-between align-items-center">
                    <div>
                        <i class="bi bi-info-circle"></i> 
                        <span id="summaryStatus">正在處理中...</span>
                    </div>
                    <div>
                        <span id="summaryDateTime"></span>
                    </div>
                </div>
                <div class="progress mt-2" style="height: 5px;">
                    <div class="progress-bar progress-bar-striped progress-bar-animated" 
                         role="progressbar" 
                         style="width: 100%" 
                         id="summaryProgress">
                    </div>
                </div>
            </div>
        `;

        // 將狀態顯示區域添加到頁面最底部
        document.body.appendChild(statusContainer);

        // 更新狀態和時間的函數
        const updateStatus = (status, isError = false) => {
            const statusElement = document.getElementById('summaryStatus');
            const datetimeElement = document.getElementById('summaryDateTime');
            const progressBar = document.getElementById('summaryProgress');
            
            statusElement.textContent = status;
            datetimeElement.textContent = new Date().toLocaleString();
            
            if (isError) {
                statusContainer.querySelector('.alert').className = 'alert alert-danger mb-0';
                progressBar.style.width = '0%';
            }
        };

        // 獲取逐字稿內容
        const transcript = await Database.getMeetingTranscript(CONFIG.currentMeetingId);
        if (!transcript) {
            throw new Error('找不到逐字稿');
        }

        updateStatus('正在生成會議記錄...');

        // 準備發送給 Gemini AI 的內容
        const prompt = `
${transcript.content}
-----------------------------
我希望將上面的逐字稿彙整成以下項目:

- 順序如下：
- 摘要 (150字內)
- 奇怪與無意義的詞（標題）
  - 列出逐字稿內無意義與奇怪的詞
  - 包含：拼字看起來不合理、或是語意不明、或感覺辨識問題的詞列出來
  - 如果逐字稿內的訂正，已經解決了所有奇怪的詞匯描述，則不顯示這個段落
  - 如果有辦法知道是，口誤或辨識錯誤的，就不要列出來了，直接訂正即可
  - 如果有這個項目，在列完之後加入一段話「請至上方逐字稿的名詞定義＆修正描述說明，並且重新產生會議摘要」
- TODOs（標題） + 負責人 + 項目的細節描述
  - 詳細描述避免缺失、把同一人負責的項目 group 在一起
  - 只有在 “會議類型” 的才使用 TODOs 其他項目如：訪談、面試則不適用
- 重點整理方法:
  - 如果是逐字稿是「產品會議」依照「每一項產品為標題」展出「重點與決議」「細節描述」跟「次要事項＆描述」（詳細描述避免缺失）
  - 如果是逐字稿是「行銷會議」依照「通路、或是社群媒體、或是品牌」為標題，展出「重點與決議」「細節描述」跟「次要事項＆描述」（詳細描述避免缺失）
  - 如果是逐字稿是「廣泛議題的會議」依照「主題、議題」為標題，展出「重點與決議」「細節描述」跟「次要事項＆描述」（詳細描述避免缺失）
  - 如果是逐字稿是「跨部門會議」依照「部門別」為標題，展出「重點與決議」「細節描述」跟「次要事項＆描述」（詳細描述避免缺失）
  - 如果是逐字稿是「員工面試」依照「主題、議題」為標題，展出「重點、跟細節」也產出「人員特質分析」包含「優缺點」（詳細描述避免缺失）
  - 如果是逐字稿是「在職員工面談」依照「主題、議題」為標題，展出「重點、跟細節」也產出「表現＆修正」（詳細描述避免缺失）
  - 如果是逐字稿是「Podcast或訪談」依照「主題、議題」為標題，展出「重點、跟細節」也產出「內容洞見」跟「獨特觀點」（詳細描述避免缺失）
- 無結論的內容（標題） + 細節描述（詳細描述避免缺失）
- 矛盾奇怪內容（標題） + 細節描述（詳細描述避免缺失）
- 特別注意要求:
  - 請依照「逐字稿內的錯誤修正＆解釋」對應到逐字稿內的理解產出會議摘要
  - 只要是名詞，包含「人名、暱稱、公司名、產品名」都使用粗體框起來 (前後需要一個空白)
  - 只要是編號的，包含「各種編號，如PFS0001, AC1234, 2283」都使用 code block 包起來
  - 如果有「英文專業名詞」請幫我多一個章節，解釋專業名詞的意思（中文的、非縮寫的不要列在這裡）
  - 議題整理，希望細節重點都加上逐字稿時間格式為 MM:SS
  - 依照逐字稿長度，產生出相對應的細節內容（詳細避免漏掉細節、又同時不會短的會議產生囉唆的結論）
  - 使用 markdown 語法 ( 外圍不要使用 code block 包起來)
  - 講者對應不要忘記了，但輸出時不要再出現講者對應
  - 直接開始不要有，好的之類的詞，這個輸出最終要輸出成 PDF 的
`;

        console.log('準備發送請求到 Gemini API');
        console.log('API Endpoint:', CONFIG.gemini.apiEndpoint);
        console.log('使用的 API Key:', settings.geminiApiKey.substring(0, 10) + '...');
        console.log('使用的 Model:', settings.geminiModel);

        // 調用 Gemini AI API
        const response = await fetch(`${CONFIG.gemini.apiEndpoint}/${settings.geminiModel}:generateContent?key=${settings.geminiApiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: prompt
                    }]
                }]
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error('API 錯誤詳情:', errorData);
            throw new Error(`API 請求失敗: ${JSON.stringify(errorData)}`);
        }

        const result = await response.json();
        console.log('API 回應:', result);

        const summaryContent = result.candidates[0].content.parts[0].text;

        // 保存會議記錄到數據庫
        await Database.saveMeetingSummary({
            meetingId: CONFIG.currentMeetingId,
            content: summaryContent
        });

        // 更新狀態為成功
        updateStatus('會議記錄生成成功！');
        statusContainer.querySelector('.alert').className = 'alert alert-success';
        document.getElementById('summaryProgress').style.width = '100%';

        // 恢復按鈕狀態
        generateSummaryBtn.disabled = false;
        generateSummaryBtn.innerHTML = '<i class="bi bi-file-text"></i> 產生會議紀錄 (from Gemini)';
        
        // 3秒後移除狀態顯示
        setTimeout(() => {
            statusContainer.remove();
        }, 3000);

        // 等待 DOM 更新完成後再載入會議摘要
        setTimeout(async () => {
            await loadMeetingSummary();
        }, 100);

    } catch (error) {
        console.error('生成會議記錄失敗:', error);
        alert('生成會議記錄失敗，請稍後再試');
        
        // 恢復按鈕狀態
        const button = document.getElementById('generateSummaryBtn');
        if (button) {
            button.disabled = false;
            button.innerHTML = '<i class="bi bi-file-text"></i> 產生會議紀錄 (from Gemini)';
        }

        // 移除狀態顯示（如果存在）
        const statusContainer = document.getElementById('statusContainer');
        if (statusContainer) {
            statusContainer.remove();
        }
    }
}

// 載入會議摘要
async function loadMeetingSummary() {
    try {
        if (!CONFIG.currentMeetingId) {
            return;
        }

        const summary = await Database.getMeetingSummary(CONFIG.currentMeetingId);
        if (summary?.content) {
            let c = marked.parse(summary.content).replace(/(\d{2}:\d{2})/g, '<a href="#" class="text-primary text-decoration-none" onclick="toTime(\'$1\'); return false;">$1</a>');
            document.getElementById('summaryContent').innerHTML = c;
        } else {
            document.getElementById('summaryContent').innerHTML = '無摘要';
        }
        
        
    } catch (error) {
        console.error('載入會議摘要失敗:', error);
    }
}

// 頁面載入時執行
document.addEventListener('DOMContentLoaded', async () => {
    // 添加離開頁面提醒
    window.addEventListener('beforeunload', (e) => {
        if (isRecording) {
            e.preventDefault();
            e.returnValue = '確定離開？有尚未完成的錄音？';
            return e.returnValue;
        }
    });

    // 從 URL 獲取會議 ID
    const urlParams = new URLSearchParams(window.location.search);
    const meetingId = urlParams.get('id');  // 修改為 'id' 而不是 'meetingId'
    
    if (meetingId) {
        CONFIG.currentMeetingId = parseInt(meetingId);
        
        // 載入逐字稿
        await loadTranscript();
    } else {
        // 可以選擇重定向到會議列表頁面
        // window.location.href = 'index.html';
    }
}); 