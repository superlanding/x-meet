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

// 初始化應用
async function initializeApp() {
    await loadMeetings();
    // 添加會議列表的事件監聽器
    addMeetingEventListeners();
}

// 載入會議列表
async function loadMeetings() {
    try {
        const meetings = await Database.getAllMeetings();
        const meetingsList = document.getElementById('meetingsList');
        const noMeetingsMessage = document.getElementById('noMeetingsMessage');

        if (!meetings || meetings.length === 0) {
            meetingsList.style.display = 'none';
            noMeetingsMessage.style.display = 'block';
            return;
        }

        meetingsList.style.display = 'block';
        noMeetingsMessage.style.display = 'none';

        meetingsList.innerHTML = meetings.map(meeting => `
            <div class="list-group-item list-group-item-action">
                <div class="d-flex w-100 justify-content-between align-items-center" style="cursor: pointer;" onclick="window.location.href = 'meeting.html?id=${meeting.id}'">
                    <h5 class="mb-1">
                        <a href="meeting.html?id=${meeting.id}" class="text-decoration-none text-dark">
                            ${meeting.title}
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
            </div>
        `).join('');

        // 重新添加事件監聽器
        addMeetingEventListeners();
    } catch (error) {
        console.error('載入會議列表失敗:', error);
        if (!document.getElementById('meetingsList').innerHTML) {
            alert('載入會議列表失敗，請稍後再試');
        }
    }
}

// 顯示新增會議模態框
function showNewMeetingModal() {
    document.getElementById('modalTitle').textContent = '新增會議';
    newMeetingForm.reset();
    participantsList.innerHTML = '';
    addParticipantInput();
    saveMeetingBtn.textContent = '儲存';
    saveMeetingBtn.onclick = saveMeeting;
    newMeetingModal.show();
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
    const title = document.getElementById('meetingTitle').value;
    const participants = Array.from(participantsList.querySelectorAll('input'))
        .map(input => input.value.trim())
        .filter(name => name !== '');

    if (!title || participants.length === 0) {
        alert('請填寫會議標題和參與者');
        return;
    }

    try {
        // 創建會議
        const meetingId = await Database.createMeeting({ title });

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
    const title = document.getElementById('meetingTitle').value;
    const participants = Array.from(participantsList.querySelectorAll('input[type="text"]'))
        .map(input => input.value.trim())
        .filter(name => name !== '');

    if (!title || participants.length === 0) {
        alert('請填寫會議標題和參與者');
        return;
    }

    try {
        // 更新會議標題
        await Database.updateMeeting(id, { title });

        // 更新參與者
        await Database.deleteMeetingParticipants(id); // 只刪除參與者
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