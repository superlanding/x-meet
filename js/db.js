// 初始化 Dexie 數據庫
const db = new Dexie('MeetingDB');

// 定義數據庫結構
db.version(7).stores({
    meetings: '++id, title, createdAt, updatedAt',
    participants: '++id, meetingId, name',
    transcripts: '++id, meetingId, content, rawJson, createdAt',
    summaries: '++id, meetingId, content, createdAt',
    recordings: '++id, meetingId, audio, createdAt',
    settings: '++id, assemblyaiApiKey, grokApiKey, grokModel'
});

// 數據庫操作類
class Database {
    static async getDB() {
        return db;
    }

    // 會議相關操作
    static async createMeeting(meeting) {
        return await db.meetings.add({
            ...meeting,
            createdAt: new Date(),
            updatedAt: new Date()
        });
    }

    static async getMeeting(id) {
        return await db.meetings.get(id);
    }

    static async getAllMeetings() {
        return await db.meetings.orderBy('createdAt').reverse().toArray();
    }

    static async updateMeeting(id, meeting) {
        return await db.meetings.update(id, {
            ...meeting,
            updatedAt: new Date()
        });
    }

    static async deleteMeeting(id) {
        await db.meetings.delete(id);
        await this.deleteMeetingParticipants(id);
        await db.transcripts.where('meetingId').equals(id).delete();
        await db.summaries.where('meetingId').equals(id).delete();
        await db.recordings.where('meetingId').equals(id).delete();
    }

    // 參與者相關操作
    static async addParticipant(participant) {
        return await db.participants.add({
            meetingId: participant.meetingId,
            name: participant.name,
            createdAt: new Date()
        });
    }

    static async getMeetingParticipants(meetingId) {
        return await db.participants.where('meetingId').equals(meetingId).toArray();
    }

    static async deleteMeetingParticipants(meetingId) {
        return await db.participants.where('meetingId').equals(meetingId).delete();
    }

    // 逐字稿相關操作
    static async saveTranscript(transcript) {
        try {
            // 先檢查是否已存在逐字稿
            const existingTranscript = await db.transcripts.where('meetingId').equals(transcript.meetingId).first();
            
            if (existingTranscript) {
                // 如果存在，則更新
                return await db.transcripts.update(existingTranscript.id, {
                    content: transcript.content,
                    rawJson: transcript.rawJson,
                    updatedAt: new Date()
                });
            } else {
                // 如果不存在，則新增
                return await db.transcripts.add({
                    meetingId: transcript.meetingId,
                    content: transcript.content,
                    rawJson: transcript.rawJson,
                    createdAt: new Date(),
                    updatedAt: new Date()
                });
            }
        } catch (error) {
            console.error('保存逐字稿失敗:', error);
            throw error;
        }
    }

    static async getMeetingTranscript(meetingId) {
        try {
            const transcript = await db.transcripts.where('meetingId').equals(meetingId).first();
            if (!transcript) {
                console.log(`找不到會議 ID ${meetingId} 的逐字稿`);
            } else {
                console.log(`成功獲取會議 ID ${meetingId} 的逐字稿`);
            }
            return transcript;
        } catch (error) {
            console.error('獲取逐字稿失敗:', error);
            throw error;
        }
    }

    // 會議摘要相關操作
    static async saveMeetingSummary(summary) {
        try {
            // 先檢查是否已存在摘要
            const existingSummary = await db.summaries.where('meetingId').equals(summary.meetingId).first();
            
            if (existingSummary) {
                // 如果存在，則更新
                return await db.summaries.update(existingSummary.id, {
                    content: summary.content,
                    updatedAt: new Date()
                });
            } else {
                // 如果不存在，則新增
                return await db.summaries.add({
                    meetingId: summary.meetingId,
                    content: summary.content,
                    createdAt: new Date(),
                    updatedAt: new Date()
                });
            }
        } catch (error) {
            console.error('保存會議摘要失敗:', error);
            throw error;
        }
    }

    static async getMeetingSummary(meetingId) {
        try {
            return await db.summaries.where('meetingId').equals(meetingId).first();
        } catch (error) {
            console.error('獲取會議摘要失敗:', error);
            return null;
        }
    }

    static async deleteMeetingSummary(meetingId) {
        try {
            return await db.summaries.where('meetingId').equals(meetingId).delete();
        } catch (error) {
            console.error('刪除會議摘要失敗:', error);
            throw error;
        }
    }

    // 錄音相關操作
    static async saveRecording(meetingId, audioBlob) {
        try {
            // 先檢查是否已存在錄音
            const existingRecording = await db.recordings.where('meetingId').equals(meetingId).first();
            
            if (existingRecording) {
                // 如果存在，則更新
                console.log(`更新會議 ID ${meetingId} 的錄音`);
                return await db.recordings.update(existingRecording.id, {
                    audio: audioBlob,
                    updatedAt: new Date()
                });
            } else {
                // 如果不存在，則新增
                console.log(`新增會議 ID ${meetingId} 的錄音`);
                return await db.recordings.add({
                    meetingId,
                    audio: audioBlob,
                    createdAt: new Date(),
                    updatedAt: new Date()
                });
            }
        } catch (error) {
            console.error('保存錄音失敗:', error);
            throw error;
        }
    }

    static async getRecording(meetingId) {
        return await db.recordings.where('meetingId').equals(meetingId).first();
    }

    static async deleteRecording(meetingId) {
        return await db.recordings.where('meetingId').equals(meetingId).delete();
    }

    // 設定相關操作
    static async getSettings() {
        try {
            const settings = await db.settings.toCollection().first();
            if (settings) {
                return settings;
            } else {
                return null;
            }
        } catch (error) {
            console.error('獲取設定失敗:', error);
            return null;
        }
    }

    static async saveSettings(settings) {
        try {
            const existingSettings = await db.settings.toCollection().first();
            
            if (existingSettings) {
                await db.settings.update(existingSettings.id, settings);
            } else {
                await db.settings.add({
                    id: 1,
                    ...settings
                });
            }
        } catch (error) {
            console.error('儲存設定失敗:', error);
            throw error;
        }
    }

    static async hasRequiredSettings() {
        try {
            const settings = await Database.getSettings();
            return settings && settings.assemblyaiApiKey && settings.geminiApiKey;
        } catch (error) {
            console.error('檢查設定失敗:', error);
            return false;
        }
    }
} 