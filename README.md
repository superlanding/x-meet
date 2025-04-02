# X-Meet 會議紀錄系統

X-Meet 是一個基於 Electron 開發的會議紀錄系統，能夠自動錄音、轉錄文字，並使用 AI 生成會議摘要。

## 專案介紹

### 功能大綱

- 會議錄音功能
- 即時音頻視覺化
- 自動語音轉文字
- AI 智能會議摘要
- 多平台支援（Windows、macOS、Linux）
- 離線工作模式
- 本地資料儲存

### AI 開發工具

本專案完全使用 [Cursor AI](https://cursor.sh) 進行開發，詳細的開發過程和提示詞可以參考 [prompt.md](prompt.md)。

## 安裝教學

### Windows
1. https://drive.google.com/drive/folders/1tzMLAE82c-S5xp3XYa1w8VGN--a2CjfM?usp=drive_link 下載 `dist/X-Meet-Setup-1.0.0.exe`
2. 執行安裝程式
3. 選擇安裝目錄
4. 完成安裝後，可以從開始選單或桌面捷徑啟動

### macOS
1. https://drive.google.com/drive/folders/1tzMLAE82c-S5xp3XYa1w8VGN--a2CjfM?usp=drive_link 下載 `dist/X-Meet-1.0.0.dmg`
2. 雙擊開啟 DMG 檔案
3. 將 X-Meet 拖曳到 Applications 資料夾
4. 從 Applications 資料夾或 Spotlight 啟動

## 首次設定

### Gemini API 設定

1. 前往 [Gemini AI](https://ai.google.dev/) 註冊帳號 (可使用免費額度)
2. 在個人設定中取得 API Key
3. 啟動 X-Meet 設定中輸入 API Key

### AssemblyAI 設定

1. 前往 [AssemblyAI](https://www.assemblyai.com) 註冊帳號 (可使用免費額度)
2. 在 Dashboard 中取得 API Key
3. 啟動 X-Meet 設定中輸入 API Key

## 開發環境

### NodeJS 安裝

```bash
node --version
npm --version
```

### 開發工具
專案提供以下開發工具：

#### 啟動開發環境 APP

```bash
./bin/meeting_dev
```

啟動開發模式，支援熱重載

#### 打包部署
```bash
./bin/meeting_deploy [platform]
```
打包應用程式，可選擇平台：
- `mac`: 只打包 macOS 版本
- `win`: 只打包 Windows 版本
- `all`: 打包所有平台版本（預設）

### 開發指令
```bash
# 安裝依賴
npm install

# 啟動開發模式
npm start

# 打包應用程式
npm run build        # 打包所有平台
npm run build:mac    # 只打包 macOS
npm run build:win    # 只打包 Windows
npm run build:linux  # 只打包 Linux
```

## 系統需求
- Node.js 18.0.0 或更高版本
- npm 9.0.0 或更高版本
- 作業系統：
  - Windows 10/11
  - macOS 10.15 或更高版本
  - Linux (Ubuntu 20.04 或更高版本)
