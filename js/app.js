// 全局變量
let mediaRecorder = null;
let audioChunks = [];
let isRecording = false;
let currentMeetingId = null;

// DOM 元素
const newMeetingBtn = document.getElementById('newMeetingBtn');
const newMeetingModal = new bootstrap.Modal(document.getElementById('newMeetingModal'));
const newMeetingForm = document.getElementById('newMeetingForm');
const participantsList = document.getElementById('participantsList');
const addParticipantBtn = document.getElementById('addParticipant');
const saveMeetingBtn = document.getElementById('saveMeeting');
const meetingList = document.getElementById('meetingList');
const importBackupBtn = document.getElementById('importBackupBtn');
const meetingCategorySelect = document.getElementById('meetingCategory');

// 事件監聽器
document.addEventListener('DOMContentLoaded', async () => {
    try {
        console.log('開始初始化...');
        console.log('CONFIG 初始狀態:', CONFIG);

        // 檢查是否有必要的設定
        const hasSettings = await Database.hasRequiredSettings();
        console.log('檢查設定結果:', hasSettings);

        if (!hasSettings) {
            console.log('沒有找到必要的設定，重定向到設定頁面');
            window.location.href = 'settings.html';
            return;
        }

        // 載入設定
        const settings = await Database.getSettings();
        console.log('載入的設定:', settings);

        if (settings) {
            // 確保 CONFIG 對象已正確初始化
            if (!CONFIG.assemblyai) CONFIG.assemblyai = {};
            if (!CONFIG.grok) CONFIG.grok = {};

            CONFIG.assemblyai.apiKey = settings.assemblyaiApiKey;
            CONFIG.grok.apiKey = settings.grokApiKey;
            CONFIG.grok.model = settings.grokModel;

            console.log('更新後的 CONFIG:', CONFIG);
        }

        // 載入會議列表
        await loadMeetings();
    } catch (error) {
        console.error('初始化失敗:', error);
        alert('初始化失敗，請稍後再試');
    }
});

newMeetingBtn.addEventListener('click', showNewMeetingModal);
addParticipantBtn.addEventListener('click', addParticipantInput);
document.getElementById('importBackupBtn').addEventListener('click', importBackup);

// 初始化應用
async function initializeApp() {
    await loadMeetings();
    // 添加會議列表的事件監聽器
    addMeetingEventListeners();
}

// 載入會議列表
async function loadMeetings() {
    try {
        // 獲取會議數據
        const meetings = await Database.getAllMeetings();
        
        // 獲取所有分類，用於顯示分類名稱
        const categories = await Database.getAllCategories();
        const categoryMap = {};
        categories.forEach(cat => {
            categoryMap[cat.id] = cat.name;
        });
        
        const meetingsList = document.getElementById('meetingsList');
        const noMeetingsMessage = document.getElementById('noMeetingsMessage');

        if (!meetings || meetings.length === 0) {
            meetingsList.style.display = 'none';
            noMeetingsMessage.style.display = 'block';
            return;
        }

        meetingsList.style.display = 'block';
        noMeetingsMessage.style.display = 'none';

        meetingsList.innerHTML = meetings.map(meeting => {
            // 獲取分類名稱，如果沒有分類則顯示"未分類"
            const categoryName = meeting.categoryId && categoryMap[meeting.categoryId] 
                ? categoryMap[meeting.categoryId] 
                : '未分類';
                
            return `
                <div class="list-group-item list-group-item-action">
                    <div class="d-flex w-100 justify-content-between align-items-center" style="cursor: pointer;" onclick="window.location.href = 'meeting.html?id=${meeting.id}'">
                        <h5 class="mb-1">
                            <a href="meeting.html?id=${meeting.id}" class="text-decoration-none text-dark">
                                ${escapeHtml(meeting.title)}
                            </a>
                        </h5>
                        <div class="btn-group">
                            <button type="button" class="btn btn-sm btn-outline-primary edit-meeting" data-id="${meeting.id}">
                                <i class="bi bi-pencil"></i>
                            </button>
                            <button type="button" class="btn btn-sm btn-outline-danger delete-meeting" data-id="${meeting.id}">
                                <i class="bi bi-trash"></i>
                            </button>
                        </div>
                    </div>
                    <p class="mb-1 text-muted">${new Date(meeting.createdAt).toLocaleString()}</p>
                    <span class="badge bg-secondary rounded-pill">${escapeHtml(categoryName)}</span>
                </div>
            `;
        }).join('');

        // 重新添加事件監聽器
        addMeetingEventListeners();
    } catch (error) {
        console.error('載入會議列表失敗:', error);
        if (!document.getElementById('meetingsList').innerHTML) {
            alert('載入會議列表失敗，請稍後再試');
        }
    }
}

// HTML 轉義函數，防止 XSS
function escapeHtml(unsafe) {
    if (typeof unsafe !== 'string') return unsafe;
    return unsafe
         .replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "&#039;");
}

// 顯示新增會議模態框
function showNewMeetingModal() {
    document.getElementById('modalTitle').textContent = '新增會議';
    newMeetingForm.reset();
    participantsList.innerHTML = '';
    addParticipantInput();
    
    // 加載分類數據
    loadCategoriesForSelect(meetingCategorySelect);
    
    saveMeetingBtn.textContent = '儲存';
    saveMeetingBtn.onclick = saveMeeting;
    newMeetingModal.show();
}

// 加載分類到下拉選單
async function loadCategoriesForSelect(selectElement) {
    try {
        // 清空現有選項，但保留"未分類"
        selectElement.innerHTML = '<option value="" selected>未分類</option>';
        
        // 從數據庫獲取分類
        const categories = await Database.getAllCategories();
        
        // 填充下拉選單
        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category.id;
            option.textContent = category.name;
            selectElement.appendChild(option);
        });
    } catch (error) {
        console.error('加載分類失敗:', error);
        // 即使加載失敗，依然保留"未分類"選項
    }
}

// 添加參與者輸入框
function addParticipantInput(name = '') {
    const input = document.createElement('div');
    input.className = 'input-group mb-2';
    input.innerHTML = `
        <input type="text" class="form-control" placeholder="輸入姓名" value="${name}">
        <button class="btn btn-outline-danger" type="button" onclick="this.parentElement.remove()">
            <i class="bi bi-trash"></i>
        </button>
    `;
    participantsList.appendChild(input);
}

// 保存會議
async function saveMeeting() {
    const title = document.getElementById('meetingTitle').value.trim();
    const categoryId = meetingCategorySelect.value ? parseInt(meetingCategorySelect.value) : null;
    const participants = Array.from(participantsList.querySelectorAll('input'))
        .map(input => input.value.trim())
        .filter(name => name !== '');

    if (!title || participants.length === 0) {
        alert('請填寫會議標題和參與者');
        return;
    }

    try {
        // 創建會議，包含分類ID
        const meetingId = await Database.createMeeting({ 
            title,
            categoryId 
        });

        // 添加參與者
        for (const name of participants) {
            await Database.addParticipant({
                meetingId,
                name
            });
        }

        // 跳轉到會議詳情頁面
        window.location.href = `meeting.html?id=${meetingId}`;
    } catch (error) {
        console.error('創建會議失敗:', error);
        alert('創建會議失敗，請稍後再試');
    }
}

// 添加會議列表的事件監聽器
function addMeetingEventListeners() {
    // 編輯按鈕
    document.querySelectorAll('.edit-meeting').forEach(button => {
        button.addEventListener('click', async (e) => {
            e.preventDefault();
            e.stopPropagation(); // 防止事件冒泡
            const id = parseInt(e.currentTarget.dataset.id);
            await editMeeting(id);
        });
    });

    // 刪除按鈕
    document.querySelectorAll('.delete-meeting').forEach(button => {
        button.addEventListener('click', async (e) => {
            e.preventDefault();
            e.stopPropagation(); // 防止事件冒泡
            const id = parseInt(e.currentTarget.dataset.id);
            await deleteMeeting(id);
        });
    });
}

// 編輯會議
async function editMeeting(id) {
    try {
        const meeting = await Database.getMeeting(id);
        const participants = await Database.getMeetingParticipants(id);

        // 更新模態框標題
        document.getElementById('modalTitle').textContent = '編輯會議';

        // 填充表單
        document.getElementById('meetingTitle').value = meeting.title.trim();
        
        // 加載分類並選中當前分類
        await loadCategoriesForSelect(meetingCategorySelect);
        if (meeting.categoryId) {
            // 找到並選中對應的選項
            const option = meetingCategorySelect.querySelector(`option[value="${meeting.categoryId}"]`);
            if (option) {
                option.selected = true;
            }
        }

        // 填充參與者
        participantsList.innerHTML = '';
        participants.forEach(participant => {
            addParticipantInput(participant.name.trim());
        });

        // 修改按鈕文字和行為
        saveMeetingBtn.textContent = '更新';
        saveMeetingBtn.onclick = () => updateMeeting(id);

        newMeetingModal.show();
    } catch (error) {
        console.error('載入編輯表單失敗:', error);
        alert('載入編輯表單失敗，請稍後再試');
    }
}

// 更新會議
async function updateMeeting(id) {
    const title = document.getElementById('meetingTitle').value.trim();
    const categoryId = meetingCategorySelect.value ? parseInt(meetingCategorySelect.value) : null;
    const participants = Array.from(participantsList.querySelectorAll('input'))
        .map(input => input.value.trim())
        .filter(name => name !== '');

    if (!title || participants.length === 0) {
        alert('請填寫會議標題和參與者');
        return;
    }

    try {
        // 更新會議，包含分類ID
        await Database.updateMeeting(id, { 
            title,
            categoryId
        });

        // 更新參與者
        await Database.deleteMeetingParticipants(id);
        for (const name of participants) {
            await Database.addParticipant({
                meetingId: id,
                name
            });
        }

        newMeetingModal.hide();
        await loadMeetings();

        // 重置按鈕
        saveMeetingBtn.textContent = '儲存';
        saveMeetingBtn.onclick = saveMeeting;
    } catch (error) {
        console.error('更新會議失敗:', error);
        alert('更新會議失敗，請稍後再試');
    }
}

// 刪除會議
async function deleteMeeting(id) {
    if (!confirm('確定要刪除這個會議嗎？')) {
        return;
    }

    try {
        await Database.deleteMeeting(id);
        await loadMeetings();
    } catch (error) {
        console.error('刪除會議失敗:', error);
        alert('刪除會議失敗，請稍後再試');
    }
}

// 為參與者輸入框添加刪除按鈕事件
document.addEventListener('click', (e) => {
    if (e.target.closest('.remove-participant')) {
        e.target.closest('.input-group').remove();
    }
});

async function importBackup() {
    try {
        // 創建檔案輸入元素
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.zip';
        
        input.onchange = async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            try {
                // 讀取 ZIP 檔案
                const zip = new JSZip();
                const zipContent = await zip.loadAsync(file);

                // 檢查必要的檔案是否存在
                if (!zipContent.files['meeting.json']) {
                    throw new Error('無效的備份檔案：缺少 meeting.json');
                }

                // 讀取 meeting.json
                const jsonContent = await zipContent.files['meeting.json'].async('string');
                const meetingData = JSON.parse(jsonContent);

                // 創建新會議
                const meetingId = await Database.createMeeting({
                    title: meetingData.title,
                    createdAt: meetingData.createdAt || new Date(),
                    updatedAt: meetingData.updatedAt || new Date()
                });

                // 添加參與者
                for (const name of meetingData.participants) {
                    await Database.addParticipant({
                        meetingId,
                        name
                    });
                }

                // 保存逐字稿
                if (meetingData.transcript) {
                    await Database.saveTranscript({
                        meetingId,
                        content: meetingData.transcript
                    });
                }

                // 保存會議摘要
                if (meetingData.summary) {
                    await Database.saveMeetingSummary({
                        meetingId,
                        content: meetingData.summary
                    });
                }

                // 處理音訊檔案
                if (zipContent.files['meeting_audio.wav']) {
                    const audioBlob = await zipContent.files['meeting_audio.wav'].async('blob');
                    await Database.saveRecording(meetingId, audioBlob);
                }

                // 重新載入會議列表
                await loadMeetings();
                
                // 跳轉到會議詳情頁面
                window.location.href = `meeting.html?id=${meetingId}`;
            } catch (error) {
                console.error('匯入備份失敗:', error);
                alert('匯入備份失敗：' + error.message);
            }
        };

        input.click();
    } catch (error) {
        console.error('匯入備份失敗:', error);
        alert('匯入備份失敗，請稍後再試');
    }
} 