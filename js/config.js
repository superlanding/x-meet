const CONFIG = {
    // AssemblyAI API 配置
    assemblyai: {
        apiKey: '',
        apiEndpoint: 'https://api.assemblyai.com/v2'
    },
    
    // Gemini AI API 配置
    gemini: {
        apiKey: '',
        apiEndpoint: 'https://generativelanguage.googleapis.com/v1beta/models',
        model: 'gemini-2.5-pro-exp-03-25'
    },
    
    // 應用程序配置
    app: {
        name: 'X-Meet',
        version: '1.0.0',
        maxParticipants: 10,
        maxRecordingDuration: 3600, // 1 hour in seconds
        supportedAudioFormats: {
            extensions: ['.wav', '.mp3', '.m4a', '.ogg', '.aac'],
            maxFileSize: 100 * 1024 * 1024 // 100MB
        }
    },

    // 共享變量
    currentMeetingId: null
}; 

window.addEventListener('error', (e) => {
    console.error('未捕獲的錯誤:', e.message);
});