// ==UserScript==
// @name         B站学习专注提醒助手
// @namespace    https://github.com/bilibili-study-focus
// @version      1.2.2
// @description  A Tampermonkey script that provides progressive, non-intrusive focus interventions during user-defined study periods on Bilibili video pages
// @author       Your Name
// @match        *://www.bilibili.com/video/BV*
// @grant        GM_addStyle
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_deleteValue
// @grant        unsafeWindow
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

    /* 白名单添加弹窗样式 */
    .bilibili-study-whitelist-modal-desc {
        font-size: 14px;
        margin-bottom: 10px;
        color: #666;
    }
    .bilibili-study-whitelist-modal-field {
        margin-bottom: 15px;
    }
    .bilibili-study-whitelist-modal-label {
        display: block;
        margin-bottom: 5px;
        font-size: 14px;
    }
    .bilibili-study-whitelist-modal-input {
        width: 100%;
        padding: 10px;
        font-size: 14px;
        border: 1px solid #ddd;
        border-radius: 6px;
        box-sizing: border-box;
    }
    .bilibili-study-whitelist-modal-hint {
        color: #999;
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

    .bilibili-study-dark-mode .bilibili-study-modal-overlay {
        background: rgba(0, 0, 0, 0.85) !important;
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

    /* 白名单添加弹窗 - 暗色模式 */
    .bilibili-study-dark-mode .bilibili-study-whitelist-modal-desc {
        color: #aaa !important;
    }
    .bilibili-study-dark-mode .bilibili-study-whitelist-modal-label {
        color: #ccc !important;
    }
    .bilibili-study-dark-mode .bilibili-study-whitelist-modal-input {
        background: #2a2a2a !important;
        color: #e0e0e0 !important;
        border-color: #444 !important;
    }
    .bilibili-study-dark-mode .bilibili-study-whitelist-modal-hint {
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

    .bilibili-study-dark-mode .bilibili-study-vocab-warning {
        background: #3d2800 !important;
        border-color: #6d4c00 !important;
    }

    .bilibili-study-dark-mode .bilibili-study-vocab-warning-title {
        color: #ffb74d !important;
    }

    .bilibili-study-dark-mode .bilibili-study-vocab-warning-text {
        color: #ff9800 !important;
    }

    .bilibili-study-dark-mode .bilibili-study-vocab-critical {
        background: #3d0000 !important;
        border-color: #6d0000 !important;
    }

    .bilibili-study-dark-mode .bilibili-study-vocab-critical-title {
        color: #ef5350 !important;
    }

    .bilibili-study-dark-mode .bilibili-study-vocab-critical-text {
        color: #f44336 !important;
    }

    .bilibili-study-dark-mode .bilibili-study-word-hint {
        background: #2a1f00 !important;
        border-color: #5d4200 !important;
    }

    .bilibili-study-dark-mode .bilibili-study-word-hint small {
        color: #ffb74d !important;
    }

    .bilibili-study-dark-mode .bilibili-study-word-memory {
        background: #1a2e1a !important;
        border-color: #2d5a2d !important;
    }

    .bilibili-study-dark-mode .bilibili-study-word-memory-word {
        color: #4ade80 !important;
    }

    .bilibili-study-dark-mode .bilibili-study-word-memory small {
        color: #66bb6a !important;
    }

    .bilibili-study-dark-mode .bilibili-study-word-chinese {
        color: #00d4e6 !important;
    }

    .bilibili-study-dark-mode .bilibili-study-word-display {
        color: #e0e0e0 !important;
    }

    .bilibili-study-dark-mode .bilibili-study-word-revealed {
        color: #4ade80 !important;
    }

    /* Settings Panel */
    .bilibili-study-settings-overlay {
        position: fixed;
        top: 0; left: 0; right: 0; bottom: 0;
        background: rgba(0,0,0,0.5);
        z-index: 999999;
        display: flex;
        align-items: center;
        justify-content: center;
        animation: bilibili-study-fade-in 0.2s ease-out;
    }

    .bilibili-study-settings-modal {
        background: #fff;
        border-radius: 12px;
        width: 92%;
        max-width: 520px;
        max-height: 80vh;
        display: flex;
        flex-direction: column;
        box-shadow: 0 4px 24px rgba(0,0,0,0.3);
        animation: bilibili-study-slide-up 0.2s ease-out;
    }

    .bilibili-study-settings-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 14px 18px;
        border-bottom: 1px solid #eee;
    }

    .bilibili-study-settings-header h3 {
        margin: 0;
        font-size: 17px;
        color: #333;
    }

    .bilibili-study-settings-tabs {
        display: flex;
        border-bottom: 1px solid #eee;
        padding: 0 12px;
    }

    .bilibili-study-settings-tab {
        padding: 10px 16px;
        font-size: 14px;
        cursor: pointer;
        border: none;
        background: none;
        color: #666;
        border-bottom: 2px solid transparent;
        transition: all 0.2s;
    }

    .bilibili-study-settings-tab:hover {
        color: #00a1d6;
    }

    .bilibili-study-settings-tab.active {
        color: #00a1d6;
        border-bottom-color: #00a1d6;
        font-weight: 600;
    }

    .bilibili-study-settings-body {
        flex: 1;
        overflow-y: auto;
        padding: 16px 18px;
    }

    .bilibili-study-settings-footer {
        display: flex;
        justify-content: flex-end;
        gap: 10px;
        padding: 12px 18px;
        border-top: 1px solid #eee;
    }

    .bilibili-study-settings-group {
        margin-bottom: 16px;
    }

    .bilibili-study-settings-group-title {
        font-size: 14px;
        font-weight: 600;
        color: #333;
        margin: 0 0 8px 0;
    }

    .bilibili-study-settings-row {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 8px;
    }

    .bilibili-study-settings-row input[type="text"],
    .bilibili-study-settings-row input[type="time"],
    .bilibili-study-settings-row textarea {
        flex: 1;
        padding: 8px 10px;
        border: 1px solid #ddd;
        border-radius: 6px;
        font-size: 14px;
        outline: none;
        transition: border-color 0.2s;
    }

    .bilibili-study-settings-row input:focus,
    .bilibili-study-settings-row textarea:focus {
        border-color: #00a1d6;
    }

    .bilibili-study-settings-row textarea {
        min-height: 120px;
        resize: vertical;
        font-family: monospace;
        line-height: 1.6;
    }

    .bilibili-study-settings-hint {
        font-size: 12px;
        color: #888;
        margin: 4px 0 0 0;
    }

    .bilibili-study-settings-error {
        font-size: 12px;
        color: #e53935;
        margin: 4px 0 0 0;
    }

    .bilibili-study-settings-empty-hint {
        color: #888;
        font-size: 14px;
        padding: 10px 0;
    }

    .bilibili-study-vocab-error-count {
        color: #e53935;
    }

    .bilibili-study-settings-period-item {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 6px 8px;
        background: #f0f0f0;
        border-radius: 6px;
        margin-bottom: 6px;
    }

    .bilibili-study-settings-period-item input {
        padding: 6px 8px;
        border: 1px solid #ddd;
        border-radius: 4px;
        font-size: 14px;
        width: 90px;
    }

    .bilibili-study-settings-period-item input:focus {
        border-color: #00a1d6;
        outline: none;
    }

    .bilibili-study-settings-period-arrow {
        color: #999;
        font-size: 14px;
    }

    .bilibili-study-settings-remove-btn {
        background: none;
        border: none;
        color: #e53935;
        cursor: pointer;
        font-size: 16px;
        padding: 2px 6px;
        border-radius: 4px;
        transition: background 0.2s;
    }

    .bilibili-study-settings-remove-btn:hover {
        background: #ffebee;
    }

    .bilibili-study-settings-whitelist-item {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 8px 10px;
        background: #f0f0f0;
        border-radius: 6px;
        margin-bottom: 6px;
        gap: 8px;
    }

    .bilibili-study-settings-whitelist-info {
        flex: 1;
        min-width: 0;
    }

    .bilibili-study-settings-whitelist-name {
        font-weight: 600;
        font-size: 14px;
        color: #333;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .bilibili-study-settings-whitelist-bv {
        font-size: 12px;
        color: #888;
    }

    .bilibili-study-settings-add-row {
        display: flex;
        gap: 6px;
        margin-bottom: 8px;
    }

    .bilibili-study-settings-add-row input {
        flex: 1;
        padding: 8px 10px;
        border: 1px solid #ddd;
        border-radius: 6px;
        font-size: 14px;
    }

    .bilibili-study-settings-add-row input:focus {
        border-color: #00a1d6;
        outline: none;
    }

    .bilibili-study-settings-toast {
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%) translateY(-100%);
        padding: 10px 20px;
        border-radius: 8px;
        font-size: 14px;
        z-index: 9999999;
        transition: transform 0.3s ease;
        box-shadow: 0 2px 12px rgba(0,0,0,0.2);
    }

    .bilibili-study-settings-toast.show {
        transform: translateX(-50%) translateY(0);
    }

    .bilibili-study-settings-toast-success {
        background: #e8f5e9;
        color: #2e7d32;
        border: 1px solid #a5d6a7;
    }

    .bilibili-study-settings-toast-error {
        background: #ffebee;
        color: #c62828;
        border: 1px solid #ef9a9a;
    }

    /* Dark mode for settings */
    .bilibili-study-dark-mode .bilibili-study-settings-modal {
        background: #1e1e1e !important;
    }

    .bilibili-study-dark-mode .bilibili-study-settings-header {
        border-bottom-color: #3a3a3a !important;
    }

    .bilibili-study-dark-mode .bilibili-study-settings-header h3 {
        color: #e0e0e0 !important;
    }

    .bilibili-study-dark-mode .bilibili-study-settings-tabs {
        border-bottom-color: #3a3a3a !important;
    }

    .bilibili-study-dark-mode .bilibili-study-settings-tab {
        color: #999 !important;
    }

    .bilibili-study-dark-mode .bilibili-study-settings-tab.active {
        color: #00a1d6 !important;
    }

    .bilibili-study-dark-mode .bilibili-study-settings-body {
        background: #1e1e1e !important;
    }

    .bilibili-study-dark-mode .bilibili-study-settings-footer {
        border-top-color: #3a3a3a !important;
    }

    .bilibili-study-dark-mode .bilibili-study-settings-group-title {
        color: #e0e0e0 !important;
    }

    .bilibili-study-dark-mode .bilibili-study-settings-row input,
    .bilibili-study-dark-mode .bilibili-study-settings-row textarea,
    .bilibili-study-dark-mode .bilibili-study-settings-add-row input,
    .bilibili-study-dark-mode .bilibili-study-settings-period-item input {
        background: #2a2a2a !important;
        color: #e0e0e0 !important;
        border-color: #444 !important;
    }

    .bilibili-study-dark-mode .bilibili-study-settings-row textarea {
        background: #2a2a2a !important;
        color: #e0e0e0 !important;
        border-color: #444 !important;
    }

    .bilibili-study-dark-mode .bilibili-study-settings-hint {
        color: #666 !important;
    }

    .bilibili-study-dark-mode .bilibili-study-settings-error {
        color: #ef5350 !important;
    }

    .bilibili-study-dark-mode .bilibili-study-settings-empty-hint {
        color: #888 !important;
    }

    .bilibili-study-dark-mode .bilibili-study-vocab-error-count {
        color: #ef5350 !important;
    }

    .bilibili-study-dark-mode .bilibili-study-settings-period-item {
        background: #2a2a2a !important;
    }

    .bilibili-study-dark-mode .bilibili-study-settings-whitelist-item {
        background: #2a2a2a !important;
    }

    .bilibili-study-dark-mode .bilibili-study-settings-whitelist-name {
        color: #e0e0e0 !important;
    }

    .bilibili-study-dark-mode .bilibili-study-settings-whitelist-bv {
        color: #888 !important;
    }

    .bilibili-study-dark-mode .bilibili-study-settings-toast-success {
        background: #1a3d1a !important;
        color: #4ade80 !important;
        border-color: #2d5a2d !important;
    }

    .bilibili-study-dark-mode .bilibili-study-settings-toast-error {
        background: #3d1a1a !important;
        color: #f87171 !important;
        border-color: #5a2d2d !important;
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
        ["13:30", "17:30"],
        ["19:00", "23:00"]
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
        { threshold: 180, interval: 60 },  // Stage 2: 3min, popup 1min
        { threshold: 600, interval: 30 },   // Stage 3: 10min, popup 30s
        { threshold: 1200, interval: 15 }   // Stage 4: 20min, popup 15s
    ],

    // Vocabulary: ["Chinese:English", ...]
    // 包含六级+考研英语一核心词汇（约220词）
    // 注意：中文释义不重复，避免wordData键冲突
    vocabulary: [
        // ===== 基础词汇（保留）=====
        "学习:study", "专注:focus", "进步:progress", "努力:effort", "坚持:persistence",
        // ===== 六级核心词汇 =====
        "抛弃(彻底放弃):abandon", "能力(先天才能):ability", "缺席:absence", "绝对的:absolute",
        "吸收(液体/知识):absorb", "抽象的:abstract", "丰富的(大量存在):abundant", "滥用:abuse",
        "学术的:academic", "加速:accelerate", "接受(主动收下):accept", "进入(通道/权利):access",
        "意外(偶然事故):accident", "赞扬:acclaim", "提供住宿:accommodate", "完成(达成目标):accomplish",
        "符合(一致):accord", "从而(因此):accordingly", "账户:account", "积累(逐渐增加):accumulate",
        "准确的:accurate", "指责(控告):accuse", "实现(达成):achieve", "承认(公开确认):acknowledge",
        "获得(习得技能):acquire", "适应(调整适应):adapt", "充足的(够用的):adequate", "调整:adjust",
        "管理(执行):administer", "钦佩:admire", "坦白(承认事实):admit", "采用(采纳方案):adopt",
        "前行(推进):advance", "有利的:advantageous", "冒险:adventure", "提倡(主张):advocate",
        "影响(作用于):affect", "负担得起:afford", "证实(断言):affirm", "加剧(恶化):aggravate",
        "侵略:aggress", "痛苦(极度):agony", "同意:agree", "警报:alarm",
        "使惊恐:alert", "分配(拨给):allocate", "允许:allow", "改变(微调):alter",
        "替代选择:alternative", "模糊的(歧义):ambiguous", "雄心:ambition", "修正(改正):amend",
        "充裕的(丰富的):ample", "娱乐(逗乐):amuse", "分析:analyze", "祖先:ancestor",
        "周年:anniversary", "宣布(公开):announce", "每年的:annual", "预期(期望):anticipate",
        "焦虑:anxiety", "道歉:apologize", "明显的(表面可见):apparent", "呼吁(恳求):appeal",
        "食欲:appetite", "申请(正式请求):apply", "指定(任命):appoint", "评价(估价):appraise",
        "欣赏(感激):appreciate", "方法(接近方式):approach", "适当的:appropriate", "批准:approve",
        "大致(近似):approximately", "武断的:arbitrary", "争论(辩论):argue", "出现(产生):arise",
        "安排:arrange", "逮捕:arrest", "到达:arrive", "人造的:artificial",
        "评估(估定价值):assess", "布置(分配任务):assign", "协助:assist", "联合(联想):associate",
        "假设(未经证实):assume", "保证(向人保证):assure", "依恋(附上):attach", "达到(实现):attain",
        "尝试(企图):attempt", "出席(参加):attend", "态度:attitude", "吸引:attract",
        "归因(属性):attribute", "拍卖:auction", "权威:authority", "自动的:automatic",
        "可用的:available", "平均:average", "避免:avoid", "奖赏(授予):award",
        "意识到:aware", "尴尬的:awkward",
        // ===== 考研英语一高频词汇 =====
        "行为(举止):behavior", "有益的:beneficial", "受益(获利):benefit", "债券:bond",
        "边界:boundary", "简短的(简洁):brief", "预算:budget", "负担(重荷):burden",
        "官僚:bureaucracy", "运动(社会活动):campaign", "能力(潜力):capability",
        "事业(职业生涯):career", "灾难(大祸):catastrophe", "类别:category", "谨慎的:cautious",
        "挑战:challenge", "特征(特点):characteristic", "环境(处境):circumstance", "文明的:civilized",
        "澄清:clarify", "分类:classify", "客户:client", "气候:climate",
        "碰撞(冲突):collide", "结合(融合):combine", "商业的:commercial", "承诺(许诺):commitment",
        "交流(沟通):communicate", "社区:community", "对比(比较差异):compare", "竞争(比赛):compete",
        "抱怨:complain", "复杂的(难解):complex", "构成(组成):compose", "理解(领悟):comprehend",
        "强迫(迫使):compel", "补偿(赔偿):compensate", "竞争性:competitive", "补充(补足):complement",
        "实施(执行):implement", "强加(征收):impose", "印象:impression", "改善(改进):improve",
        "事件(小事):incident", "表明(指出):indicate", "个人的(个别的):individual", "勤奋(产业):industry",
        "影响力(感化):influence", "通知(告知):inform", "固有的(内在):inherent", "最初的(开始):initial",
        "发起(启动):initiate", "创新(革新):innovation", "调查(审查):investigate", "投资(投入):invest",
        "涉及(包含):involve", "隔离(孤立):isolate", "判断:judge", "劳动:labor",
        "发射(发起):launch", "合法的:legitimate", "自由(解放):liberty", "限制(限度):limit",
        "维持(保养):maintain", "主要的(重大):major", "经营(管理):manage", "方式(态度):manner",
        "制造(生产):manufacture", "边缘(利润):margin", "成熟的(深思熟虑):mature", "衡量(测量):measure",
        "机制(机理):mechanism", "方法(系统性):method", "迁移(移居):migrate", "最低的:minimum",
        "部长:minister", "少数(少数民族):minority", "模式(模特):model", "监控(监测):monitor",
        "道德:morality", "动机(驱动力):motive", "谈判(协商):negotiate", "中立的:neutral",
        "提名(任命):nominate", "显著的(明显):noticeable", "获取(得到):obtain", "占领(职业):occupation",
        "发生(出现):occur", "官方的:official", "反对(对抗):oppose", "选项:option",
        "结果(成效):outcome", "克服:overcome", "监督(监管):oversee", "参与(加入):participate",
        "规律(模式):pattern", "察觉(感知):perceive", "执行(表演):perform", "永久的:permanent",
        "许可证:permit", "执着(坚持不懈):persistent", "视角(观点):perspective", "现象:phenomenon",
        "哲学:philosophy", "身体的(物理):physical", "策划(规划):plan", "政策:policy",
        "污染:pollute", "流行的(受欢迎):popular", "人口:population", "实践(练习):practice",
        "先前的(时间):previous", "首要的(主要):primary", "原则(法则):principle", "优先(优先权):priority",
        "程序(流程):procedure", "过程(进程):process", "产物(结果):product", "利润(利益):profit",
        "前进(进展):progress", "工程(项目):project", "促进(晋升):promote", "比例(份额):proportion",
        "提议(建议):propose", "前景(展望):prospect", "保护:protect", "抗议(反对):protest",
        "供应(提供):provide", "追求(追赶):pursue", "资格:qualification", "质量(品质):quality",
        "数量:quantity", "引用(报价):quote", "比率(速率):rate", "理性的:reason",
        "意识到(实现):realize", "推荐(建议):recommend", "恢复(痊愈):recover",
        "减少(降低):reduce", "改革(改良):reform", "拒绝(驳回):reject", "相关的(切题):relevant",
        "缓解(减轻):relieve", "勉强(不情愿):reluctant", "依赖(信赖):rely", "移除:remove",
        "替换(取代):replace", "代表(象征):represent", "繁殖(复制):reproduce", "声誉(名望):reputation",
        "需求(要求):require", "研究(调查):research", "抵抗(抗拒):resist", "解决(决心):resolve",
        "资源:resource", "响应(反应):respond", "修复(恢复):restore", "约束(限制):restrict",
        "导致(起因):result", "退休:retire", "揭示(揭露):reveal", "收入(税收):revenue",
        "变革(革命):revolution", "风险:risk", "角色:role", "牺牲:sacrifice",
        "安全(无危险):safety", "规模(比例尺):scale", "日程(安排):schedule", "奖学金:scholarship",
        "范围(余地):scope", "部分(章节):section", "保障(获得):secure", "寻求(探索):seek", "挑选(精选):select",
        "敏感的(灵敏):sensitive", "分离(分开):separate", "顺序(次序):sequence", "转变(切换):shift",
        "短缺(不足):shortage", "重大的(有意义):significant", "类似的(相似):similar", "简化:simplify",
        "处境(形势):situation", "技能:skill", "社会的(社交):social", "解答(解决):solve",
        "出处(源头):source", "特定的(明确):specific", "稳定(稳固):stabilize", "标准:standard",
        "地位(状态):status", "策略(战略):strategy", "实力(优势):strength", "强调(压力):stress",
        "严格的:strict", "构造(结构):structure", "提交(服从):submit", "物质(本质):substance",
        "代替(替补):substitute", "成功(继承):succeed", "充分的(足够):sufficient", "提议(暗示):suggest",
        "上级(优越):superior", "增补(补充):supplement", "供给:supply", "支持(支撑):support",
        "猜想(假设):suppose", "外观(表面):surface", "手术(操作):surgery", "民意调查:survey",
        "存活(幸存):survive", "嫌疑(怀疑):suspect", "象征: symbolize", "同情(共鸣):sympathy",
        "趋势(倾向):tendency", "理论:theory", "治疗(疗法):therapy", "因此(所以):therefore",
        "威胁:threat", "容忍(宽恕):tolerate", "传统:tradition", "变革(转化):transform",
        "过渡(转变):transition", "传播(传送):transmit", "透明的:transparent", "走向(趋势):trend",
        "触发(引发):trigger", "典型的:typical", "最终的(极限):ultimate", "承担(保证):undertake",
        "统一的(一致):uniform", "独特的(唯一):unique", "普遍的(全球):universal", "更新: update",
        "城市的:urban", "紧急的(迫切):urgent", "利用(运用):utilize", "有效的(合法):valid",
        "有价值的:valuable", "差异(变动):variation", "多样的(不同):various", "交通工具:vehicle",
        "版本:version", "暴力的(猛烈):violent", "虚拟的(实质上):virtual", "可见的:visible",
        "远见(愿景):vision", "至关重要的: vital", "词汇:vocabulary", "音量(卷):volume",
        "自愿的:voluntary", "福利:welfare", "智慧:wisdom", "见证(证据):witness"
    ],

    // Consecutive correct answers to master a word
    // 连续正确5次降低出现概率，8次移入已掌握词库
    masteryThreshold: 8,
    // 连续正确次数达到此值时降低出现概率
    reducedProbabilityThreshold: 5,

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
                // 调试：输出 localStorage 中存储的 studyPeriods
                console.log('[B站学习助手] ConfigManager.load: localStorage studyPeriods =', JSON.stringify(parsed.studyPeriods));
                // Merge with defaults to ensure all fields exist
                // 策略：localStorage 有有效值就用 localStorage 的，否则用代码默认值
                const hasValidPeriods = Array.isArray(parsed.studyPeriods) && parsed.studyPeriods.length > 0;
                const hasValidVocab = Array.isArray(parsed.vocabulary) && parsed.vocabulary.length > 0;
                currentConfig = {
                    ...USER_CONFIG,
                    ...parsed,
                    // 词库：localStorage 有效则用 localStorage 的（用户可能通过设置面板修改过）
                    // localStorage 无效（空/不存在）则用代码默认值（362词）
                    vocabulary: hasValidVocab ? parsed.vocabulary : USER_CONFIG.vocabulary,
                    // 学习时段：同上策略
                    studyPeriods: hasValidPeriods ? parsed.studyPeriods : USER_CONFIG.studyPeriods,
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
    let _isStudyTimeDebugLogged = false;
    function isStudyTime() {
        const config = get();
        const now = new Date();
        const currentMinutes = now.getHours() * 60 + now.getMinutes();

        if (!config.studyPeriods || config.studyPeriods.length === 0) {
            if (!_isStudyTimeDebugLogged) {
                _isStudyTimeDebugLogged = true;
                console.warn('[B站学习助手] isStudyTime: studyPeriods 为空！', config.studyPeriods);
            }
            return false;
        }

        // 首次调用时输出详细调试
        if (!_isStudyTimeDebugLogged) {
            _isStudyTimeDebugLogged = true;
            const debugPeriods = config.studyPeriods.map((p, i) => {
                const s = parseTimeToMinutes(p[0]);
                const e = parseTimeToMinutes(p[1]);
                return { index: i, start: p[0], end: p[1], startMin: s, endMin: e, inRange: s <= e ? (currentMinutes >= s && currentMinutes < e) : (currentMinutes >= s || currentMinutes < e) };
            });
            console.log('[B站学习助手] isStudyTime 调试:', {
                currentMinutes,
                currentTime: `${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}`,
                periods: debugPeriods
            });
        }

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
        reducedProbabilityThreshold: USER_CONFIG.reducedProbabilityThreshold,
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
            if (saved) {
                currentTheme = saved;
            } else {
                // 无手动偏好时自动检测B站当前主题
                currentTheme = detectBilibiliTheme();
            }
        } catch (e) {
            currentTheme = detectBilibiliTheme();
        }
        console.log('[B站学习助手] loadTheme: currentTheme=', currentTheme,
            '(saved=' + (localStorage.getItem(THEME_KEY) || 'null') + ')');
        return currentTheme;
    }

    // 自动检测B站当前主题
    function detectBilibiliTheme() {
        // B站暗色模式: <html data-theme="dark">
        if (document.documentElement.getAttribute('data-theme') === 'dark') {
            return 'dark';
        }
        // 备选: 检测系统主题偏好
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            return 'dark';
        }
        return 'light';
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

    // ===== 刷新/重置词库按钮处理器（声明在作用域顶层，showDetailedStatsModal和refreshVocabDisplay均可访问） =====
    function handleRefreshVocabBtn(e) {
        e.stopPropagation();
        console.log('[B站学习助手] handleRefreshVocabBtn: 刷新词库显示');
        refreshVocabDisplay();
    }

    function handleResetVocabBtn(e) {
        e.stopPropagation();
        if (!confirm('确认重置所有单词的掌握状态和答题记录吗？\n\n所有已掌握单词、连续正确次数将清零，重新从零开始学习。')) {
            return;
        }
        console.log('[B站学习助手] handleResetVocabBtn: 重置所有学习记录');
        WordVerifier.resetWordRecords();
        // 弹出主题感知的重置成功提示
        const total = WordVerifier.parseVocabulary().length;
        showVocabToast({ total, mastered: 0, learnable: total, changed: 0 }, 'reset');
        // 重渲染 Module3 + Module4
        const wrapper = document.getElementById('bilibili-study-module3-wrapper');
        if (wrapper) {
            const temp = document.createElement('div');
            temp.innerHTML = renderModule3();
            wrapper.replaceWith(temp.firstElementChild);
            // 重新绑定按钮事件
            const newResetBtn = document.getElementById('bilibili-study-reset-vocab');
            if (newResetBtn) newResetBtn.addEventListener('click', handleResetVocabBtn);
            const newRefreshBtn = document.getElementById('bilibili-study-refresh-vocab');
            if (newRefreshBtn) newRefreshBtn.addEventListener('click', handleRefreshVocabBtn);
        }
        const modal = document.getElementById('bilibili-study-detail-modal');
        if (modal) {
            const m4 = modal.querySelector('.bilibili-study-modal-module:nth-child(4)');
            if (m4) {
                const t = document.createElement('div');
                t.innerHTML = renderModule4();
                m4.replaceWith(t.firstElementChild);
            }
        }
    }

    // 刷新词库显示（置于 DetailPanel 作用域内，可直接调用 renderModule3/renderModule4）
    function refreshVocabDisplay() {
        console.log('[B站学习助手] refreshVocabDisplay: 开始刷新词库显示');
        console.log('[B站学习助手]   当前词库总词数:', WordVerifier.parseVocabulary().length);
        console.log('[B站学习助手]   当前已掌握词数:', Object.values(WordVerifier.getWordRecords().words || {}).filter(w => w.mastered).length);
        console.log('[B站学习助手]   当前可学习词数:', WordVerifier.getUnmasteredCount());

        const wrapper = document.getElementById('bilibili-study-module3-wrapper');
        if (wrapper) {
            const temp = document.createElement('div');
            temp.innerHTML = renderModule3();
            wrapper.replaceWith(temp.firstElementChild);
            // 为新按钮重新绑定事件（handleRefreshVocabBtn/handleResetVocabBtn同在DetailPanel作用域）
            const resetBtn = document.getElementById('bilibili-study-reset-vocab');
            if (resetBtn) resetBtn.addEventListener('click', handleResetVocabBtn);
            const refreshBtn = document.getElementById('bilibili-study-refresh-vocab');
            if (refreshBtn) refreshBtn.addEventListener('click', handleRefreshVocabBtn);
            console.log('[B站学习助手] refreshVocabDisplay: Module3 刷新成功');
        } else {
            console.warn('[B站学习助手] refreshVocabDisplay: 未找到 Module3 容器元素');
        }
        // 同步刷新 Module4 建议区
        const modalElement = document.getElementById('bilibili-study-detail-modal');
        if (modalElement) {
            const module4 = modalElement.querySelector('.bilibili-study-modal-module:nth-child(4)');
            if (module4) {
                const temp4 = document.createElement('div');
                temp4.innerHTML = renderModule4();
                module4.replaceWith(temp4.firstElementChild);
                console.log('[B站学习助手] refreshVocabDisplay: Module4 刷新成功');
            }
        }
        console.log('[B站学习助手] refreshVocabDisplay: 词库信息刷新完成');

        // 弹出主题感知的词库信息提示
        const total = WordVerifier.parseVocabulary().length;
        const mastered = Object.values(WordVerifier.getWordRecords().words || {}).filter(w => w.mastered).length;
        const learnable = total - mastered;
        showVocabToast({ total, mastered, learnable, changed: learnable }, 'refresh');
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

        // 统计来源：词库配置总词数，而非 localStorage 答题记录数
        const vocabList = WordVerifier.parseVocabulary();
        const totalWords = vocabList.length;  // 词库配置中的总词数（362）
        const masteredWords = Object.values(words).filter(w => w.mastered).length;  // 答过且已掌握
        const progressPercent = totalWords > 0 ? Math.round((masteredWords / totalWords) * 100) : 0;

        // 词库更新提醒：非掌握单词不足50时显示
        const unmasteredCount = WordVerifier.getUnmasteredCount();
        const reducedCount = WordVerifier.getReducedProbabilityCount();
        let vocabWarning = '';
        if (unmasteredCount < 50 && unmasteredCount > 0) {
            vocabWarning = `
                <div class="bilibili-study-vocab-warning" style="margin: 10px 0; padding: 10px; background: #fff3e0; border-radius: 6px; border: 1px solid #ffe0b2;">
                    <div style="display: flex; align-items: center; gap: 6px;">
                        <span style="font-size: 16px;">⚠️</span>
                        <span class="bilibili-study-vocab-warning-title" style="color: #e65100; font-weight: bold;">词库不足提醒</span>
                    </div>
                    <p class="bilibili-study-vocab-warning-text" style="margin: 5px 0 0 0; color: #bf360c; font-size: 13px;">
                        可学习单词仅剩 <strong>${unmasteredCount}</strong> 个，建议添加更多词汇以保持学习效果。
                    </p>
                </div>`;
        } else if (unmasteredCount === 0) {
            vocabWarning = `
                <div class="bilibili-study-vocab-critical" style="margin: 10px 0; padding: 10px; background: #ffebee; border-radius: 6px; border: 1px solid #ffcdd2;">
                    <div style="display: flex; align-items: center; gap: 6px;">
                        <span style="font-size: 16px;">🔴</span>
                        <span class="bilibili-study-vocab-critical-title" style="color: #c62828; font-weight: bold;">词库已全部掌握</span>
                    </div>
                    <p class="bilibili-study-vocab-critical-text" style="margin: 5px 0 0 0; color: #b71c1c; font-size: 13px;">
                        所有单词已掌握，请添加新词汇继续学习！
                    </p>
                </div>`;
        }

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
            <div class="bilibili-study-modal-module" id="bilibili-study-module3-wrapper">
                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; gap: 6px;">
                    <h3 class="bilibili-study-module-title" style="margin-bottom: 0;">📚 单词学习</h3>
                    <div style="display: flex; gap: 6px;">
                        <button id="bilibili-study-refresh-vocab"
                                class="bilibili-study-btn"
                                style="padding: 4px 10px; font-size: 12px; cursor: pointer; border-radius: 6px; background: rgba(59,130,246,0.15); border: 1px solid rgba(59,130,246,0.3); color: #60a5fa;"
                                title="刷新词库信息，查看最新学习状态（不清除记录）">
                            🔄 刷新词库
                        </button>
                        <button id="bilibili-study-reset-vocab"
                                class="bilibili-study-btn bilibili-study-btn-secondary"
                                style="padding: 4px 10px; font-size: 12px; cursor: pointer; border-radius: 6px;"
                                title="重置所有单词的掌握状态和答题记录，从零开始学习">
                            🗑️ 重置记录
                        </button>
                    </div>
                </div>
                <div class="bilibili-study-module-content">
                    ${vocabWarning}
                    <div class="bilibili-study-stat-row">
                        <span class="bilibili-study-stat-label">总单词数：</span>
                        <span class="bilibili-study-stat-value">${totalWords}</span>
                    </div>
                    <div class="bilibili-study-stat-row">
                        <span class="bilibili-study-stat-label">已掌握：</span>
                        <span class="bilibili-study-stat-value">${masteredWords}</span>
                    </div>
                    <div class="bilibili-study-stat-row">
                        <span class="bilibili-study-stat-label">可学习：</span>
                        <span class="bilibili-study-stat-value">${unmasteredCount}${reducedCount > 0 ? `（含${reducedCount}个即将掌握）` : ''}</span>
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
                                id="bilibili-study-open-settings"
                                style="padding: 6px 12px; font-size: 14px; cursor: pointer;"
                                title="参数设置">
                            ⚙️ 设置
                        </button>
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

        // Settings button
        const settingsBtn = document.getElementById('bilibili-study-open-settings');
        if (settingsBtn) {
            settingsBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                openSettings();
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

            // 刷新词库按钮：重新渲染模块，显示最新词库统计信息
            const refreshVocabBtn = document.getElementById('bilibili-study-refresh-vocab');
            if (refreshVocabBtn) {
                refreshVocabBtn.addEventListener('click', handleRefreshVocabBtn);
            }

            // 重置记录按钮：清空所有学习记录，需用户确认
            const resetVocabBtn = document.getElementById('bilibili-study-reset-vocab');
            if (resetVocabBtn) {
                resetVocabBtn.addEventListener('click', handleResetVocabBtn);
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
                    <p class="bilibili-study-whitelist-modal-desc">
                        当前视频：${currentBV}
                    </p>
                    <div class="bilibili-study-whitelist-modal-field">
                        <label class="bilibili-study-whitelist-modal-label">课程名称（可选）：</label>
                        <input type="text" id="bilibili-study-whitelist-course-name"
                               class="bilibili-study-whitelist-modal-input"
                               placeholder="例如：高等数学第一章">
                        <small class="bilibili-study-whitelist-modal-hint">留空将使用视频BV号作为名称</small>
                    </div>
                    <div id="bilibili-study-whitelist-error" class="bilibili-study-settings-error"></div>
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

    // ==========================================
    // Settings Panel (配置编辑器)
    // ==========================================
    let settingsElement = null;
    let activeSettingsTab = 'periods'; // 'periods' | 'whitelist' | 'vocab'

    function openSettings() {
        if (settingsElement) {
            settingsElement.remove();
            settingsElement = null;
        }

        settingsElement = document.createElement('div');
        settingsElement.className = 'bilibili-study-settings-overlay';
        settingsElement.id = 'bilibili-study-settings-overlay';

        const config = ConfigManager.get();
        const isDark = currentTheme === 'dark';

        settingsElement.innerHTML = `
            <div class="bilibili-study-settings-modal ${isDark ? 'bilibili-study-dark-mode' : ''}">
                <div class="bilibili-study-settings-header">
                    <h3>⚙️ 参数设置</h3>
                    <button class="bilibili-study-modal-close" id="bilibili-study-settings-close">&times;</button>
                </div>
                <div class="bilibili-study-settings-tabs">
                    <button class="bilibili-study-settings-tab ${activeSettingsTab === 'periods' ? 'active' : ''}" data-tab="periods">⏰ 学习时段</button>
                    <button class="bilibili-study-settings-tab ${activeSettingsTab === 'whitelist' ? 'active' : ''}" data-tab="whitelist">📚 学习视频</button>
                    <button class="bilibili-study-settings-tab ${activeSettingsTab === 'vocab' ? 'active' : ''}" data-tab="vocab">📝 词库管理</button>
                </div>
                <div class="bilibili-study-settings-body" id="bilibili-study-settings-body">
                    ${renderSettingsContent(activeSettingsTab, config)}
                </div>
                <div class="bilibili-study-settings-footer">
                    <button class="bilibili-study-btn bilibili-study-btn-secondary" id="bilibili-study-settings-cancel">取消</button>
                    <button class="bilibili-study-btn bilibili-study-btn-primary" id="bilibili-study-settings-save">💾 保存</button>
                </div>
            </div>
        `;

        document.body.appendChild(settingsElement);
        bindSettingsEvents();
    }

    function closeSettings() {
        if (settingsElement) {
            settingsElement.remove();
            settingsElement = null;
        }
    }

    function renderSettingsContent(tab, config) {
        switch (tab) {
            case 'periods': return renderPeriodsSettings(config);
            case 'whitelist': return renderWhitelistSettings(config);
            case 'vocab': return renderVocabSettings(config);
            default: return renderPeriodsSettings(config);
        }
    }

    function renderPeriodsSettings(config) {
        const periods = config.studyPeriods || [];
        let periodsHtml = periods.map((p, i) => `
            <div class="bilibili-study-settings-period-item" data-index="${i}">
                <input type="time" class="bilibili-study-period-start" value="${p[0]}" data-index="${i}">
                <span class="bilibili-study-settings-period-arrow">→</span>
                <input type="time" class="bilibili-study-period-end" value="${p[1]}" data-index="${i}">
                <button class="bilibili-study-settings-remove-btn" data-index="${i}" title="删除此时段">✕</button>
            </div>
        `).join('');

        if (!periodsHtml) {
            periodsHtml = '<div class="bilibili-study-settings-empty-hint">暂无学习时段，请点击下方添加</div>';
        }

        return `
            <div class="bilibili-study-settings-group">
                <p class="bilibili-study-settings-group-title">学习时段</p>
                <p class="bilibili-study-settings-hint" style="margin: 0 0 10px 0;">设定每天的专注学习时间段，仅在此时段内才会触发专注提醒</p>
                <div id="bilibili-study-periods-list">
                    ${periodsHtml}
                </div>
                <button class="bilibili-study-btn bilibili-study-btn-secondary" id="bilibili-study-add-period" style="margin-top: 8px; font-size: 13px;">+ 添加时段</button>
            </div>
        `;
    }

    function renderWhitelistSettings(config) {
        const whitelist = ConfigManager.getWhitelistArray();
        let listHtml = whitelist.map(item => `
            <div class="bilibili-study-settings-whitelist-item" data-bv="${item.bv}">
                <div class="bilibili-study-settings-whitelist-info">
                    <div class="bilibili-study-settings-whitelist-name">${item.name}</div>
                    <div class="bilibili-study-settings-whitelist-bv">${item.bv}</div>
                </div>
                <button class="bilibili-study-settings-remove-btn" data-bv="${item.bv}" title="移除此视频">✕</button>
            </div>
        `).join('');

        if (!listHtml) {
            listHtml = '<div class="bilibili-study-settings-empty-hint">白名单为空，请添加学习视频</div>';
        }

        return `
            <div class="bilibili-study-settings-group">
                <p class="bilibili-study-settings-group-title">学习视频（白名单）</p>
                <p class="bilibili-study-settings-hint" style="margin: 0 0 10px 0;">白名单中的视频不会触发专注干预</p>
                <div id="bilibili-study-whitelist-list">
                    ${listHtml}
                </div>
                <div class="bilibili-study-settings-add-row" style="margin-top: 10px;">
                    <input type="text" id="bilibili-study-new-bv" placeholder="输入BV号（如 BV1xx411c7mD）">
                    <input type="text" id="bilibili-study-new-name" placeholder="课程名称" style="max-width: 120px;">
                    <button class="bilibili-study-btn bilibili-study-btn-primary" id="bilibili-study-add-whitelist-btn" style="white-space: nowrap; font-size: 13px;">添加</button>
                </div>
                <div id="bilibili-study-whitelist-error" class="bilibili-study-settings-error"></div>
            </div>
        `;
    }

    function renderVocabSettings(config) {
        const vocab = config.vocabulary || [];
        const total = vocab.length;
        // 格式化为每行一个 "中文:英文"
        const vocabText = vocab.join('\n');

        return `
            <div class="bilibili-study-settings-group">
                <p class="bilibili-study-settings-group-title">词库管理</p>
                <p class="bilibili-study-settings-hint" style="margin: 0 0 4px 0;">当前词库共 <strong>${total}</strong> 个词条</p>
                <p class="bilibili-study-settings-hint" style="margin: 0 0 10px 0;">格式：每行一个词条，中文和英文用英文冒号分隔，如 "学习:study"</p>
                <div class="bilibili-study-settings-row">
                    <textarea id="bilibili-study-vocab-textarea" placeholder="学习:study&#10;专注:focus&#10;进步:progress">${vocabText}</textarea>
                </div>
                <div id="bilibili-study-vocab-error" class="bilibili-study-settings-error"></div>
                <div id="bilibili-study-vocab-preview" class="bilibili-study-settings-hint"></div>
            </div>
        `;
    }

    function bindSettingsEvents() {
        // 关闭按钮
        const closeBtn = document.getElementById('bilibili-study-settings-close');
        if (closeBtn) closeBtn.addEventListener('click', closeSettings);

        // 点击遮罩关闭
        if (settingsElement) {
            settingsElement.addEventListener('click', function(e) {
                if (e.target === settingsElement) closeSettings();
            });
        }

        // 取消按钮
        const cancelBtn = document.getElementById('bilibili-study-settings-cancel');
        if (cancelBtn) cancelBtn.addEventListener('click', closeSettings);

        // Tab 切换
        const tabs = settingsElement.querySelectorAll('.bilibili-study-settings-tab');
        tabs.forEach(tab => {
            tab.addEventListener('click', function() {
                activeSettingsTab = this.dataset.tab;
                // 更新 tab 样式
                tabs.forEach(t => t.classList.remove('active'));
                this.classList.add('active');
                // 更新内容区
                const body = document.getElementById('bilibili-study-settings-body');
                if (body) {
                    const config = ConfigManager.get();
                    body.innerHTML = renderSettingsContent(activeSettingsTab, config);
                    bindSettingsTabEvents();
                }
            });
        });

        // 保存按钮
        const saveBtn = document.getElementById('bilibili-study-settings-save');
        if (saveBtn) saveBtn.addEventListener('click', saveSettings);

        // 各 tab 内的事件
        bindSettingsTabEvents();
    }

    function bindSettingsTabEvents() {
        // === 学习时段 tab ===
        // 删除时段
        document.querySelectorAll('.bilibili-study-settings-period-item .bilibili-study-settings-remove-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const idx = parseInt(this.dataset.index);
                this.closest('.bilibili-study-settings-period-item').remove();
                // 重新编号
                document.querySelectorAll('.bilibili-study-settings-period-item').forEach((item, i) => {
                    item.dataset.index = i;
                    item.querySelectorAll('input').forEach(inp => inp.dataset.index = i);
                    item.querySelector('.bilibili-study-settings-remove-btn').dataset.index = i;
                });
            });
        });

        // 添加时段
        const addPeriodBtn = document.getElementById('bilibili-study-add-period');
        if (addPeriodBtn) {
            addPeriodBtn.addEventListener('click', function() {
                const list = document.getElementById('bilibili-study-periods-list');
                if (!list) return;
                const idx = list.querySelectorAll('.bilibili-study-settings-period-item').length;
                const div = document.createElement('div');
                div.className = 'bilibili-study-settings-period-item';
                div.dataset.index = idx;
                div.innerHTML = `
                    <input type="time" class="bilibili-study-period-start" value="08:00" data-index="${idx}">
                    <span class="bilibili-study-settings-period-arrow">→</span>
                    <input type="time" class="bilibili-study-period-end" value="12:00" data-index="${idx}">
                    <button class="bilibili-study-settings-remove-btn" data-index="${idx}" title="删除此时段">✕</button>
                `;
                list.appendChild(div);
                // 绑定删除事件
                div.querySelector('.bilibili-study-settings-remove-btn').addEventListener('click', function() {
                    div.remove();
                });
            });
        }

        // === 白名单 tab ===
        // 删除白名单项
        document.querySelectorAll('.bilibili-study-settings-whitelist-item .bilibili-study-settings-remove-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                this.closest('.bilibili-study-settings-whitelist-item').remove();
            });
        });

        // 添加白名单
        const addWhitelistBtn = document.getElementById('bilibili-study-add-whitelist-btn');
        if (addWhitelistBtn) {
            addWhitelistBtn.addEventListener('click', function() {
                const bvInput = document.getElementById('bilibili-study-new-bv');
                const nameInput = document.getElementById('bilibili-study-new-name');
                const errorDiv = document.getElementById('bilibili-study-whitelist-error');
                const bv = (bvInput.value || '').trim();
                const name = (nameInput.value || '').trim();

                // 验证
                if (!bv) {
                    if (errorDiv) errorDiv.textContent = '请输入BV号';
                    return;
                }
                if (!/^BV[\w]+$/i.test(bv)) {
                    if (errorDiv) errorDiv.textContent = 'BV号格式不正确，应以 BV 开头';
                    return;
                }
                // 检查重复
                const existing = document.querySelectorAll('.bilibili-study-settings-whitelist-item');
                for (const item of existing) {
                    if (item.dataset.bv === bv) {
                        if (errorDiv) errorDiv.textContent = '该BV号已在白名单中';
                        return;
                    }
                }

                if (errorDiv) errorDiv.textContent = '';

                // 添加到列表
                const list = document.getElementById('bilibili-study-whitelist-list');
                if (list) {
                    const div = document.createElement('div');
                    div.className = 'bilibili-study-settings-whitelist-item';
                    div.dataset.bv = bv;
                    div.innerHTML = `
                        <div class="bilibili-study-settings-whitelist-info">
                            <div class="bilibili-study-settings-whitelist-name">${name || bv}</div>
                            <div class="bilibili-study-settings-whitelist-bv">${bv}</div>
                        </div>
                        <button class="bilibili-study-settings-remove-btn" data-bv="${bv}" title="移除此视频">✕</button>
                    `;
                    list.appendChild(div);
                    div.querySelector('.bilibili-study-settings-remove-btn').addEventListener('click', function() {
                        div.remove();
                    });
                    bvInput.value = '';
                    nameInput.value = '';
                }
            });
        }

        // === 词库 tab ===
        const vocabTextarea = document.getElementById('bilibili-study-vocab-textarea');
        if (vocabTextarea) {
            // 实时预览词数
            vocabTextarea.addEventListener('input', function() {
                const lines = this.value.split('\n').filter(l => l.trim());
                const validLines = lines.filter(l => /^.+:.+$/.test(l.trim()));
                const invalidCount = lines.length - validLines.length;
                const previewDiv = document.getElementById('bilibili-study-vocab-preview');
                if (previewDiv) {
                    if (invalidCount > 0) {
                        previewDiv.innerHTML = `解析到 <strong>${validLines.length}</strong> 个有效词条，<span class="bilibili-study-vocab-error-count">${invalidCount} 行格式错误</span>（需使用 "中文:英文" 格式）`;
                    } else {
                        previewDiv.innerHTML = `解析到 <strong>${validLines.length}</strong> 个有效词条`;
                    }
                }
            });
            // 触发一次预览
            vocabTextarea.dispatchEvent(new Event('input'));
        }
    }

    function saveSettings() {
        const errors = [];
        let hasChanges = false;

        // === 保存学习时段 ===（只保存当前激活的 tab）
        if (activeSettingsTab === 'periods') {
            const periodItems = settingsElement?.querySelectorAll('.bilibili-study-settings-period-item');
            if (periodItems) {
                const newPeriods = [];
                periodItems.forEach(item => {
                    const start = item.querySelector('.bilibili-study-period-start')?.value;
                    const end = item.querySelector('.bilibili-study-period-end')?.value;
                    if (start && end) {
                        newPeriods.push([start, end]);
                    } else if (start || end) {
                        errors.push('存在不完整的学习时段（缺少开始或结束时间）');
                    }
                });
                const oldPeriods = ConfigManager.get().studyPeriods || [];
                if (JSON.stringify(newPeriods) !== JSON.stringify(oldPeriods)) {
                    ConfigManager.save({ studyPeriods: newPeriods });
                    hasChanges = true;
                }
            }
        }

        // === 保存白名单 ===
        if (activeSettingsTab === 'whitelist') {
            const whitelistItems = settingsElement?.querySelectorAll('.bilibili-study-settings-whitelist-item');
            if (whitelistItems && whitelistItems.length > 0) {
                const newWhitelist = {};
                whitelistItems.forEach(item => {
                    const bv = item.dataset.bv;
                    const nameEl = item.querySelector('.bilibili-study-settings-whitelist-name');
                    const name = nameEl ? nameEl.textContent : bv;
                    if (bv) {
                        newWhitelist[bv] = { name, addedAt: Date.now() };
                    }
                });
                const oldWhitelist = ConfigManager.get().whitelist || {};
                if (JSON.stringify(newWhitelist) !== JSON.stringify(oldWhitelist)) {
                    ConfigManager.save({ whitelist: newWhitelist });
                    hasChanges = true;
                }
            } else if (whitelistItems && whitelistItems.length === 0) {
                // 用户主动清空了所有白名单
                const oldWhitelist = ConfigManager.get().whitelist || {};
                if (Object.keys(oldWhitelist).length > 0) {
                    ConfigManager.save({ whitelist: {} });
                    hasChanges = true;
                }
            }
        }

        // === 保存词库 ===
        if (activeSettingsTab === 'vocab') {
            const vocabTextarea = document.getElementById('bilibili-study-vocab-textarea');
            if (vocabTextarea) {
                const lines = vocabTextarea.value.split('\n').filter(l => l.trim());
                const newVocab = [];
                const invalidLines = [];

                lines.forEach((line, i) => {
                    const trimmed = line.trim();
                    if (/^.+:.+$/.test(trimmed)) {
                        const [chinese, ...rest] = trimmed.split(':');
                        const english = rest.join(':').trim(); // 支持英文中包含冒号
                        if (chinese.trim() && english) {
                            newVocab.push(`${chinese.trim()}:${english.trim().toLowerCase()}`);
                        }
                    } else if (trimmed) {
                        invalidLines.push(i + 1);
                    }
                });

                if (invalidLines.length > 0) {
                    errors.push(`词库第 ${invalidLines.slice(0, 5).join(', ')}${invalidLines.length > 5 ? '...' : ''} 行格式错误，需使用 "中文:英文" 格式`);
                }

                const oldVocab = ConfigManager.get().vocabulary || [];
                if (newVocab.length > 0 && JSON.stringify(newVocab) !== JSON.stringify(oldVocab)) {
                    ConfigManager.save({ vocabulary: newVocab });
                    hasChanges = true;
                } else if (newVocab.length === 0 && oldVocab.length > 0) {
                    errors.push('词库不能为空，至少需要1个词条');
                }
            }
        }

        // 反馈
        if (errors.length > 0) {
            showSettingsToast(errors[0], 'error');
            return;
        }

        closeSettings();

        if (hasChanges) {
            showSettingsToast('✅ 配置已保存，正在刷新面板…', 'success');
            // 刷新详情面板
            setTimeout(() => {
                close(); // 关闭当前详情面板
                setTimeout(() => open(), 200); // 重新打开以加载新配置
            }, 800);
        } else {
            showSettingsToast('配置无变化', 'success');
        }
    }

    // 设置面板的 Toast 反馈
    function showSettingsToast(message, type) {
        const existing = document.querySelector('.bilibili-study-settings-toast');
        if (existing) existing.remove();

        const toast = document.createElement('div');
        toast.className = `bilibili-study-settings-toast bilibili-study-settings-toast-${type}`;
        toast.textContent = message;
        document.body.appendChild(toast);

        requestAnimationFrame(() => {
            toast.classList.add('show');
        });

        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    return {
        open,
        close,
        isOpen: function() { return isOpen; },
        getCurrentTheme: function() { return currentTheme; },
        detectTheme: detectBilibiliTheme,
        loadTheme: loadTheme,
        openSettings
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
    // 连续正确5次降低出现概率(权重0.2)，连续正确8次移入已掌握
    function selectWord() {
        const words = parseVocabulary();
        if (words.length === 0) {
            return null;
        }

        const config = ConfigManager.get();
        const records = getWordRecords();
        const wordData = records.words || {};
        const reducedThreshold = config.reducedProbabilityThreshold || 5;

        // 过滤已掌握单词（连续正确8次）
        let availableWords = words.filter(w => {
            const data = wordData[w.chinese];
            return !data || !data.mastered;
        });

        // 如果全部掌握，使用所有单词
        if (availableWords.length === 0) {
            availableWords = words;
        }

        // 加权随机选择：连续正确5-7次的单词权重降为0.2
        const weights = availableWords.map(w => {
            const data = wordData[w.chinese];
            if (data && data.consecutiveCorrect >= reducedThreshold && !data.mastered) {
                return 0.2; // 降低出现概率
            }
            return 1.0;
        });

        const totalWeight = weights.reduce((sum, w) => sum + w, 0);
        let random = Math.random() * totalWeight;
        for (let i = 0; i < availableWords.length; i++) {
            random -= weights[i];
            if (random <= 0) {
                return availableWords[i];
            }
        }
        return availableWords[availableWords.length - 1];
    }

    // 获取非掌握单词数量（用于词库更新提醒）
    function getUnmasteredCount() {
        const words = parseVocabulary();
        if (words.length === 0) return 0;
        const records = getWordRecords();
        const wordData = records.words || {};
        return words.filter(w => {
            const data = wordData[w.chinese];
            return !data || !data.mastered;
        }).length;
    }

    // 获取处于"降概率"阶段的单词数量
    function getReducedProbabilityCount() {
        const words = parseVocabulary();
        if (words.length === 0) return 0;
        const config = ConfigManager.get();
        const records = getWordRecords();
        const wordData = records.words || {};
        const reducedThreshold = config.reducedProbabilityThreshold || 5;
        return words.filter(w => {
            const data = wordData[w.chinese];
            return data && data.consecutiveCorrect >= reducedThreshold && !data.mastered;
        }).length;
    }

    // Check if user's answer is correct
    function checkAnswer(word, answer) {
        if (!word || !answer) return false;
        const normalizedAnswer = answer.trim().toLowerCase();
        const normalizedEnglish = word.english.toLowerCase();
        return normalizedAnswer === normalizedEnglish;
    }

    // Update word mastery status
    // wasHinted: 提示后正确不算连续正确
    function updateMastery(word, correct, wasHinted) {
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
            entry.correctAttempts++;
            // 提示后正确不算连续正确，不增加consecutiveCorrect
            if (!wasHinted) {
                entry.consecutiveCorrect++;
            }
            // 检查是否达到掌握阈值
            if (entry.consecutiveCorrect >= config.masteryThreshold) {
                entry.mastered = true;
            }
        } else {
            entry.consecutiveCorrect = 0;
            // 答错不清除mastered状态，只有连续正确重新累积
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

    // 重置单词学习状态：清空所有掌握记录、连续正确数、答题历史
    function resetWordRecords() {
        saveWordRecords({ words: {}, recentAnswers: [] });
        console.log('[B站学习助手] resetWordRecords: 词库学习状态已重置');
    }

    return {
        selectWord,
        checkAnswer,
        updateMastery,
        getMasteredWords,
        parseVocabulary,
        recordAnswer,
        getRecentAnswers,
        getUnmasteredCount,
        getReducedProbabilityCount,
        resetWordRecords
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
     * 将当前 DetailPanel 主题应用到干预弹窗（学习提醒/单词验证）
     * DetailPanel 的 dark-mode CSS 类通过层叠样式覆盖子元素，
     * 因此只需在弹窗根节点加上同一个 class 即可复用所有暗色样式。
     */
    function applyCurrentThemeToModal(el) {
        if (!el) return;
        // 优先使用 DetailPanel 中已初始化的主题（脚本启动时已通过 initTheme 加载）
        const theme = (typeof DetailPanel !== 'undefined' && typeof DetailPanel.getCurrentTheme === 'function')
            ? DetailPanel.getCurrentTheme()
            : (localStorage.getItem('bilibiliStudyAssistant_theme') || 'light');
        console.log('[B站学习助手] applyCurrentThemeToModal: theme=', theme, 'el=', el.id);
        console.log('[B站学习助手]   当前classList:', el.className);

        const innerModal = el.querySelector('.bilibili-study-modal');

        if (theme === 'dark') {
            el.classList.add('bilibili-study-dark-mode');
            el.style.background = 'rgba(0, 0, 0, 0.85)';
            if (innerModal) {
                innerModal.style.background = 'rgba(30, 35, 45, 0.97)';
                innerModal.style.color = '#e0e0e0';
            }
            console.log('[B站学习助手]   已应用深色模式 (overlay+modal)');
        } else {
            el.classList.remove('bilibili-study-dark-mode');
            el.style.background = 'rgba(0, 0, 0, 0.5)';
            if (innerModal) {
                innerModal.style.background = '';
                innerModal.style.color = '';
            }
        }
        console.log('[B站学习助手]   最终classList:', el.className);
    }

    /**
     * 主题感知的词库变更提示 Toast
     * @param {object} stats - { total, mastered, learnable, changed }
     * @param {string} type - 'refresh' | 'reset'
     */
    function showVocabToast(stats, type) {
        // 移除已有 toast
        const existing = document.getElementById('bilibili-study-vocab-toast');
        if (existing) existing.remove();

        const theme = getCurrentTheme ? getCurrentTheme() : 'light';
        const isDark = theme === 'dark';

        const toast = document.createElement('div');
        toast.id = 'bilibili-study-vocab-toast';

        // 主题配色
        const bg = isDark ? 'rgba(30, 35, 45, 0.97)' : 'rgba(255, 255, 255, 0.97)';
        const border = isDark ? 'rgba(96, 165, 250, 0.4)' : 'rgba(59, 130, 246, 0.3)';
        const iconColor = isDark ? '#60a5fa' : '#3b82f6';
        const titleColor = isDark ? '#f1f5f9' : '#1e293b';
        const statColor = isDark ? '#94a3b8' : '#64748b';
        const valueColor = isDark ? '#60a5fa' : '#3b82f6';
        const changedColor = isDark ? '#4ade80' : '#16a34a';

        const icon = type === 'reset'
            ? '<span style="font-size:16px">🗑️</span>'
            : '<span style="font-size:16px">🔄</span>';
        const title = type === 'reset' ? '学习记录已重置' : '词库信息已刷新';
        const changedText = type === 'reset'
            ? ''
            : `<span style="color:${changedColor}; font-weight:600; margin-left:8px;">+${stats.changed} 可学习</span>`;

        toast.innerHTML = `
            <div style="
                display: flex; align-items: center; gap: 8px;
                background: ${bg};
                border: 1px solid ${border};
                border-radius: 10px;
                padding: 10px 14px;
                box-shadow: 0 4px 16px rgba(0,0,0,0.2);
                backdrop-filter: blur(12px);
                color: ${titleColor};
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                min-width: 220px;
                animation: vocabToastIn 0.25s ease-out;
            ">
                ${icon}
                <span style="font-weight: 600; font-size: 13px;">${title}</span>
            </div>
            <div style="
                display: flex; gap: 12px; margin-top: 4px;
                background: ${bg};
                padding: 0 14px 10px 38px;
                font-size: 12px;
            ">
                <span style="color: ${statColor}">总词 <span style="color: ${valueColor}; font-weight:600">${stats.total}</span></span>
                <span style="color: ${statColor}">已掌握 <span style="color: ${valueColor}; font-weight:600">${stats.mastered}</span></span>
                <span style="color: ${statColor}">可学习 <span style="color: ${valueColor}; font-weight:600">${stats.learnable}</span>${changedText}</span>
            </div>
        `;
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            z-index: 999999;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        `;

        // 注入动画样式（仅首次）
        if (!document.getElementById('bilibili-study-toast-styles')) {
            const style = document.createElement('style');
            style.id = 'bilibili-study-toast-styles';
            style.textContent = `
                @keyframes vocabToastIn {
                    from { opacity: 0; transform: translateX(-50%) translateY(-10px); }
                    to   { opacity: 1; transform: translateX(-50%) translateY(0); }
                }
                @keyframes vocabToastOut {
                    from { opacity: 1; transform: translateX(-50%) translateY(0); }
                    to   { opacity: 0; transform: translateX(-50%) translateY(-10px); }
                }
            `;
            document.head.appendChild(style);
        }

        // 插入到 modal overlay 内部（跟随 modal 位置）
        const overlay = document.querySelector('.bilibili-study-modal-overlay');
        if (overlay) {
            overlay.insertBefore(toast, overlay.firstChild);
        } else {
            document.body.appendChild(toast);
        }

        // 自动消失
        setTimeout(() => {
            toast.style.animation = 'vocabToastOut 0.25s ease-in forwards';
            setTimeout(() => toast.remove(), 300);
        }, 3000);

        console.log('[B站学习助手] showVocabToast: type=', type, stats);
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
            const isDark = DetailPanel.getCurrentTheme() === 'dark';
            const ciBg = isDark ? 'rgba(40,45,55,0.8)' : 'white';
            const ciBorder = isDark ? 'rgba(255,255,255,0.12)' : '#e0e0e0';
            const ciText = isDark ? '#999' : '#666';
            const ctBg = isDark ? 'rgba(30,35,45,0.5)' : '#f8f9fa';
            const ctLabel = isDark ? '#e0e0e0' : '#333';
            // 使用 data-index 属性而不是内联 onclick，避免模板字符串嵌套和引号冲突
            const courseItems = whitelist.map((course, index) => `
                            <div class="course-item" 
                                 data-index="${index}"
                                 data-bv="${course.bv.replace(/"/g, '&quot;')}"
                                 data-name="${course.name.replace(/"/g, '&quot;')}"
                                 style="padding: 8px 12px; margin: 5px 0; background: ${ciBg}; 
                                        border: 1px solid ${ciBorder}; border-radius: 4px; 
                                        cursor: pointer; transition: all 0.2s;">
                                <div style="font-weight: bold;">${course.name}</div>
                                <div style="font-size: 12px; color: ${ciText};">${course.bv}</div>
                            </div>
            `).join('');
            courseOptions = `
                <div style="margin: 15px 0; padding: 10px; background: ${ctBg}; border-radius: 6px;">
                    <p style="margin: 0 0 10px 0; font-weight: bold; color: ${ctLabel};">选择要返回的课程：</p>
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
                        el.style.background = ciBg;
                        el.style.borderColor = ciBorder;
                        el.removeAttribute('data-selected');
                    });

                    // 标记当前选中
                    item.style.background = isDark ? 'rgba(0,100,200,0.25)' : '#e3f2fd';
                    item.style.borderColor = isDark ? '#4da6ff' : '#00a1d6';
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

        const yesBtn = document.getElementById('bilibili-study-confirm-yes');
        console.log('[B站学习助手] showConfirmModal: 绑定确认按钮事件 yesBtn=', !!yesBtn);
        yesBtn.addEventListener('click', function(e) {
            console.log('[B站学习助手] 确认离开按钮被点击');
            e.stopPropagation();
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
        const submitBtn = document.getElementById('bilibili-study-word-submit');
        const skipBtn = document.getElementById('bilibili-study-word-skip');
        console.log('[B站学习助手] showWordVerifierModal: DOM元素检查 input=', !!input, 'submit=', !!submitBtn, 'skip=', !!skipBtn);
        
        if (input) input.focus();

        if (submitBtn) {
            submitBtn.addEventListener('click', function() {
                console.log('[B站学习助手] word-submit: 按钮被点击, currentWord=', currentWord ? currentWord.chinese : 'null');
                handleWordSubmit();
            });
        } else {
            console.error('[B站学习助手] showWordVerifierModal: 提交按钮未找到!');
        }

        if (skipBtn) {
            skipBtn.addEventListener('click', function() {
                console.log('[B站学习助手] word-skip: 跳过按钮被点击');
                closeCurrentModal();
            });
        }

        if (input) {
            input.addEventListener('keypress', function(e) {
                console.log('[B站学习助手] word-input keypress: key=', e.key);
                if (e.key === 'Enter') {
                    handleWordSubmit();
                }
            });
        } else {
            console.error('[B站学习助手] showWordVerifierModal: 输入框未找到!');
        }

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
        const isDark = DetailPanel.getCurrentTheme() === 'dark';

        // 渐进提示文本
        let hintSection = '';
        if (revealedCount > 0 && !isFullyRevealed) {
            hintSection = `<div class="bilibili-study-word-hint" style="text-align: center; margin: 10px 0; padding: 8px; ${isDark ? 'background: rgba(255,152,0,0.12); border-radius: 6px; border: 1px solid rgba(255,152,0,0.25);' : 'background: #fff3e0; border-radius: 6px; border: 1px solid #ffe0b2;'}">
                <small style="${isDark ? 'color: #ffab40;' : 'color: #e65100;'}">💡 提示: 已揭示 ${revealedCount}/${word.english.length} 个字母</small>
            </div>`;
        }

        // 全部揭示后的记忆提示
        let memorySection = '';
        if (isFullyRevealed) {
            memorySection = `<div class="bilibili-study-word-memory" style="text-align: center; margin: 15px 0; padding: 12px; ${isDark ? 'background: rgba(76,175,80,0.12); border-radius: 6px; border: 1px solid rgba(76,175,80,0.25);' : 'background: #e8f5e9; border-radius: 6px; border: 1px solid #a5d6a7;'}">
                <div class="bilibili-study-word-memory-word" style="font-size: 18px; font-weight: bold; ${isDark ? 'color: #81c784;' : 'color: #2e7d32;'} letter-spacing: 4px; font-family: monospace;">${word.english}</div>
                <small style="${isDark ? 'color: #66bb6a;' : 'color: #388e3c;'}">📖 记住这个单词，6秒后自动关闭...</small>
            </div>`;
        }

        // 弹窗主体内容
        const bodyContent = `
            <p style="font-size: 18px; margin-bottom: 15px; text-align: center;">
                请输入以下释义的英文单词：<br>
                <strong class="bilibili-study-word-chinese" style="font-size: 24px; color: ${isDark ? '#64b5f6' : '#00a1d6'};">${word.chinese}</strong>
            </p>
            <div style="text-align: center; margin-bottom: 15px;">
                <div class="bilibili-study-word-display" style="font-size: 22px; font-family: monospace; letter-spacing: 4px; color: ${isDark ? '#e0e0e0' : '#333'};">
                    ${displayWord}
                </div>
            </div>
            ${hintSection}
            ${memorySection}
            <input type="text" id="bilibili-study-word-input"
                   placeholder="${isFullyRevealed ? '记忆模式 - 请记住这个单词' : '请输入英文单词'}"
                   ${isFullyRevealed ? 'disabled' : ''}
                   style="width: 100%; padding: 10px; font-size: 16px; ${isDark ? 'border: 1px solid rgba(255,255,255,0.15); background: rgba(40,45,55,0.8); color: #e0e0e0;' : 'border: 1px solid #ddd; background: white; color: #333;'} border-radius: 6px; margin-bottom: 15px; margin-top: 10px; box-sizing: border-box;">
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
                display.push(`<span class="bilibili-study-word-revealed" style="color: #16a34a; font-weight: bold;">${letters[i]}</span>`);
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
        console.log('[B站学习助手] handleWordSubmit: 开始处理');
        const input = document.getElementById('bilibili-study-word-input');
        const feedback = document.getElementById('bilibili-study-word-feedback');
        console.log('[B站学习助手]   input=', !!input, 'feedback=', !!feedback, 'currentWord=', currentWord ? currentWord.chinese : 'null');
        if (!input || !feedback || !currentWord) {
            console.error('[B站学习助手] handleWordSubmit: 提前退出! input=', !!input, 'feedback=', !!feedback, 'word=', !!currentWord);
            return;
        }

        const answer = input.value.trim();
        console.log('[B站学习助手]   answer=', JSON.stringify(answer), 'length=', answer.length);
        if (!answer) {
            console.log('[B站学习助手]   空输入，跳过');
            return; // 空输入不处理
        }

        const correct = WordVerifier.checkAnswer(currentWord, answer);
        console.log('[B站学习助手]   correct=', correct, 'target=', currentWord.english, 'answer=', answer);

        const isDark = DetailPanel.getCurrentTheme() === 'dark';
        console.log('[B站学习助手]   isDark=', isDark);

        // 如果有提示字母被揭示，标记为wasHinted
        const wasHinted = revealedIndices.size > 0;
        WordVerifier.updateMastery(currentWord, correct, wasHinted);
        WordVerifier.recordAnswer(currentWord, correct);
        StatisticsTracker.recordWordAttempt(correct);

        if (correct) {
            console.log('[B站学习助手]   → 回答正确! 弹窗即将关闭');
            feedback.innerHTML = `<span style="color: ${isDark ? '#4ade80' : '#16a34a'}; font-weight: bold;">✅ 回答正确！</span>`;
            // 正确答案直接关闭
            setTimeout(() => closeCurrentModal(), 300);
        } else {
            console.log('[B站学习助手]   → 回答错误, 开始揭示字母, wordLength=', currentWord.english.length, 'revealed=', revealedIndices.size);
            feedback.innerHTML = `<span style="color: ${isDark ? '#f87171' : '#dc2626'}; font-weight: bold;">❌ 回答错误，再试一次</span>`;

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
                console.log('[B站学习助手]   → 全部字母已揭示! 进入记忆模式(6秒)');
                // 全部揭示 - 显示完整单词，6秒后自动关闭
                const modal = document.getElementById('bilibili-study-word-modal');
                console.log('[B站学习助手]   modal=', !!modal);
                if (modal) {
                    console.log('[B站学习助手]   调用renderWordModalContent(fullyRevealed=true)');
                    renderWordModalContent(modal, currentWord, revealedIndices, { fullyRevealed: true });
                    console.log('[B站学习助手]   记忆模式渲染完成');
                }
                wordRevealTime = Date.now();
                setTimeout(() => {
                    console.log('[B站学习助手]   记忆模式6秒到! 关闭弹窗, modalState=', modalState, 'WORD_VERIFY=', MODAL_STATES.WORD_VERIFY);
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

    // 调试日志节流：check() 每秒调用一次，只在状态变化时输出
    let _lastCheckLogKey = '';

    function check() {
        const state = window.__bilibiliStudyAppState;
        if (!state) return;

        const isVideoPage = PageMonitor.isVideoPage();
        const isPageActive = PageMonitor.isPageActive();
        const isStudyTime = ConfigManager.isStudyTime();
        const currentBV = PageMonitor.getCurrentBV();
        const isWhitelisted = ConfigManager.isWhitelisted(currentBV);

        // 调试日志：节流输出（状态变化时才打日志，避免刷屏）
        const logKey = `${isVideoPage}|${isPageActive}|${isStudyTime}|${isWhitelisted}|${currentBV}|${state.currentStage}|${state.distractionStartTime}`;
        if (logKey !== _lastCheckLogKey) {
            _lastCheckLogKey = logKey;
            console.log('[B站学习助手] check: 状态变化 →', {
                isVideoPage, isPageActive, isStudyTime, isWhitelisted,
                currentBV, currentStage: state.currentStage,
                distractionStartTime: state.distractionStartTime,
                url: window.location.href
            });
        }

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
    // 同时暴露到真实 window（控制台可调试），需要 unsafeWindow
    try {
        if (typeof unsafeWindow !== 'undefined') {
            unsafeWindow.__bilibiliStudyAppState = window.__bilibiliStudyAppState;
        }
    } catch(e) { /* 沙箱限制，忽略 */ }

    // Initialize config
    ConfigManager.load();
    console.log('B站学习专注提醒助手 loaded, config:', ConfigManager.get());

    // Initialize theme (preload so intervention modals can use it immediately)
    try {
        DetailPanel.loadTheme();
        console.log('[B站学习助手] init: loadTheme 完成');
    } catch(e) {
        console.error('[B站学习助手] init: loadTheme 失败!', e);
    }

    // Initialize data modules
    let userConfig, timeStats, wordRecords;
    try {
        userConfig = getOrInitModule('userConfig');
        timeStats = getOrInitModule('timeStats');
        wordRecords = getOrInitModule('wordRecords');
        console.log('[B站学习助手] init: Storage modules 初始化完成');
    } catch(e) {
        console.error('[B站学习助手] init: Storage modules 初始化失败!', e);
    }

    console.log('Storage modules initialized:', {
        userConfig: !!userConfig,
        timeStats: !!timeStats,
        wordRecords: !!wordRecords,
        storageAvailable: StorageManager.isAvailable()
    });

    // Initialize page monitor
    try {
        PageMonitor.init();
        console.log('[B站学习助手] init: PageMonitor.init 完成');
    } catch(e) {
        console.error('[B站学习助手] init: PageMonitor.init 失败!', e);
    }

    // Initialize statistics tracker
    try {
        StatisticsTracker.init();
        console.log('[B站学习助手] init: StatisticsTracker.init 完成');
    } catch(e) {
        console.error('[B站学习助手] init: StatisticsTracker.init 失败!', e);
    }

    // Create floating window if on video page
    try {
        if (PageMonitor.isVideoPage()) {
            FloatingWindow.create();
            // Set up callback to open detail panel when floating window is clicked
            FloatingWindow.setOnPanelOpen(function() {
                DetailPanel.open();
            });
            console.log('[B站学习助手] init: FloatingWindow 创建完成');
        }
    } catch(e) {
        console.error('[B站学习助手] init: FloatingWindow 创建失败!', e);
    }

    // Main timer loop - runs every second
    console.log('[B站学习助手] init: 启动主定时器(1秒)');
    let _mainTimerLogCounter = 0;
    setInterval(function() {
        const state = window.__bilibiliStudyAppState;
        if (!state) {
            // 每30秒输出一次，避免刷屏
            if (++_mainTimerLogCounter % 30 === 0) {
                console.warn('[B站学习助手] 主定时器: state 为空！');
            }
            return;
        }

        const isVideoPage = PageMonitor.isVideoPage();
        const isPageActive = PageMonitor.isPageActive();
        const isStudyTime = ConfigManager.isStudyTime();
        const currentBV = PageMonitor.getCurrentBV();
        const isWhitelisted = ConfigManager.isWhitelisted(currentBV);

        // 每60秒输出一次心跳日志，确认定时器在运行
        if (++_mainTimerLogCounter % 60 === 0) {
            console.log('[B站学习助手] 主定时器心跳:', {
                isVideoPage, isPageActive, isStudyTime, isWhitelisted,
                currentBV, currentStage: state.currentStage, url: window.location.href
            });
        }

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