// ==UserScript==
// @name         B站学习专注提醒助手
// @namespace    https://github.com/bilibili-study-focus
// @version      1.0.7
// @description  A Tampermonkey script that provides progressive, non-intrusive focus interventions during user-defined study periods on Bilibili video pages
// @author       Your Name
// @match        *://www.bilibili.com/video/BV*
// @grant        GM_addStyle
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_deleteValue
// @license      MIT
// @supportURL   https://github.com/bilibili-study-focus/issues
// ==/UserScript==

// ==========================================
// CSS Styles
// ==========================================
const STYLES = `
    /* Floating Window */
    .bilibili-study-floating {
        position: fixed;
        z-index: 999999;
        padding: 8px 12px;
        border-radius: 8px;
        font-size: 14px;
        color: #fff;
        cursor: move;
        user-select: none;
        box-shadow: 0 2px 10px rgba(0,0,0,0.3);
        transition: background-color 0.3s, opacity 0.3s;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        background-color: rgba(34, 139, 34, 0.7);
    }

    /* Detail Panel Modal */
    .bilibili-study-modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.6);
        z-index: 999998;
        display: flex;
        align-items: center;
        justify-content: center;
        animation: bilibili-study-fade-in 0.2s ease-out;
    }

    @keyframes bilibili-study-fade-in {
        from { opacity: 0; }
        to { opacity: 1; }
    }

    .bilibili-study-modal {
        background: #fff;
        border-radius: 12px;
        width: 90%;
        max-width: 600px;
        max-height: 80vh;
        overflow-y: auto;
        box-shadow: 0 4px 20px rgba(0,0,0,0.4);
        animation: bilibili-study-slide-up 0.2s ease-out;
    }

    @keyframes bilibili-study-slide-up {
        from { transform: translateY(20px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
    }

    .bilibili-study-modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 16px 20px;
        border-bottom: 1px solid #eee;
    }

    .bilibili-study-modal-header h2 {
        margin: 0;
        font-size: 18px;
        color: #333;
    }

    .bilibili-study-modal-close {
        background: none;
        border: none;
        font-size: 24px;
        color: #999;
        cursor: pointer;
        padding: 0;
        line-height: 1;
    }

    .bilibili-study-modal-close:hover {
        color: #333;
    }

    .bilibili-study-modal-body {
        padding: 20px;
    }

    /* Modal Modules */
    .bilibili-study-modal-module {
        margin-bottom: 20px;
        padding: 16px;
        background: #f8f9fa;
        border-radius: 8px;
    }

    .bilibili-study-modal-module:last-child {
        margin-bottom: 0;
    }

    .bilibili-study-module-title {
        margin: 0 0 12px 0;
        font-size: 16px;
        color: #333;
        font-weight: 600;
    }

    .bilibili-study-module-content {
        color: #666;
        font-size: 14px;
    }

    /* Stats Rows */
    .bilibili-study-stat-row {
        display: flex;
        justify-content: space-between;
        padding: 6px 0;
        border-bottom: 1px solid #eee;
    }

    .bilibili-study-stat-row:last-child {
        border-bottom: none;
    }

    .bilibili-study-stat-label {
        color: #666;
    }

    .bilibili-study-stat-value {
        color: #333;
        font-weight: 500;
    }

    .bilibili-study-whitelisted {
        color: #22c55e !important;
    }

    /* Action Buttons */
    .bilibili-study-action-buttons {
        display: flex;
        gap: 10px;
        margin-top: 12px;
        flex-wrap: wrap;
    }

    .bilibili-study-btn {
        padding: 8px 16px;
        border-radius: 6px;
        font-size: 14px;
        cursor: pointer;
        border: none;
        transition: all 0.2s;
    }

    .bilibili-study-btn-primary {
        background: #00a1d6;
        color: #fff;
    }

    .bilibili-study-btn-primary:hover {
        background: #0087b8;
    }

    .bilibili-study-btn-secondary {
        background: #e9ecef;
        color: #333;
    }

    .bilibili-study-btn-secondary:hover {
        background: #dee2e6;
    }

    /* Progress Bar */
    .bilibili-study-progress-container {
        display: flex;
        align-items: center;
        gap: 10px;
        margin: 12px 0;
    }

    .bilibili-study-progress-bar {
        flex: 1;
        height: 8px;
        background: #e9ecef;
        border-radius: 4px;
        overflow: hidden;
    }

    .bilibili-study-progress-fill {
        height: 100%;
        background: linear-gradient(90deg, #00a1d6, #00c7ff);
        border-radius: 4px;
        transition: width 0.3s ease;
    }

    .bilibili-study-progress-text {
        font-size: 14px;
        color: #666;
        min-width: 40px;
    }

    /* Mastered List */
    .bilibili-study-mastered-list {
        margin-top: 12px;
        padding-top: 12px;
        border-top: 1px solid #eee;
    }

    /* Recent Answers */
    .bilibili-study-recent-answers {
        margin-top: 12px;
        padding-top: 12px;
        border-top: 1px solid #eee;
    }

    .bilibili-study-answers-list {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin-top: 8px;
    }

    .bilibili-study-answer {
        display: inline-block;
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 12px;
    }

    .bilibili-study-answer-correct {
        background: #dcfce7;
        color: #16a34a;
    }

    .bilibili-study-answer-incorrect {
        background: #fee2e2;
        color: #dc2626;
    }

    /* Collapsible Section */
    .bilibili-study-collapsible {
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: space-between;
    }

    .bilibili-study-toggle-icon {
        font-size: 12px;
        transition: transform 0.2s;
    }

    .bilibili-study-collapsible-content {
        max-height: 500px;
        overflow: hidden;
        transition: max-height 0.3s ease;
    }

    .bilibili-study-collapsed .bilibili-study-collapsible-content {
        max-height: 0;
    }

    /* Suggestions List */
    .bilibili-study-suggestions-list {
        margin: 0;
        padding-left: 20px;
    }

    .bilibili-study-suggestions-list li {
        margin: 8px 0;
        line-height: 1.5;
    }

    /* Trend Chart */
    .bilibili-study-trend-chart {
        display: flex;
        flex-direction: column;
        gap: 8px;
    }

    .bilibili-study-trend-row {
        display: flex;
        align-items: center;
        gap: 10px;
    }

    .bilibili-study-trend-date {
        min-width: 50px;
        font-size: 12px;
        color: #666;
    }

    .bilibili-study-trend-bar-container {
        flex: 1;
        height: 16px;
        background: #e9ecef;
        border-radius: 3px;
        overflow: hidden;
    }

    .bilibili-study-trend-bar {
        height: 100%;
        background: linear-gradient(90deg, #00a1d6, #00c7ff);
        border-radius: 3px;
        min-width: 4px;
    }

    .bilibili-study-trend-time {
        min-width: 50px;
        font-size: 12px;
        color: #666;
        text-align: right;
    }

    .bilibili-study-no-data {
        text-align: center;
        color: #999;
        padding: 20px;
    }

    /* Visual Interventions - Stage 1: Progressive visual effects on non-player elements */
    .bilibili-study-intervention-stage1 .bilibili-player-wrap,
    .bilibili-study-intervention-stage1 .bpx-player-container,
    .bilibili-study-intervention-stage1 #bilibili-player,
    .bilibili-study-intervention-stage1 .bpx-player-video-wrap {
        filter: invert(0%) grayscale(0%) !important;
        opacity: 1 !important;
    }

    .bilibili-study-intervention-stage1 .video-container,
    .bilibili-study-intervention-stage1 .main-container,
    .bilibili-study-intervention-stage1 .left-container,
    .bilibili-study-intervention-stage1 #viewbox_report,
    .bilibili-study-intervention-stage1 .reCMD-list,
    .bilibili-study-intervention-stage1 .recommend-list,
    .bilibili-study-intervention-stage1 .sidebar,
    .bilibili-study-intervention-stage1 .relative-ul,
    .bilibili-study-intervention-stage1 .right-container,
    .bilibili-study-intervention-stage1 .video-info-container,
    .bilibili-study-intervention-stage1 .comment-container {
        filter: invert(0%) grayscale(0%);
        opacity: 1;
    }

    /* Stage 2: Peak visual effects from stage 1 + popup reminder */
    .bilibili-study-intervention-stage2 .bilibili-player-wrap,
    .bilibili-study-intervention-stage2 .bpx-player-container,
    .bilibili-study-intervention-stage2 #bilibili-player,
    .bilibili-study-intervention-stage2 .bpx-player-video-wrap {
        filter: invert(0%) grayscale(0%) !important;
        opacity: 1 !important;
    }

    .bilibili-study-intervention-stage2 .video-container,
    .bilibili-study-intervention-stage2 .main-container,
    .bilibili-study-intervention-stage2 .left-container,
    .bilibili-study-intervention-stage2 #viewbox_report,
    .bilibili-study-intervention-stage2 .reCMD-list,
    .bilibili-study-intervention-stage2 .recommend-list,
    .bilibili-study-intervention-stage2 .sidebar,
    .bilibili-study-intervention-stage2 .relative-ul,
    .bilibili-study-intervention-stage2 .right-container,
    .bilibili-study-intervention-stage2 .video-info-container,
    .bilibili-study-intervention-stage2 .comment-container {
        filter: invert(100%) grayscale(80%);
        opacity: 0.7;
    }

    /* Stage 3: Same as stage 2 */
    .bilibili-study-intervention-stage3 .bilibili-player-wrap,
    .bilibili-study-intervention-stage3 .bpx-player-container,
    .bilibili-study-intervention-stage3 #bilibili-player,
    .bilibili-study-intervention-stage3 .bpx-player-video-wrap {
        filter: invert(0%) grayscale(0%) !important;
        opacity: 1 !important;
    }

    .bilibili-study-intervention-stage3 .video-container,
    .bilibili-study-intervention-stage3 .main-container,
    .bilibili-study-intervention-stage3 .left-container,
    .bilibili-study-intervention-stage3 #viewbox_report,
    .bilibili-study-intervention-stage3 .reCMD-list,
    .bilibili-study-intervention-stage3 .recommend-list,
    .bilibili-study-intervention-stage3 .sidebar,
    .bilibili-study-intervention-stage3 .relative-ul,
    .bilibili-study-intervention-stage3 .right-container,
    .bilibili-study-intervention-stage3 .video-info-container,
    .bilibili-study-intervention-stage3 .comment-container {
        filter: invert(100%) grayscale(80%);
        opacity: 0.7;
    }

    /* Stage 4: Warning effects with red flashing border */
    .bilibili-study-intervention-stage4 .bilibili-player-wrap,
    .bilibili-study-intervention-stage4 .bpx-player-container,
    .bilibili-study-intervention-stage4 #bilibili-player,
    .bilibili-study-intervention-stage4 .bpx-player-video-wrap {
        filter: invert(0%) grayscale(0%) !important;
        opacity: 1 !important;
    }

    .bilibili-study-intervention-stage4 .video-container,
    .bilibili-study-intervention-stage4 .main-container,
    .bilibili-study-intervention-stage4 .left-container,
    .bilibili-study-intervention-stage4 #viewbox_report,
    .bilibili-study-intervention-stage4 .reCMD-list,
    .bilibili-study-intervention-stage4 .recommend-list,
    .bilibili-study-intervention-stage4 .sidebar,
    .bilibili-study-intervention-stage4 .relative-ul,
    .bilibili-study-intervention-stage4 .right-container,
    .bilibili-study-intervention-stage4 .video-info-container,
    .bilibili-study-intervention-stage4 .comment-container {
        filter: invert(100%) grayscale(80%);
        opacity: 0.6;
        outline: 3px solid #dc2626;
        outline-offset: -3px;
        animation: bilibili-study-warning-flash 1s infinite;
    }

    @keyframes bilibili-study-warning-flash {
        0%, 100% { outline-color: #dc2626; }
        50% { outline-color: #ef4444; }
    }

    /* Dynamic visual effect applied via JS */
    .bilibili-study-visual-effect {
        transition: filter 0.5s ease, opacity 0.5s ease;
    }

    /* Dark mode for detail panel */
    .bilibili-study-dark-mode {
        background-color: rgba(0, 0, 0, 0.85) !important;
    }
    
    .bilibili-study-dark-mode .bilibili-study-modal {
        background: #1e1e1e !important;
        color: #e0e0e0 !important;
    }
    
    .bilibili-study-dark-mode .bilibili-study-modal-header {
        background: #252525 !important;
        border-bottom: 1px solid #3a3a3a !important;
    }
    
    .bilibili-study-dark-mode .bilibili-study-modal-header h2 {
        color: #e0e0e0 !important;
    }
    
    .bilibili-study-dark-mode .bilibili-study-modal-close {
        color: #aaa !important;
    }
    
    .bilibili-study-dark-mode .bilibili-study-modal-close:hover {
        color: #fff !important;
    }
    
    .bilibili-study-dark-mode .bilibili-study-modal-module {
        background: #252525 !important;
        border: 1px solid #3a3a3a !important;
    }
    
    .bilibili-study-dark-mode .bilibili-study-module-title {
        color: #e0e0e0 !important;
    }
    
    .bilibili-study-dark-mode .bilibili-study-module-content {
        color: #b0b0b0 !important;
    }
    
    .bilibili-study-dark-mode .bilibili-study-stat-row {
        border-bottom-color: #3a3a3a !important;
    }
    
    .bilibili-study-dark-mode .bilibili-study-stat-label {
        color: #999 !important;
    }
    
    .bilibili-study-dark-mode .bilibili-study-stat-value {
        color: #e0e0e0 !important;
    }
    
    .bilibili-study-dark-mode .bilibili-study-btn {
        background: #333 !important;
        color: #e0e0e0 !important;
        border: 1px solid #444 !important;
    }
    
    .bilibili-study-dark-mode .bilibili-study-btn:hover {
        background: #444 !important;
    }
    
    .bilibili-study-dark-mode .bilibili-study-btn-primary {
        background: #00a1d6 !important;
        color: #fff !important;
    }
    
    .bilibili-study-dark-mode .bilibili-study-btn-primary:hover {
        background: #0087b8 !important;
    }
    
    .bilibili-study-dark-mode .bilibili-study-btn-secondary {
        background: #3a3a3a !important;
        color: #e0e0e0 !important;
    }
    
    .bilibili-study-dark-mode .bilibili-study-btn-secondary:hover {
        background: #4a4a4a !important;
    }
    
    .bilibili-study-dark-mode .bilibili-study-progress-bar {
        background: #2a2a2a !important;
    }
    
    .bilibili-study-dark-mode .bilibili-study-trend-bar-container {
        background: #2a2a2a !important;
    }
    
    .bilibili-study-dark-mode .bilibili-study-trend-date,
    .bilibili-study-dark-mode .bilibili-study-trend-time {
        color: #999 !important;
    }
    
    .bilibili-study-dark-mode .bilibili-study-answer-correct {
        background: #1a4d2e !important;
        color: #4ade80 !important;
    }
    
    .bilibili-study-dark-mode .bilibili-study-answer-incorrect {
        background: #4d1a1a !important;
        color: #f87171 !important;
    }
    
    .bilibili-study-dark-mode .bilibili-study-no-data {
        color: #666 !important;
    }
    
    .bilibili-study-dark-mode input[type="text"] {
        background: #2a2a2a !important;
        color: #e0e0e0 !important;
        border-color: #444 !important;
    }
    
    .bilibili-study-dark-mode input[type="text"]::placeholder {
        color: #666 !important;
    }
    
    .bilibili-study-dark-mode small {
        color: #777 !important;
    }
    
    .bilibili-study-dark-mode .course-item {
        background: #2a2a2a !important;
        border-color: #444 !important;
        color: #e0e0e0 !important;
    }
    
    .bilibili-study-dark-mode .course-item:hover {
        background: #333 !important;
    }
`;

// Inject CSS
if (typeof GM_addStyle !== 'undefined') {
    GM_addStyle(STYLES);
} else {
    // Fallback for when GM_addStyle is not available
    const styleEl = document.createElement('style');
    styleEl.textContent = STYLES;
    document.head.appendChild(styleEl);
}

// ==========================================
// USER CONFIGURATION - Edit these values
// ==========================================
const USER_CONFIG = {
    // Study time periods: [["HH:MM", "HH:MM"], ...]
    studyPeriods: [
        ["08:00", "12:00"],
        ["14:00", "18:00"],
        ["19:00", "22:00"]
    ],

    // Whitelist: { "BV号": { name: "课程名称", addedAt: timestamp }, ... }
    // 旧格式数组仍然兼容: ["BV1xx411c7mD", ...] 会自动转换为新格式
    whitelist: {
        "BV1EpNjzgEcs": { name: "我的学习视频", addedAt: Date.now() }
    },

    // 学习视频选择面板相关配置
    learningVideoPanel: {
        enabled: true,
        defaultBV: "BV1EpNjzgEcs"  // 点击立即返回时默认跳转的BV号
    },

    // Intervention thresholds (seconds) and popup intervals (seconds)
    interventionStages: [
        { threshold: 0, interval: 0 },      // Stage 0: Confirm
        { threshold: 60, interval: 0 },     // Stage 1: 1min, visual only
        { threshold: 300, interval: 120 },  // Stage 2: 5min, popup 2min
        { threshold: 600, interval: 30 },   // Stage 3: 10min, popup 30s
        { threshold: 1200, interval: 15 }   // Stage 4: 20min, popup 15s
    ],

    // Vocabulary: ["Chinese:English", ...]
    vocabulary: [
        "学习:study",
        "专注:focus",
        "进步:progress",
        "努力:effort",
        "坚持:persistence"
    ],

    // Consecutive correct answers to master a word
    masteryThreshold: 3,

    // Include mastered words in verification
    includeMasteredWords: false,

    // Floating window settings
    floatingWindow: {
        enabled: true,
        defaultPosition: { x: 20, y: 100 },
        showStats: true
    },

    // Statistics period
    statsPeriod: "day"  // "day" or "week"
};

// ==========================================
// ConfigManager Module
// ==========================================
const ConfigManager = (function() {
    const STORAGE_KEY = "bilibiliStudyAssistant_config";
    let currentConfig = null;

    // Load config from localStorage or return defaults
    function load() {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                const parsed = JSON.parse(stored);
                // Merge with defaults to ensure all fields exist
                currentConfig = {
                    ...USER_CONFIG,
                    ...parsed,
                    floatingWindow: {
                        ...USER_CONFIG.floatingWindow,
                        ...(parsed.floatingWindow || {})
                    }
                };
            } else {
                currentConfig = { ...USER_CONFIG };
            }
        } catch (e) {
            console.warn("Failed to load config from localStorage, using defaults:", e);
            currentConfig = { ...USER_CONFIG };
        }
        return currentConfig;
    }

    // Save config to localStorage
    function save(config) {
        try {
            currentConfig = { ...currentConfig, ...config };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(currentConfig));
        } catch (e) {
            console.error("Failed to save config to localStorage:", e);
        }
    }

    // Get current config
    function get() {
        if (!currentConfig) {
            load();
        }
        return currentConfig;
    }

    // Parse time string "HH:MM" to minutes from midnight
    function parseTimeToMinutes(timeStr) {
        const [hours, minutes] = timeStr.split(":").map(Number);
        return hours * 60 + minutes;
    }

    // Check if current time is within study periods
    function isStudyTime() {
        const config = get();
        if (!config.studyPeriods || config.studyPeriods.length === 0) {
            return false;
        }

        const now = new Date();
        const currentMinutes = now.getHours() * 60 + now.getMinutes();

        for (const period of config.studyPeriods) {
            const startMinutes = parseTimeToMinutes(period[0]);
            const endMinutes = parseTimeToMinutes(period[1]);

            // Handle overnight periods (e.g., 22:00 to 06:00)
            if (startMinutes <= endMinutes) {
                if (currentMinutes >= startMinutes && currentMinutes < endMinutes) {
                    return true;
                }
            } else {
                // Overnight: either >= start OR < end
                if (currentMinutes >= startMinutes || currentMinutes < endMinutes) {
                    return true;
                }
            }
        }
        return false;
    }

    // Check if BV is in whitelist
    function isWhitelisted(bv) {
        const config = get();
        if (!bv || !config.whitelist) {
            return false;
        }
        // Support both old array format and new object format
        if (Array.isArray(config.whitelist)) {
            return config.whitelist.includes(bv);
        }
        return !!config.whitelist[bv];
    }

    // Add video to whitelist with optional course name
    function addToWhitelist(bv, courseName) {
        const config = get();
        if (!config.whitelist) {
            config.whitelist = {};
        }
        // Convert array format to object format if needed
        if (Array.isArray(config.whitelist)) {
            const oldWhitelist = config.whitelist;
            config.whitelist = {};
            oldWhitelist.forEach(item => {
                if (typeof item === 'string') {
                    config.whitelist[item] = { name: item, addedAt: Date.now() };
                } else {
                    config.whitelist[item.bv] = { name: item.name || item.bv, addedAt: item.addedAt || Date.now() };
                }
            });
        }
        // Check if already exists
        if (config.whitelist[bv]) {
            return { success: false, message: '该视频已在白名单中' };
        }
        // Check for duplicate course name
        const courseNameLower = (courseName || '').toLowerCase().trim();
        if (courseNameLower) {
            for (const key in config.whitelist) {
                if (config.whitelist[key].name && config.whitelist[key].name.toLowerCase().trim() === courseNameLower) {
                    return { success: false, message: `课程名称 "${courseName}" 已存在，请使用其他名称` };
                }
            }
        }
        // Add new entry
        config.whitelist[bv] = {
            name: courseName || bv,
            addedAt: Date.now()
        };
        save({ whitelist: config.whitelist });
        return { success: true };
    }

    // Remove video from whitelist
    function removeFromWhitelist(bv) {
        const config = get();
        if (!config.whitelist || Array.isArray(config.whitelist)) {
            return false;
        }
        if (config.whitelist[bv]) {
            delete config.whitelist[bv];
            save({ whitelist: config.whitelist });
            return true;
        }
        return false;
    }

    // Get whitelist as array with course names
    function getWhitelistArray() {
        const config = get();
        if (!config.whitelist) return [];
        if (Array.isArray(config.whitelist)) {
            return config.whitelist.map(item => typeof item === 'string' ? { bv: item, name: item } : item);
        }
        return Object.entries(config.whitelist).map(([bv, info]) => ({ bv, name: info.name || bv }));
    }

    // Get course name for a BV
    function getCourseName(bv) {
        const config = get();
        if (!config.whitelist) return null;
        if (Array.isArray(config.whitelist)) {
            return null;
        }
        if (config.whitelist[bv]) {
            return config.whitelist[bv].name || bv;
        }
        return null;
    }

    // Get default return target BV
    function getDefaultReturnBV() {
        const config = get();
        const panelConfig = config.learningVideoPanel;
        if (panelConfig && panelConfig.defaultBV) {
            return panelConfig.defaultBV;
        }
        // Fallback to first whitelist video
        const whitelistArray = getWhitelistArray();
        if (whitelistArray.length > 0) {
            return whitelistArray[0].bv;
        }
        return null;
    }

    // Get intervention config for stage
    function getInterventionConfig(stage) {
        const config = get();
        if (!config.interventionStages || stage < 0 || stage >= config.interventionStages.length) {
            return null;
        }
        return config.interventionStages[stage];
    }

    return {
        load,
        save,
        get,
        isStudyTime,
        isWhitelisted,
        getInterventionConfig,
        addToWhitelist,
        removeFromWhitelist,
        getWhitelistArray,
        getCourseName,
        getDefaultReturnBV
    };
})();

// ==========================================
// StorageManager Module
// ==========================================
const StorageManager = (function() {
    const STORAGE_PREFIX = "bilibiliStudyAssistant_";
    const MODULES = {
        userConfig: "config",
        timeStats: "stats",
        wordRecords: "words"
    };

    // In-memory fallback when localStorage is unavailable
    let memoryStorage = {};

    // Check if localStorage is available
    function isLocalStorageAvailable() {
        try {
            const testKey = "__storage_test__";
            localStorage.setItem(testKey, testKey);
            localStorage.removeItem(testKey);
            return true;
        } catch (e) {
            return false;
        }
    }

    const isAvailable = isLocalStorageAvailable();

    // Get the full storage key
    function getKey(moduleName) {
        return STORAGE_PREFIX + MODULES[moduleName] || moduleName;
    }

    // Retrieve module data
    function getModule(name) {
        const key = getKey(name);
        try {
            if (isAvailable) {
                const stored = localStorage.getItem(key);
                return stored ? JSON.parse(stored) : null;
            } else {
                return memoryStorage[key] || null;
            }
        } catch (e) {
            console.warn(`Failed to get module ${name} from storage:`, e);
            return memoryStorage[key] || null;
        }
    }

    // Save module data
    function setModule(name, data) {
        const key = getKey(name);
        try {
            if (isAvailable) {
                localStorage.setItem(key, JSON.stringify(data));
            } else {
                memoryStorage[key] = data;
            }
        } catch (e) {
            console.error(`Failed to save module ${name} to storage:`, e);
            // Fallback to memory storage
            memoryStorage[key] = data;
        }
    }

    return {
        getModule,
        setModule,
        isAvailable: function() { return isAvailable; }
    };
})();

// ==========================================
// Data Structure Definitions
// ==========================================

// Default data structures for the three modules
const DEFAULT_DATA_STRUCTURES = {
    // Module 1: userConfig
    userConfig: {
        version: "1.1.0",
        studyPeriods: USER_CONFIG.studyPeriods,
        whitelist: USER_CONFIG.whitelist,
        learningVideoPanel: USER_CONFIG.learningVideoPanel,
        interventionConfig: {
            stages: USER_CONFIG.interventionStages
        },
        vocabulary: USER_CONFIG.vocabulary,
        masteryThreshold: USER_CONFIG.masteryThreshold,
        includeMasteredWords: USER_CONFIG.includeMasteredWords,
        floatingWindow: USER_CONFIG.floatingWindow,
        statsPeriod: USER_CONFIG.statsPeriod
    },

    // Module 2: timeStats
    timeStats: {
        lastResetDate: new Date().toISOString().split('T')[0],
        today: {
            studyTime: 0,           // seconds
            distractionTime: 0,     // seconds
            distractionCount: 0,
            wordAccuracy: {
                correct: 0,
                total: 0
            }
        },
        history: []  // up to 30 days
    },

    // Module 3: wordRecords
    wordRecords: {
        words: {},  // { chinese: { chinese, english, consecutiveCorrect, mastered, totalAttempts, correctAttempts } }
        recentAnswers: []  // up to 50
    }
};

// Initialize or get data for a module
function getOrInitModule(moduleName) {
    let data = StorageManager.getModule(moduleName);
    if (!data) {
        data = { ...DEFAULT_DATA_STRUCTURES[moduleName] };
        // Deep clone nested objects
        if (moduleName === 'timeStats') {
            data.today = { ...DEFAULT_DATA_STRUCTURES.timeStats.today };
            data.today.wordAccuracy = { ...DEFAULT_DATA_STRUCTURES.timeStats.today.wordAccuracy };
        }
        if (moduleName === 'wordRecords') {
            data.words = {};
            data.recentAnswers = [];
        }
        StorageManager.setModule(moduleName, data);
    }
    return data;
}

// ==========================================
// PageMonitor Module
// ==========================================
const PageMonitor = (function() {
    // Bilibili video URL pattern: *://www.bilibili.com/video/BV*
    const VIDEO_URL_PATTERN = /^https?:\/\/www\.bilibili\.com\/video\/BV[\w]+/;
    const BV_PATTERN = /\/video\/(BV[\w]+)/;

    let currentBV = null;
    let observer = null;
    let routeChangeCallback = null;

    // Check if current URL matches Bilibili video pattern
    function isVideoPage() {
        return VIDEO_URL_PATTERN.test(window.location.href);
    }

    // Extract BV number from current URL
    function getCurrentBV() {
        const match = window.location.href.match(BV_PATTERN);
        return match ? match[1] : null;
    }

    // Check if page is visible (not background tab)
    function isPageActive() {
        return document.visibilityState === 'visible';
    }

    // Check video fullscreen state
    function isFullscreen() {
        return !!(
            document.fullscreenElement ||
            document.webkitFullscreenElement ||
            document.mozFullScreenElement ||
            document.msFullscreenElement
        );
    }

    // Handle route changes (SPA navigation)
    function onRouteChange() {
        const newBV = getCurrentBV();
        if (newBV !== currentBV) {
            currentBV = newBV;
            if (routeChangeCallback) {
                routeChangeCallback(currentBV);
            }
        }
    }

    // Set up MutationObserver for DOM changes (SPA navigation)
    function observeSPAChanges(callback) {
        routeChangeCallback = callback;

        // Listen for popstate events (browser back/forward)
        window.addEventListener('popstate', onRouteChange);

        // Also listen for pushState/replaceState to detect SPA navigation
        const originalPushState = history.pushState;
        const originalReplaceState = history.replaceState;

        history.pushState = function() {
            originalPushState.apply(this, arguments);
            setTimeout(onRouteChange, 100);
        };

        history.replaceState = function() {
            originalReplaceState.apply(this, arguments);
            setTimeout(onRouteChange, 100);
        };

        // Use MutationObserver to detect DOM changes
        if (typeof MutationObserver !== 'undefined') {
            observer = new MutationObserver(function(mutations) {
                // Re-check URL after DOM changes
                onRouteChange();
            });

            // Observe the body for any child additions
            observer.observe(document.body, {
                childList: true,
                subtree: true
            });
        }
    }

    // Stop observing SPA changes
    function stopObserving() {
        if (observer) {
            observer.disconnect();
            observer = null;
        }
        window.removeEventListener('popstate', onRouteChange);
    }

    // Initialize page monitoring
    function init() {
        currentBV = getCurrentBV();
    }

    return {
        init,
        isVideoPage,
        getCurrentBV,
        isPageActive,
        isFullscreen,
        observeSPAChanges,
        stopObserving
    };
})();

// ==========================================
// FloatingWindow Module
// ==========================================
const FloatingWindow = (function() {
    const WINDOW_ID = 'bilibili-study-floating-window';
    const POSITION_KEY = 'bilibiliStudyAssistant_floatingPosition';

    let element = null;
    let isDragging = false;
    let dragStartX = 0;
    let dragStartY = 0;
    let elementStartX = 0;
    let elementStartY = 0;
    let isFullscreen = false;
    let onPanelOpenCallback = null;

    // Get saved position from localStorage
    function getPosition() {
        try {
            const stored = localStorage.getItem(POSITION_KEY);
            if (stored) {
                return JSON.parse(stored);
            }
        } catch (e) {
            console.warn('Failed to get floating window position:', e);
        }
        return null;
    }

    // Save position to localStorage
    function setPosition(x, y) {
        try {
            localStorage.setItem(POSITION_KEY, JSON.stringify({ x, y }));
        } catch (e) {
            console.warn('Failed to save floating window position:', e);
        }
    }

    // Format time as "XhXm" or "XmXs"
    function formatTime(seconds) {
        if (seconds >= 3600) {
            const hours = Math.floor(seconds / 3600);
            const mins = Math.floor((seconds % 3600) / 60);
            return `${hours}h${mins}m`;
        } else {
            const mins = Math.floor(seconds / 60);
            const secs = seconds % 60;
            return `${mins}m${secs}s`;
        }
    }

    // Create and append floating window element
    function create() {
        if (element) {
            return element;
        }

        const config = ConfigManager.get();
        if (!config.floatingWindow || !config.floatingWindow.enabled) {
            return null;
        }

        element = document.createElement('div');
        element.id = WINDOW_ID;
        element.className = 'bilibili-study-floating';

        // Apply base styles
        element.style.cssText = `
            position: fixed;
            z-index: 999999;
            padding: 8px 12px;
            border-radius: 8px;
            font-size: 14px;
            color: #fff;
            cursor: move;
            user-select: none;
            box-shadow: 0 2px 10px rgba(0,0,0,0.3);
            transition: background-color 0.3s, opacity 0.3s;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            background-color: rgba(34, 139, 34, 0.7);
        `;

        // Set initial content (studying state)
        element.innerHTML = `
            <span class="bilibili-study-status-text">学习中</span>
            <span class="bilibili-study-time-display">今日学习：0h0m</span>
        `;

        // Restore position from localStorage or use default
        const savedPosition = getPosition();
        if (savedPosition) {
            element.style.left = savedPosition.x + 'px';
            element.style.top = savedPosition.y + 'px';
        } else {
            const defaultPos = config.floatingWindow.defaultPosition || { x: 20, y: 100 };
            element.style.left = defaultPos.x + 'px';
            element.style.top = defaultPos.y + 'px';
        }

        // Add event listeners
        element.addEventListener('mousedown', onDragStart);
        element.addEventListener('click', onClick);

        document.body.appendChild(element);

        // Set up fullscreen listener
        setupFullscreenListener();

        return element;
    }

    // Set up fullscreen change listener
    function setupFullscreenListener() {
        const handleFullscreenChange = function() {
            isFullscreen = PageMonitor.isFullscreen();
            if (element) {
                element.style.display = isFullscreen ? 'none' : 'block';
            }
        };

        document.addEventListener('fullscreenchange', handleFullscreenChange);
        document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
        document.addEventListener('mozfullscreenchange', handleFullscreenChange);
        document.addEventListener('MSFullscreenChange', handleFullscreenChange);
    }

    // Drag start - track mouse down position
    function onDragStart(e) {
        if (e.button !== 0) return; // Only left mouse button

        isDragging = false;
        dragStartX = e.clientX;
        dragStartY = e.clientY;

        const rect = element.getBoundingClientRect();
        elementStartX = rect.left;
        elementStartY = rect.top;

        document.addEventListener('mousemove', onDragMove);
        document.addEventListener('mouseup', onDragEnd);
    }

    // Drag move - update element position during drag
    function onDragMove(e) {
        const deltaX = e.clientX - dragStartX;
        const deltaY = e.clientY - dragStartY;

        // Use 5px threshold to distinguish drag from click
        if (!isDragging && (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5)) {
            isDragging = true;
        }

        if (isDragging) {
            let newX = elementStartX + deltaX;
            let newY = elementStartY + deltaY;

            // Constrain to viewport bounds
            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;
            const elemWidth = element.offsetWidth;
            const elemHeight = element.offsetHeight;

            newX = Math.max(0, Math.min(newX, viewportWidth - elemWidth));
            newY = Math.max(0, Math.min(newY, viewportHeight - elemHeight));

            element.style.left = newX + 'px';
            element.style.top = newY + 'px';
        }
    }

    // Drag end - finalize position
    function onDragEnd(e) {
        document.removeEventListener('mousemove', onDragMove);
        document.removeEventListener('mouseup', onDragEnd);

        if (isDragging) {
            // Save position to localStorage
            const rect = element.getBoundingClientRect();
            setPosition(rect.left, rect.top);
        }
    }

    // Click handler - open detail panel (if not dragging)
    function onClick(e) {
        if (!isDragging && onPanelOpenCallback) {
            onPanelOpenCallback();
        }
    }

    // Set callback for panel open
    function setOnPanelOpen(callback) {
        onPanelOpenCallback = callback;
    }

    // Update status display
    function updateStatus(status) {
        if (!element) return;

        const { isStudying, stage, studyTime, distractionTime } = status;

        if (isStudying) {
            // Green background for studying
            element.style.backgroundColor = 'rgba(34, 139, 34, 0.7)';
            element.innerHTML = `
                <span class="bilibili-study-status-text">学习中</span>
                <span class="bilibili-study-time-display">今日学习：${formatTime(studyTime || 0)}</span>
            `;
        } else {
            // Red background with varying opacity based on stage
            const opacityMap = {
                0: 0.7,
                1: 0.65,
                2: 0.55,
                3: 0.45,
                4: 0.35
            };
            const opacity = opacityMap[stage] || 0.7;
            element.style.backgroundColor = `rgba(220, 20, 60, ${opacity})`;
            element.innerHTML = `
                <span class="bilibili-study-status-text">分心中</span>
                <span class="bilibili-study-time-display">已停留：${formatTime(distractionTime || 0)}</span>
            `;
        }
    }

    // Show/hide based on fullscreen
    function setFullscreen(fullscreen) {
        isFullscreen = fullscreen;
        if (element) {
            element.style.display = fullscreen ? 'none' : 'block';
        }
    }

    // Get current position
    function getCurrentPosition() {
        if (!element) return null;
        const rect = element.getBoundingClientRect();
        return { x: rect.left, y: rect.top };
    }

    // Destroy floating window
    function destroy() {
        if (element) {
            element.remove();
            element = null;
        }
    }

    return {
        create,
        updateStatus,
        setFullscreen,
        getPosition: getCurrentPosition,
        setOnPanelOpen,
        destroy
    };
})();

// ==========================================
// DetailPanel Module
// ==========================================
const DetailPanel = (function() {
    const MODAL_ID = 'bilibili-study-detail-modal';
    const THEME_KEY = 'bilibiliStudyAssistant_theme';
    let modalElement = null;
    let isOpen = false;
    let currentTheme = 'light'; // 'light' or 'dark'

    // Load theme preference
    function loadTheme() {
        try {
            const saved = localStorage.getItem(THEME_KEY);
            currentTheme = saved || 'light';
        } catch (e) {
            currentTheme = 'light';
        }
        return currentTheme;
    }

    // Save theme preference
    function saveTheme(theme) {
        try {
            localStorage.setItem(THEME_KEY, theme);
            currentTheme = theme;
        } catch (e) {
            console.warn('Failed to save theme preference:', e);
        }
    }

    // Toggle theme
    function toggleTheme() {
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        saveTheme(newTheme);
        applyTheme(newTheme);
    }

    // Apply theme to modal
    function applyTheme(theme) {
        if (!modalElement) return;
        
        if (theme === 'dark') {
            modalElement.classList.add('bilibili-study-dark-mode');
        } else {
            modalElement.classList.remove('bilibili-study-dark-mode');
        }
        
        // Update toggle button icon
        const toggleBtn = document.getElementById('bilibili-study-theme-toggle');
        if (toggleBtn) {
            toggleBtn.textContent = theme === 'dark' ? '☀️' : '🌙';
            toggleBtn.title = theme === 'dark' ? '切换到亮色模式' : '切换到暗色模式';
        }
    }

    // Format time as "Xh Xm" or "Xm Xs"
    function formatTime(seconds) {
        if (!seconds || seconds < 0) seconds = 0;
        if (seconds >= 3600) {
            const hours = Math.floor(seconds / 3600);
            const mins = Math.floor((seconds % 3600) / 60);
            return `${hours}小时${mins}分钟`;
        } else {
            const mins = Math.floor(seconds / 60);
            const secs = seconds % 60;
            return `${mins}分${secs}秒`;
        }
    }

    // Get today's statistics
    function getTodayStats() {
        const stats = getOrInitModule('timeStats');
        return stats.today || {
            studyTime: 0,
            distractionTime: 0,
            distractionCount: 0,
            wordAccuracy: { correct: 0, total: 0 }
        };
    }

    // Get word records
    function getWordRecords() {
        return getOrInitModule('wordRecords');
    }

    // Get 7-day trend data
    function getTrendData() {
        const stats = getOrInitModule('timeStats');
        const history = stats.history || [];
        const today = getTodayStats();

        // Combine today with history, get last 7 days
        const days = [];
        const todayDate = new Date().toISOString().split('T')[0];

        // Add today first
        days.push({
            date: todayDate,
            studyTime: today.studyTime,
            distractionTime: today.distractionTime
        });

        // Add history (most recent first)
        for (let i = history.length - 1; i >= 0 && days.length < 7; i--) {
            days.push(history[i]);
        }

        return days.slice(0, 7);
    }

    // Render Module 1: Today's overview
    function renderModule1() {
        const stats = getTodayStats();
        const accuracy = stats.wordAccuracy;
        const accuracyPercent = accuracy.total > 0
            ? Math.round((accuracy.correct / accuracy.total) * 100)
            : 0;

        return `
            <div class="bilibili-study-modal-module">
                <h3 class="bilibili-study-module-title">📊 今日概览</h3>
                <div class="bilibili-study-module-content">
                    <div class="bilibili-study-stat-row">
                        <span class="bilibili-study-stat-label">有效学习时间：</span>
                        <span class="bilibili-study-stat-value">${formatTime(stats.studyTime)}</span>
                    </div>
                    <div class="bilibili-study-stat-row">
                        <span class="bilibili-study-stat-label">分心时间：</span>
                        <span class="bilibili-study-stat-value">${formatTime(stats.distractionTime)}</span>
                    </div>
                    <div class="bilibili-study-stat-row">
                        <span class="bilibili-study-stat-label">分心次数：</span>
                        <span class="bilibili-study-stat-value">${stats.distractionCount || 0}次</span>
                    </div>
                    <div class="bilibili-study-stat-row">
                        <span class="bilibili-study-stat-label">单词正确率：</span>
                        <span class="bilibili-study-stat-value">${accuracyPercent}% (${accuracy.correct}/${accuracy.total})</span>
                    </div>
                </div>
            </div>
        `;
    }

    // Render Module 2: Real-time status
    function renderModule2() {
        const currentBV = PageMonitor.getCurrentBV() || '未知';
        const isWhitelisted = ConfigManager.isWhitelisted(currentBV);
        const config = ConfigManager.get();

        // Get current stage from app state (if available)
        const currentStage = window.__bilibiliStudyAppState?.currentStage || 0;

        return `
            <div class="bilibili-study-modal-module">
                <h3 class="bilibili-study-module-title">🔍 当前状态</h3>
                <div class="bilibili-study-module-content">
                    <div class="bilibili-study-stat-row">
                        <span class="bilibili-study-stat-label">当前视频：</span>
                        <span class="bilibili-study-stat-value">${currentBV}</span>
                    </div>
                    <div class="bilibili-study-stat-row">
                        <span class="bilibili-study-stat-label">白名单状态：</span>
                        <span class="bilibili-study-stat-value ${isWhitelisted ? 'bilibili-study-whitelisted' : ''}">
                            ${isWhitelisted ? '✓ 已加入白名单' : '✗ 未加入白名单'}
                        </span>
                    </div>
                    <div class="bilibili-study-stat-row">
                        <span class="bilibili-study-stat-label">干预阶段：</span>
                        <span class="bilibili-study-stat-value">${currentStage} / ${config.interventionStages.length - 1}</span>
                    </div>
                    <div class="bilibili-study-action-buttons">
                        <button class="bilibili-study-btn bilibili-study-btn-primary" id="bilibili-study-stop-intervention">
                            手动停止干预
                        </button>
                        ${!isWhitelisted ? `
                        <button class="bilibili-study-btn bilibili-study-btn-secondary" id="bilibili-study-add-whitelist">
                            添加到白名单
                        </button>
                        ` : `
                        <button class="bilibili-study-btn bilibili-study-btn-secondary" id="bilibili-study-remove-whitelist">
                            从白名单移除
                        </button>
                        `}
                    </div>
                </div>
            </div>
        `;
    }

    // Render Module 3: Word learning records
    function renderModule3() {
        const wordData = getWordRecords();
        const words = wordData.words || {};
        const recentAnswers = wordData.recentAnswers || [];

        const totalWords = Object.keys(words).length;
        const masteredWords = Object.values(words).filter(w => w.mastered).length;
        const progressPercent = totalWords > 0 ? Math.round((masteredWords / totalWords) * 100) : 0;

        // Get mastered words list
        const masteredList = Object.values(words)
            .filter(w => w.mastered)
            .map(w => w.chinese)
            .join('、') || '暂无';

        // Get recent 10 answers
        const recent10 = recentAnswers.slice(-10).reverse();
        const recentAnswersHtml = recent10.length > 0
            ? recent10.map(a => `<span class="bilibili-study-answer ${a.correct ? 'bilibili-study-answer-correct' : 'bilibili-study-answer-incorrect'}">${a.correct ? '✓' : '✗'}${a.word}</span>`).join(' ')
            : '暂无答题记录';

        return `
            <div class="bilibili-study-modal-module">
                <h3 class="bilibili-study-module-title">📚 单词学习</h3>
                <div class="bilibili-study-module-content">
                    <div class="bilibili-study-stat-row">
                        <span class="bilibili-study-stat-label">总单词数：</span>
                        <span class="bilibili-study-stat-value">${totalWords}</span>
                    </div>
                    <div class="bilibili-study-stat-row">
                        <span class="bilibili-study-stat-label">已掌握：</span>
                        <span class="bilibili-study-stat-value">${masteredWords}</span>
                    </div>
                    <div class="bilibili-study-progress-container">
                        <div class="bilibili-study-progress-bar">
                            <div class="bilibili-study-progress-fill" style="width: ${progressPercent}%"></div>
                        </div>
                        <span class="bilibili-study-progress-text">${progressPercent}%</span>
                    </div>
                    <div class="bilibili-study-mastered-list">
                        <span class="bilibili-study-stat-label">已掌握：</span>
                        <span class="bilibili-study-stat-value">${masteredList}</span>
                    </div>
                    <div class="bilibili-study-recent-answers">
                        <span class="bilibili-study-stat-label">最近答题：</span>
                        <div class="bilibili-study-answers-list">${recentAnswersHtml}</div>
                    </div>
                </div>
            </div>
        `;
    }

    // Render Module 4: Focus suggestions
    function renderModule4() {
        const stats = getTodayStats();
        const wordData = getWordRecords();
        const words = wordData.words || {};
        const masteredCount = Object.values(words).filter(w => w.mastered).length;

        const suggestions = [];

        // Suggestion based on distraction time
        if (stats.distractionTime > 1800) { // > 30 min
            suggestions.push('今天分心时间较长，建议设置更明确的学习目标。');
        }

        // Suggestion based on distraction count
        if (stats.distractionCount > 5) {
            suggestions.push(`您今天已经分心${stats.distractionCount}次了，建议短暂休息一下。`);
        }

        // Suggestion based on study time
        if (stats.studyTime > 7200 && stats.distractionTime < 600) { // > 2h study, < 10min distraction
            suggestions.push('学习状态非常好！继续保持专注！');
        }

        // Suggestion based on word learning
        if (masteredCount > 0) {
            suggestions.push(`您已经掌握了${masteredCount}个单词，继续加油！`);
        } else if (Object.keys(words).length > 0) {
            suggestions.push('尝试开始单词学习，通过测验来巩固记忆。');
        }

        // Default suggestion
        if (suggestions.length === 0) {
            suggestions.push('保持良好的学习习惯，祝您学习愉快！');
        }

        const suggestionsHtml = suggestions.map(s => `<li>${s}</li>`).join('');

        return `
            <div class="bilibili-study-modal-module">
                <h3 class="bilibili-study-module-title bilibili-study-collapsible" id="bilibili-study-suggestions-toggle">
                    💡 专注建议 <span class="bilibili-study-toggle-icon">▶</span>
                </h3>
                <div class="bilibili-study-module-content bilibili-study-collapsible-content" id="bilibili-study-suggestions-content">
                    <ul class="bilibili-study-suggestions-list">
                        ${suggestionsHtml}
                    </ul>
                </div>
            </div>
        `;
    }

    // Render Module 5: Historical trends
    function renderModule5() {
        const trendData = getTrendData();

        if (trendData.length === 0) {
            return `
                <div class="bilibili-study-modal-module">
                    <h3 class="bilibili-study-module-title">📈 历史趋势 (7天)</h3>
                    <div class="bilibili-study-module-content">
                        <p class="bilibili-study-no-data">暂无历史数据</p>
                    </div>
                </div>
            `;
        }

        // Find max study time for bar chart scaling
        const maxStudyTime = Math.max(...trendData.map(d => d.studyTime), 1);

        const barsHtml = trendData.map(day => {
            const date = new Date(day.date);
            const dateStr = `${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getDate().toString().padStart(2, '0')}`;
            const barWidth = Math.max(5, (day.studyTime / maxStudyTime) * 100);
            const hours = Math.floor(day.studyTime / 3600);
            const mins = Math.floor((day.studyTime % 3600) / 60);
            const timeStr = day.studyTime >= 3600 ? `${hours}h${mins}m` : `${mins}m`;

            return `
                <div class="bilibili-study-trend-row">
                    <span class="bilibili-study-trend-date">${dateStr}</span>
                    <div class="bilibili-study-trend-bar-container">
                        <div class="bilibili-study-trend-bar" style="width: ${barWidth}%"></div>
                    </div>
                    <span class="bilibili-study-trend-time">${timeStr}</span>
                </div>
            `;
        }).join('');

        return `
            <div class="bilibili-study-modal-module">
                <h3 class="bilibili-study-module-title">📈 历史趋势 (7天)</h3>
                <div class="bilibili-study-module-content">
                    <div class="bilibili-study-trend-chart">
                        ${barsHtml}
                    </div>
                </div>
            </div>
        `;
    }

    // Close modal
    function close() {
        if (modalElement) {
            modalElement.remove();
            modalElement = null;
        }
        isOpen = false;

        // Remove keyboard listener
        document.removeEventListener('keydown', handleKeyDown);
    }

    // Handle keyboard events
    function handleKeyDown(e) {
        if (e.key === 'Escape' && isOpen) {
            close();
        }
    }

    // Open modal
    function open() {
        if (isOpen) {
            close(); // Close existing modal first
        }

        // Create modal overlay
        modalElement = document.createElement('div');
        modalElement.id = MODAL_ID;
        modalElement.className = 'bilibili-study-modal-overlay';
        
        // Load saved theme
        loadTheme();
        
        modalElement.innerHTML = `
            <div class="bilibili-study-modal">
                <div class="bilibili-study-modal-header">
                    <h2>学习专注助手 - 详细统计</h2>
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <button class="bilibili-study-btn bilibili-study-btn-secondary" 
                                id="bilibili-study-theme-toggle"
                                style="padding: 6px 12px; font-size: 18px; cursor: pointer;"
                                title="切换主题">
                            ${currentTheme === 'dark' ? '☀️' : '🌙'}
                        </button>
                        <button class="bilibili-study-modal-close" id="bilibili-study-modal-close">&times;</button>
                    </div>
                </div>
                <div class="bilibili-study-modal-body">
                    ${renderModule1()}
                    ${renderModule2()}
                    ${renderModule3()}
                    ${renderModule4()}
                    ${renderModule5()}
                </div>
            </div>
        `;

        document.body.appendChild(modalElement);
        isOpen = true;
        
        // Apply saved theme
        applyTheme(currentTheme);

        // Add event listeners
        modalElement.querySelector('#bilibili-study-modal-close').addEventListener('click', close);
        modalElement.addEventListener('click', function(e) {
            if (e.target === modalElement) {
                close();
            }
        });

        // Theme toggle button
        const themeToggleBtn = document.getElementById('bilibili-study-theme-toggle');
        if (themeToggleBtn) {
            themeToggleBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                toggleTheme();
            });
        }

        // Add keyboard listener
        document.addEventListener('keydown', handleKeyDown);

        // Add button event listeners
        setTimeout(() => {
            // Stop intervention button
            const stopBtn = document.getElementById('bilibili-study-stop-intervention');
            if (stopBtn) {
                stopBtn.addEventListener('click', function() {
                    if (window.__bilibiliStudyAppState) {
                        window.__bilibiliStudyAppState.currentStage = 0;
                        window.__bilibiliStudyAppState.distractionStartTime = null;
                    }
                    // Remove visual interventions
                    document.body.classList.remove(
                        'bilibili-study-intervention-stage1',
                        'bilibili-study-intervention-stage2',
                        'bilibili-study-intervention-stage3',
                        'bilibili-study-intervention-stage4'
                    );
                    close();
                });
            }

            // Add to whitelist button
            const whitelistBtn = document.getElementById('bilibili-study-add-whitelist');
            if (whitelistBtn) {
                whitelistBtn.addEventListener('click', function() {
                    showAddWhitelistModal();
                });
            }

            // Remove from whitelist button
            const removeWhitelistBtn = document.getElementById('bilibili-study-remove-whitelist');
            if (removeWhitelistBtn) {
                removeWhitelistBtn.addEventListener('click', function() {
                    const currentBV = PageMonitor.getCurrentBV();
                    if (currentBV) {
                        ConfigManager.removeFromWhitelist(currentBV);
                    }
                    close();
                });
            }

            // Collapsible section toggle
            const toggleBtn = document.getElementById('bilibili-study-suggestions-toggle');
            const content = document.getElementById('bilibili-study-suggestions-content');
            if (toggleBtn && content) {
                toggleBtn.addEventListener('click', function() {
                    content.classList.toggle('bilibili-study-collapsed');
                    const icon = toggleBtn.querySelector('.bilibili-study-toggle-icon');
                    if (icon) {
                        icon.textContent = content.classList.contains('bilibili-study-collapsed') ? '▶' : '▼';
                    }
                });
            }
        }, 100);
    }

    function showAddWhitelistModal() {
        const currentBV = PageMonitor.getCurrentBV();
        if (!currentBV) return;

        const modal = document.createElement('div');
        modal.className = 'bilibili-study-modal-overlay';
        modal.id = 'bilibili-study-add-whitelist-modal';
        modal.innerHTML = `
            <div class="bilibili-study-modal" style="max-width: 400px;">
                <div class="bilibili-study-modal-header">
                    <h2>📚 添加到白名单</h2>
                </div>
                <div class="bilibili-study-modal-body">
                    <p style="font-size: 14px; margin-bottom: 10px; color: #666;">
                        当前视频：${currentBV}
                    </p>
                    <div style="margin-bottom: 15px;">
                        <label style="display: block; margin-bottom: 5px; font-size: 14px;">课程名称（可选）：</label>
                        <input type="text" id="bilibili-study-whitelist-course-name"
                               placeholder="例如：高等数学第一章"
                               style="width: 100%; padding: 10px; font-size: 14px; border: 1px solid #ddd; border-radius: 6px; box-sizing: border-box;">
                        <small style="color: #999;">留空将使用视频BV号作为名称</small>
                    </div>
                    <div id="bilibili-study-whitelist-error" style="color: #dc2626; font-size: 14px; margin-bottom: 10px; display: none;"></div>
                    <div class="bilibili-study-action-buttons" style="justify-content: center;">
                        <button class="bilibili-study-btn bilibili-study-btn-primary" id="bilibili-study-whitelist-confirm">
                            确认添加
                        </button>
                        <button class="bilibili-study-btn bilibili-study-btn-secondary" id="bilibili-study-whitelist-cancel">
                            取消
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        document.getElementById('bilibili-study-whitelist-confirm').addEventListener('click', function() {
            const courseName = document.getElementById('bilibili-study-whitelist-course-name').value.trim();
            const result = ConfigManager.addToWhitelist(currentBV, courseName);

            if (result.success) {
                modal.remove();
                close();
            } else {
                const errorDiv = document.getElementById('bilibili-study-whitelist-error');
                errorDiv.textContent = result.message;
                errorDiv.style.display = 'block';
            }
        });

        document.getElementById('bilibili-study-whitelist-cancel').addEventListener('click', function() {
            modal.remove();
        });

        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                modal.remove();
            }
        });

        modal.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                modal.remove();
            }
        });
    }

    return {
        open,
        close,
        isOpen: function() { return isOpen; },
        getCurrentTheme: function() { return currentTheme; }
    };
})();

// ==========================================
// WordVerifier Module
// ==========================================
const WordVerifier = (function() {
    // Parse vocabulary from config
    function parseVocabulary() {
        const config = ConfigManager.get();
        const vocab = config.vocabulary || [];
        return vocab.map(item => {
            const [chinese, english] = item.split(':');
            return { chinese: chinese.trim(), english: english ? english.trim().toLowerCase() : '' };
        }).filter(w => w.chinese && w.english);
    }

    // Get word records from storage
    function getWordRecords() {
        return getOrInitModule('wordRecords');
    }

    // Save word records to storage
    function saveWordRecords(records) {
        StorageManager.setModule('wordRecords', records);
    }

    // Select a random word for verification
    function selectWord() {
        const words = parseVocabulary();
        if (words.length === 0) {
            return null;
        }

        const config = ConfigManager.get();
        const records = getWordRecords();
        const wordData = records.words || {};

        // Filter words based on mastery setting
        let availableWords = words;
        if (!config.includeMasteredWords) {
            availableWords = words.filter(w => {
                const data = wordData[w.chinese];
                return !data || !data.mastered;
            });
        }

        // If all words are mastered, use all words
        if (availableWords.length === 0) {
            availableWords = words;
        }

        const randomIndex = Math.floor(Math.random() * availableWords.length);
        return availableWords[randomIndex];
    }

    // Check if user's answer is correct
    function checkAnswer(word, answer) {
        if (!word || !answer) return false;
        const normalizedAnswer = answer.trim().toLowerCase();
        const normalizedEnglish = word.english.toLowerCase();
        return normalizedAnswer === normalizedEnglish;
    }

    // Update word mastery status
    function updateMastery(word, correct) {
        const records = getWordRecords();
        const wordData = records.words || {};
        const config = ConfigManager.get();

        if (!wordData[word.chinese]) {
            wordData[word.chinese] = {
                chinese: word.chinese,
                english: word.english,
                consecutiveCorrect: 0,
                mastered: false,
                totalAttempts: 0,
                correctAttempts: 0
            };
        }

        const entry = wordData[word.chinese];
        entry.totalAttempts++;

        if (correct) {
            entry.consecutiveCorrect++;
            entry.correctAttempts++;
            // Check if word is mastered
            if (entry.consecutiveCorrect >= config.masteryThreshold) {
                entry.mastered = true;
            }
        } else {
            entry.consecutiveCorrect = 0;
            entry.mastered = false;
        }

        records.words = wordData;
        saveWordRecords(records);
    }

    // Get all mastered words
    function getMasteredWords() {
        const records = getWordRecords();
        const wordData = records.words || {};
        return Object.values(wordData).filter(w => w.mastered);
    }

    // Record an answer in recent answers
    function recordAnswer(word, correct) {
        const records = getWordRecords();
        const recentAnswers = records.recentAnswers || [];

        recentAnswers.push({
            word: word.chinese,
            correct: correct,
            timestamp: Date.now()
        });

        // Keep only last 50 answers
        if (recentAnswers.length > 50) {
            recentAnswers.shift();
        }

        records.recentAnswers = recentAnswers;
        saveWordRecords(records);
    }

    // Get recent answers
    function getRecentAnswers(count) {
        const records = getWordRecords();
        const recentAnswers = records.recentAnswers || [];
        return recentAnswers.slice(-count);
    }

    return {
        selectWord,
        checkAnswer,
        updateMastery,
        getMasteredWords,
        recordAnswer,
        getRecentAnswers
    };
})();

// ==========================================
// StatisticsTracker Module
// ==========================================
const StatisticsTracker = (function() {
    // Get time stats from storage
    function getTimeStats() {
        return getOrInitModule('timeStats');
    }

    // Save time stats to storage
    function saveTimeStats(stats) {
        StorageManager.setModule('timeStats', stats);
    }

    // Check and archive daily stats if needed
    function checkDailyArchive() {
        const stats = getTimeStats();
        const today = new Date().toISOString().split('T')[0];

        if (stats.lastResetDate !== today) {
            // Archive yesterday's data
            const history = stats.history || [];
            history.push({
                date: stats.lastResetDate,
                studyTime: stats.today.studyTime,
                distractionTime: stats.today.distractionTime,
                distractionCount: stats.today.distractionCount,
                wordAccuracy: { ...stats.today.wordAccuracy }
            });

            // Keep only last 30 days
            while (history.length > 30) {
                history.shift();
            }

            // Reset today's stats
            stats.history = history;
            stats.lastResetDate = today;
            stats.today = {
                studyTime: 0,
                distractionTime: 0,
                distractionCount: 0,
                wordAccuracy: { correct: 0, total: 0 }
            };

            saveTimeStats(stats);
        }
    }

    // Add study time (in seconds)
    function addStudyTime(seconds) {
        checkDailyArchive();
        const stats = getTimeStats();
        stats.today.studyTime += seconds;
        saveTimeStats(stats);
    }

    // Add distraction time (in seconds)
    function addDistractionTime(seconds) {
        checkDailyArchive();
        const stats = getTimeStats();
        stats.today.distractionTime += seconds;
        saveTimeStats(stats);
    }

    // Increment distraction count
    function incrementDistractionCount() {
        checkDailyArchive();
        const stats = getTimeStats();
        stats.today.distractionCount++;
        saveTimeStats(stats);
    }

    // Record word attempt
    function recordWordAttempt(correct) {
        checkDailyArchive();
        const stats = getTimeStats();
        stats.today.wordAccuracy.total++;
        if (correct) {
            stats.today.wordAccuracy.correct++;
        }
        saveTimeStats(stats);
    }

    // Get today's statistics
    function getTodayStats() {
        checkDailyArchive();
        const stats = getTimeStats();
        return { ...stats.today };
    }

    // Get statistics for a period (day or week)
    function getStatsForPeriod(period) {
        const stats = getTimeStats();
        checkDailyArchive();

        if (period === 'day') {
            return { ...stats.today };
        }

        // Week: combine today with history
        const history = stats.history || [];
        const weekStats = {
            studyTime: stats.today.studyTime,
            distractionTime: stats.today.distractionTime,
            distractionCount: stats.today.distractionCount,
            wordAccuracy: {
                correct: stats.today.wordAccuracy.correct,
                total: stats.today.wordAccuracy.total
            }
        };

        // Add last 6 days from history
        for (let i = history.length - 1; i >= 0 && history.length - i < 7; i--) {
            const day = history[i];
            weekStats.studyTime += day.studyTime;
            weekStats.distractionTime += day.distractionTime;
            weekStats.distractionCount += day.distractionCount;
            weekStats.wordAccuracy.correct += day.wordAccuracy.correct;
            weekStats.wordAccuracy.total += day.wordAccuracy.total;
        }

        return weekStats;
    }

    // Initialize statistics
    function init() {
        checkDailyArchive();
    }

    return {
        init,
        addStudyTime,
        addDistractionTime,
        incrementDistractionCount,
        recordWordAttempt,
        getTodayStats,
        getStatsForPeriod
    };
})();

// ==========================================
// InterventionController Module
// ==========================================
const InterventionController = (function() {
    const INTERVENTION_CLASSES = [
        'bilibili-study-intervention-stage1',
        'bilibili-study-intervention-stage2',
        'bilibili-study-intervention-stage3',
        'bilibili-study-intervention-stage4'
    ];

    const MODAL_STATES = {
        NONE: 'none',
        CONFIRM: 'confirm',
        WORD_VERIFY: 'wordVerify'
    };

    let modalState = MODAL_STATES.NONE;
    let lastPopupTime = 0;
    let wordRevealTime = 0;
    let currentWord = null;
    let revealedIndices = new Set();

    /**
     * Bug2修复：将当前 DetailPanel 主题应用到给定弹窗元素
     * DetailPanel 的 dark-mode CSS 类通过层叠样式覆盖子元素，
     * 因此只需在弹窗根节点加上同一个 class 即可复用所有暗色样式。
     */
    function applyCurrentThemeToModal(el) {
        if (!el) return;
        const theme = DetailPanel.getCurrentTheme ? DetailPanel.getCurrentTheme() : 'light';
        if (theme === 'dark') {
            el.classList.add('bilibili-study-dark-mode');
        } else {
            el.classList.remove('bilibili-study-dark-mode');
        }
    }

    /**
     * Bug3修复：全屏时将弹窗挂载到 fullscreenElement 内部，
     * 否则挂载到 document.body。这样弹窗才能显示在全屏层之上。
     */
    function getModalContainer() {
        const fsEl = document.fullscreenElement ||
                     document.webkitFullscreenElement ||
                     document.mozFullScreenElement ||
                     document.msFullscreenElement;
        return fsEl || document.body;
    }

    function getCurrentStage(distractionDuration) {
        const config = ConfigManager.get();
        const stages = config.interventionStages || [];
        let currentStage = 0;
        for (let i = stages.length - 1; i >= 0; i--) {
            if (distractionDuration >= stages[i].threshold) {
                currentStage = i;
                break;
            }
        }
        return currentStage;
    }

    function applyVisualIntervention(stage) {
        removeVisualIntervention();
        if (stage > 0 && stage <= 4) {
            document.body.classList.add(INTERVENTION_CLASSES[stage - 1]);
        }
        updateProgressiveVisualEffect(stage, 0);
    }

    function updateProgressiveVisualEffect(stage, distractionDuration) {
        if (stage !== 1) return;

        const stage1Duration = distractionDuration - 60;
        const stage1Total = 240;
        const progress = Math.min(1, Math.max(0, stage1Duration / stage1Total));

        const invert = Math.floor(progress * 100);
        const grayscale = Math.floor(progress * 80);
        const opacity = 1 - (progress * 0.3);

        const selectors = [
            '.video-container',
            '.main-container',
            '.left-container',
            '#viewbox_report',
            '.reCMD-list',
            '.recommend-list',
            '.sidebar',
            '.relative-ul',
            '.bpx-player-area',
            '.player-area'
        ];

        selectors.forEach(selector => {
            const elements = document.querySelectorAll(selector);
            elements.forEach(el => {
                if (!el.classList.contains('bilibili-player-wrap') && !el.closest('.bilibili-player-wrap')) {
                    el.style.filter = `invert(${invert}%) grayscale(${grayscale}%)`;
                    el.style.opacity = opacity;
                }
            });
        });
    }

    function removeVisualIntervention() {
        INTERVENTION_CLASSES.forEach(cls => {
            document.body.classList.remove(cls);
        });
        const selectors = [
            '.video-container',
            '.main-container',
            '.left-container',
            '#viewbox_report',
            '.reCMD-list',
            '.recommend-list',
            '.sidebar',
            '.relative-ul',
            '.bpx-player-area',
            '.player-area'
        ];
        selectors.forEach(selector => {
            const elements = document.querySelectorAll(selector);
            elements.forEach(el => {
                el.style.filter = '';
                el.style.opacity = '';
            });
        });
    }

    function closeCurrentModal() {
        const confirmModal = document.getElementById('bilibili-study-confirm-modal');
        const wordModal = document.getElementById('bilibili-study-word-modal');

        if (confirmModal) confirmModal.remove();
        if (wordModal) wordModal.remove();

        modalState = MODAL_STATES.NONE;
    }

    function returnToLearning() {
        closeCurrentModal();
        const defaultBV = ConfigManager.getDefaultReturnBV();
        if (defaultBV) {
            window.location.href = `https://www.bilibili.com/video/${defaultBV}`;
        } else {
            window.history.back();
        }
    }

    function showConfirmModal() {
        if (modalState !== MODAL_STATES.NONE) {
            console.log('[B站学习助手] showConfirmModal: 跳过，当前弹窗状态=', modalState);
            return;
        }
        console.log('[B站学习助手] showConfirmModal: 显示确认弹窗');
        modalState = MODAL_STATES.CONFIRM;

        // 获取白名单课程
        const whitelist = ConfigManager.getWhitelistArray();
        const hasWhitelist = whitelist && whitelist.length > 0;
        
        let courseOptions = '';
        if (hasWhitelist) {
            // 使用 data-index 属性而不是内联 onclick，避免模板字符串嵌套和引号冲突
            const courseItems = whitelist.map((course, index) => `
                            <div class="course-item" 
                                 data-index="${index}"
                                 data-bv="${course.bv.replace(/"/g, '&quot;')}"
                                 data-name="${course.name.replace(/"/g, '&quot;')}"
                                 style="padding: 8px 12px; margin: 5px 0; background: white; 
                                        border: 1px solid #e0e0e0; border-radius: 4px; 
                                        cursor: pointer; transition: all 0.2s;">
                                <div style="font-weight: bold;">${course.name}</div>
                                <div style="font-size: 12px; color: #666;">${course.bv}</div>
                            </div>
            `).join('');
            courseOptions = `
                <div style="margin: 15px 0; padding: 10px; background: #f8f9fa; border-radius: 6px;">
                    <p style="margin: 0 0 10px 0; font-weight: bold; color: #333;">选择要返回的课程：</p>
                    <div id="bilibili-study-course-list" style="max-height: 200px; overflow-y: auto;">
                        ${courseItems}
                    </div>
                </div>`;
        }

        const modal = document.createElement('div');
        modal.className = 'bilibili-study-modal-overlay';
        modal.id = 'bilibili-study-confirm-modal';
        modal.innerHTML = `
            <div class="bilibili-study-modal" style="max-width: ${hasWhitelist ? '500px' : '400px'};">
                <div class="bilibili-study-modal-header">
                    <h2>⚠️ 学习提醒</h2>
                </div>
                <div class="bilibili-study-modal-body">
                    <p style="font-size: 16px; margin-bottom: 20px;">
                        您当前处于学习时段，是否确认访问无关视频页面？
                    </p>
                    ${courseOptions}
                    <div class="bilibili-study-action-buttons">
                        <button class="bilibili-study-btn bilibili-study-btn-primary" id="bilibili-study-confirm-yes">
                            确认离开学习
                        </button>
                        <button class="bilibili-study-btn bilibili-study-btn-secondary" 
                                id="bilibili-study-confirm-no"
                                style="${hasWhitelist ? 'opacity: 0.5; cursor: not-allowed;' : ''}">
                            ${hasWhitelist ? '选择课程返回' : '立即返回学习'}
                        </button>
                    </div>
                </div>
            </div>
        `;

        getModalContainer().appendChild(modal);
        applyCurrentThemeToModal(modal);

        // 课程列表点击事件 - 使用事件委托，避免内联onclick的嵌套模板字符串问题
        if (hasWhitelist) {
            const courseList = document.getElementById('bilibili-study-course-list');
            if (courseList) {
                courseList.addEventListener('click', function(e) {
                    const item = e.target.closest('.course-item');
                    if (!item) return;

                    // 清除所有选中状态
                    courseList.querySelectorAll('.course-item').forEach(el => {
                        el.style.background = 'white';
                        el.style.borderColor = '#e0e0e0';
                        el.removeAttribute('data-selected');
                    });

                    // 标记当前选中
                    item.style.background = '#e3f2fd';
                    item.style.borderColor = '#00a1d6';
                    item.setAttribute('data-selected', 'true');

                    // 更新返回按钮
                    const returnBtn = document.getElementById('bilibili-study-confirm-no');
                    if (returnBtn) {
                        const bv = item.getAttribute('data-bv');
                        const name = item.getAttribute('data-name');
                        returnBtn.textContent = `返回学习：${name}`;
                        returnBtn.setAttribute('data-bv', bv);
                        returnBtn.style.opacity = '1';
                        returnBtn.style.cursor = 'pointer';
                    }
                });
            }
        }

        document.getElementById('bilibili-study-confirm-yes').addEventListener('click', function() {
            closeCurrentModal();
            StatisticsTracker.incrementDistractionCount();
            if (window.__bilibiliStudyAppState) {
                window.__bilibiliStudyAppState.distractionStartTime = Date.now();
                window.__bilibiliStudyAppState.currentStage = 1;
            }
            // Start the popup timer from this point
            lastPopupTime = Date.now();
        });

        document.getElementById('bilibili-study-confirm-no').addEventListener('click', function() {
            if (hasWhitelist) {
                const selectedCourse = document.querySelector('.course-item[data-selected="true"]');
                if (selectedCourse) {
                    const bv = this.getAttribute('data-bv');
                    if (bv) {
                        window.location.href = `https://www.bilibili.com/video/${bv}`;
                    } else {
                        returnToLearning();
                    }
                } else {
                    alert('请先选择一个课程');
                }
            } else {
                returnToLearning();
            }
        });

        modal.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                if (hasWhitelist) {
                    const selectedCourse = document.querySelector('.course-item[data-selected="true"]');
                    if (selectedCourse) {
                        const returnBtn = document.getElementById('bilibili-study-confirm-no');
                        const bv = returnBtn ? returnBtn.getAttribute('data-bv') : null;
                        if (bv) {
                            window.location.href = `https://www.bilibili.com/video/${bv}`;
                        } else {
                            returnToLearning();
                        }
                    } else {
                        returnToLearning();
                    }
                } else {
                    returnToLearning();
                }
            }
        });
    }

    function showWordVerifierModal() {
        if (modalState !== MODAL_STATES.NONE) {
            console.log('[B站学习助手] showWordVerifierModal: 跳过，当前弹窗状态=', modalState);
            return;
        }

        const word = WordVerifier.selectWord();
        if (!word) {
            console.warn('[B站学习助手] showWordVerifierModal: 无可用词汇，跳过弹窗');
            modalState = MODAL_STATES.NONE;
            return;
        }

        console.log('[B站学习助手] showWordVerifierModal: 显示弹窗，单词=', word.chinese, '/', word.english);
        modalState = MODAL_STATES.WORD_VERIFY;
        currentWord = word;
        revealedIndices = new Set();
        wordRevealTime = 0;

        const modal = document.createElement('div');
        modal.className = 'bilibili-study-modal-overlay';
        modal.id = 'bilibili-study-word-modal';
        renderWordModalContent(modal, word, revealedIndices);

        getModalContainer().appendChild(modal);
        applyCurrentThemeToModal(modal);

        const input = document.getElementById('bilibili-study-word-input');
        if (input) input.focus();

        document.getElementById('bilibili-study-word-submit').addEventListener('click', handleWordSubmit);
        document.getElementById('bilibili-study-word-skip').addEventListener('click', function() {
            closeCurrentModal();
        });

        input.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                handleWordSubmit();
            }
        });

        modal.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                closeCurrentModal();
            }
        });
    }

    /**
     * 渐进式学习弹窗内容渲染
     * - 初始：只显示中文释义，所有字母为下划线
     * - 每次答错后揭示1-3个新字母（随机选择未揭示的位置）
     * - 全部揭示后：固定显示6秒用于记忆，然后自动关闭
     *
     * 首次调用时 modal 为空 div，需要先创建完整外壳；
     * 后续调用时只更新 .bilibili-study-modal-body 内容
     */
    function renderWordModalContent(modal, word, indices, options) {
        const opts = options || {};
        const isFullyRevealed = indices.size >= word.english.length;
        const displayWord = getDisplayWord(word.english, indices);
        const revealedCount = indices.size;

        // 渐进提示文本
        let hintSection = '';
        if (revealedCount > 0 && !isFullyRevealed) {
            hintSection = `<div style="text-align: center; margin: 10px 0; padding: 8px; background: #fff3e0; border-radius: 6px; border: 1px solid #ffe0b2;">
                <small style="color: #e65100;">💡 提示: 已揭示 ${revealedCount}/${word.english.length} 个字母</small>
            </div>`;
        }

        // 全部揭示后的记忆提示
        let memorySection = '';
        if (isFullyRevealed) {
            memorySection = `<div style="text-align: center; margin: 15px 0; padding: 12px; background: #e8f5e9; border-radius: 6px; border: 1px solid #a5d6a7;">
                <div style="font-size: 18px; font-weight: bold; color: #2e7d32; letter-spacing: 4px; font-family: monospace;">${word.english}</div>
                <small style="color: #388e3c;">📖 记住这个单词，6秒后自动关闭...</small>
            </div>`;
        }

        // 弹窗主体内容
        const bodyContent = `
            <p style="font-size: 18px; margin-bottom: 15px; text-align: center;">
                请输入以下释义的英文单词：<br>
                <strong style="font-size: 24px; color: #00a1d6;">${word.chinese}</strong>
            </p>
            <div style="text-align: center; margin-bottom: 15px;">
                <div style="font-size: 22px; font-family: monospace; letter-spacing: 4px; color: #333;">
                    ${displayWord}
                </div>
            </div>
            ${hintSection}
            ${memorySection}
            <input type="text" id="bilibili-study-word-input"
                   placeholder="${isFullyRevealed ? '记忆模式 - 请记住这个单词' : '请输入英文单词'}"
                   ${isFullyRevealed ? 'disabled' : ''}
                   style="width: 100%; padding: 10px; font-size: 16px; border: 1px solid #ddd; border-radius: 6px; margin-bottom: 15px; margin-top: 10px; box-sizing: border-box;">
            <div id="bilibili-study-word-feedback" style="text-align: center; font-size: 16px; margin-bottom: 10px; min-height: 24px;"></div>
            <div class="bilibili-study-action-buttons" style="justify-content: center;">
                <button class="bilibili-study-btn bilibili-study-btn-primary" id="bilibili-study-word-submit"
                        ${isFullyRevealed ? 'style="opacity:0.5;cursor:not-allowed;"' : ''}>
                    提交
                </button>
                <button class="bilibili-study-btn bilibili-study-btn-secondary" id="bilibili-study-word-skip">
                    跳过
                </button>
            </div>
        `;

        let body = modal.querySelector('.bilibili-study-modal-body');
        if (!body) {
            // 首次渲染：modal 为空 div，需要创建完整的外壳结构
            console.log('[B站学习助手] renderWordModalContent: 首次渲染，创建弹窗外壳');
            modal.innerHTML = `
                <div class="bilibili-study-modal" style="max-width: 450px;">
                    <div class="bilibili-study-modal-header">
                        <h2>📝 单词验证</h2>
                    </div>
                    <div class="bilibili-study-modal-body">
                        ${bodyContent}
                    </div>
                </div>
            `;
        } else {
            // 后续渲染：只更新 body 内容
            console.log('[B站学习助手] renderWordModalContent: 更新弹窗内容, revealedCount=', indices.size);
            body.innerHTML = bodyContent;
        }
    }

    /**
     * 根据已揭示字母索引生成展示字符串
     * 已揭示字母显示为绿色加粗，未揭示显示为下划线
     */
    function getDisplayWord(word, indices) {
        const letters = word.split('');
        let display = [];
        for (let i = 0; i < letters.length; i++) {
            if (indices.has(i)) {
                display.push(`<span style="color: #16a34a; font-weight: bold;">${letters[i]}</span>`);
            } else {
                display.push('_');
            }
        }
        return display.join(' ');
    }

    /**
     * 渐进式单词提交处理
     * - 正确：直接关闭弹窗
     * - 错误：随机揭示1-3个新字母作为提示
     * - 全部揭示：固定显示6秒用于记忆后自动关闭
     */
    function handleWordSubmit() {
        const input = document.getElementById('bilibili-study-word-input');
        const feedback = document.getElementById('bilibili-study-word-feedback');
        if (!input || !feedback || !currentWord) return;

        const answer = input.value.trim();
        if (!answer) return; // 空输入不处理

        const correct = WordVerifier.checkAnswer(currentWord, answer);
        WordVerifier.updateMastery(currentWord, correct);
        WordVerifier.recordAnswer(currentWord, correct);
        StatisticsTracker.recordWordAttempt(correct);

        if (correct) {
            feedback.innerHTML = '<span style="color: #16a34a; font-weight: bold;">✅ 回答正确！</span>';
            // 正确答案直接关闭
            setTimeout(() => closeCurrentModal(), 300);
        } else {
            feedback.innerHTML = '<span style="color: #dc2626; font-weight: bold;">❌ 回答错误，再试一次</span>';

            // 随机揭示1-3个新字母
            const totalLength = currentWord.english.length;
            const unrevealedIndices = [];
            for (let i = 0; i < totalLength; i++) {
                if (!revealedIndices.has(i)) {
                    unrevealedIndices.push(i);
                }
            }

            // 随机选择1-3个（不超过剩余未揭示数）
            const revealCount = Math.min(
                Math.floor(Math.random() * 3) + 1,
                unrevealedIndices.length
            );

            // Fisher-Yates 部分洗牌选取
            for (let i = unrevealedIndices.length - 1; i > 0 && revealCount > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [unrevealedIndices[i], unrevealedIndices[j]] = [unrevealedIndices[j], unrevealedIndices[i]];
            }
            const toReveal = unrevealedIndices.slice(0, revealCount);
            toReveal.forEach(idx => revealedIndices.add(idx));

            // 检查是否全部揭示
            if (revealedIndices.size >= totalLength) {
                // 全部揭示 - 显示完整单词，6秒后自动关闭
                const modal = document.getElementById('bilibili-study-word-modal');
                if (modal) {
                    renderWordModalContent(modal, currentWord, revealedIndices, { fullyRevealed: true });
                }
                wordRevealTime = Date.now();
                setTimeout(() => {
                    if (modalState === MODAL_STATES.WORD_VERIFY) {
                        closeCurrentModal();
                        // 重置lastPopupTime以开始下一轮计时
                        lastPopupTime = Date.now();
                    }
                }, 6000);
            } else {
                // 部分揭示 - 重新渲染弹窗内容，保留已揭示的字母
                const modal = document.getElementById('bilibili-study-word-modal');
                if (modal) {
                    renderWordModalContent(modal, currentWord, revealedIndices);
                    const newInput = document.getElementById('bilibili-study-word-input');
                    if (newInput) {
                        newInput.value = '';
                        newInput.focus();
                    }
                    // 重新绑定事件（renderWordModalContent会替换innerHTML）
                    document.getElementById('bilibili-study-word-submit').addEventListener('click', handleWordSubmit);
                    document.getElementById('bilibili-study-word-skip').addEventListener('click', function() {
                        closeCurrentModal();
                    });
                    if (newInput) {
                        newInput.addEventListener('keypress', function(e) {
                            if (e.key === 'Enter') {
                                handleWordSubmit();
                            }
                        });
                    }
                }
            }
        }
    }

    function showPopupIfNeeded(stage) {
        if (modalState !== MODAL_STATES.NONE) {
            console.log('[B站学习助手] showPopupIfNeeded: 跳过，弹窗已打开 state=', modalState);
            return;
        }

        const config = ConfigManager.get();
        const stages = config.interventionStages || [];
        const stageConfig = stages[stage];

        if (!stageConfig || stageConfig.interval === 0) {
            console.log('[B站学习助手] showPopupIfNeeded: 跳过，stage=', stage, 'config=', stageConfig);
            return;
        }

        const now = Date.now();
        const intervalMs = stageConfig.interval * 1000;
        const elapsed = now - lastPopupTime;

        console.log('[B站学习助手] showPopupIfNeeded: stage=', stage, 'elapsed=', elapsed, 'interval=', intervalMs, 'ready=', elapsed >= intervalMs);

        if (elapsed >= intervalMs) {
            // 所有分心阶段统一使用单词验证弹窗
            showWordVerifierModal();
            // Update lastPopupTime AFTER showing popup
            lastPopupTime = now;
        }
    }

    function reset() {
        removeVisualIntervention();
        lastPopupTime = 0;
        modalState = MODAL_STATES.NONE;
        currentWord = null;
        revealedIndices = new Set();
        wordRevealTime = 0;
    }

    // Track page visibility for accurate timing
    let lastVisibilityChange = 0;
    let totalHiddenTime = 0;

    function handleVisibilityChange() {
        if (document.hidden) {
            lastVisibilityChange = Date.now();
        } else {
            if (lastVisibilityChange > 0) {
                totalHiddenTime += Date.now() - lastVisibilityChange;
                lastVisibilityChange = 0;
            }
        }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange);

    function check() {
        const state = window.__bilibiliStudyAppState;
        if (!state) return;

        const isVideoPage = PageMonitor.isVideoPage();
        const isPageActive = PageMonitor.isPageActive();
        const isStudyTime = ConfigManager.isStudyTime();
        const currentBV = PageMonitor.getCurrentBV();
        const isWhitelisted = ConfigManager.isWhitelisted(currentBV);

        if (!isVideoPage || !isPageActive) {
            return;
        }

        // Adjust for time spent hidden
        if (totalHiddenTime > 0) {
            if (state.distractionStartTime) {
                state.distractionStartTime += totalHiddenTime;
            }
            // Also adjust lastPopupTime to maintain correct intervals
            if (lastPopupTime > 0) {
                lastPopupTime += totalHiddenTime;
            }
            totalHiddenTime = 0;
        }

        if (!isStudyTime) {
            state.isStudying = true;
            state.currentStage = 0;
            state.distractionStartTime = null;
            removeVisualIntervention();
            reset();
            return;
        }

        if (isWhitelisted) {
            state.isStudying = true;
            state.currentStage = 0;
            state.distractionStartTime = null;
            removeVisualIntervention();
            reset();
            return;
        }

        if (!isWhitelisted) {
            if (state.distractionStartTime === null) {
                state.distractionStartTime = Date.now();
                state.isStudying = false;
                console.log('[B站学习助手] check: 首次分心，弹出确认弹窗');
                showConfirmModal();
                return;
            }

            const distractionDuration = Math.floor((Date.now() - state.distractionStartTime) / 1000);
            const newStage = getCurrentStage(distractionDuration);

            if (newStage !== state.currentStage) {
                state.currentStage = newStage;
                applyVisualIntervention(newStage);
                if (newStage >= 2) {
                    lastPopupTime = state.distractionStartTime + (newStage === 2 ? 300 : newStage === 3 ? 600 : 1200) * 1000;
                }
                console.log('[B站学习助手] check: 阶段变更 →', newStage, '分心时长=', distractionDuration + 's');
            }

            if (state.currentStage === 1) {
                updateProgressiveVisualEffect(1, distractionDuration);
            }

            showPopupIfNeeded(newStage);
        }
    }

    return {
        check,
        getCurrentStage,
        applyVisualIntervention,
        removeVisualIntervention,
        showPopupIfNeeded,
        showConfirmModal,
        reset,
        closeCurrentModal,
        returnToLearning
    };
})();

// ==========================================
// Main Initialization
// ==========================================
(function() {
    'use strict';

    // ==========================================
    // Tab ID Management - Isolate state per tab
    // ==========================================
    function generateTabId() {
        const tabId = 'tab_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        try {
            sessionStorage.setItem('bilibiliStudyAssistant_tabId', tabId);
        } catch (e) {
            console.warn('Failed to save tab ID to sessionStorage:', e);
        }
        return tabId;
    }

    function getTabId() {
        try {
            let tabId = sessionStorage.getItem('bilibiliStudyAssistant_tabId');
            if (!tabId) {
                tabId = generateTabId();
            }
            return tabId;
        } catch (e) {
            console.warn('Failed to get tab ID from sessionStorage:', e);
            return 'tab_fallback_' + Math.random().toString(36).substr(2, 9);
        }
    }

    const TAB_ID = getTabId();
    console.log('[B站学习助手] Tab ID:', TAB_ID);

    // Initialize app state with tab ID
    window.__bilibiliStudyAppState = {
        tabId: TAB_ID,
        currentStage: 0,
        distractionStartTime: null,
        isStudying: true,
        lastDistractionCount: 0
    };

    // Initialize config
    ConfigManager.load();
    console.log('B站学习专注提醒助手 loaded, config:', ConfigManager.get());

    // Initialize data modules
    const userConfig = getOrInitModule('userConfig');
    const timeStats = getOrInitModule('timeStats');
    const wordRecords = getOrInitModule('wordRecords');

    console.log('Storage modules initialized:', {
        userConfig: !!userConfig,
        timeStats: !!timeStats,
        wordRecords: !!wordRecords,
        storageAvailable: StorageManager.isAvailable()
    });

    // Initialize page monitor
    PageMonitor.init();

    // Initialize statistics tracker
    StatisticsTracker.init();

    // Create floating window if on video page
    if (PageMonitor.isVideoPage()) {
        FloatingWindow.create();
        // Set up callback to open detail panel when floating window is clicked
        FloatingWindow.setOnPanelOpen(function() {
            DetailPanel.open();
        });
    }

    // Main timer loop - runs every second
    setInterval(function() {
        const state = window.__bilibiliStudyAppState;
        if (!state) return;

        const isVideoPage = PageMonitor.isVideoPage();
        const isPageActive = PageMonitor.isPageActive();
        const isStudyTime = ConfigManager.isStudyTime();
        const currentBV = PageMonitor.getCurrentBV();
        const isWhitelisted = ConfigManager.isWhitelisted(currentBV);

        // Update statistics based on current state
        if (isVideoPage && isPageActive && isStudyTime) {
            if (isWhitelisted) {
                // Studying on whitelisted video
                state.isStudying = true;
                StatisticsTracker.addStudyTime(1);
            } else {
                // Distracted on non-whitelisted video
                state.isStudying = false;
                StatisticsTracker.addDistractionTime(1);
            }
        }

        // Run intervention check
        InterventionController.check();

        // Update floating window status
        if (FloatingWindow.create()) {
            const todayStats = StatisticsTracker.getTodayStats();
            FloatingWindow.updateStatus({
                isStudying: state.isStudying,
                stage: state.currentStage,
                studyTime: todayStats.studyTime,
                distractionTime: todayStats.distractionTime
            });
        }
    }, 1000);

    // Set up SPA navigation handling
    PageMonitor.observeSPAChanges(function(newBV) {
        const state = window.__bilibiliStudyAppState;
        const isWhitelisted = ConfigManager.isWhitelisted(newBV);

        if (isWhitelisted || !ConfigManager.isStudyTime()) {
            // 切到白名单视频或非学习时段：重置干预状态
            if (state) {
                state.currentStage = 0;
                state.distractionStartTime = null;
                state.isStudying = true;
            }
            InterventionController.reset();
            removeVisualIntervention();
            console.log('[B站学习助手] SPA导航到白名单视频/非学习时段，重置干预状态');
        } else {
            // 切到另一个非白名单视频：保留干预状态，关闭已有弹窗
            // 不重置 distractionStartTime 和 currentStage，让干预计时延续
            InterventionController.closeCurrentModal();
            console.log('[B站学习助手] SPA导航到非白名单视频，保留干预状态', {
                currentStage: state?.currentStage,
                distractionStartTime: state?.distractionStartTime,
                elapsed: state?.distractionStartTime ? Math.floor((Date.now() - state.distractionStartTime) / 1000) + 's' : 'null'
            });
        }

        // Recreate floating window if needed
        if (PageMonitor.isVideoPage()) {
            if (!FloatingWindow.create()) {
                FloatingWindow.create();
                FloatingWindow.setOnPanelOpen(function() {
                    DetailPanel.open();
                });
            }
        } else {
            FloatingWindow.destroy();
        }
    });

    // Helper function for visual intervention removal (used by SPA navigation)
    function removeVisualIntervention() {
        document.body.classList.remove(
            'bilibili-study-intervention-stage1',
            'bilibili-study-intervention-stage2',
            'bilibili-study-intervention-stage3',
            'bilibili-study-intervention-stage4'
        );
    }

    console.log('B站学习专注提醒助手 initialized successfully');

})();