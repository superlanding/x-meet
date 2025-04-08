// DOM 元素
const editMeetingBtn = document.getElementById('editMeetingBtn');
const deleteMeetingBtn = document.getElementById('deleteMeetingBtn');
const editMeetingModal = new bootstrap.Modal(document.getElementById('editMeetingModal'));
const editMeetingForm = document.getElementById('editMeetingForm');
const editParticipantsList = document.getElementById('editParticipantsList');
const addEditParticipantBtn = document.getElementById('addEditParticipant');
const saveEditMeetingBtn = document.getElementById('saveEditMeeting');

// 編輯逐字稿相關
const editTranscriptBtn = document.getElementById('editTranscriptBtn');
const editTranscriptModal = new bootstrap.Modal(document.getElementById('editTranscriptModal'));
const editTranscriptContent = document.getElementById('editTranscriptContent');
const saveTranscriptBtn = document.getElementById('saveTranscriptBtn');

// 編輯會議摘要相關
const editSummaryBtn = document.getElementById('editSummaryBtn');
const editSummaryModal = new bootstrap.Modal(document.getElementById('editSummaryModal'));
const editSummaryContent = document.getElementById('editSummaryContent');
const saveSummaryBtn = document.getElementById('saveSummaryBtn');

// 匯出 PDF 相關
const exportPdfBtn = document.getElementById('exportPdfBtn');

// 頁面載入時執行
document.addEventListener('DOMContentLoaded', async () => {
    // 從 URL 獲取會議 ID
    const urlParams = new URLSearchParams(window.location.search);
    CONFIG.currentMeetingId = parseInt(urlParams.get('id'));

    if (!CONFIG.currentMeetingId) {
        window.location.href = 'index.html';
        return;
    }

    await loadMeetingDetails();

    // 點擊編輯逐字稿按鈕
    editTranscriptBtn.addEventListener('click', async () => {
        try {
            const transcript = await Database.getMeetingTranscript(CONFIG.currentMeetingId);
            editTranscriptContent.value = transcript.content || '';
            editTranscriptModal.show();
        } catch (error) {
            console.error('載入逐字稿失敗:', error);
            alert('載入逐字稿失敗，請稍後再試');
        }
    });

    // 儲存逐字稿
    saveTranscriptBtn.addEventListener('click', async () => {
        try {
            const content = editTranscriptContent.value.trim();
            await Database.saveTranscript({meetingId:CONFIG.currentMeetingId, content: content});
            let c = content
                .replace(/(\d{2}:\d{2})/g, '<a href="#" class="text-primary text-decoration-none" onclick="toTime(\'$1\'); return false;">$1</a>')
                .replace(/\n/g, '<br>');
            document.getElementById('transcriptContent').innerHTML = c;
            editTranscriptModal.hide();
        } catch (error) {
            console.error('儲存逐字稿失敗:', error);
            alert('儲存逐字稿失敗，請稍後再試');
        }
    });

    // 點擊編輯會議摘要按鈕
    editSummaryBtn.addEventListener('click', async () => {
        try {
            const summary = await Database.getMeetingSummary(CONFIG.currentMeetingId);
            editSummaryContent.value = summary?.content || '';
            editSummaryModal.show();
        } catch (error) {
            console.error('載入會議摘要失敗:', error);
            alert('載入會議摘要失敗，請稍後再試');
        }
    });

    

    // 儲存會議摘要
    saveSummaryBtn.addEventListener('click', async () => {
        try {
            const content = editSummaryContent.value.trim();
            await Database.saveMeetingSummary({meetingId: CONFIG.currentMeetingId, content: content});
            let c = marked.parse(content).replace(/(\d{2}:\d{2})/g, '<a href="#" class="text-primary text-decoration-none" onclick="toTime(\'$1\'); return false;">$1</a>');
            document.getElementById('summaryContent').innerHTML = c;
            editSummaryModal.hide();
        } catch (error) {
            console.error('儲存會議摘要失敗:', error);
            alert('儲存會議摘要失敗，請稍後再試');
        }
    });

    // 匯出 PDF 按鈕點擊事件
    exportPdfBtn.addEventListener('click', async () => {
        try {
            const meeting = await Database.getMeeting(CONFIG.currentMeetingId);
            const participants = await Database.getMeetingParticipants(CONFIG.currentMeetingId);
            const transcript = await Database.getMeetingTranscript(CONFIG.currentMeetingId);
            const summary = await Database.getMeetingSummary(CONFIG.currentMeetingId);

            // 創建要匯出的內容
            const content = document.createElement('div');
            const html = []
            html.push("<div id='summaryContent'>", marked.parse(summary.content), '</div>');
            html.push('<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">');
            html.push('<link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.7.2/font/bootstrap-icons.css" rel="stylesheet">');
            html.push('<link href="css/style.css" rel="stylesheet">');
            content.innerHTML = html.join("\n");

            // 配置 PDF 選項
            const opt = {
                margin: 0.7,
                filename: `會議記錄_${meeting.title}.pdf`,
                image: { type: 'jpeg', quality: 0.95 },
                html2canvas: { scale: 2, dpi: 192 },
                jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
            };

            // 生成 PDF
            await html2pdf().set(opt).from(content).save();
        } catch (error) {
            console.error('匯出 PDF 失敗:', error);
            alert('匯出 PDF 失敗，請稍後再試');
        }
    });

    document.getElementById('exportBackupBtn').addEventListener('click', exportBackup);
});

// 載入會議詳細資料
async function loadMeetingDetails() {
    try {
        const meeting = await Database.getMeeting(CONFIG.currentMeetingId);
        let formattedContent = "";
        if (!meeting) {
            window.location.href = 'index.html';
            return;
        }

        // 更新頁面標題
        document.title = `${meeting.title} - 會議詳細資料`;

        // 更新會議標題
        document.getElementById('meetingTitle').textContent = meeting.title;

        // 載入參與者
        const participants = await Database.getMeetingParticipants(CONFIG.currentMeetingId);
        const participantsList = document.getElementById('participantsList');
        participantsList.innerHTML = participants.map(p => `
            <li class="list-group-item">${p.name}</li>
        `).join('');

        // 載入逐字稿
        const transcript = await Database.getMeetingTranscript(CONFIG.currentMeetingId);

        if (transcript?.content) {
            formattedContent = transcript.content
        } else {
            formattedContent = "無逐字稿"
        }

        // 先將換行符轉換為特殊標記
        formattedContent = formattedContent.replace(/\n/g, '{{BR}}')
            // 將時間格式轉換為可點擊的連結
            .replace(/(\d{2}:\d{2})/g, '<a href="#" class="text-primary text-decoration-none" onclick="toTime(\'$1\'); return false;">$1</a>')
            // 將特殊標記轉換回換行標籤
            .replace(/{{BR}}/g, '<br>');

        document.getElementById('transcriptContent').innerHTML = formattedContent;

        // 載入摘要
        const summary = await Database.getMeetingSummary(CONFIG.currentMeetingId);

        if (summary?.content) {
            let c = marked.parse(summary.content).replace(/(\d{2}:\d{2})/g, '<a href="#" class="text-primary text-decoration-none" onclick="toTime(\'$1\'); return false;">$1</a>');
            document.getElementById('summaryContent').innerHTML = c;
        } else {
            document.getElementById('summaryContent').innerHTML = '無摘要';
        }

        // 載入音頻文件
        const recording = await Database.getRecording(CONFIG.currentMeetingId);
        if (recording) {
            const audioUrl = URL.createObjectURL(recording.audio);
            showAudioPlayer(audioUrl);
        }
    } catch (error) {
        console.error('載入會議詳情失敗:', error);
        alert('載入會議詳情失敗，請稍後再試');
    }
}

// 編輯會議按鈕點擊事件
editMeetingBtn.addEventListener('click', async () => {
    try {
        const meeting = await Database.getMeeting(CONFIG.currentMeetingId);
        const participants = await Database.getMeetingParticipants(CONFIG.currentMeetingId);

        // 填充表單
        document.getElementById('editMeetingTitle').value = meeting.title;

        // 填充參與者
        editParticipantsList.innerHTML = participants.map(p => `
            <div class="input-group mb-2">
                <input type="text" class="form-control" placeholder="輸入姓名" value="${p.name}">
                <button type="button" class="btn btn-outline-danger remove-participant">
                    <i class="bi bi-trash"></i>
                </button>
            </div>
        `).join('');

        editMeetingModal.show();
    } catch (error) {
        console.error('載入編輯表單失敗:', error);
        alert('載入編輯表單失敗，請稍後再試');
    }
});

// 新增參與者按鈕點擊事件
addEditParticipantBtn.addEventListener('click', () => {
    if (editParticipantsList.children.length >= CONFIG.app.maxParticipants) {
        alert(`最多只能新增 ${CONFIG.app.maxParticipants} 位參與者`);
        return;
    }

    const newParticipant = document.createElement('div');
    newParticipant.className = 'input-group mb-2';
    newParticipant.innerHTML = `
        <input type="text" class="form-control" placeholder="輸入姓名">
        <button type="button" class="btn btn-outline-danger remove-participant">
            <i class="bi bi-trash"></i>
        </button>
    `;
    editParticipantsList.appendChild(newParticipant);
});

// 保存編輯的會議
saveEditMeetingBtn.addEventListener('click', async () => {
    const title = document.getElementById('editMeetingTitle').value;
    const participants = Array.from(editParticipantsList.querySelectorAll('input[type="text"]'))
        .map(input => input.value)
        .filter(name => name.trim() !== '');

    if (!title) {
        alert('請輸入會議標題');
        return;
    }

    try {
        // 更新會議
        await Database.updateMeeting(CONFIG.currentMeetingId, {
            title
        });

        // 更新參與者
        await Database.deleteMeetingParticipants(CONFIG.currentMeetingId);
        for (const name of participants) {
            await Database.addParticipant({
                meetingId: CONFIG.currentMeetingId,
                name
            });
        }
        
        editMeetingModal.hide();

        await loadMeetingDetails();
    } catch (error) {
        console.error('更新會議失敗:', error);
        alert('更新會議失敗，請稍後再試');
    }
});

// 刪除會議按鈕點擊事件
deleteMeetingBtn.addEventListener('click', async () => {
    if (!confirm('確定要刪除這個會議嗎？')) {
        return;
    }

    try {
        await Database.deleteMeeting(CONFIG.currentMeetingId);
        window.location.href = 'index.html';
    } catch (error) {
        console.error('刪除會議失敗:', error);
        alert('刪除會議失敗，請稍後再試');
    }
});

// 為參與者輸入框添加刪除按鈕事件
document.addEventListener('click', (e) => {
    if (e.target.closest('.remove-participant')) {
        e.target.closest('.input-group').remove();
    }
});

// 選擇會議
async function selectMeeting(meetingId) {
    try {
        CONFIG.currentMeetingId = meetingId;
        localStorage.setItem('currentMeetingId', meetingId);
        
        // 更新 UI
        const meetings = await Database.getAllMeetings();
        const meeting = meetings.find(m => m.id === meetingId);
        if (meeting) {
            document.getElementById('currentMeetingTitle').textContent = meeting.title;
        }
        
        // 關閉 Modal
        const selectMeetingModal = bootstrap.Modal.getInstance(document.getElementById('selectMeetingModal'));
        selectMeetingModal.hide();
        
        // 載入逐字稿
        await loadTranscript();
    } catch (error) {
        console.error('選擇會議失敗:', error);
        alert('選擇會議失敗，請稍後再試');
    }
}

async function exportBackup() {
    try {
        // 從資料庫獲取完整的會議資料
        const meeting = await Database.getMeeting(CONFIG.currentMeetingId);
        const participants = await Database.getMeetingParticipants(CONFIG.currentMeetingId);
        const transcript = await Database.getMeetingTranscript(CONFIG.currentMeetingId);
        const summary = await Database.getMeetingSummary(CONFIG.currentMeetingId);
        const recording = await Database.getRecording(CONFIG.currentMeetingId);

        // 準備會議資料
        const meetingData = {
            title: meeting.title,
            participants: participants.map(p => p.name),
            transcript: transcript?.content || '',
            summary: summary?.content || '',
            createdAt: meeting.createdAt,
            updatedAt: meeting.updatedAt
        };

        // 創建 JSZip 實例
        const zip = new JSZip();

        // 添加 meeting.json
        zip.file('meeting.json', JSON.stringify(meetingData, null, 2));

        // 如果有音訊檔案，添加到 zip
        if (recording && recording.audio) {
            zip.file('meeting_audio.wav', recording.audio);
        }

        // 生成 zip 檔案
        const content = await zip.generateAsync({type: 'blob'});

        // 創建下載連結
        const url = window.URL.createObjectURL(content);
        const a = document.createElement('a');
        a.href = url;
        a.download = `會議_${meeting.title.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.zip`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        showToast('備份匯出成功！', 'success');
    } catch (error) {
        console.error('匯出備份失敗:', error);
        showToast('匯出備份失敗，請稍後再試', 'error');
    }
} 