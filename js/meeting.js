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
            content.innerHTML = marked.parse(summary.content);

            // 配置 PDF 選項
            const opt = {
                margin: 1,
                filename: `${meeting.title}_會議記錄.pdf`,
                image: { type: 'jpeg', quality: 0.9 },
                html2canvas: { scale: 3 },
                jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
            };

            // 生成 PDF
            await html2pdf().set(opt).from(content).save();
        } catch (error) {
            console.error('匯出 PDF 失敗:', error);
            alert('匯出 PDF 失敗，請稍後再試');
        }
    });
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

        // 添加 markdown 樣式
        const style = document.createElement('style');
        style.textContent = `
            #summaryContent h1 {
                font-size: 28px;
                margin-top: 1.5rem;
                margin-bottom: 0.75rem;
                font-weight: 600;
            }
            #summaryContent h2 {
                font-size: 24px;
                margin-top: 1.25rem;
                margin-bottom: 0.75rem;
                font-weight: 600;
            }
            #summaryContent h3 {
                font-size: 22px;
                margin-top: 1rem;
                margin-bottom: 0.5rem;
                font-weight: 600;
            }
            #summaryContent h4 {
                font-size: 20px;
                margin-top: 1rem;
                margin-bottom: 0.5rem;
                font-weight: 600;
            }
            #summaryContent h5 {
                font-size: 18px;
                margin-top: 0.75rem;
                margin-bottom: 0.5rem;
                font-weight: 600;
            }
            #summaryContent h6 {
                font-size: 16px;
                margin-top: 0.75rem;
                margin-bottom: 0.5rem;
                font-weight: 600;
            }
            #summaryContent p {
                margin-bottom: 1rem;
            }
            #summaryContent ul, #summaryContent ol {
                margin-bottom: 1rem;
                padding-left: 2rem;
            }
            #summaryContent li {
                margin-bottom: 0.5rem;
            }
            #summaryContent code {
                background-color: #f8f9fa;
                padding: 0.2rem 0.4rem;
                border-radius: 0.25rem;
                font-family: monospace;
            }
            #summaryContent pre {
                background-color: #f8f9fa;
                padding: 1rem;
                border-radius: 0.375rem;
                overflow-x: auto;
            }
            #summaryContent blockquote {
                border-left: 4px solid #dee2e6;
                padding-left: 1rem;
                margin-left: 0;
                color: #6c757d;
            }
        `;
        document.head.appendChild(style);

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