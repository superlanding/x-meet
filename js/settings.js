// DOM 元素
const settingsForm = document.getElementById('settingsForm');
const assemblyaiApiKeyInput = document.getElementById('assemblyaiApiKey');
const geminiApiKeyInput = document.getElementById('geminiApiKey');
const geminiModelInput = document.getElementById('geminiModel');

// 頁面載入時執行
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // 載入設定
        const settings = await Database.getSettings();
        if (settings) {
            assemblyaiApiKeyInput.value = settings.assemblyaiApiKey || '';
            geminiApiKeyInput.value = settings.geminiApiKey || '';
            geminiModelInput.value = settings.geminiModel || 'gemini-2.5-pro-exp-03-25';
        }
    } catch (error) {
        console.error('載入設定失敗:', error);
        alert('載入設定失敗，請稍後再試');
    }
});

// 表單提交事件
settingsForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    try {
        // 驗證 Gemini API Key 格式
        const geminiApiKey = geminiApiKeyInput.value.trim();
        if (!geminiApiKey) {
            alert('Gemini API Key 不能為空');
            return;
        }

        // 儲存設定
        const settings = {
            assemblyaiApiKey: assemblyaiApiKeyInput.value.trim(),
            geminiApiKey: geminiApiKey,
            geminiModel: geminiModelInput.value.trim() || 'gemini-2.5-pro-exp-03-25'
        };

        await Database.saveSettings(settings);

        // 更新 CONFIG
        CONFIG.assemblyai.apiKey = settings.assemblyaiApiKey;
        CONFIG.gemini.apiKey = settings.geminiApiKey;
        CONFIG.gemini.model = settings.geminiModel;

        alert('設定已儲存');
        // 使用 window.location.replace 來確保完全重定向
        window.location.replace('index.html');
    } catch (error) {
        console.error('儲存設定失敗:', error);
        alert('儲存設定失敗，請稍後再試');
    }
}); 