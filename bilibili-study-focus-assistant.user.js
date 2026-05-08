// ==UserScript==
// @name         B站学习专注提醒助手
// @namespace    https://github.com/bilibili-study-focus
// @version      1.4.0
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

    /* v1.2.4.1: 阶段时间表样式 */
    .bilibili-study-stage-timeline {
        margin-top: 10px;
        padding: 12px 14px;
        background: rgba(128, 128, 128, 0.08);
        border-radius: 8px;
        font-size: 13px;
        line-height: 1.6;
        border: 1px solid rgba(128, 128, 128, 0.12);
    }
    .bilibili-study-stage-timeline .stage-timeline-title {
        margin: 0 0 6px 0;
        font-weight: bold;
        color: #555;
        font-size: 13px;
    }
    .bilibili-study-stage-timeline-item {
        padding: 2px 0;
        color: #666;
        font-family: "SF Mono", "Consolas", "Menlo", monospace;
        font-size: 12px;
        letter-spacing: 0.3px;
    }

    /* v1.2.4.1: 重置策略参数行 */
    .bilibili-study-reset-param-row {
        margin-top: 8px;
        display: flex;
        align-items: center;
        gap: 8px;
    }
    .bilibili-study-reset-label {
        font-size: 13px;
        white-space: nowrap;
        color: #555;
    }
    .bilibili-study-reset-input {
        width: 60px;
        padding: 4px 8px;
        border-radius: 4px;
        border: 1px solid #ddd;
        text-align: center;
        font-size: 14px;
        outline: none;
    }
    .bilibili-study-reset-input:focus {
        border-color: #3b82f6;
    }

    /* v1.2.5: 详情面板通用组件 class */
    .bilibili-study-module-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 10px;
        gap: 6px;
    }
    .bilibili-study-module-header .bilibili-study-module-title {
        margin-bottom: 0;
    }
    .bilibili-study-module-actions {
        display: flex;
        gap: 6px;
    }
    .bilibili-study-btn-sm {
        padding: 4px 10px;
        font-size: 12px;
        cursor: pointer;
        border-radius: 6px;
    }
    .bilibili-study-btn-sm.bilibili-study-btn-primary {
        background: rgba(59,130,246,0.15);
        border: 1px solid rgba(59,130,246,0.3);
        color: #60a5fa;
    }
    .bilibili-study-btn-sm.bilibili-study-btn-secondary {
        background: transparent;
        border: 1px solid #ddd;
        color: #666;
    }
    .bilibili-study-btn-sm.bilibili-study-btn-secondary:hover {
        border-color: #999;
        color: #333;
    }

    /* v1.2.5: 词库警告区 class（替代内联样式） */
    .bilibili-study-vocab-warning {
        margin: 10px 0;
        padding: 10px;
        background: #fff3e0;
        border-radius: 6px;
        border: 1px solid #ffe0b2;
    }
    .bilibili-study-vocab-warning-header {
        display: flex;
        align-items: center;
        gap: 6px;
    }
    .bilibili-study-vocab-warning-icon {
        font-size: 16px;
    }
    .bilibili-study-vocab-warning-title {
        color: #e65100;
        font-weight: bold;
    }
    .bilibili-study-vocab-warning-text {
        margin: 5px 0 0 0;
        color: #bf360c;
        font-size: 13px;
    }
    .bilibili-study-vocab-critical {
        margin: 10px 0;
        padding: 10px;
        background: #ffebee;
        border-radius: 6px;
        border: 1px solid #ffcdd2;
    }
    .bilibili-study-vocab-critical-header {
        display: flex;
        align-items: center;
        gap: 6px;
    }
    .bilibili-study-vocab-critical-icon {
        font-size: 16px;
    }
    .bilibili-study-vocab-critical-title {
        color: #c62828;
        font-weight: bold;
    }
    .bilibili-study-vocab-critical-text {
        margin: 5px 0 0 0;
        color: #b71c1c;
        font-size: 13px;
    }

    /* v1.2.5: 锁定面板 class */
    .bilibili-study-locked-panel {
        text-align: center;
        padding: 20px;
        opacity: 0.7;
    }
    .bilibili-study-locked-icon {
        font-size: 32px;
        margin-bottom: 8px;
    }
    .bilibili-study-locked-text {
        margin: 0;
        font-size: 13px;
        color: inherit;
    }

    /* v1.2.5: 历史视频项 class */
    .bilibili-study-history-item {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 8px 0;
        border-bottom: 1px solid rgba(128,128,128,0.15);
    }
    .bilibili-study-history-link {
        flex: 1;
        text-decoration: none;
        color: inherit;
        min-width: 0;
    }
    .bilibili-study-history-title {
        font-size: 13px;
        font-weight: 500;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }
    .bilibili-study-history-meta {
        font-size: 11px;
        color: #888;
        margin-top: 2px;
    }
    .bilibili-study-history-meta-extra {
        margin-left: 8px;
    }
    .bilibili-study-history-right {
        flex-shrink: 0;
        text-align: right;
    }
    .bilibili-study-history-time {
        font-size: 11px;
        color: #888;
    }
    .bilibili-study-history-reason {
        font-size: 10px;
        color: #aaa;
    }

    /* v1.2.4: 干预设置 radio 选项组 */
    .bilibili-study-settings-option-group {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
    }
    .bilibili-study-settings-radio {
        display: flex;
        align-items: center;
        gap: 4px;
        cursor: pointer;
        padding: 6px 12px;
        border-radius: 6px;
        border: 1px solid #ddd;
        background: #fafafa;
        font-size: 13px;
        transition: all 0.2s ease;
    }
    .bilibili-study-settings-radio:hover {
        border-color: #60a5fa;
        background: rgba(59,130,246,0.05);
    }
    .bilibili-study-settings-radio input[type="radio"] {
        margin: 0;
        accent-color: #3b82f6;
    }
    .bilibili-study-settings-radio:has(input:checked) {
        border-color: #3b82f6;
        background: rgba(59,130,246,0.1);
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

    .bilibili-study-dark-mode .bilibili-study-settings-radio {
        background: #2d2d2d !important;
        border-color: #555 !important;
        color: #ddd !important;
    }
    .bilibili-study-dark-mode .bilibili-study-settings-radio:hover {
        border-color: #60a5fa !important;
        background: rgba(59,130,246,0.12) !important;
    }
    .bilibili-study-dark-mode .bilibili-study-settings-radio:has(input:checked) {
        border-color: #3b82f6 !important;
        background: rgba(59,130,246,0.18) !important;
        color: #fff !important;
    }

    .bilibili-study-dark-mode .bilibili-study-settings-row textarea {
        background: #2a2a2a !important;
        color: #e0e0e0 !important;
        border-color: #444 !important;
    }

    .bilibili-study-dark-mode .bilibili-study-settings-hint {
        color: #999 !important;
    }

    .bilibili-study-dark-mode .bilibili-study-settings-error {
        color: #ef5350 !important;
    }

    .bilibili-study-dark-mode .bilibili-study-settings-empty-hint {
        color: #aaa !important;
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

    /* v1.2.4.1: 阶段时间表暗色模式 */
    .bilibili-study-dark-mode .bilibili-study-stage-timeline {
        background: rgba(255, 255, 255, 0.04) !important;
        border-color: rgba(255, 255, 255, 0.08) !important;
    }
    .bilibili-study-dark-mode .bilibili-study-stage-timeline .stage-timeline-title {
        color: #ccc !important;
    }
    .bilibili-study-dark-mode .bilibili-study-stage-timeline-item {
        color: #999 !important;
    }

    /* v1.2.4.1: 重置策略参数行暗色模式 */
    .bilibili-study-dark-mode .bilibili-study-reset-label {
        color: #bbb !important;
    }
    .bilibili-study-dark-mode .bilibili-study-reset-input {
        background: #2d2d2d !important;
        color: #e0e0e0 !important;
        border-color: #555 !important;
    }
    .bilibili-study-dark-mode .bilibili-study-reset-input:focus {
        border-color: #60a5fa !important;
    }
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

    /* v1.2.5: 详情面板通用组件暗色模式 */
    .bilibili-study-dark-mode .bilibili-study-btn-sm.bilibili-study-btn-secondary {
        border-color: #555 !important;
        color: #bbb !important;
    }
    .bilibili-study-dark-mode .bilibili-study-btn-sm.bilibili-study-btn-secondary:hover {
        border-color: #888 !important;
        color: #eee !important;
    }

    /* v1.2.5: 词库警告区暗色模式 */
    .bilibili-study-dark-mode .bilibili-study-vocab-warning {
        background: rgba(255, 152, 0, 0.12) !important;
        border-color: rgba(255, 152, 0, 0.25) !important;
    }
    .bilibili-study-dark-mode .bilibili-study-vocab-warning-title {
        color: #ffab40 !important;
    }
    .bilibili-study-dark-mode .bilibili-study-vocab-warning-text {
        color: #ff8a65 !important;
    }
    .bilibili-study-dark-mode .bilibili-study-vocab-critical {
        background: rgba(239, 83, 80, 0.12) !important;
        border-color: rgba(239, 83, 80, 0.25) !important;
    }
    .bilibili-study-dark-mode .bilibili-study-vocab-critical-title {
        color: #ef5350 !important;
    }
    .bilibili-study-dark-mode .bilibili-study-vocab-critical-text {
        color: #e57373 !important;
    }

    /* v1.2.5: 历史视频暗色模式 */
    .bilibili-study-dark-mode .bilibili-study-history-item {
        border-bottom-color: rgba(255,255,255,0.08) !important;
    }
    .bilibili-study-dark-mode .bilibili-study-history-meta {
        color: #999 !important;
    }
    .bilibili-study-dark-mode .bilibili-study-history-time {
        color: #999 !important;
    }
    .bilibili-study-dark-mode .bilibili-study-history-reason {
        color: #777 !important;
    }

    /* ==========================================
       Multi-Tab Guide (v1.2.6)
       ========================================== */

    /* 学习窗口叠加层 - 高斯模糊背景 + 标注文字 */
    .bilibili-study-multi-tab-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        z-index: 1000007;
        display: flex;
        align-items: center;
        justify-content: center;
        backdrop-filter: blur(8px) saturate(0.6);
        -webkit-backdrop-filter: blur(8px) saturate(0.6);
        background: rgba(0, 0, 0, 0.4);
        animation: bilibili-study-fade-in 0.3s ease-out;
    }

    .bilibili-study-multi-tab-study-message {
        text-align: center;
        padding: 40px 50px;
        background: rgba(255, 255, 255, 0.95);
        border-radius: 16px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
        max-width: 400px;
    }

    .bilibili-study-multi-tab-study-icon {
        font-size: 48px;
        margin-bottom: 16px;
    }

    .bilibili-study-multi-tab-study-title {
        font-size: 20px;
        font-weight: 600;
        color: #333;
        margin-bottom: 10px;
    }

    .bilibili-study-multi-tab-study-desc {
        font-size: 15px;
        color: #666;
        margin-bottom: 12px;
        line-height: 1.5;
    }

    .bilibili-study-multi-tab-study-hint {
        font-size: 13px;
        color: #999;
        line-height: 1.5;
        padding-top: 10px;
        border-top: 1px solid #eee;
    }

    /* 引导弹窗 - 分心窗口 */
    .bilibili-study-multi-tab-guide {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        z-index: 1000007;
        display: flex;
        align-items: center;
        justify-content: center;
        animation: bilibili-study-fade-in 0.3s ease-out;
    }

    .bilibili-study-multi-tab-guide-backdrop {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        backdrop-filter: blur(6px) saturate(0.7);
        -webkit-backdrop-filter: blur(6px) saturate(0.7);
        background: rgba(0, 0, 0, 0.45);
    }

    .bilibili-study-multi-tab-guide-content {
        position: relative;
        background: #fff;
        border-radius: 16px;
        width: 90%;
        max-width: 480px;
        max-height: 85vh;
        overflow-y: auto;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.25);
        animation: bilibili-study-slide-up 0.3s ease-out;
    }

    .bilibili-study-multi-tab-guide-header {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 20px 24px 14px;
        border-bottom: 1px solid #f0f0f0;
    }

    .bilibili-study-multi-tab-guide-icon {
        font-size: 24px;
    }

    .bilibili-study-multi-tab-guide-title {
        font-size: 18px;
        font-weight: 600;
        color: #333;
    }

    .bilibili-study-multi-tab-guide-body {
        padding: 18px 24px;
    }

    .bilibili-study-multi-tab-guide-desc {
        font-size: 14px;
        color: #666;
        margin-bottom: 16px;
        line-height: 1.6;
    }

    /* 窗口列表 */
    .bilibili-study-multi-tab-guide-list {
        display: flex;
        flex-direction: column;
        gap: 8px;
        margin-bottom: 16px;
    }

    .bilibili-study-multi-tab-item {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 10px 14px;
        border-radius: 10px;
        background: #f8f9fa;
        border: 1px solid #eee;
    }

    .bilibili-study-multi-tab-item-study {
        background: #f0fdf4;
        border-color: #bbf7d0;
    }

    .bilibili-study-multi-tab-item-current {
        background: #fef2f2;
        border-color: #fecaca;
    }

    .bilibili-study-multi-tab-item-icon {
        font-size: 18px;
        flex-shrink: 0;
    }

    .bilibili-study-multi-tab-item-title {
        flex: 1;
        font-size: 13px;
        color: #444;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .bilibili-study-multi-tab-item-badge {
        font-size: 11px;
        padding: 2px 8px;
        border-radius: 10px;
        font-weight: 500;
        flex-shrink: 0;
    }

    .bilibili-study-multi-tab-badge-study {
        background: #dcfce7;
        color: #16a34a;
    }

    .bilibili-study-multi-tab-badge-distraction {
        background: #fee2e2;
        color: #dc2626;
    }

    /* 提示和白名单选项 */
    .bilibili-study-multi-tab-guide-notice {
        font-size: 13px;
        color: #888;
        margin-bottom: 14px;
        padding: 10px 12px;
        background: #f8f9fa;
        border-radius: 8px;
        line-height: 1.5;
    }

    .bilibili-study-multi-tab-guide-whitelist {
        margin-bottom: 6px;
    }

    .bilibili-study-multi-tab-whitelist-label {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 13px;
        color: #555;
        cursor: pointer;
        padding: 8px 10px;
        border-radius: 8px;
        background: #eff6ff;
        border: 1px solid #bfdbfe;
        transition: background 0.2s;
    }

    .bilibili-study-multi-tab-whitelist-label:hover {
        background: #dbeafe;
    }

    .bilibili-study-multi-tab-whitelist-label input[type="checkbox"] {
        width: 16px;
        height: 16px;
        accent-color: #3b82f6;
        cursor: pointer;
    }

    /* 底部按钮 */
    .bilibili-study-multi-tab-guide-footer {
        padding: 14px 24px 20px;
        display: flex;
        flex-direction: column;
        gap: 10px;
        border-top: 1px solid #f0f0f0;
    }

    .bilibili-study-multi-tab-btn {
        width: 100%;
        padding: 12px 20px;
        border-radius: 10px;
        font-size: 15px;
        font-weight: 500;
        cursor: pointer;
        border: none;
        transition: all 0.2s;
    }

    .bilibili-study-multi-tab-btn-primary {
        background: #dc2626;
        color: #fff;
    }

    .bilibili-study-multi-tab-btn-primary:hover {
        background: #b91c1c;
        transform: translateY(-1px);
    }

    .bilibili-study-multi-tab-btn-secondary {
        background: #f3f4f6;
        color: #555;
        border: 1px solid #d1d5db;
    }

    .bilibili-study-multi-tab-btn-secondary:hover {
        background: #e5e7eb;
        transform: translateY(-1px);
    }

    .bilibili-study-multi-tab-guide-countdown {
        text-align: center;
        font-size: 12px;
        color: #999;
        padding-top: 4px;
    }

    /* 浮窗副窗口/暂停样式 */
    .bilibili-study-floating-secondary {
        opacity: 0.6 !important;
    }

    .bilibili-study-floating-negotiating {
        opacity: 0.75 !important;
        animation: bilibili-study-pulse-pause 2s ease-in-out infinite;
    }

    @keyframes bilibili-study-pulse-pause {
        0%, 100% { opacity: 0.75; }
        50% { opacity: 0.5; }
    }

    /* ── 暗色模式适配 ── */

    .bilibili-study-dark-mode .bilibili-study-multi-tab-study-message {
        background: rgba(45, 45, 45, 0.95);
    }

    .bilibili-study-dark-mode .bilibili-study-multi-tab-study-title {
        color: #eee;
    }

    .bilibili-study-dark-mode .bilibili-study-multi-tab-study-desc {
        color: #bbb;
    }

    .bilibili-study-dark-mode .bilibili-study-multi-tab-study-hint {
        color: #888;
        border-top-color: #444;
    }

    .bilibili-study-dark-mode .bilibili-study-multi-tab-guide-content {
        background: #2d2d2d;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
    }

    .bilibili-study-dark-mode .bilibili-study-multi-tab-guide-header {
        border-bottom-color: #444;
    }

    .bilibili-study-dark-mode .bilibili-study-multi-tab-guide-title {
        color: #eee;
    }

    .bilibili-study-dark-mode .bilibili-study-multi-tab-guide-desc {
        color: #bbb;
    }

    .bilibili-study-dark-mode .bilibili-study-multi-tab-item {
        background: #3a3a3a;
        border-color: #4a4a4a;
    }

    .bilibili-study-dark-mode .bilibili-study-multi-tab-item-study {
        background: rgba(34, 139, 34, 0.12);
        border-color: rgba(34, 139, 34, 0.25);
    }

    .bilibili-study-dark-mode .bilibili-study-multi-tab-item-current {
        background: rgba(220, 20, 60, 0.12);
        border-color: rgba(220, 20, 60, 0.25);
    }

    .bilibili-study-dark-mode .bilibili-study-multi-tab-item-title {
        color: #ccc;
    }

    .bilibili-study-dark-mode .bilibili-study-multi-tab-guide-notice {
        background: #3a3a3a;
        color: #999;
    }

    .bilibili-study-dark-mode .bilibili-study-multi-tab-whitelist-label {
        background: rgba(59, 130, 246, 0.1);
        border-color: rgba(59, 130, 246, 0.25);
        color: #bbb;
    }

    .bilibili-study-dark-mode .bilibili-study-multi-tab-whitelist-label:hover {
        background: rgba(59, 130, 246, 0.18);
    }

    .bilibili-study-dark-mode .bilibili-study-multi-tab-guide-footer {
        border-top-color: #444;
    }

    .bilibili-study-dark-mode .bilibili-study-multi-tab-btn-secondary {
        background: #3a3a3a;
        color: #bbb;
        border-color: #555;
    }

    .bilibili-study-dark-mode .bilibili-study-multi-tab-btn-secondary:hover {
        background: #454545;
    }

    .bilibili-study-dark-mode .bilibili-study-multi-tab-guide-countdown {
        color: #777;
    }

    /* v1.2.6.1: 补全暗色适配 */

    /* overlay 背景（学习窗口叠加层）*/
    .bilibili-study-dark-mode .bilibili-study-multi-tab-overlay {
        background: rgba(0, 0, 0, 0.65);
    }

    /* 引导弹窗 backdrop 暗色加深 */
    .bilibili-study-dark-mode .bilibili-study-multi-tab-guide-backdrop {
        background: rgba(0, 0, 0, 0.65);
    }

    /* badge 学习标签暗色 */
    .bilibili-study-dark-mode .bilibili-study-multi-tab-badge-study {
        background: rgba(34, 139, 34, 0.15);
        color: #4ade80;
    }

    /* badge 非学习标签暗色 */
    .bilibili-study-dark-mode .bilibili-study-multi-tab-badge-distraction {
        background: rgba(220, 20, 60, 0.15);
        color: #f87171;
    }

    /* btn-primary 暗色（红色太刺眼，改为偏暗红）*/
    .bilibili-study-dark-mode .bilibili-study-multi-tab-btn-primary {
        background: #b91c1c;
        color: #fca5a5;
    }

    .bilibili-study-dark-mode .bilibili-study-multi-tab-btn-primary:hover {
        background: #991b1b;
    }

    /* checkbox 暗色适配 */
    .bilibili-study-dark-mode .bilibili-study-multi-tab-whitelist-label input[type="checkbox"] {
        accent-color: #60a5fa;
    }

    /* guide-icon 暗色下微调 */
    .bilibili-study-dark-mode .bilibili-study-multi-tab-guide-icon {
        filter: brightness(1.1);
    }

    /* Auto-navigate Toast */
    .bilibili-study-auto-nav-toast {
        position: fixed;
        bottom: 30px;
        left: 50%;
        transform: translateX(-50%);
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    }

    .bilibili-study-auto-nav-inner {
        display: flex;
        align-items: center;
        gap: 12px;
        background: rgba(255, 255, 255, 0.97);
        border: 1px solid rgba(255,255,255,0.12);
        border-radius: 10px;
        padding: 12px 18px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.3);
        backdrop-filter: blur(12px);
        color: #333;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        min-width: 300px;
        animation: vocabToastIn 0.25s ease-out;
    }

    .bilibili-study-auto-nav-icon {
        font-size: 16px;
    }

    .bilibili-study-auto-nav-text {
        flex: 1;
        font-size: 14px;
    }

    .bilibili-study-auto-nav-countdown {
        color: #3b82f6;
    }

    .bilibili-study-auto-nav-cancel {
        background: none;
        border: 1px solid #dc2626;
        color: #dc2626;
        border-radius: 6px;
        padding: 4px 12px;
        cursor: pointer;
        font-size: 13px;
        font-weight: 500;
    }

    /* Guide Toast */
    .bilibili-study-guide-toast {
        position: fixed;
        bottom: 80px;
        left: 50%;
        transform: translateX(-50%);
        padding: 10px 20px;
        border-radius: 10px;
        font-size: 14px;
        z-index: 1000010;
        background: rgba(34,139,34,0.9);
        color: #fff;
        box-shadow: 0 2px 12px rgba(0,0,0,0.3);
        transition: opacity 0.2s ease-in-out;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    }

    /* Dark mode - Auto-navigate Toast */
    .bilibili-study-dark-mode .bilibili-study-auto-nav-inner {
        background: rgba(30, 35, 45, 0.97) !important;
        color: #e0e0e0 !important;
    }

    .bilibili-study-dark-mode .bilibili-study-auto-nav-countdown {
        color: #60a5fa !important;
    }

    .bilibili-study-dark-mode .bilibili-study-auto-nav-cancel {
        border-color: #f87171 !important;
        color: #f87171 !important;
    }

    /* Dark mode - Guide Toast */
    .bilibili-study-dark-mode .bilibili-study-guide-toast {
        background: rgba(17,17,17,0.95) !important;
        color: #e0e0e0 !important;
    }

    /* ── Telemetry Dashboard (v1.4.0) ── */
    .bilibili-study-telemetry-drawer {
        position: absolute;
        right: 0;
        top: 0;
        width: 420px;
        height: 100%;
        background: #fff;
        border-left: 1px solid #e5e7eb;
        box-shadow: -4px 0 12px rgba(0,0,0,0.1);
        z-index: 100;
        font-size: 13px;
        overflow-y: auto;
        display: flex;
        flex-direction: column;
    }
    .bilibili-study-telemetry-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px 16px;
        border-bottom: 1px solid #e5e7eb;
    }
    .bilibili-study-telemetry-title {
        font-size: 15px;
        font-weight: 500;
        color: #111;
    }
    .bilibili-study-telemetry-close {
        cursor: pointer;
        font-size: 18px;
        color: #666;
        padding: 4px;
    }
    .bilibili-study-telemetry-close:hover {
        color: #111;
    }
    .bilibili-study-telemetry-tabs {
        display: flex;
        border-bottom: 1px solid #e5e7eb;
    }
    .bilibili-study-telemetry-tab {
        flex: 1;
        padding: 10px;
        text-align: center;
        cursor: pointer;
        font-size: 13px;
        color: #666;
        border-bottom: 2px solid transparent;
    }
    .bilibili-study-telemetry-tab.active {
        color: #3b82f6;
        border-bottom-color: #3b82f6;
    }
    .bilibili-study-telemetry-content {
        flex: 1;
        padding: 12px;
        overflow-y: auto;
    }
    .bilibili-study-telemetry-loading {
        text-align: center;
        padding: 40px;
        color: #999;
    }
    .bilibili-study-telemetry-filter {
        margin-bottom: 8px;
    }
    .bilibili-study-telemetry-filter-label {
        font-size: 12px;
        color: #888;
        margin-right: 4px;
    }
    .bilibili-study-telemetry-filter-btn {
        display: inline-block;
        padding: 2px 8px;
        margin: 2px;
        font-size: 12px;
        border-radius: 4px;
        cursor: pointer;
        background: #f3f4f6;
        color: #555;
        border: 1px solid transparent;
    }
    .bilibili-study-telemetry-filter-btn.active {
        background: #3b82f6;
        color: #fff;
    }
    .bilibili-study-telemetry-summary {
        font-size: 12px;
        color: #888;
        margin-bottom: 8px;
        padding: 4px 0;
    }
    .bilibili-study-telemetry-list {
        border: 1px solid #f0f0f0;
        border-radius: 6px;
    }
    .bilibili-study-telemetry-row {
        padding: 6px 10px;
        border-bottom: 1px solid #f5f5f5;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 6px;
        flex-wrap: wrap;
    }
    .bilibili-study-telemetry-row:last-child {
        border-bottom: none;
    }
    .bilibili-study-telemetry-row:hover {
        background: #f9fafb;
    }
    .bilibili-study-telemetry-row-error {
        background: #fef2f2;
    }
    .bilibili-study-telemetry-row-error:hover {
        background: #fee2e2;
    }
    .bilibili-study-telemetry-row-time {
        font-size: 11px;
        color: #999;
        font-family: monospace;
        min-width: 58px;
    }
    .bilibili-study-telemetry-row-cat {
        font-size: 11px;
        font-weight: 500;
        min-width: 50px;
    }
    .bilibili-study-telemetry-row-event {
        font-size: 12px;
        color: #333;
        flex: 1;
    }
    .bilibili-study-telemetry-row-expand {
        font-size: 10px;
        color: #aaa;
        margin-left: auto;
    }
    .bilibili-study-telemetry-row-detail {
        width: 100%;
        margin-top: 4px;
    }
    .bilibili-study-telemetry-row-detail pre {
        font-size: 11px;
        background: #f5f5f5;
        padding: 8px;
        border-radius: 4px;
        overflow-x: auto;
        max-height: 200px;
        color: #333;
    }
    .bilibili-study-telemetry-more {
        text-align: center;
        padding: 8px;
        color: #3b82f6;
        cursor: pointer;
        font-size: 12px;
    }
    .bilibili-study-telemetry-more:hover {
        background: #f9fafb;
    }
    .bilibili-study-telemetry-section-title {
        font-size: 13px;
        font-weight: 500;
        color: #444;
        padding: 8px 0 4px;
        border-bottom: 1px solid #f0f0f0;
        margin-bottom: 8px;
    }
    .bilibili-study-telemetry-metrics-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 8px;
        margin-bottom: 12px;
    }
    .bilibili-study-telemetry-metric {
        border: 1px solid #f0f0f0;
        border-radius: 6px;
        padding: 10px;
        text-align: center;
    }
    .bilibili-study-telemetry-metric-label {
        display: block;
        font-size: 11px;
        color: #888;
        margin-bottom: 4px;
    }
    .bilibili-study-telemetry-metric-val {
        display: block;
        font-size: 22px;
        font-weight: 500;
        color: #3b82f6;
    }
    .bilibili-study-telemetry-window {
        display: flex;
        justify-content: space-between;
        padding: 6px 10px;
        border: 1px solid #f0f0f0;
        border-radius: 6px;
        margin-bottom: 4px;
        font-size: 12px;
        color: #555;
    }
    .bilibili-study-telemetry-window-online {
        border-left: 3px solid #22c55e;
    }
    .bilibili-study-telemetry-window-offline {
        border-left: 3px solid #ef4444;
    }
    .bilibili-study-telemetry-empty {
        text-align: center;
        padding: 20px;
        color: #aaa;
        font-size: 12px;
    }
    .bilibili-study-telemetry-actions {
        display: flex;
        gap: 8px;
        margin-top: 12px;
    }
    .bilibili-study-telemetry-btn {
        flex: 1;
        padding: 8px;
        border: 1px solid #d1d5db;
        border-radius: 6px;
        background: #fff;
        cursor: pointer;
        font-size: 12px;
        color: #444;
    }
    .bilibili-study-telemetry-btn:hover {
        background: #f3f4f6;
    }
    .bilibili-study-telemetry-timeline {
        padding: 4px 0;
    }
    .bilibili-study-telemetry-trace-item {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 6px 0;
        font-size: 12px;
    }
    .bilibili-study-telemetry-trace-time {
        font-family: monospace;
        font-size: 11px;
        color: #999;
        min-width: 58px;
    }
    .bilibili-study-telemetry-trace-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        flex-shrink: 0;
    }
    .bilibili-study-telemetry-trace-text {
        color: #444;
    }
    /* Dark mode dla Telemetry Dashboard */
    .bilibili-study-dark-mode .bilibili-study-telemetry-drawer {
        background: #1e1e1e;
        border-left-color: #333;
    }
    .bilibili-study-dark-mode .bilibili-study-telemetry-title {
        color: #e0e0e0;
    }
    .bilibili-study-dark-mode .bilibili-study-telemetry-close {
        color: #999;
    }
    .bilibili-study-dark-mode .bilibili-study-telemetry-close:hover {
        color: #fff;
    }
    .bilibili-study-dark-mode .bilibili-study-telemetry-header {
        border-bottom-color: #333;
    }
    .bilibili-study-dark-mode .bilibili-study-telemetry-tabs {
        border-bottom-color: #333;
    }
    .bilibili-study-dark-mode .bilibili-study-telemetry-tab {
        color: #999;
    }
    .bilibili-study-dark-mode .bilibili-study-telemetry-row {
        border-bottom-color: #2a2a2a;
    }
    .bilibili-study-dark-mode .bilibili-study-telemetry-row:hover {
        background: #252525;
    }
    .bilibili-study-dark-mode .bilibili-study-telemetry-row-event {
        color: #ccc;
    }
    .bilibili-study-dark-mode .bilibili-study-telemetry-row-error {
        background: #2a1515;
    }
    .bilibili-study-dark-mode .bilibili-study-telemetry-row-error:hover {
        background: #3a1a1a;
    }
    .bilibili-study-dark-mode .bilibili-study-telemetry-section-title {
        color: #ccc;
        border-bottom-color: #333;
    }
    .bilibili-study-dark-mode .bilibili-study-telemetry-metric {
        border-color: #333;
    }
    .bilibili-study-dark-mode .bilibili-study-telemetry-metric-label {
        color: #999;
    }
    .bilibili-study-dark-mode .bilibili-study-telemetry-window {
        border-color: #333;
        color: #aaa;
    }
    .bilibili-study-dark-mode .bilibili-study-telemetry-empty {
        color: #666;
    }
    .bilibili-study-dark-mode .bilibili-study-telemetry-btn {
        background: #2a2a2a;
        border-color: #444;
        color: #ccc;
    }
    .bilibili-study-dark-mode .bilibili-study-telemetry-btn:hover {
        background: #333;
    }
    .bilibili-study-dark-mode .bilibili-study-telemetry-filter-btn {
        background: #333;
        color: #aaa;
    }
    .bilibili-study-dark-mode .bilibili-study-telemetry-filter-btn.active {
        background: #3b82f6;
        color: #fff;
    }
    .bilibili-study-dark-mode .bilibili-study-telemetry-summary {
        color: #888;
    }
    .bilibili-study-dark-mode .bilibili-study-telemetry-trace-text {
        color: #bbb;
    }
    .bilibili-study-dark-mode .bilibili-study-telemetry-row-detail pre {
        background: #252525;
        color: #ccc;
    }
    .bilibili-study-dark-mode .bilibili-study-telemetry-more {
        color: #60a5fa;
    }
    .bilibili-study-dark-mode .bilibili-study-telemetry-more:hover {
        background: #252525;
    }
    .bilibili-study-dark-mode .bilibili-study-telemetry-loading {
        color: #666;
    }
    .bilibili-study-dark-mode .bilibili-study-telemetry-list {
        border-color: #2a2a2a;
    }

    /* Telemetry Floating Window */
    .bilibili-study-telemetry-float-window {
        position: fixed;
        z-index: 1000010;
        width: 480px;
        border-radius: 12px;
        background: #fff;
        border: 1px solid #e5e7eb;
        box-shadow: 0 4px 16px rgba(0,0,0,0.12);
        right: 20px;
        top: 80px;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        font-size: 13px;
        color: #333;
    }
    .bilibili-study-telemetry-float-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0 16px;
        height: 44px;
        background: #f8f9fa;
        border-radius: 12px 12px 0 0;
        cursor: move;
        border-bottom: 1px solid #e5e7eb;
    }
    .bilibili-study-telemetry-float-title {
        font-size: 14px;
        font-weight: 500;
        text-align: center;
        flex: 1;
    }
    .bilibili-study-telemetry-float-close {
        cursor: pointer;
        font-size: 18px;
        color: #999;
        line-height: 1;
        padding: 4px;
    }
    .bilibili-study-telemetry-float-close:hover {
        color: #666;
    }
    .bilibili-study-telemetry-float-tabs {
        display: flex;
        border-bottom: 1px solid #e5e7eb;
    }
    .bilibili-study-telemetry-float-tab {
        flex: 1;
        padding: 10px;
        text-align: center;
        color: #666;
        cursor: pointer;
        font-size: 13px;
    }
    .bilibili-study-telemetry-float-tab:hover {
        background: #f3f4f6;
    }
    .bilibili-study-telemetry-float-tab.active {
        color: #3b82f6;
        border-bottom: 2px solid #3b82f6;
        font-weight: 500;
    }
    .bilibili-study-telemetry-float-body {
        padding: 12px;
        max-height: 500px;
        overflow-y: auto;
    }

    /* Dark mode dla Telemetry Floating Window */
    .bilibili-study-dark-mode .bilibili-study-telemetry-float-window {
        background: #1e1e1e;
        border-color: #333;
        color: #e0e0e0;
    }
    .bilibili-study-dark-mode .bilibili-study-telemetry-float-header {
        background: #2a2a2a;
        border-bottom-color: #333;
    }
    .bilibili-study-dark-mode .bilibili-study-telemetry-float-title {
        color: #e0e0e0;
    }
    .bilibili-study-dark-mode .bilibili-study-telemetry-float-close {
        color: #888;
    }
    .bilibili-study-dark-mode .bilibili-study-telemetry-float-close:hover {
        color: #aaa;
    }
    .bilibili-study-dark-mode .bilibili-study-telemetry-float-tabs {
        border-bottom-color: #333;
    }
    .bilibili-study-dark-mode .bilibili-study-telemetry-float-tab {
        color: #999;
    }
    .bilibili-study-dark-mode .bilibili-study-telemetry-float-tab:hover {
        background: #333;
    }
    .bilibili-study-dark-mode .bilibili-study-telemetry-float-tab.active {
        color: #60a5fa;
        border-bottom-color: #60a5fa;
    }
    .bilibili-study-dark-mode .bilibili-study-telemetry-float-body {
        color: #e0e0e0;
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
    statsPeriod: "day",  // "day" or "week"

    // 干预重置策略（v1.2.3 新增）
    // 'period'   - 跟随学习时段配置，每个时段结束时重置（默认）
    // 'duration' - 累计学习满X分钟后重置
    // 'interval' - 距上次活动超过X分钟后重置
    resetStrategy: 'period',
    resetDuration: 30,   // 固定学习时长（分钟），策略=duration时生效
    resetInterval: 30,   // 固定间隔（分钟），策略=interval时生效

    // 干预等级（v1.2.4 新增）
    // 'gentle'  - 温和：stage1=3min, stage2=10min, stage3=20min, stage4=40min
    // 'standard'- 标准：stage1=1min, stage2=3min,  stage3=10min, stage4=20min（默认）
    // 'strict'  - 严格：stage1=30s, stage2=1min,  stage3=3min,  stage4=10min
    interventionLevel: 'standard',

    // 视觉效果强度（v1.2.4 新增）
    // 'none'    - 无视觉效果
    // 'light'   - 轻度：grayscale最高40%, opacity最低0.85
    // 'medium'  - 中度：grayscale最高60%, opacity最低0.75
    // 'heavy'   - 重度：grayscale最高80%, opacity最低0.6（默认，等同当前效果）
    visualEffectLevel: 'heavy',

    // P0: 自动导航到学习视频（v1.3.0 新增）
    // 关闭分心弹窗后显示3秒倒计时Toast，结束后自动跳转到白名单视频
    autoNavigate: true
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
                    },
                    // 干预重置策略（v1.2.3 新增）：确保新字段有默认值
                    resetStrategy: parsed.resetStrategy || USER_CONFIG.resetStrategy,
                    resetDuration: parsed.resetDuration || USER_CONFIG.resetDuration,
                    resetInterval: parsed.resetInterval || USER_CONFIG.resetInterval,
                    // 干预等级 & 视觉效果强度（v1.2.4 新增）
                    interventionLevel: parsed.interventionLevel || USER_CONFIG.interventionLevel,
                    visualEffectLevel: parsed.visualEffectLevel || USER_CONFIG.visualEffectLevel,
                    // P0: 自动导航（v1.3.0 新增）
                    autoNavigate: parsed.autoNavigate !== undefined ? parsed.autoNavigate : USER_CONFIG.autoNavigate,
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

    // Check if current time is in a rest period (between study periods, v1.2.3 新增)
    // 休息时段 = 在两个学习时段之间的间隙，且不是学习时段
    function isRestPeriod() {
        const config = get();
        if (!config.studyPeriods || config.studyPeriods.length < 2) {
            return false;  // 少于2个时段不存在"间隙"
        }
        // 当前是学习时段 → 不是休息时段
        if (isStudyTime()) {
            return false;
        }
        // 当前不是学习时段，但今天还有未来的学习时段 → 是休息时段
        const now = new Date();
        const currentMinutes = now.getHours() * 60 + now.getMinutes();
        for (const period of config.studyPeriods) {
            const startMinutes = parseTimeToMinutes(period[0]);
            // 如果有还没开始的学习时段，说明当前在休息时段
            if (currentMinutes < startMinutes) {
                return true;
            }
        }
        // 今天所有学习时段都已结束
        return false;
    }

    // Get the end time of current study period (v1.2.3 新增)
    // 返回当前学习时段的结束时间（分钟），不在学习时段时返回 null
    function getCurrentPeriodEnd() {
        const config = get();
        if (!config.studyPeriods || config.studyPeriods.length === 0) {
            return null;
        }
        const now = new Date();
        const currentMinutes = now.getHours() * 60 + now.getMinutes();
        for (const period of config.studyPeriods) {
            const startMinutes = parseTimeToMinutes(period[0]);
            const endMinutes = parseTimeToMinutes(period[1]);
            if (startMinutes <= endMinutes) {
                if (currentMinutes >= startMinutes && currentMinutes < endMinutes) {
                    return endMinutes;
                }
            } else {
                // Overnight period
                if (currentMinutes >= startMinutes || currentMinutes < endMinutes) {
                    return endMinutes;
                }
            }
        }
        return null;
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
        const stages = getEffectiveInterventionStages();
        if (!stages || stage < 0 || stage >= stages.length) {
            return null;
        }
        return stages[stage];
    }

    // v1.2.4: 根据 interventionLevel 获取实际生效的干预阶段配置
    // 如果用户自定义过 interventionStages 则优先用自定义的
    // v1.3.0: 增加 level 字段
    function getEffectiveInterventionStages() {
        const config = get();
        // 如果 localStorage 中存了自定义的 interventionStages，优先使用
        if (config.interventionStages && config._customStages) {
            // 确保旧格式向后兼容：为自定义阶段也添加 level 字段
            return config.interventionStages.map((s, i) => {
                if (s.level) return s;
                if (i <= 1) return { ...s, level: 'gentle' };
                if (i <= 2) return { ...s, level: 'moderate' };
                return { ...s, level: 'aggressive' };
            });
        }

        const level = config.interventionLevel || 'standard';
        const profile = getInterventionProfile(level);
        return profile ? profile.stages : getInterventionProfile('standard').stages;
    }

    // v1.3.0: 获取干预级别完整配置档案（包含阶段配置+视觉效果参数）
    function getInterventionProfile(level) {
        const PROFILES = {
            gentle: {
                // 温和：分心3min开始，12s弹窗间隔，灰度80%，无反色
                stages: [
                    { threshold: 0, interval: 0, level: 'gentle' },
                    { threshold: 180, interval: 0, level: 'gentle' },
                    { threshold: 600, interval: 12, level: 'gentle' },
                    { threshold: 1200, interval: 12, level: 'gentle' },
                    { threshold: 2400, interval: 12, level: 'gentle' }
                ],
                visual: { maxInvert: 0, maxGrayscale: 80, minOpacity: 0.7 }
            },
            standard: {
                // 标准（默认）：分心1min开始，8s弹窗间隔，灰度60%+反色20%
                stages: [
                    { threshold: 0, interval: 0, level: 'gentle' },
                    { threshold: 60, interval: 0, level: 'gentle' },
                    { threshold: 180, interval: 8, level: 'standard' },
                    { threshold: 600, interval: 8, level: 'standard' },
                    { threshold: 1200, interval: 8, level: 'standard' }
                ],
                visual: { maxInvert: 20, maxGrayscale: 60, minOpacity: 0.75 }
            },
            strict: {
                // 严格：分心30s开始，5s弹窗间隔，灰度40%+反色40%+文字遮挡层
                stages: [
                    { threshold: 0, interval: 0, level: 'gentle' },
                    { threshold: 30, interval: 0, level: 'gentle' },
                    { threshold: 60, interval: 5, level: 'strict' },
                    { threshold: 180, interval: 5, level: 'strict' },
                    { threshold: 600, interval: 5, level: 'strict' }
                ],
                visual: { maxInvert: 40, maxGrayscale: 40, minOpacity: 0.6 }
            }
        };
        return PROFILES[level] || PROFILES.standard;
    }

    // v1.3.0: 根据 interventionLevel 获取阶段对应的干预级别标记
    function getInterventionLevel(stage) {
        const config = get();
        const level = config.interventionLevel || 'standard';
        const profile = getInterventionProfile(level);
        if (!profile || !profile.stages || stage < 0 || stage >= profile.stages.length) {
            return stage <= 1 ? 'gentle' : 'aggressive';
        }
        return profile.stages[stage].level || 'gentle';
    }

    // v1.2.4: 根据 visualEffectLevel 获取视觉效果参数
    // 返回 { maxInvert, maxGrayscale, minOpacity }
    function getVisualEffectParams() {
        const config = get();
        // v1.3.0: 优先从干预配置读取视觉效果参数
        const level = config.interventionLevel || 'standard';
        const profile = getInterventionProfile(level);
        // 保留 visualEffectLevel 覆盖能力
        const overrideLevel = config.visualEffectLevel;
        if (overrideLevel && overrideLevel !== 'heavy') {
            const LEVEL_PARAMS = {
                none:   { maxInvert: 0,   maxGrayscale: 0,   minOpacity: 1 },
                light:  { maxInvert: 40,  maxGrayscale: 40,  minOpacity: 0.85 },
                medium: { maxInvert: 70,  maxGrayscale: 60,  minOpacity: 0.75 },
                heavy:  { maxInvert: 100, maxGrayscale: 80,  minOpacity: 0.6 }
            };
            return LEVEL_PARAMS[overrideLevel] || profile.visual;
        }
        return profile.visual;
    }

    // v1.3.0: 获取最近学习的BV号（P6休闲时段预留，当前返回null）
    function getRecentStudyBV() {
        // TODO: P1 实现后从 StatisticsTracker 历史记录中获取
        return null;
    }

    return {
        load,
        save,
        get,
        isStudyTime,
        isRestPeriod,
        getCurrentPeriodEnd,
        isWhitelisted,
        getInterventionConfig,
        getEffectiveInterventionStages,
        getVisualEffectParams,
        addToWhitelist,
        removeFromWhitelist,
        getWhitelistArray,
        getCourseName,
        getDefaultReturnBV,
        // v1.3.0 新增
        getInterventionProfile,
        getInterventionLevel,
        getRecentStudyBV
    };
})();

// ==========================================
// GlobalStateManager Module (v1.2.3 新增)
// ==========================================
// 将干预状态从 window 内存变量迁移到 localStorage，实现跨窗口持久化
// 支持三种重置策略：时段配置(period) / 固定学习时长(duration) / 固定间隔(interval)
const GlobalStateManager = (function() {
    const STATE_KEY = 'bilibiliStudy_globalState';

    // 默认全局状态
    const DEFAULT_STATE = {
        currentStage: 0,
        distractionStartTime: null,
        isStudying: true,
        lastStudyPeriodEnd: null,      // 上次学习时段结束时间戳
        lastActivityTime: null,        // 上次活动时间戳（interval策略用）
        accumulatedStudyTime: 0,       // 累计学习时间秒数（duration策略用）
    };

    // 上一 tick 的 isStudyTime 状态，用于检测下降沿
    let _wasStudyTime = null;

    // 读取全局状态
    function load() {
        try {
            const stored = localStorage.getItem(STATE_KEY);
            if (stored) {
                const parsed = JSON.parse(stored);
                return { ...DEFAULT_STATE, ...parsed };
            }
        } catch (e) {
            console.warn('[B站学习助手] GlobalStateManager.load: 读取失败，使用默认值', e);
        }
        return { ...DEFAULT_STATE };
    }

    // 写入全局状态
    function save(state) {
        try {
            localStorage.setItem(STATE_KEY, JSON.stringify(state));
        } catch (e) {
            console.warn('[B站学习助手] GlobalStateManager.save: 写入失败', e);
        }
    }

    // 获取某个字段
    function get(key) {
        const state = load();
        return key ? state[key] : state;
    }

    // 设置某个字段
    function set(key, value) {
        const state = load();
        state[key] = value;
        save(state);
        return state;
    }

    // 批量更新
    function update(partial) {
        const state = load();
        const newState = { ...state, ...partial };
        save(newState);
        return newState;
    }

    // 重置干预状态
    function resetIntervention() {
        const state = load();
        state.currentStage = 0;
        state.distractionStartTime = null;
        state.isStudying = true;
        state.lastStudyPeriodEnd = Date.now();
        state.accumulatedStudyTime = 0;
        save(state);
        console.log('[B站学习助手] GlobalStateManager.resetIntervention: 干预状态已重置');
        return state;
    }

    // 根据重置策略检查是否需要重置（每个 tick 调用）
    // isStudyTimeNow: 当前是否在学习时段
    function checkAndReset(isStudyTimeNow) {
        const config = ConfigManager.get();
        const strategy = config.resetStrategy || 'period';
        const state = load();
        let needReset = false;

        switch (strategy) {
            case 'period': {
                // 策略1：学习时段结束时重置（检测 isStudyTime 下降沿）
                if (_wasStudyTime === true && !isStudyTimeNow) {
                    // 从学习时段 → 非学习时段 = 时段结束
                    // 但要排除"休息时段"：休息时段不重置，等下一个学习时段开始时再判断
                    if (!ConfigManager.isRestPeriod()) {
                        needReset = true;
                        console.log('[B站学习助手] period策略: 学习时段结束，触发重置');
                    }
                }
                break;
            }
            case 'duration': {
                // 策略2：累计学习满X分钟后重置
                const threshold = (config.resetDuration || 30) * 60;
                if (state.accumulatedStudyTime >= threshold) {
                    needReset = true;
                    console.log('[B站学习助手] duration策略: 累计学习', state.accumulatedStudyTime, '秒 ≥', threshold, '秒，触发重置');
                }
                break;
            }
            case 'interval': {
                // 策略3：距上次活动超过X分钟后重置
                const intervalMs = (config.resetInterval || 30) * 60 * 1000;
                if (state.lastActivityTime && (Date.now() - state.lastActivityTime > intervalMs)) {
                    needReset = true;
                    console.log('[B站学习助手] interval策略: 距上次活动超过', config.resetInterval, '分钟，触发重置');
                }
                break;
            }
        }

        // 更新上一 tick 状态
        _wasStudyTime = isStudyTimeNow;

        if (needReset) {
            return resetIntervention();
        }

        return state;
    }

    // 更新活动时间（主定时器每秒调用）
    function touchActivity() {
        const state = load();
        state.lastActivityTime = Date.now();
        save(state);
    }

    // 累加学习时间（duration策略用，主定时器每秒调用）
    function addStudySeconds(seconds) {
        const state = load();
        state.accumulatedStudyTime += seconds;
        save(state);
    }

    // 同步到 window.__bilibiliStudyAppState（兼容现有代码）
    function syncToAppState() {
        const state = load();
        const appState = window.__bilibiliStudyAppState;
        if (appState) {
            appState.currentStage = state.currentStage;
            appState.distractionStartTime = state.distractionStartTime;
            appState.isStudying = state.isStudying;
        }
    }

    // 从 window.__bilibiliStudyAppState 同步到全局（用于旧代码写入后同步）
    function syncFromAppState() {
        const appState = window.__bilibiliStudyAppState;
        if (appState) {
            update({
                currentStage: appState.currentStage,
                distractionStartTime: appState.distractionStartTime,
                isStudying: appState.isStudying,
            });
        }
    }

    // 初始化：读取全局状态并同步到 appState
    function init() {
        const state = load();
        const appState = window.__bilibiliStudyAppState;
        if (appState) {
            appState.currentStage = state.currentStage;
            appState.distractionStartTime = state.distractionStartTime;
            appState.isStudying = state.isStudying;
        }
        // 初始化 _wasStudyTime
        _wasStudyTime = ConfigManager.isStudyTime();
        console.log('[B站学习助手] GlobalStateManager.init: 全局状态已加载', {
            currentStage: state.currentStage,
            isStudying: state.isStudying,
            resetStrategy: ConfigManager.get().resetStrategy,
        });
    }

    return {
        init,
        load,
        save,
        get,
        set,
        update,
        resetIntervention,
        checkAndReset,
        touchActivity,
        addStudySeconds,
        syncToAppState,
        syncFromAppState,
    };
})();

// ==========================================
// TabManager Module (v1.2.6 新增)
// ==========================================
// 多窗口 Master 选举 + 心跳 + 注册表
// 核心原则：谁被用户关注，谁是 Master
const TabManager = (function() {
    // 唯一标签页 ID（同一标签页内持久，跨标签页唯一）
    const TAB_ID = 'tab_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();

    // localStorage 键名
    const MASTER_KEY = 'bilibiliStudy_masterTab';
    const REGISTRY_KEY = 'bilibiliStudy_tabRegistry';

    // 心跳参数
    const HEARTBEAT_INTERVAL = 3000;   // 心跳间隔 3 秒
    const HEARTBEAT_TIMEOUT = 8000;    // 心跳超时 8 秒
    const MULTI_WINDOW_CHECK_INTERVAL = 5000;  // 多窗口检测间隔 5 秒

    // Master 最小持有时间（防止并排窗口频繁切换）
    const MIN_MASTER_HOLD_MS = 3000;

    // 引导弹窗倒计时
    const GUIDE_COUNTDOWN_MS = 30000;  // 30 秒
    const GUIDE_COOLDOWN_MS = 60000;   // 引导弹窗冷却期 60 秒（用户做出选择后不再重复触发）

    // 内部状态
    let isMaster = false;
    let heartbeatTimer = null;
    let multiWindowCheckTimer = null;
    let masterClaimTime = 0;           // 成为 Master 的时间戳
    let guideCountdownTimer = null;    // 引导弹窗倒计时定时器
    let guideModalElement = null;      // 引导弹窗 DOM 引用
    let isGuideActive = false;         // 引导弹窗是否激活中
    let guideCountdownRemaining = 0;   // 倒计时剩余秒数
    let guideCountdownInterval = null; // 倒计时 setInterval
    let lastGuideResolvedAt = 0;       // 上次用户处理引导弹窗的时间戳（冷却期用）
    let lastMultiWindowState = false;  // 上一 tick 的多窗口状态
    let _mixedWindowStableCount = 0;   // 【v1.2.6.2】连续检测到 mixed 状态的次数（稳定性去抖）
    let syncChannel = null;            // 【v1.2.7】BroadcastChannel 实例

    // ── 注册表操作 ──

    // 获取注册表
    function getRegistry() {
        try {
            const stored = localStorage.getItem(REGISTRY_KEY);
            if (stored) {
                const parsed = JSON.parse(stored);
                return parsed.tabs || {};
            }
        } catch (e) {
            console.warn('[B站学习助手] TabManager.getRegistry: 读取失败', e);
        }
        return {};
    }

    // 保存注册表
    function saveRegistry(tabs) {
        try {
            localStorage.setItem(REGISTRY_KEY, JSON.stringify({ tabs }));
        } catch (e) {
            console.warn('[B站学习助手] TabManager.saveRegistry: 写入失败', e);
        }
    }

    // 注册自己到注册表
    function registerSelf() {
        const tabs = getRegistry();
        tabs[TAB_ID] = {
            bv: PageMonitor.getCurrentBV() || '',
            isWhitelisted: false,
            isStudying: false,
            isVisible: !document.hidden,
            lastHeartbeat: Date.now(),
            windowTitle: document.title,
            registeredAt: Date.now()
        };
        saveRegistry(tabs);
    }

    // 更新自己的注册信息（主定时器每秒调用）
    let _lastRegistrationLogTime = 0;
    function updateRegistration(data) {
        const tabs = getRegistry();
        const myEntry = tabs[TAB_ID];
        // 【v1.2.6.2】增加 isVisible 字段，标记当前标签页是否在前台可见
        const enriched = Object.assign({}, data, {
            lastHeartbeat: Date.now(),
            isVisible: !document.hidden
        });
        if (myEntry) {
            Object.assign(myEntry, enriched);
        } else {
            tabs[TAB_ID] = { ...enriched, registeredAt: Date.now() };
        }
        saveRegistry(tabs);

        // 节流日志：每30秒输出一次注册状态
        const now = Date.now();
        if (now - _lastRegistrationLogTime > 30000) {
            _lastRegistrationLogTime = now;
            const activeCount = getActiveTabCount();
            const visibleCount = getVisibleTabCount();
            DebugTelemetry.log(DebugTelemetry.CATEGORY.STATE, 'registration_status', {
                tabId: TAB_ID.substring(0, 12) + '...',
                bv: (data.bv || '').substring(0, 10) + '...',
                isWhitelisted: data.isWhitelisted,
                isVisible: enriched.isVisible,
                isMaster: isMaster,
                activeTabs: activeCount,
                visibleTabs: visibleCount,
                isPaused: _isPaused,
                documentHidden: document.hidden
            });
        }
    }

    // 注销自己
    function unregisterSelf() {
        const tabs = getRegistry();
        delete tabs[TAB_ID];
        saveRegistry(tabs);
    }

    // 清理失联标签页（心跳超时）
    function cleanStaleTabs() {
        const tabs = getRegistry();
        const now = Date.now();
        let changed = false;
        for (const tabId in tabs) {
            if (tabId !== TAB_ID && now - tabs[tabId].lastHeartbeat > HEARTBEAT_TIMEOUT) {
                delete tabs[tabId];
                changed = true;
                console.log('[B站学习助手] TabManager: 清理失联标签页', tabId);
            }
        }
        if (changed) saveRegistry(tabs);
    }

    // ── Master 选举 ──

    // 尝试成为 Master
    function claimMaster() {
        const now = Date.now();
        try {
            localStorage.setItem(MASTER_KEY, JSON.stringify({
                tabId: TAB_ID,
                heartbeat: now,
                claimedAt: now
            }));
        } catch (e) { /* ignore */ }
        isMaster = true;
        masterClaimTime = now;
        DebugTelemetry.log(DebugTelemetry.CATEGORY.STATE, 'claimMaster', {
            tabId: TAB_ID.substring(0, 12) + '...',
            claimedAt: new Date(now).toLocaleTimeString()
        });
        // 【v1.4.0】指标
        if (typeof DebugTelemetry !== 'undefined' && DebugTelemetry.incrementMetric) {
            DebugTelemetry.incrementMetric('masterElections');
        }
        // 【v1.2.7】通过 BroadcastChannel 广播 Master 声明
        if (syncChannel) {
            try {
                syncChannel.postMessage({
                    type: 'master_claimed',
                    tabId: TAB_ID,
                    isMaster: true,
                    timestamp: now
                });
                DebugTelemetry.logMultiTab('broadcast_master_claimed', {
                    tabId: TAB_ID.substring(0, 12) + '...'
                });
            } catch (e) { /* ignore */ }
        }
    }

    // 释放 Master
    function releaseMaster() {
        if (isMaster) {
            try {
                const stored = localStorage.getItem(MASTER_KEY);
                if (stored) {
                    const parsed = JSON.parse(stored);
                    // 只清理自己的标记（避免覆盖其他窗口的新标记）
                    if (parsed.tabId === TAB_ID) {
                        localStorage.removeItem(MASTER_KEY);
                    }
                }
            } catch (e) { /* ignore */ }
            isMaster = false;
            masterClaimTime = 0;
            DebugTelemetry.log(DebugTelemetry.CATEGORY.STATE, 'releaseMaster', {
                tabId: TAB_ID.substring(0, 12) + '...',
                reason: 'visibility_change_or_focus_lost'
            });
            // 【v1.2.7】通过 BroadcastChannel 广播 Master 释放
            if (syncChannel) {
                try {
                    syncChannel.postMessage({
                        type: 'master_released',
                        tabId: TAB_ID,
                        isMaster: false,
                        timestamp: Date.now()
                    });
                    DebugTelemetry.logMultiTab('broadcast_master_released', {
                        tabId: TAB_ID.substring(0, 12) + '...'
                    });
                } catch (e) { /* ignore */ }
            }
        }
    }

    // Master 选举逻辑
    function elect() {
        const now = Date.now();
        try {
            const stored = localStorage.getItem(MASTER_KEY);
            if (stored) {
                const master = JSON.parse(stored);
                // 如果自己就是 Master
                if (master.tabId === TAB_ID) {
                    // 更新心跳
                    master.heartbeat = now;
                    localStorage.setItem(MASTER_KEY, JSON.stringify(master));
                    isMaster = true;
                    return;
                }
                // 检查现有 Master 是否存活
                if (now - master.heartbeat < HEARTBEAT_TIMEOUT) {
                    // 其他窗口是 Master 且存活
                    isMaster = false;
                    return;
                }
                // Master 心跳超时，接管
                console.log('[B站学习助手] TabManager: 主窗口心跳超时，尝试接管');
            }
            // 无 Master 或 Master 超时 → 成为 Master
            claimMaster();
        } catch (e) {
            console.warn('[B站学习助手] TabManager.elect: 选举失败，默认成为主窗口', e);
            isMaster = true;
            masterClaimTime = now;
        }
    }

    // ── 心跳 ──

    function startHeartbeat() {
        if (heartbeatTimer) clearInterval(heartbeatTimer);
        heartbeatTimer = setInterval(function() {
            if (isMaster) {
                // Master 更新心跳
                try {
                    const stored = localStorage.getItem(MASTER_KEY);
                    if (stored) {
                        const master = JSON.parse(stored);
                        if (master.tabId === TAB_ID) {
                            master.heartbeat = Date.now();
                            localStorage.setItem(MASTER_KEY, JSON.stringify(master));
                        } else {
                            // 另一个窗口抢了 Master
                            isMaster = false;
                            masterClaimTime = 0;
                        }
                    } else {
                        // Master 标记丢失，重新声明
                        claimMaster();
                    }
                } catch (e) { /* ignore */ }
            } else {
                // 非 Master 检查 Master 心跳
                elect();
            }
            // 顺便清理失联标签
            cleanStaleTabs();
        }, HEARTBEAT_INTERVAL);
    }

    // ── 可见性与焦点监听 ──

    function listenForVisibilityChange() {
        document.addEventListener('visibilitychange', function() {
            if (document.hidden) {
                // 页面隐藏：如果是 Master 且已持有超过最小持有时间，则释放
                if (isMaster && Date.now() - masterClaimTime > MIN_MASTER_HOLD_MS) {
                    DebugTelemetry.log(DebugTelemetry.CATEGORY.STATE, 'visibility_hidden_release_master', {
                        holdTime: Date.now() - masterClaimTime + 'ms',
                        activeTabs: _getActiveTabDetails()
                    });
                    releaseMaster();
                } else {
                    DebugTelemetry.log(DebugTelemetry.CATEGORY.STATE, 'visibility_hidden_keep_state', {
                        isMaster: isMaster,
                        holdTime: Date.now() - masterClaimTime + 'ms'
                    });
                }
                // 【v1.2.6.2】页面隐藏后立即更新注册表中的 isVisible
                updateRegistration({ isVisible: false });
            } else {
                // 页面可见：尝试接管 Master
                DebugTelemetry.log(DebugTelemetry.CATEGORY.STATE, 'visibility_visible_attempt_elect', {});
                // 短延迟避免快速切换时的竞态
                setTimeout(function() {
                    elect();
                    // 【v1.2.6.2】页面恢复可见后立即更新 isVisible
                    updateRegistration({ isVisible: true });
                }, 200);
            }
        });
    }

    function listenForFocus() {
        window.addEventListener('focus', function() {
            // 【v1.2.7】窗口获得焦点时更新 isVisible
            updateRegistration({ isVisible: !document.hidden });
            if (!document.hidden) {
                // 窗口获得焦点且可见：如果当前不是 Master，尝试抢夺
                if (!isMaster) {
                    console.log('[B站学习助手] TabManager: 窗口获得焦点，尝试抢夺主窗口');
                    // 检查当前 Master 的心跳
                    try {
                        const stored = localStorage.getItem(MASTER_KEY);
                        if (stored) {
                            const master = JSON.parse(stored);
                            // 如果 Master 心跳超过 1 秒（说明不是并排连续操作），抢夺
                            if (Date.now() - master.heartbeat > 1000) {
                                claimMaster();
                            } else {
                                console.log('[B站学习助手] TabManager: 当前主窗口心跳新鲜，不抢夺', {
                                    masterAge: Date.now() - master.heartbeat + 'ms'
                                });
                            }
                        } else {
                            claimMaster();
                        }
                    } catch (e) {
                        claimMaster();
                    }
                }
            }
        });
        // 【v1.2.7】窗口失去焦点时更新 isVisible
        window.addEventListener('blur', function() {
            updateRegistration({ isVisible: !document.hidden });
        });
    }

    function listenForUnload() {
        window.addEventListener('beforeunload', function() {
            // 释放 Master
            releaseMaster();
            // 注销注册表
            unregisterSelf();
        });
    }

    // ── 多窗口检测 ──

    // 获取活跃标签页数量
    function getActiveTabCount() {
        const tabs = getRegistry();
        const now = Date.now();
        let count = 0;
        for (const tabId in tabs) {
            if (now - tabs[tabId].lastHeartbeat < HEARTBEAT_TIMEOUT) {
                count++;
            }
        }
        return count;
    }

    // 【v1.2.6.2】获取当前可见标签页数量（排除后台隐藏的标签页）
    function getVisibleTabCount() {
        const tabs = getRegistry();
        const now = Date.now();
        let count = 0;
        for (const tabId in tabs) {
            if (now - tabs[tabId].lastHeartbeat > HEARTBEAT_TIMEOUT) continue;
            // isVisible 为 true 或者未定义（兼容旧数据）时视为可见
            if (tabs[tabId].isVisible !== false) {
                count++;
            }
        }
        return count;
    }

    // 检测是否存在不同类型的窗口（1学+1分）
    // 【v1.2.6.2】仅考虑当前可见的标签页，排除后台隐藏标签页的残余注册信息
    function hasMixedWindowTypes() {
        const tabs = getRegistry();
        const now = Date.now();
        let hasStudy = false;
        let hasDistraction = false;
        const studyList = [];
        const distractList = [];
        const skippedHidden = [];
        for (const tabId in tabs) {
            if (now - tabs[tabId].lastHeartbeat > HEARTBEAT_TIMEOUT) continue;
            // 【v1.2.6.2】跳过后台隐藏标签页——它们的 isWhitelisted 状态可能已过时
            if (tabs[tabId].isVisible === false) {
                skippedHidden.push(tabId.substring(0, 12) + '...');
                continue;
            }
            if (tabs[tabId].isWhitelisted) {
                hasStudy = true;
                studyList.push(tabId.substring(0, 12) + '...');
            } else {
                hasDistraction = true;
                distractList.push(tabId.substring(0, 12) + '...');
            }
        }
        const result = hasStudy && hasDistraction;
        if (result || skippedHidden.length > 0) {
            DebugTelemetry.log(DebugTelemetry.CATEGORY.MULTI_TAB, 'hasMixedWindowTypes', {
                result: result,
                studyTabs: studyList,
                distractionTabs: distractList,
                skippedHidden: skippedHidden.length > 0 ? skippedHidden : undefined,
                totalTabsInRegistry: Object.keys(tabs).length,
                visibleTabCount: getVisibleTabCount()
            });
        }
        return result;
    }

    // 获取当前是否处于多窗口场景
    function isMultiWindow() {
        return getActiveTabCount() >= 2;
    }

    // 多窗口检测定时器
    function startMultiWindowCheck() {
        if (multiWindowCheckTimer) clearInterval(multiWindowCheckTimer);
        multiWindowCheckTimer = setInterval(function() {
            const multiNow = isMultiWindow();
            const mixedNow = hasMixedWindowTypes();
            const now = Date.now();
            const inCooldown = (now - lastGuideResolvedAt) < GUIDE_COOLDOWN_MS;

            // 检测到多窗口状态变化
            if (multiNow !== lastMultiWindowState) {
                DebugTelemetry.log(DebugTelemetry.CATEGORY.MULTI_TAB, 'multi_window_state_change', {
                    state: multiNow ? '进入多窗口' : '退出多窗口',
                    activeTabs: _getActiveTabDetails(),
                    mixedTypes: mixedNow,
                    inCooldown: inCooldown,
                    documentHidden: document.hidden,
                    mixedWindowStableCount: _mixedWindowStableCount
                });
                lastMultiWindowState = multiNow;
            }

            // 【v1.2.6.2】2-cycle 稳定性去抖：mixed 状态必须连续出现 2 次以上才触发引导
            // 过滤瞬态场景（后台标签页的残余注册信息在几秒内自动消失）
            if (mixedNow) {
                _mixedWindowStableCount++;
                if (_mixedWindowStableCount > 10) _mixedWindowStableCount = 10; // 封顶
            } else {
                if (_mixedWindowStableCount > 0) {
                    DebugTelemetry.log(DebugTelemetry.CATEGORY.MULTI_TAB, 'mixed_window_stable_reset', {
                        previousStableCount: _mixedWindowStableCount
                    });
                }
                _mixedWindowStableCount = 0;
            }

            // 只在"不同类型窗口并存"时触发引导
            // Bug修复：当前窗口在后台时不弹引导（用户看不到，反而打断前台窗口）
            // Bug修复：冷却期内不再重复触发
            // 【v1.2.6.2】增加稳定性去抖：_mixedWindowStableCount >= 2
            if (multiNow && mixedNow && !isGuideActive && !inCooldown && !document.hidden && _mixedWindowStableCount >= 2) {
                DebugTelemetry.log(DebugTelemetry.CATEGORY.MULTI_TAB, 'trigger_guide', {
                    stableCount: _mixedWindowStableCount,
                    activeTabs: _getActiveTabDetails(),
                    currentTab: TAB_ID,
                    currentBV: PageMonitor.getCurrentBV(),
                    isWhitelisted: ConfigManager.isWhitelisted(PageMonitor.getCurrentBV()),
                    documentHidden: document.hidden
                });
                triggerMultiWindowGuide();
            }

            // 如果不再是多窗口，关闭引导
            if (!multiNow && isGuideActive) {
                DebugTelemetry.log(DebugTelemetry.CATEGORY.MULTI_TAB, 'window_resolved_close_guide', {
                    reason: 'no_longer_multi_window',
                    activeTabs: _getActiveTabDetails()
                });
                dismissGuide('window_resolved');
            }
        }, MULTI_WINDOW_CHECK_INTERVAL);
    }

    // ── 多窗口引导弹窗 ──

    // 触发多窗口引导
    function triggerMultiWindowGuide() {
        isGuideActive = true;
        guideCountdownRemaining = Math.ceil(GUIDE_COUNTDOWN_MS / 1000);

        // 两边都暂停计时
        _setPaused(true);

        // 判断当前窗口类型
        const currentBV = PageMonitor.getCurrentBV();
        const isWhitelisted = ConfigManager.isWhitelisted(currentBV);

        // 【v1.4.0】触发引导时自动捕获状态快照并计数
        DebugTelemetry.captureSnapshot('trigger_guide');
        if (typeof DebugTelemetry.incrementMetric === 'function') {
            DebugTelemetry.incrementMetric('guidePopupsShown');
            DebugTelemetry.incrementMetric('interventionsTriggered');
        }
        DebugTelemetry.log(DebugTelemetry.CATEGORY.MULTI_TAB, 'triggerMultiWindowGuide', {
            currentTab: TAB_ID,
            currentBV: currentBV,
            isWhitelisted: isWhitelisted,
            activeTabs: _getActiveTabDetails(),
            stableCount: _mixedWindowStableCount
        });

        if (isWhitelisted) {
            // 学习窗口：显示高斯模糊 + 标注文字（不弹弹窗）
            showStudyWindowOverlay();
        } else {
            // 分心窗口：弹出引导弹窗
            showGuideModal();
        }
    }

    // 学习窗口的叠加层（高斯模糊 + 标注）
    function showStudyWindowOverlay() {
        // 移除已有的 overlay
        dismissStudyOverlay();

        const overlay = document.createElement('div');
        overlay.className = 'bilibili-study-multi-tab-overlay bilibili-study-multi-tab-study-overlay';
        overlay.innerHTML = `
            <div class="bilibili-study-multi-tab-study-message">
                <div class="bilibili-study-multi-tab-study-icon">🖥️</div>
                <div class="bilibili-study-multi-tab-study-title">检测到多个学习窗口</div>
                <div class="bilibili-study-multi-tab-study-desc">计时已暂停，请在另一个窗口处理</div>
                <div class="bilibili-study-multi-tab-study-hint">
                    另一窗口正在分心，关闭后将自动恢复计时
                </div>
            </div>
        `;
        document.body.appendChild(overlay);

        // 暗色适配
        const isDark = document.documentElement.classList.contains('bilibili-study-dark-mode') ||
                       document.body.classList.contains('bilibili-study-dark-mode');
        if (isDark) {
            overlay.classList.add('bilibili-study-dark-mode');
        }

        console.log('[B站学习助手] TabManager: 显示学习窗口叠加层');
    }

    // 移除学习窗口叠加层
    function dismissStudyOverlay() {
        const existing = document.querySelector('.bilibili-study-multi-tab-study-overlay');
        if (existing) existing.remove();
    }

    // 显示引导弹窗（在分心窗口弹出）
    function showGuideModal() {
        // 如果已有弹窗，先移除
        dismissGuideModalOnly();

        const tabs = getRegistry();
        const now = Date.now();
        let studyTabs = [];
        let distractionTabs = [];
        for (const tabId in tabs) {
            if (now - tabs[tabId].lastHeartbeat > HEARTBEAT_TIMEOUT) continue;
            const tab = tabs[tabId];
            if (tab.isWhitelisted) {
                studyTabs.push(tab);
            } else {
                distractionTabs.push(tab);
            }
        }

        // 当前视频信息
        const currentBV = PageMonitor.getCurrentBV();
        const currentTitle = document.title;

        // 构建学习窗口列表
        let studyListHtml = studyTabs.map(tab => `
            <div class="bilibili-study-multi-tab-item bilibili-study-multi-tab-item-study">
                <span class="bilibili-study-multi-tab-item-icon">📚</span>
                <span class="bilibili-study-multi-tab-item-title">${_escapeHtml(tab.windowTitle || '学习视频')}</span>
                <span class="bilibili-study-multi-tab-item-badge bilibili-study-multi-tab-badge-study">学习</span>
            </div>
        `).join('');

        guideModalElement = document.createElement('div');
        guideModalElement.className = 'bilibili-study-multi-tab-guide';
        guideModalElement.innerHTML = `
            <div class="bilibili-study-multi-tab-guide-backdrop"></div>
            <div class="bilibili-study-multi-tab-guide-content">
                <div class="bilibili-study-multi-tab-guide-header">
                    <span class="bilibili-study-multi-tab-guide-icon">🖥️</span>
                    <span class="bilibili-study-multi-tab-guide-title">检测到多个学习窗口</span>
                </div>
                <div class="bilibili-study-multi-tab-guide-body">
                    <div class="bilibili-study-multi-tab-guide-desc">
                        同时打开多个窗口会导致计时不准确，请选择如何处理：
                    </div>
                    <div class="bilibili-study-multi-tab-guide-list">
                        ${studyListHtml}
                        <div class="bilibili-study-multi-tab-item bilibili-study-multi-tab-item-current">
                            <span class="bilibili-study-multi-tab-item-icon">🎬</span>
                            <span class="bilibili-study-multi-tab-item-title">${_escapeHtml(currentTitle || '当前视频')}</span>
                            <span class="bilibili-study-multi-tab-item-badge bilibili-study-multi-tab-badge-distraction">非学习</span>
                        </div>
                    </div>
                    <div class="bilibili-study-multi-tab-guide-notice">
                        📌 当前视频已记录在近期播放列表，可稍后观看
                    </div>
                    <div class="bilibili-study-multi-tab-guide-whitelist">
                        <label class="bilibili-study-multi-tab-whitelist-label">
                            <input type="checkbox" id="bilibili-study-multi-tab-add-whitelist" />
                            将当前视频添加到学习白名单
                        </label>
                    </div>
                </div>
                <div class="bilibili-study-multi-tab-guide-footer">
                    <button class="bilibili-study-multi-tab-btn bilibili-study-multi-tab-btn-primary" id="bilibili-study-multi-tab-btn-close">
                        关闭本窗口
                    </button>
                    <button class="bilibili-study-multi-tab-btn bilibili-study-multi-tab-btn-secondary" id="bilibili-study-multi-tab-btn-keep">
                        保留本窗口
                    </button>
                    <div class="bilibili-study-multi-tab-guide-countdown" id="bilibili-study-multi-tab-countdown">
                        ⏱️ ${guideCountdownRemaining}秒后未选择，将自动以当前视频窗口为主窗口
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(guideModalElement);

        // 注册到 ModalManager
        ModalManager.register('multi-tab-guide', ModalManager.LEVELS.MULTI_TAB, guideModalElement);

        // 绑定按钮事件
        const closeBtn = guideModalElement.querySelector('#bilibili-study-multi-tab-btn-close');
        const keepBtn = guideModalElement.querySelector('#bilibili-study-multi-tab-btn-keep');

        closeBtn.addEventListener('click', function() {
            _handleGuideChoice('close');
        });
        keepBtn.addEventListener('click', function() {
            _handleGuideChoice('keep');
        });

        // 应用当前主题
        _applyThemeToGuide();

        // 启动倒计时
        _startGuideCountdown();

        console.log('[B站学习助手] TabManager: 显示多窗口引导弹窗');
    }

    // 启动倒计时
    function _startGuideCountdown() {
        if (guideCountdownInterval) clearInterval(guideCountdownInterval);
        guideCountdownInterval = setInterval(function() {
            guideCountdownRemaining--;
            const countdownEl = document.getElementById('bilibili-study-multi-tab-countdown');
            if (countdownEl) {
                countdownEl.textContent = `⏱️ ${guideCountdownRemaining}秒后未选择，将自动以当前视频窗口为主窗口`;
            }
            if (guideCountdownRemaining <= 0) {
                clearInterval(guideCountdownInterval);
                guideCountdownInterval = null;
                // 倒计时结束：默认分心窗口成为Master
                _handleGuideChoice('timeout');
            }
        }, 1000);
    }

    // 处理引导选择
    function _handleGuideChoice(choice) {
        DebugTelemetry.logUserAction('guide_choice', {
            choice: choice,
            isGuideActive: isGuideActive,
            isMaster: isMaster,
            isPaused: _isPaused,
            currentBV: PageMonitor.getCurrentBV()
        });

        // 停止倒计时
        if (guideCountdownInterval) {
            clearInterval(guideCountdownInterval);
            guideCountdownInterval = null;
        }

        const checkbox = document.getElementById('bilibili-study-multi-tab-add-whitelist');
        const shouldAddWhitelist = checkbox && checkbox.checked;
        const currentBV = PageMonitor.getCurrentBV();
        let whitelistAdded = false;

        // 如果用户勾选了"添加到白名单"
        if (shouldAddWhitelist && currentBV) {
            const config = ConfigManager.get();
            if (!config.whitelist.find(w => w.bv === currentBV)) {
                const videoName = document.title.replace('_哔哩哔哩_bilibili', '').replace('_哔哩哔哩', '').trim() || currentBV;
                config.whitelist.push({
                    bv: currentBV,
                    name: videoName
                });
                ConfigManager.save(config);
                // v1.4.1
                DebugTelemetry.incrementMetric('whiteListChanges');
                whitelistAdded = true;
                console.log('[B站学习助手] TabManager: 已将当前视频添加到白名单', currentBV, videoName);
                // Bug修复：白名单添加成功后给用户反馈
                _showGuideToast('✅ 已将「' + videoName + '」添加到学习白名单');
            } else {
                console.log('[B站学习助手] TabManager: 当前视频已在白名单中', currentBV);
            }
        }

        switch (choice) {
            case 'close':
                // 用户选择关闭本窗口
                console.log('[B站学习助手] TabManager: 用户选择关闭当前窗口');
                // 记录 BV 号
                if (currentBV) {
                    HistoryVideoTracker.record(currentBV, document.title, 'distraction', 'multi_window_close');
                }
                dismissGuide('user_close');
                // 尝试关闭窗口（可能被浏览器拦截）
                window.close();
                // 如果关闭失败，回退为副窗口模式
                _becomeSecondary();
                break;

            case 'keep':
                // 用户选择保留本窗口
                console.log('[B站学习助手] TabManager: 用户选择保留当前窗口', {
                    whitelistAdded: whitelistAdded,
                    willBeMaster: true
                });
                dismissGuide('user_keep');
                // 当前窗口成为 Master
                claimMaster();
                _setPaused(false);
                // 如果添加了白名单，重置干预状态（当前视频已变为学习视频）
                if (whitelistAdded && window.__bilibiliStudyAppState) {
                    const state = window.__bilibiliStudyAppState;
                    state.currentStage = 0;
                    state.distractionStartTime = null;
                    state.isStudying = true;
                    console.log('[B站学习助手] TabManager: 白名单添加后重置干预状态');
                }
                break;

            case 'timeout':
                // 倒计时结束：分心窗口成为 Master，继承干预状态
                console.log('[B站学习助手] TabManager: 倒计时结束，默认当前视频窗口为主窗口');
                dismissGuide('timeout');
                claimMaster();
                _setPaused(false);
                break;
        }

        // v1.4.1
        DebugTelemetry.incrementMetric('userActions');
    }

    // 成为副窗口
    function _becomeSecondary() {
        isMaster = false;
        _setPaused(true);
        // 更新浮窗状态
        _updateFloatingWindowStatus();
    }

    // 关闭引导弹窗（不含叠加层）
    function dismissGuideModalOnly() {
        if (guideCountdownInterval) {
            clearInterval(guideCountdownInterval);
            guideCountdownInterval = null;
        }
        if (guideModalElement) {
            ModalManager.dismiss('multi-tab-guide');
            guideModalElement = null;
        }
    }

    // 关闭引导（弹窗+叠加层+暂停状态）
    function dismissGuide(reason) {
        dismissGuideModalOnly();
        dismissStudyOverlay();

        isGuideActive = false;
        // Bug修复：记录冷却时间而非简单重置标志
        // 用户做出选择后，冷却期内不再重复触发引导弹窗
        lastGuideResolvedAt = Date.now();

        // 【v1.2.6.2】记录引导关闭时的上下文的快照
        const currentMulti = isMultiWindow();
        const currentMixed = hasMixedWindowTypes();
        DebugTelemetry.log(DebugTelemetry.CATEGORY.MULTI_TAB, 'dismissGuide', {
            reason: reason,
            isMultiWindow: currentMulti,
            hasMixedTypes: currentMixed,
            activeTabs: _getActiveTabDetails(),
            cooldownUntil: new Date(lastGuideResolvedAt + GUIDE_COOLDOWN_MS).toLocaleTimeString()
        });
        // 如果引导在短时间内关闭（< 10秒），可能是一次瞬态触发，自动捕获快照
        if (reason === 'window_resolved') {
            DebugTelemetry.captureSnapshot('dismiss_guide_window_resolved');
        }

        // 【v1.2.7】window_resolved / user_close 时记录 BV 到历史，并广播通知其他窗口
        if ((reason === 'window_resolved' || reason === 'user_close') && PageMonitor.getCurrentBV) {
            const bv = PageMonitor.getCurrentBV();
            if (bv) {
                const title = document.title.replace('_哔哩哔哩_bilibili', '').replace('_哔哩哔哩', '').trim() || bv;
                HistoryVideoTracker.record(bv, title, 'distraction', reason === 'window_resolved' ? 'multiwindow' : 'user_close');
                // 广播 window_resolved 给其他窗口，附带视频标题
                if (syncChannel) {
                    try {
                        syncChannel.postMessage({
                            type: 'window_resolved',
                            tabId: TAB_ID,
                            videoTitle: title,
                            timestamp: Date.now()
                        });
                        DebugTelemetry.logMultiTab('broadcast_window_resolved', { bv: bv.substring(0, 12), title: title });
                    } catch (e) { /* ignore */ }
                }
            }
        }

        // 如果不再是多窗口，恢复计时
        if (!currentMulti) {
            _setPaused(false);
            DebugTelemetry.log(DebugTelemetry.CATEGORY.MULTI_TAB, 'resume_timer', {
                reason: reason
            });
        }

        // 更新浮窗
        _updateFloatingWindowStatus();
    }

    // ── 暂停控制 ──

    let _isPaused = false;

    function _setPaused(paused) {
        _isPaused = paused;
        // 通知主定时器
        if (window.__bilibiliStudyAppState) {
            window.__bilibiliStudyAppState.multiWindowPaused = paused;
        }
        // 更新浮窗显示
        _updateFloatingWindowStatus();
    }

    function isPaused() {
        return _isPaused;
    }

    // ── 浮窗状态更新 ──

    function _updateFloatingWindowStatus() {
        const fw = document.getElementById('bilibili-study-floating-window');
        if (!fw) return;

        if (_isPaused && !isMaster) {
            // 副窗口 + 暂停中
            fw.classList.add('bilibili-study-floating-secondary');
        } else {
            fw.classList.remove('bilibili-study-floating-secondary');
        }

        if (_isPaused && isMaster) {
            // Master 但暂停中（多窗口协商期间）
            fw.classList.add('bilibili-study-floating-negotiating');
        } else {
            fw.classList.remove('bilibili-study-floating-negotiating');
        }
    }

    // ── 主题适配 ──

    function _applyThemeToGuide() {
        if (!guideModalElement) return;
        const isDark = document.documentElement.classList.contains('bilibili-study-dark-mode') ||
                       document.body.classList.contains('bilibili-study-dark-mode');
        if (isDark) {
            guideModalElement.classList.add('bilibili-study-dark-mode');
        }
    }

    // ── 工具函数 ──

    function _escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    // 获取活跃标签页的详细信息（用于调试日志）
    function _getActiveTabDetails() {
        const tabs = getRegistry();
        const now = Date.now();
        const details = [];
        for (const tabId in tabs) {
            const tab = tabs[tabId];
            const age = now - tab.lastHeartbeat;
            details.push({
                id: tabId.substring(0, 15) + '...',
                bv: (tab.bv || '').substring(0, 10) + '...',
                isWhitelisted: tab.isWhitelisted,
                age: age + 'ms',
                stale: age > HEARTBEAT_TIMEOUT
            });
        }
        return details;
    }

    // 在引导弹窗场景中显示轻量 Toast 反馈
    // 【v1.2.7】修复 Toast 闪现：0.2s ease-in-out 过渡，最少可见 500ms，防快速连续闪烁
    var _toastTimerId = null;
    var _toastStartTime = 0;
    function _showGuideToast(message) {
        // 【v1.4.0】指标
        if (typeof DebugTelemetry.incrementMetric === 'function') {
            DebugTelemetry.incrementMetric('toastShown');
        }
        // 复用已有的 Toast 逻辑（如果存在），否则创建简单的临时 Toast
        let toast = document.getElementById('bilibili-study-guide-toast');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'bilibili-study-guide-toast';
            toast.className = 'bilibili-study-guide-toast';
            document.body.appendChild(toast);
        }
        toast.textContent = message;
        toast.style.opacity = '1';
        _toastStartTime = Date.now();

        // 清除之前的定时器，防止快速连续调用导致闪烁
        if (_toastTimerId) {
            clearTimeout(_toastTimerId);
            _toastTimerId = null;
        }

        // 最少可见 500ms 后才开始 fadeOut
        _toastTimerId = setTimeout(function() {
            var elapsed = Date.now() - _toastStartTime;
            var remaining = Math.max(0, 500 - elapsed);
            // 如果已过时间不足 500ms，继续等待补齐
            if (remaining > 0) {
                _toastTimerId = setTimeout(function() {
                    if (toast) toast.style.opacity = '0';
                    setTimeout(function() {
                        if (toast && toast.parentNode) toast.remove();
                        _toastTimerId = null;
                    }, 300);
                }, remaining);
            } else {
                if (toast) toast.style.opacity = '0';
                setTimeout(function() {
                    if (toast && toast.parentNode) toast.remove();
                    _toastTimerId = null;
                }, 300);
            }
        }, 3000);
    }

    // ── 初始化 ──

    // 【v1.2.7】设置 BroadcastChannel 多窗口同步
    function _setupBroadcastChannel() {
        try {
            if (typeof BroadcastChannel === 'undefined') {
                DebugTelemetry.logMultiTab('broadcast_channel_unsupported', { reason: 'BroadcastChannel not available' });
                return;
            }
            syncChannel = new BroadcastChannel('bilibili-study-sync');
            syncChannel.onmessage = function(event) {
                var msg = event.data;
                if (!msg || !msg.type) return;
                DebugTelemetry.logMultiTab('broadcast_channel_received', {
                    type: msg.type,
                    tabId: (msg.tabId || '').substring(0, 12) + '...',
                    isMaster: msg.isMaster,
                    timestamp: msg.timestamp
                });
                // 处理不同类型的广播消息
                switch (msg.type) {
                    case 'master_claimed':
                        // 其他窗口声称成为 Master，如果该消息来自其他窗口，放弃自己的 Master 状态
                        if (msg.tabId !== TAB_ID && isMaster) {
                            DebugTelemetry.logMultiTab('broadcast_master_claim_other', {
                                myTab: TAB_ID.substring(0, 12) + '...',
                                otherTab: (msg.tabId || '').substring(0, 12) + '...'
                            });
                            isMaster = false;
                            masterClaimTime = 0;
                        }
                        break;
                    case 'master_released':
                        // Master 已释放，触发重新选举
                        if (msg.tabId !== TAB_ID) {
                            setTimeout(function() { elect(); }, 100);
                        }
                        break;
                    case 'window_resolved':
                        // 其他窗口的多窗口问题已解决，显示 Toast 通知
                        if (msg.tabId !== TAB_ID && msg.videoTitle) {
                            _showGuideToast('\u2705 \u6709\u89c6\u9891\u5df2\u8bb0\u5f55\uff1a' + msg.videoTitle);
                        }
                        break;
                }
            };
            DebugTelemetry.logMultiTab('broadcast_channel_ready', {
                tabId: TAB_ID.substring(0, 12) + '...'
            });
        } catch (e) {
            DebugTelemetry.logMultiTab('broadcast_channel_error', {
                error: e.message
            });
            syncChannel = null;
        }
    }

    function init() {
        // 1. 注册自己
        registerSelf();

        // 2. 【v1.2.7】设置 BroadcastChannel
        _setupBroadcastChannel();

        // 3. Master 选举
        elect();

        // 4. 启动心跳
        startHeartbeat();

        // 5. 启动多窗口检测
        startMultiWindowCheck();

        // 6. 监听可见性变化
        listenForVisibilityChange();

        // 7. 监听焦点
        listenForFocus();

        // 8. 监听窗口关闭
        listenForUnload();

        console.log('[B站学习助手] TabManager.init: 初始化完成', {
            tabId: TAB_ID,
            isMaster: isMaster
        });
    }

    return {
        TAB_ID,
        init,
        isMaster: function() { return isMaster; },
        isPaused,
        isMultiWindow,
        hasMixedWindowTypes,
        getRegistry,
        getActiveTabCount,
        updateRegistration,
        claimMaster,
        releaseMaster,
        dismissGuide,
        isGuideActive: function() { return isGuideActive; }
    };
})();

// ==========================================
// DebugTelemetry Module (v1.2.6.2 新增)
// ==========================================
// 轻量级可观测性系统，用于捕获瞬态 Bug 的关键上下文
// 三层架构：事件日志（环形缓冲） + 状态快照 + 导出分析
const DebugTelemetry = (function() {
    // ── 配置 ──
    const MAX_EVENTS = 500;           // 环形缓冲上限
    const TELEMETRY_KEY = 'bilibiliStudy_telemetry';
    const MAX_SNAPSHOTS = 20;         // localStorage 保留快照数

    // 事件分类
    const CATEGORY = {
        STATE:        'STATE',        // 状态变更
        MULTI_TAB:    'MULTI_TAB',    // 多窗口相关
        INTERVENTION: 'INTERVENTION', // 干预相关
        TIMING:       'TIMING',       // 定时器/心跳
        ERROR:        'ERROR',        // 异常
        PERF:         'PERF',         // 性能
        USER_ACTION:  'USER_ACTION',  // 用户交互
        SNAPSHOT:     'SNAPSHOT'      // 快照事件
    };

    // ── 环形缓冲（内存） ──
    const _events = [];
    let _eventId = 0;

    // ── 【v1.4.0】指标计数器 ──
    // 用于 Telemetry Dashboard 的 Metrics 视图
    const _metrics = {
        guidePopupsShown: 0,       // 引导弹窗显示次数（已有）
        masterElections: 0,        // Master 选举次数（已有）
        autoNavigations: 0,        // 自动导航触发次数（已有）
        toastShown: 0,             // Toast 显示次数（已有）
        errorEvents: 0,            // 错误事件次数（已有）
        interventionsTriggered: 0, // 干预触发次数（已有）
        // v1.4.1 新增
        userActions: 0,            // 用户操作总次数
        settingsChanges: 0,        // 配置修改次数
        whiteListChanges: 0,       // 白名单增删次数
        wordsAttempted: 0,         // 单词验证尝试次数
        wordsMastered: 0           // 新学会的单词数
    };

    // ── 【v1.4.0】指标计数器操作 ──
    // 增加指定计数器的值
    function incrementMetric(name) {
        if (_metrics.hasOwnProperty(name)) {
            _metrics[name]++;
        }
    }

    // 获取所有指标计数器的当前值
    function getMetrics() {
        return { ..._metrics };
    }

    // 重置所有指标计数器
    function resetMetrics() {
        for (var key in _metrics) {
            if (_metrics.hasOwnProperty(key)) {
                _metrics[key] = 0;
            }
        }
    }

    // ── 核心 API：记录事件 ──
    // category: CATEGORY 常量之一
    // event:    事件名称（如 'hasMixedWindowTypes'）
    // data:     附加数据对象（自动 JSON 序列化）
    function log(category, event, data) {
        const entry = {
            id: ++_eventId,
            ts: Date.now(),
            tsISO: new Date().toISOString(),
            category: category,
            event: event,
            data: data || null
        };
        _events.push(entry);
        if (_events.length > MAX_EVENTS) _events.shift();

        // 【v1.4.0】自动统计错误事件
        if (category === CATEGORY.ERROR) {
            _metrics.errorEvents++;
        }
        const prefix = {
            STATE:        '[📊TELE/STATE]',
            MULTI_TAB:    '[🖥️TELE/MULTI]',
            INTERVENTION: '[⚠️TELE/INTV]',
            TIMING:       '[⏱️TELE/TIME]',
            ERROR:        '[❌TELE/ERR]',
            PERF:         '[⚡TELE/PERF]',
            USER_ACTION:  '[👤TELE/USER]',
            SNAPSHOT:     '[📸TELE/SNAP]'
        }[category] || '[TELE]';
        console.log(prefix, event, data || '');

        return entry;
    }

    // ── 状态快照 ──
    // 捕获当前所有关键上下文，存入 localStorage
    function captureSnapshot(reason) {
        const snapshot = {
            capturedAt: Date.now(),
            capturedAtISO: new Date().toISOString(),
            reason: reason,
            // 全局状态
            globalState: window.__bilibiliStudyAppState ? { ...window.__bilibiliStudyAppState } : null,
            // TabManager 注册表
            tabRegistry: _getRegistrySnapshot(),
            // 当前页面的可见性/焦点状态
            pageState: {
                hidden: document.hidden,
                hasFocus: document.hasFocus(),
                url: location.href,
                title: document.title,
                bv: typeof PageMonitor !== 'undefined' && PageMonitor.getCurrentBV ? PageMonitor.getCurrentBV() : ''
            },
            // 本地配置快照（摘要）
            configSnapshot: _getConfigSnapshot(),
            // 最近事件摘要
            recentEvents: _events.slice(-20)
        };

        // 存入 localStorage
        _saveSnapshot(snapshot);
        log(CATEGORY.SNAPSHOT, 'capture', { reason: reason, snapshotId: snapshot.capturedAt });

        return snapshot;
    }

    // 获取注册表快照（脱敏处理）
    function _getRegistrySnapshot() {
        try {
            const stored = localStorage.getItem('bilibiliStudy_tabRegistry');
            if (stored) {
                const parsed = JSON.parse(stored);
                const summary = {};
                for (const tabId in (parsed.tabs || {})) {
                    const tab = parsed.tabs[tabId];
                    summary[tabId.substring(0, 12) + '...'] = {
                        bv: (tab.bv || '').substring(0, 10) + '...',
                        isWhitelisted: tab.isWhitelisted,
                        isVisible: tab.isVisible,
                        isStudying: tab.isStudying,
                        age: tab.lastHeartbeat ? Math.round((Date.now() - tab.lastHeartbeat) / 1000) + 's' : '?'
                    };
                }
                return summary;
            }
        } catch (e) { /* ignore */ }
        return {};
    }

    // 获取配置摘要
    function _getConfigSnapshot() {
        try {
            const stored = localStorage.getItem('bilibiliStudyAssistant_config');
            if (stored) {
                const config = JSON.parse(stored);
                return {
                    whitelistCount: (config.whitelist || []).length,
                    studyPeriods: config.studyPeriods ? config.studyPeriods.length + '个时段' : '无',
                    interventionLevel: config.interventionLevel || 'standard'
                };
            }
        } catch (e) { /* ignore */ }
        return {};
    }

    // 保存快照到 localStorage
    function _saveSnapshot(snapshot) {
        try {
            let snapshots = [];
            const stored = localStorage.getItem(TELEMETRY_KEY);
            if (stored) {
                try { snapshots = JSON.parse(stored); } catch(e) { snapshots = []; }
            }
            snapshots.push(snapshot);
            // FIFO：只保留最新的 MAX_SNAPSHOTS 条
            while (snapshots.length > MAX_SNAPSHOTS) snapshots.shift();
            localStorage.setItem(TELEMETRY_KEY, JSON.stringify(snapshots));
        } catch (e) {
            console.warn('[B站学习助手] DebugTelemetry: 保存快照失败', e);
        }
    }

    // ── 查询与分析 ──

    // 获取所有事件
    function getEvents() {
        return _events;
    }

    // 按条件筛选事件
    // filterBy: { category, eventPattern, since, until }
    function query(filterBy) {
        return _events.filter(function(e) {
            if (filterBy.category && e.category !== filterBy.category) return false;
            if (filterBy.eventPattern && !e.event.includes(filterBy.eventPattern)) return false;
            if (filterBy.since && e.ts < filterBy.since) return false;
            if (filterBy.until && e.ts > filterBy.until) return false;
            return true;
        });
    }

    // 提取多窗口相关事件链（用于诊断瞬态多窗口状态）
    function dumpMultiWindowTrace(options) {
        options = options || {};
        const windowMs = options.windowMs || 15000;  // 默认 15 秒窗口
        const since = Date.now() - windowMs;
        return _events.filter(function(e) {
            return e.ts >= since && (
                e.category === CATEGORY.MULTI_TAB ||
                e.category === CATEGORY.SNAPSHOT ||
                (e.category === CATEGORY.STATE && e.event.includes('multiWindow'))
            );
        });
    }

    // ── 导出 ──

    // 以 JSON 字符串导出所有事件 + 指标 + 快照
    function exportJSON() {
        return JSON.stringify({
            schemaVersion: '1.0',
            exportedAt: new Date().toISOString(),
            source: {
                tabId: typeof TAB_ID !== 'undefined' ? TAB_ID : '',
                windowTitle: document.title
            },
            telemetry: {
                totalEvents: _events.length,
                events: _events,
                metrics: _metrics,
                snapshotCount: _getSnapshotCount()
            }
        }, null, 2);
    }

    // 获取保存的快照数量
    function _getSnapshotCount() {
        try {
            var stored = localStorage.getItem(TELEMETRY_KEY);
            if (stored) return JSON.parse(stored).length;
        } catch (e) { /* ignore */ }
        return 0;
    }

    // 从 localStorage 获取所有保存的快照
    function getSavedSnapshots() {
        try {
            const stored = localStorage.getItem(TELEMETRY_KEY);
            if (stored) return JSON.parse(stored);
        } catch (e) { /* ignore */ }
        return [];
    }

    // 清除 localStorage 中的快照
    function clearSnapshots() {
        try {
            localStorage.removeItem(TELEMETRY_KEY);
        } catch (e) { /* ignore */ }
    }

    // ── 便利封装 ──

    // 创建拦截器：替换 console.log 使其同时写入 telemetry
    // 注意：这里不替换原始 console，而是提供辅助函数
    function logState(event, data) { return log(CATEGORY.STATE, event, data); }
    function logMultiTab(event, data) { return log(CATEGORY.MULTI_TAB, event, data); }
    function logIntervention(event, data) { return log(CATEGORY.INTERVENTION, event, data); }
    function logTiming(event, data) { return log(CATEGORY.TIMING, event, data); }
    function logError(event, data) { return log(CATEGORY.ERROR, event, data); }
    function logUserAction(event, data) { return log(CATEGORY.USER_ACTION, event, data); }

    // ── 全局挂载 ──
    // 挂载到 unsafeWindow 方便控制台调试
    try {
        if (typeof unsafeWindow !== 'undefined') {
            unsafeWindow.__bilibiliStudyDebugTelemetry = {
                log: log,
                snapshot: captureSnapshot,
                query: query,
                exportJSON: exportJSON,
                dumpMultiWindowTrace: dumpMultiWindowTrace,
                getEvents: getEvents,
                getSavedSnapshots: getSavedSnapshots,
                clearSnapshots: clearSnapshots,
                CATEGORY: CATEGORY,
                // 【v1.4.0】指标
                incrementMetric: incrementMetric,
                getMetrics: getMetrics,
                resetMetrics: resetMetrics
            };
        }
    } catch (e) { /* ignore */ }

    return {
        log: log,
        logState: logState,
        logMultiTab: logMultiTab,
        logIntervention: logIntervention,
        logTiming: logTiming,
        logError: logError,
        logUserAction: logUserAction,
        captureSnapshot: captureSnapshot,
        query: query,
        dumpMultiWindowTrace: dumpMultiWindowTrace,
        exportJSON: exportJSON,
        getEvents: getEvents,
        getSavedSnapshots: getSavedSnapshots,
        clearSnapshots: clearSnapshots,
        CATEGORY: CATEGORY,
        // 【v1.4.0】指标
        incrementMetric: incrementMetric,
        getMetrics: getMetrics,
        resetMetrics: resetMetrics
    };
})();

// ==========================================
// HistoryVideoTracker Module (v1.2.3 新增)
// ==========================================
// 记录用户观看/离开的所有视频 BV 号，含 reason/leftAt/title
// 任何"离开当前视频"的行为都记录，不限于多窗口场景
const HistoryVideoTracker = (function() {
    const HISTORY_KEY = 'bilibiliStudy_historyVideos';
    const MAX_RECORDS = 20;  // 最多保存20条

    // 获取历史视频列表
    function getAll() {
        try {
            const stored = localStorage.getItem(HISTORY_KEY);
            if (stored) {
                return JSON.parse(stored);
            }
        } catch (e) {
            console.warn('[B站学习助手] HistoryVideoTracker.getAll: 读取失败', e);
        }
        return [];
    }

    // 保存历史视频列表
    function saveAll(records) {
        try {
            // 去重：同一个 BV 号只保留最新的记录
            const seen = new Set();
            const deduped = [];
            for (let i = records.length - 1; i >= 0; i--) {
                if (!seen.has(records[i].bv)) {
                    seen.add(records[i].bv);
                    deduped.unshift(records[i]);
                }
            }
            // FIFO：超出上限则移除最旧的
            while (deduped.length > MAX_RECORDS) {
                deduped.shift();
            }
            localStorage.setItem(HISTORY_KEY, JSON.stringify(deduped));
        } catch (e) {
            console.warn('[B站学习助手] HistoryVideoTracker.saveAll: 写入失败', e);
        }
    }

    // 记录一条视频离开记录
    // bv: BV号
    // title: 视频标题
    // type: 'study' / 'distraction'
    // reason: 'intervention' / 'user_close' / 'user_navigate' / 'multiwindow' / 'return_learning'
    // watchDuration: 观看秒数（可选）
    function record(bv, title, type, reason, watchDuration) {
        if (!bv) return;
        const records = getAll();
        records.push({
            bv: bv,
            title: title || bv,
            type: type || 'distraction',
            watchedAt: Date.now() - (watchDuration || 0) * 1000,  // 推算开始观看时间
            leftAt: Date.now(),
            watchDuration: watchDuration || 0,
            reason: reason || 'unknown',
        });
        saveAll(records);
        console.log('[B站学习助手] HistoryVideoTracker.record:', { bv, type, reason });
    }

    // 清空所有记录
    function clear() {
        try {
            localStorage.removeItem(HISTORY_KEY);
        } catch (e) {
            console.warn('[B站学习助手] HistoryVideoTracker.clear: 清除失败', e);
        }
    }

    // 获取最近 N 条记录
    function getRecent(n) {
        const records = getAll();
        return records.slice(-n);
    }

    return {
        getAll,
        record,
        clear,
        getRecent,
    };
})();
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
    let lastBV = null;       // v1.2.3: 记录上一个BV号，用于SPA导航时追踪离开的视频
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
            lastBV = currentBV;  // v1.2.3: 保存旧BV号
            currentBV = newBV;
            if (routeChangeCallback) {
                routeChangeCallback(currentBV);
            }
        }
    }

    // v1.2.3: 获取上一个BV号（SPA导航离开的视频）
    function getLastBV() {
        return lastBV;
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
        getLastBV,
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

        const { isStudying, stage, studyTime, distractionTime, isMaster: isMasterTab, isPaused: isPausedTab } = status;

        // v1.2.6: 多窗口暂停状态
        if (isPausedTab) {
            element.style.backgroundColor = 'rgba(128, 128, 128, 0.7)';
            element.innerHTML = `
                <span class="bilibili-study-status-text">⏸️ 计时暂停</span>
                <span class="bilibili-study-time-display">多窗口协商中</span>
            `;
            return;
        }

        // v1.2.6: 非 Master 标识
        if (isMasterTab === false) {
            // 副窗口
            element.style.backgroundColor = isStudying
                ? 'rgba(70, 130, 180, 0.7)'    // 钢蓝色：副窗口学习中
                : 'rgba(128, 128, 128, 0.7)';   // 灰色：副窗口分心
            element.innerHTML = `
                <span class="bilibili-study-status-text">${isStudying ? '🔵 副窗口' : '🔵 已暂停'}</span>
                <span class="bilibili-study-time-display">${isStudying ? '学习中' : '已离开学习状态'}</span>
            `;
            return;
        }

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
// TelemetryUI Module (v1.4.0 新增)
// ==========================================
// 调试面板：Logs/Metrics/Traces 三视图，集成到 DetailPanel
// 数据来源：DebugTelemetry（事件日志+指标+快照）
const TelemetryUI = (function() {
    let _floatWin = null;        // 浮动窗口 DOM
    let _activeView = 'logs';    // 当前视图: logs | metrics | traces
    let _refreshTimer = null;    // 自动刷新定时器
    let _displayCount = 10;      // 当前显示的事件条数（渐进式）
    let _currentFilter = null;   // 当前筛选条件 { category, eventPattern }
    let _autoSaveTimer = null;   // 自动保存定时器
    let _autoSaveInterval = 300000; // 默认5分钟
    const POSITION_KEY = 'bilibiliStudyAssistant_telemetryPosition';

    // 分类中文名映射（方便你看懂）
    var CATEGORY_LABELS = {
        STATE:        '状态',
        MULTI_TAB:    '多窗口',
        INTERVENTION: '干预',
        TIMING:       '计时',
        ERROR:        '错误',
        PERF:         '性能',
        USER_ACTION:  '用户操作',
        SNAPSHOT:     '快照'
    };

    // 分类颜色映射
    var CATEGORY_COLORS = {
        STATE:        '#3b82f6',  // 蓝色
        MULTI_TAB:    '#8b5cf6',  // 紫色
        INTERVENTION: '#f59e0b',  // 橙色
        TIMING:       '#10b981',  // 绿色
        ERROR:        '#ef4444',  // 红色
        PERF:         '#6366f1',  // 靛蓝
        USER_ACTION:  '#ec4899',  // 粉色
        SNAPSHOT:     '#6b7280'   // 灰色
    };

    // ── 拖拽实现 ──
    function _makeDraggable(header, win) {
        var offsetX = 0, offsetY = 0, mouseX = 0, mouseY = 0;
        header.addEventListener('mousedown', function(e) {
            e.preventDefault();
            offsetX = e.clientX - win.offsetLeft;
            offsetY = e.clientY - win.offsetTop;
            document.addEventListener('mousemove', _onMouseMove);
            document.addEventListener('mouseup', _onMouseUp);
        });
        function _onMouseMove(e) {
            win.style.left = (e.clientX - offsetX) + 'px';
            win.style.top = (e.clientY - offsetY) + 'px';
        }
        function _onMouseUp() {
            document.removeEventListener('mousemove', _onMouseMove);
            document.removeEventListener('mouseup', _onMouseUp);
            _savePosition();
        }
    }

    // ── 保存位置 ──
    function _savePosition() {
        if (!_floatWin) return;
        try {
            localStorage.setItem(POSITION_KEY, JSON.stringify({
                x: _floatWin.offsetLeft,
                y: _floatWin.offsetTop
            }));
        } catch (e) {
            console.warn('[B站学习助手] Failed to save telemetry window position:', e);
        }
    }

    // ── 主入口：打开调试面板 ──
    function open() {
        // 如果已存在则直接显示
        if (_floatWin) {
            _floatWin.style.display = 'block';
            _refreshView();
            return;
        }

        // 创建浮动窗口
        _floatWin = document.createElement('div');
        _floatWin.id = 'bilibili-study-telemetry-float';
        _floatWin.className = 'bilibili-study-telemetry-float';
        _floatWin.innerHTML = `
            <div class="bilibili-study-telemetry-float-header">
                <span class="bilibili-study-telemetry-float-title">🔍 调试面板</span>
                <span class="bilibili-study-telemetry-float-close" id="bilibili-study-telemetry-float-close">✕</span>
            </div>
            <div class="bilibili-study-telemetry-float-tabs">
                <span class="bilibili-study-telemetry-float-tab active" data-view="logs">📋 日志</span>
                <span class="bilibili-study-telemetry-float-tab" data-view="metrics">📊 指标</span>
                <span class="bilibili-study-telemetry-float-tab" data-view="traces">🔗 追踪</span>
            </div>
            <div class="bilibili-study-telemetry-float-content" id="bilibili-study-telemetry-float-content">
                <div class="bilibili-study-telemetry-float-loading">加载中...</div>
            </div>
        `;

        document.body.appendChild(_floatWin);

        // 恢复上次位置
        try {
            var saved = localStorage.getItem(POSITION_KEY);
            if (saved) {
                var pos = JSON.parse(saved);
                _floatWin.style.left = pos.x + 'px';
                _floatWin.style.top = pos.y + 'px';
            } else {
                _floatWin.style.left = '20px';
                _floatWin.style.top = '80px';
            }
        } catch (e) {
            _floatWin.style.left = '20px';
            _floatWin.style.top = '80px';
        }

        // 绑定拖拽（header 区域）
        var header = _floatWin.querySelector('.bilibili-study-telemetry-float-header');
        _makeDraggable(header, _floatWin);

        // 绑定关闭事件
        _floatWin.querySelector('#bilibili-study-telemetry-float-close').addEventListener('click', close);

        // 绑定 tab 切换
        var tabs = _floatWin.querySelectorAll('.bilibili-study-telemetry-float-tab');
        for (var i = 0; i < tabs.length; i++) {
            (function(tab) {
                tab.addEventListener('click', function() {
                    var view = this.getAttribute('data-view');
                    switchView(view);
                });
            })(tabs[i]);
        }

        // 应用暗色模式
        _applyDarkMode();

        // 首次渲染
        _displayCount = 10;
        _currentFilter = null;
        _refreshView();

        // 启动自动刷新（每5秒）
        if (_refreshTimer) clearInterval(_refreshTimer);
        _refreshTimer = setInterval(_refreshView, 5000);

        // 启动自动保存
        _startAutoSave();
    }

    // ── 关闭调试面板 ──
    function close() {
        if (_refreshTimer) {
            clearInterval(_refreshTimer);
            _refreshTimer = null;
        }
        if (_autoSaveTimer) {
            clearInterval(_autoSaveTimer);
            _autoSaveTimer = null;
        }
        if (_floatWin) {
            _floatWin.style.display = 'none';
        }
    }

    // ── 彻底销毁 ──
    function destroy() {
        close();
        if (_floatWin) {
            _floatWin.remove();
            _floatWin = null;
        }
    }

    // ── 切换视图 ──
    function switchView(viewName) {
        _activeView = viewName;
        _displayCount = 10;  // 切换视图时重置显示条数
        _currentFilter = null;

        // 更新 tab 高亮
        if (_floatWin) {
            var tabs = _floatWin.querySelectorAll('.bilibili-study-telemetry-float-tab');
            for (var i = 0; i < tabs.length; i++) {
                tabs[i].classList.remove('active');
                if (tabs[i].getAttribute('data-view') === viewName) {
                    tabs[i].classList.add('active');
                }
            }
        }
        _refreshView();
    }

    // ── 刷新当前视图 ──
    function _refreshView() {
        if (!_floatWin) return;
        var content = _floatWin.querySelector('#bilibili-study-telemetry-float-content');
        if (!content) return;

        switch (_activeView) {
            case 'logs':    _renderLogs(content);    break;
            case 'metrics': _renderMetrics(content); break;
            case 'traces':  _renderTraces(content);  break;
        }
    }

    // ── Logs 视图（渐进式披露） ──
    function _renderLogs(container) {
        var events = DebugTelemetry.getEvents();
        // 如果有筛选条件
        var filtered = events;
        if (_currentFilter) {
            filtered = DebugTelemetry.query(_currentFilter);
        }

        var totalEvents = filtered.length;
        var displayEvents = filtered.slice(-_displayCount);
        var errorCount = 0;
        for (var i = 0; i < filtered.length; i++) {
            if (filtered[i].category === 'ERROR') errorCount++;
        }

        var html = '';
        // 筛选栏
        html += '<div class="bilibili-study-telemetry-float-filter">';
        html += '<span class="bilibili-study-telemetry-float-filter-label">筛选:</span> ';
        var cats = ['', 'STATE', 'MULTI_TAB', 'INTERVENTION', 'ERROR', 'USER_ACTION'];
        for (var c = 0; c < cats.length; c++) {
            var cat = cats[c];
            var label = cat ? (CATEGORY_LABELS[cat] || cat) : '全部';
            var active = (!_currentFilter && !cat) || (_currentFilter && _currentFilter.category === cat) ? ' active' : '';
            html += '<span class="bilibili-study-telemetry-float-filter-btn' + active + '" data-cat="' + cat + '">' + label + '</span>';
        }
        html += '</div>';

        // 概要栏（渐进式披露第一步：先看总数）
        html += '<div class="bilibili-study-telemetry-float-summary">';
        html += '总计 ' + totalEvents + ' 条 | 当前显示 ' + _displayCount + ' 条 | 错误 ' + errorCount + ' 条';
        html += '</div>';

        // 事件列表（渐进式披露第二步：逐条截断）
        html += '<div class="bilibili-study-telemetry-float-list">';
        for (var e = displayEvents.length - 1; e >= 0; e--) {
            var ev = displayEvents[e];
            var time = new Date(ev.ts);
            var timeStr = time.getHours().toString().padStart(2,'0') + ':' +
                          time.getMinutes().toString().padStart(2,'0') + ':' +
                          time.getSeconds().toString().padStart(2,'0');
            var catColor = CATEGORY_COLORS[ev.category] || '#6b7280';
            var catLabel = CATEGORY_LABELS[ev.category] || ev.category;
            var isError = ev.category === 'ERROR';
            var rowClass = isError ? ' bilibili-study-telemetry-float-row-error' : '';

            // 每行只显示：时间 + 分类标签 + 事件名（渐进式披露）
            html += '<div class="bilibili-study-telemetry-float-row' + rowClass + '" data-idx="' + e + '">';
            html += '<span class="bilibili-study-telemetry-float-row-time">' + timeStr + '</span>';
            html += '<span class="bilibili-study-telemetry-float-row-cat" style="color:' + catColor + '">[' + catLabel + ']</span>';
            html += '<span class="bilibili-study-telemetry-float-row-event">' + _escapeHtml(ev.event) + '</span>';
            // 有 data 时显示展开箭头（渐进式披露第三步：点击展开）
            if (ev.data) {
                html += '<span class="bilibili-study-telemetry-float-row-expand">▶</span>';
                html += '<div class="bilibili-study-telemetry-float-row-detail" style="display:none"><pre>' + _escapeHtml(JSON.stringify(ev.data, null, 2)) + '</pre></div>';
            }
            html += '</div>';
        }
        html += '</div>';

        // 加载更多按钮（渐进式披露第四步）
        if (_displayCount < totalEvents) {
            html += '<div class="bilibili-study-telemetry-float-more" id="bilibili-study-telemetry-float-load-more">加载更多（+10）</div>';
        }

        container.innerHTML = html;

        // 绑定展开事件
        var rows = container.querySelectorAll('.bilibili-study-telemetry-float-row');
        for (var r = 0; r < rows.length; r++) {
            (function(row) {
                var expand = row.querySelector('.bilibili-study-telemetry-float-row-expand');
                var detail = row.querySelector('.bilibili-study-telemetry-float-row-detail');
                if (expand && detail) {
                    row.addEventListener('click', function(e) {
                        // 点按钮时不要触发
                        if (e.target.classList.contains('bilibili-study-telemetry-float-filter-btn')) return;
                        var isHidden = detail.style.display === 'none' || detail.style.display === '';
                        detail.style.display = isHidden ? 'block' : 'none';
                        expand.textContent = isHidden ? '▼' : '▶';
                    });
                }
            })(rows[r]);
        }

        // 绑定筛选事件
        var filterBtns = container.querySelectorAll('.bilibili-study-telemetry-float-filter-btn');
        for (var f = 0; f < filterBtns.length; f++) {
            (function(btn) {
                btn.addEventListener('click', function() {
                    var cat = this.getAttribute('data-cat');
                    _currentFilter = cat ? { category: cat } : null;
                    _displayCount = 10;
                    _refreshView();
                });
            })(filterBtns[f]);
        }

        // 绑定加载更多
        var loadMore = container.querySelector('#bilibili-study-telemetry-float-load-more');
        if (loadMore) {
            loadMore.addEventListener('click', function() {
                _displayCount += 10;
                _refreshView();
            });
        }
    }

    // ── Metrics 视图 ──
    function _renderMetrics(container) {
        var metrics = DebugTelemetry.getMetrics();

        // 从 tabRegistry 获取其他窗口信息
        var remoteWindows = _getRemoteWindowInfo();

        var html = '';

        // 本窗口指标
        html += '<div class="bilibili-study-telemetry-float-section-title">本窗口指标</div>';
        html += '<div class="bilibili-study-telemetry-float-metrics-grid">';
        html += '<div class="bilibili-study-telemetry-float-metric"><span class="bilibili-study-telemetry-float-metric-label">引导弹窗</span><span class="bilibili-study-telemetry-float-metric-val">' + metrics.guidePopupsShown + '</span></div>';
        html += '<div class="bilibili-study-telemetry-float-metric"><span class="bilibili-study-telemetry-float-metric-label">Master选举</span><span class="bilibili-study-telemetry-float-metric-val">' + metrics.masterElections + '</span></div>';
        html += '<div class="bilibili-study-telemetry-float-metric"><span class="bilibili-study-telemetry-float-metric-label">自动导航</span><span class="bilibili-study-telemetry-float-metric-val">' + metrics.autoNavigations + '</span></div>';
        html += '<div class="bilibili-study-telemetry-float-metric"><span class="bilibili-study-telemetry-float-metric-label">Toast显示</span><span class="bilibili-study-telemetry-float-metric-val">' + metrics.toastShown + '</span></div>';
        html += '<div class="bilibili-study-telemetry-float-metric"><span class="bilibili-study-telemetry-float-metric-label">错误事件</span><span class="bilibili-study-telemetry-float-metric-val">' + metrics.errorEvents + '</span></div>';
        html += '<div class="bilibili-study-telemetry-float-metric"><span class="bilibili-study-telemetry-float-metric-label">干预触发</span><span class="bilibili-study-telemetry-float-metric-val">' + metrics.interventionsTriggered + '</span></div>';
        html += '</div>';

        // 其他窗口信息（从 tabRegistry 读取）
        if (remoteWindows.length > 0) {
            html += '<div class="bilibili-study-telemetry-float-section-title">其他窗口</div>';
            for (var w = 0; w < remoteWindows.length; w++) {
                var win = remoteWindows[w];
                var statusClass = win.isOnline ? 'bilibili-study-telemetry-float-window-online' : 'bilibili-study-telemetry-float-window-offline';
                html += '<div class="bilibili-study-telemetry-float-window ' + statusClass + '">';
                html += '<span>' + (win.tabId || '').substring(0, 15) + '...</span>';
                html += '<span>' + (win.isOnline ? '在线' : '离线') + '</span>';
                html += '<span>' + (win.isWhitelisted ? '学习' : '分心') + '</span>';
                html += '</div>';
            }
        } else {
            html += '<div class="bilibili-study-telemetry-float-section-title">其他窗口</div>';
            html += '<div class="bilibili-study-telemetry-float-empty">无其他活跃窗口</div>';
        }

        // 操作按钮
        html += '<div class="bilibili-study-telemetry-float-actions">';
        html += '<button class="bilibili-study-telemetry-float-btn" id="bilibili-study-telemetry-float-reset-metrics">重置计数</button>';
        html += '<button class="bilibili-study-telemetry-float-btn" id="bilibili-study-telemetry-float-export">导出 JSON</button>';
        html += '</div>';

        container.innerHTML = html;

        // 绑定重置
        var resetBtn = container.querySelector('#bilibili-study-telemetry-float-reset-metrics');
        if (resetBtn) {
            resetBtn.addEventListener('click', function() {
                DebugTelemetry.resetMetrics();
                _refreshView();
            });
        }

        // 绑定导出
        var exportBtn = container.querySelector('#bilibili-study-telemetry-float-export');
        if (exportBtn) {
            exportBtn.addEventListener('click', function() {
                _doExport();
            });
        }
    }

    // ── Traces 时间线视图 ──
    function _renderTraces(container) {
        var events = DebugTelemetry.dumpMultiWindowTrace({ windowMs: 30000 });
        var html = '';

        html += '<div class="bilibili-study-telemetry-float-section-title">多窗口事件流（最近 30 秒）</div>';

        if (events.length === 0) {
            html += '<div class="bilibili-study-telemetry-float-empty">近 30 秒无多窗口事件</div>';
        } else {
            html += '<div class="bilibili-study-telemetry-float-timeline">';
            for (var i = 0; i < events.length; i++) {
                var ev = events[i];
                var time = new Date(ev.ts);
                var timeStr = time.getHours().toString().padStart(2,'0') + ':' +
                              time.getMinutes().toString().padStart(2,'0') + ':' +
                              time.getSeconds().toString().padStart(2,'0');
                var catColor = CATEGORY_COLORS[ev.category] || '#6b7280';
                html += '<div class="bilibili-study-telemetry-float-trace-item">';
                html += '<span class="bilibili-study-telemetry-float-trace-time">' + timeStr + '</span>';
                html += '<span class="bilibili-study-telemetry-float-trace-dot" style="background:' + catColor + '"></span>';
                html += '<span class="bilibili-study-telemetry-float-trace-text">[' + (CATEGORY_LABELS[ev.category] || ev.category) + '] ' + _escapeHtml(ev.event) + '</span>';
                // 有 data 时显示摘要
                if (ev.data) {
                    var summary = _escapeHtml(JSON.stringify(ev.data).substring(0, 100));
                    html += '<div class="bilibili-study-telemetry-float-trace-data">' + summary + '</div>';
                }
                html += '</div>';
            }
            html += '</div>';
        }

        // 刷新按钮
        html += '<div class="bilibili-study-telemetry-float-actions">';
        html += '<button class="bilibili-study-telemetry-float-btn" id="bilibili-study-telemetry-float-refresh-traces">刷新</button>';
        html += '</div>';

        container.innerHTML = html;

        var refreshBtn = container.querySelector('#bilibili-study-telemetry-float-refresh-traces');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', function() {
                _refreshView();
            });
        }
    }

    // ── 从 tabRegistry 获取其他窗口信息 ──
    function _getRemoteWindowInfo() {
        try {
            var stored = localStorage.getItem('bilibiliStudy_tabRegistry');
            if (!stored) return [];
            var parsed = JSON.parse(stored);
            var tabs = parsed.tabs || {};
            var result = [];
            var myTabId = typeof TabManager !== 'undefined' && TabManager.TAB_ID ? TabManager.TAB_ID : '';
            var now = Date.now();
            for (var tabId in tabs) {
                if (tabId === myTabId) continue;
                var tab = tabs[tabId];
                var age = now - (tab.lastHeartbeat || 0);
                result.push({
                    tabId: tabId,
                    isOnline: age < 8000,
                    isWhitelisted: tab.isWhitelisted,
                    isVisible: tab.isVisible,
                    bv: tab.bv || ''
                });
            }
            return result;
        } catch (e) {
            return [];
        }
    }

    // ── 导出 ──
    function _doExport() {
        var json = DebugTelemetry.exportJSON();
        var now = new Date();
        var filename = 'bilibili-telemetry-' +
            now.getFullYear() + '-' +
            (now.getMonth()+1).toString().padStart(2,'0') + '-' +
            now.getDate().toString().padStart(2,'0') + '-' +
            now.getHours().toString().padStart(2,'0') +
            now.getMinutes().toString().padStart(2,'0') +
            now.getSeconds().toString().padStart(2,'0') + '.json';

        var blob = new Blob([json], { type: 'application/json' });
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    // ── 自动保存 ──
    function _startAutoSave() {
        if (_autoSaveTimer) clearInterval(_autoSaveTimer);
        // 默认每5分钟自动保存一次
        _autoSaveTimer = setInterval(function() {
            _doExport();
        }, _autoSaveInterval);
    }

    // ── 暗色模式 ──
    function _applyDarkMode() {
        if (!_floatWin) return;
        var isDark = document.documentElement.classList.contains('bilibili-study-dark-mode') ||
                     document.body.classList.contains('bilibili-study-dark-mode');
        if (isDark) {
            _floatWin.classList.add('bilibili-study-dark-mode');
        }
    }

    // ── HTML 转义 ──
    function _escapeHtml(str) {
        if (str === null || str === undefined) return '';
        var div = document.createElement('div');
        div.textContent = typeof str === 'string' ? str : String(str);
        return div.innerHTML;
    }

    return {
        open: open,
        close: close,
        destroy: destroy,
        switchView: switchView
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
                        <span class="bilibili-study-stat-value">${currentStage} / ${ConfigManager.getEffectiveInterventionStages().length - 1}</span>
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
                <div class="bilibili-study-vocab-warning">
                    <div class="bilibili-study-vocab-warning-header">
                        <span class="bilibili-study-vocab-warning-icon">⚠️</span>
                        <span class="bilibili-study-vocab-warning-title">词库不足提醒</span>
                    </div>
                    <p class="bilibili-study-vocab-warning-text">
                        可学习单词仅剩 <strong>${unmasteredCount}</strong> 个，建议添加更多词汇以保持学习效果。
                    </p>
                </div>`;
        } else if (unmasteredCount === 0) {
            vocabWarning = `
                <div class="bilibili-study-vocab-critical">
                    <div class="bilibili-study-vocab-critical-header">
                        <span class="bilibili-study-vocab-critical-icon">🔴</span>
                        <span class="bilibili-study-vocab-critical-title">词库已全部掌握</span>
                    </div>
                    <p class="bilibili-study-vocab-critical-text">
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
                <div class="bilibili-study-module-header">
                    <h3 class="bilibili-study-module-title">📚 单词学习</h3>
                    <div class="bilibili-study-module-actions">
                        <button id="bilibili-study-refresh-vocab"
                                class="bilibili-study-btn bilibili-study-btn-sm bilibili-study-btn-primary"
                                title="刷新词库信息，查看最新学习状态（不清除记录）">
                            🔄 刷新词库
                        </button>
                        <button id="bilibili-study-reset-vocab"
                                class="bilibili-study-btn bilibili-study-btn-sm bilibili-study-btn-secondary"
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

    // Render Module 6: History video records (v1.2.4)
    // 显示用户刷视频离开的记录，非学习时段结束后解锁
    function renderModule6() {
        const historyVideos = HistoryVideoTracker.getRecent(10);
        const isStudyTime = ConfigManager.isStudyTime();
        const isRestPeriod = ConfigManager.isRestPeriod();
        // 解锁条件：非学习时段 或 休息时段
        const isUnlocked = !isStudyTime || isRestPeriod;

        if (!isUnlocked) {
            return `
                <div class="bilibili-study-modal-module" id="bilibili-study-module6-wrapper">
                    <h3 class="bilibili-study-module-title">📼 历史视频</h3>
                    <div class="bilibili-study-module-content">
                        <div class="bilibili-study-locked-panel">
                            <div class="bilibili-study-locked-icon">🔒</div>
                            <p class="bilibili-study-locked-text">学习时段内不可查看，休息后再来回顾吧</p>
                        </div>
                    </div>
                </div>
            `;
        }

        if (historyVideos.length === 0) {
            return `
                <div class="bilibili-study-modal-module" id="bilibili-study-module6-wrapper">
                    <h3 class="bilibili-study-module-title">📼 历史视频</h3>
                    <div class="bilibili-study-module-content">
                        <p class="bilibili-study-no-data">暂无历史视频记录</p>
                    </div>
                </div>
            `;
        }

        const itemsHtml = historyVideos.map(v => {
            const leftTime = v.leftAt ? new Date(v.leftAt) : null;
            const timeStr = leftTime
                ? `${leftTime.getHours().toString().padStart(2, '0')}:${leftTime.getMinutes().toString().padStart(2, '0')}`
                : '';
            const durationStr = v.watchDuration > 0
                ? `${Math.floor(v.watchDuration / 60)}分${v.watchDuration % 60}秒`
                : '';
            // 离开原因映射
            const reasonMap = {
                'intervention': '🎯 干预跳转',
                'user_close': '👋 关闭页面',
                'user_navigate': '🔀 自主离开',
                'return_learning': '📚 返回学习',
                'multiwindow': '🪟 多窗口切换'
            };
            const reasonLabel = reasonMap[v.reason] || v.reason || '';
            // 截断标题
            const shortTitle = v.title.length > 28 ? v.title.slice(0, 28) + '…' : v.title;

            return `
                <div class="bilibili-study-history-item">
                    <a href="https://www.bilibili.com/video/${v.bv}" target="_blank"
                       class="bilibili-study-history-link"
                       title="${v.title}">
                        <div class="bilibili-study-history-title">${shortTitle}</div>
                        <div class="bilibili-study-history-meta">
                            <span>${v.bv}</span>
                            ${durationStr ? `<span class="bilibili-study-history-meta-extra">⏱${durationStr}</span>` : ''}
                        </div>
                    </a>
                    <div class="bilibili-study-history-right">
                        <div class="bilibili-study-history-time">${timeStr}</div>
                        <div class="bilibili-study-history-reason">${reasonLabel}</div>
                    </div>
                </div>
            `;
        }).join('');

        return `
            <div class="bilibili-study-modal-module" id="bilibili-study-module6-wrapper">
                <div class="bilibili-study-module-header">
                    <h3 class="bilibili-study-module-title">📼 历史视频</h3>
                    <button id="bilibili-study-clear-history"
                            class="bilibili-study-btn bilibili-study-btn-sm bilibili-study-btn-secondary"
                            title="清空历史视频记录">
                        🗑️ 清空
                    </button>
                </div>
                <div class="bilibili-study-module-content">
                    ${itemsHtml}
                </div>
            </div>
        `;
    }

    // Close modal
    function close() {
        if (modalElement) {
            // v1.2.5: 从 ModalManager 注销
            ModalManager.dismiss('detail-modal');
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
                                id="bilibili-study-open-telemetry"
                                style="padding: 6px 12px; font-size: 14px; cursor: pointer;"
                                title="调试面板">
                            🔍 调试
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
                    ${renderModule6()}
                </div>
            </div>
        `;

        document.body.appendChild(modalElement);
        isOpen = true;

        // v1.2.5: 注册到 ModalManager
        ModalManager.register('detail-modal', ModalManager.LEVELS.DETAIL, modalElement);

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

        // Telemetry button (v1.4.0)
        const telemetryBtn = document.getElementById('bilibili-study-open-telemetry');
        if (telemetryBtn) {
            telemetryBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                TelemetryUI.open();
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
                    // v1.2.3: 同步到全局状态
                    GlobalStateManager.syncFromAppState();
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

            // v1.2.4: 清空历史视频记录
            const clearHistoryBtn = document.getElementById('bilibili-study-clear-history');
            if (clearHistoryBtn) {
                clearHistoryBtn.addEventListener('click', function() {
                    if (confirm('确定要清空所有历史视频记录吗？')) {
                        HistoryVideoTracker.clear();
                        // 刷新 Module 6
                        const m6 = document.getElementById('bilibili-study-module6-wrapper');
                        if (m6) {
                            const t = document.createElement('div');
                            t.innerHTML = renderModule6();
                            m6.replaceWith(t.firstElementChild);
                        }
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

        // v1.2.5: 注册到 ModalManager
        ModalManager.register('whitelist-modal', ModalManager.LEVELS.CONFIRM, modal);

        document.getElementById('bilibili-study-whitelist-confirm').addEventListener('click', function() {
            const courseName = document.getElementById('bilibili-study-whitelist-course-name').value.trim();
            const result = ConfigManager.addToWhitelist(currentBV, courseName);

            if (result.success) {
                ModalManager.dismiss('whitelist-modal');
                close();
            } else {
                const errorDiv = document.getElementById('bilibili-study-whitelist-error');
                errorDiv.textContent = result.message;
                errorDiv.style.display = 'block';
            }
        });

        document.getElementById('bilibili-study-whitelist-cancel').addEventListener('click', function() {
            ModalManager.dismiss('whitelist-modal');
        });

        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                ModalManager.dismiss('whitelist-modal');
            }
        });

        modal.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                ModalManager.dismiss('whitelist-modal');
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
                    <button class="bilibili-study-settings-tab ${activeSettingsTab === 'intervention' ? 'active' : ''}" data-tab="intervention">🎯 干预设置</button>
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

        // v1.2.5: 注册到 ModalManager
        ModalManager.register('settings-modal', ModalManager.LEVELS.SETTINGS, settingsElement);

        bindSettingsEvents();
    }

    function closeSettings() {
        if (settingsElement) {
            // v1.2.5: 从 ModalManager 注销
            ModalManager.dismiss('settings-modal');
            settingsElement = null;
        }
    }

    function renderSettingsContent(tab, config) {
        switch (tab) {
            case 'periods': return renderPeriodsSettings(config);
            case 'whitelist': return renderWhitelistSettings(config);
            case 'vocab': return renderVocabSettings(config);
            case 'intervention': return renderInterventionSettings(config);
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

    // v1.2.4: 干预设置 tab
    function renderInterventionSettings(config) {
        const level = config.interventionLevel || 'standard';
        const visualLevel = config.visualEffectLevel || 'heavy';
        const resetStrategy = config.resetStrategy || 'period';
        const resetDuration = config.resetDuration || 30;
        const resetInterval = config.resetInterval || 30;

        // 干预等级描述
        const levelDescriptions = {
            gentle:   '温和：分心3分钟才开始干预，弹窗间隔较长',
            standard: '标准：分心1分钟开始干预，平衡提醒与体验',
            strict:   '严格：分心30秒即干预，弹窗密集，强力约束'
        };

        // 视觉效果描述
        const visualDescriptions = {
            none:   '无视觉效果：页面外观不变，仅弹窗提醒',
            light:  '轻度：轻微灰度变化，视觉影响较小',
            medium: '中度：明显色彩翻转和灰度，保持可读性',
            heavy:  '重度：强烈色彩翻转和灰度，视觉冲击大'
        };

        // 各等级的阶段时间表
        const stageTimelines = {
            gentle:   ['3min 视觉', '10min 弹窗2min', '20min 弹窗1min', '40min 弹窗30s'],
            standard: ['1min 视觉', '3min 弹窗1min', '10min 弹窗30s', '20min 弹窗15s'],
            strict:   ['30s 视觉', '1min 弹窗30s', '3min 弹窗15s', '10min 弹窗10s']
        };
        const timeline = stageTimelines[level] || stageTimelines.standard;

        return `
            <div class="bilibili-study-settings-group">
                <p class="bilibili-study-settings-group-title">🎯 干预等级</p>
                <p class="bilibili-study-settings-hint" style="margin: 0 0 10px 0;">控制干预的触发速度和弹窗频率</p>
                <div class="bilibili-study-settings-option-group">
                    <label class="bilibili-study-settings-radio">
                        <input type="radio" name="interventionLevel" value="gentle" ${level === 'gentle' ? 'checked' : ''}>
                        <span>🕊️ 温和</span>
                    </label>
                    <label class="bilibili-study-settings-radio">
                        <input type="radio" name="interventionLevel" value="standard" ${level === 'standard' ? 'checked' : ''}>
                        <span>⚖️ 标准</span>
                    </label>
                    <label class="bilibili-study-settings-radio">
                        <input type="radio" name="interventionLevel" value="strict" ${level === 'strict' ? 'checked' : ''}>
                        <span>🔥 严格</span>
                    </label>
                </div>
                <p class="bilibili-study-settings-hint" style="margin: 6px 0 0 0; font-style: italic;">${levelDescriptions[level] || ''}</p>
                <div class="bilibili-study-stage-timeline">
                    <p class="stage-timeline-title">阶段时间表：</p>
                    ${timeline.map((t, i) => `<div class="bilibili-study-stage-timeline-item">阶段${i + 1}: ${t}</div>`).join('')}
                </div>
            </div>

            <div class="bilibili-study-settings-group">
                <p class="bilibili-study-settings-group-title">👁️ 视觉效果强度</p>
                <p class="bilibili-study-settings-hint" style="margin: 0 0 10px 0;">控制分心时页面的色彩翻转和灰度程度</p>
                <div class="bilibili-study-settings-option-group">
                    <label class="bilibili-study-settings-radio">
                        <input type="radio" name="visualEffectLevel" value="none" ${visualLevel === 'none' ? 'checked' : ''}>
                        <span>❌ 无</span>
                    </label>
                    <label class="bilibili-study-settings-radio">
                        <input type="radio" name="visualEffectLevel" value="light" ${visualLevel === 'light' ? 'checked' : ''}>
                        <span>🟢 轻度</span>
                    </label>
                    <label class="bilibili-study-settings-radio">
                        <input type="radio" name="visualEffectLevel" value="medium" ${visualLevel === 'medium' ? 'checked' : ''}>
                        <span>🟡 中度</span>
                    </label>
                    <label class="bilibili-study-settings-radio">
                        <input type="radio" name="visualEffectLevel" value="heavy" ${visualLevel === 'heavy' ? 'checked' : ''}>
                        <span>🔴 重度</span>
                    </label>
                </div>
                <p class="bilibili-study-settings-hint" style="margin: 6px 0 0 0; font-style: italic;">${visualDescriptions[visualLevel] || ''}</p>
            </div>

            <div class="bilibili-study-settings-group">
                <p class="bilibili-study-settings-group-title">🔄 干预重置策略</p>
                <p class="bilibili-study-settings-hint" style="margin: 0 0 10px 0;">决定干预状态何时重置回初始</p>
                <div class="bilibili-study-settings-option-group">
                    <label class="bilibili-study-settings-radio">
                        <input type="radio" name="resetStrategy" value="period" ${resetStrategy === 'period' ? 'checked' : ''}>
                        <span>⏰ 跟随时段</span>
                    </label>
                    <label class="bilibili-study-settings-radio">
                        <input type="radio" name="resetStrategy" value="duration" ${resetStrategy === 'duration' ? 'checked' : ''}>
                        <span>⏱️ 固定时长</span>
                    </label>
                    <label class="bilibili-study-settings-radio">
                        <input type="radio" name="resetStrategy" value="interval" ${resetStrategy === 'interval' ? 'checked' : ''}>
                        <span>📐 固定间隔</span>
                    </label>
                </div>
                <div id="bilibili-study-reset-duration-row" class="bilibili-study-reset-param-row" style="display: ${resetStrategy === 'duration' ? 'flex' : 'none'};">
                    <label class="bilibili-study-reset-label">累计学习</label>
                    <input type="number" id="bilibili-study-reset-duration" value="${resetDuration}" min="5" max="120"
                           class="bilibili-study-reset-input">
                    <span class="bilibili-study-reset-label">分钟后重置</span>
                </div>
                <div id="bilibili-study-reset-interval-row" class="bilibili-study-reset-param-row" style="display: ${resetStrategy === 'interval' ? 'flex' : 'none'};">
                    <label class="bilibili-study-reset-label">离开超过</label>
                    <input type="number" id="bilibili-study-reset-interval" value="${resetInterval}" min="5" max="120"
                           class="bilibili-study-reset-input">
                    <span class="bilibili-study-reset-label">分钟后重置</span>
                </div>
            </div>

            <div class="bilibili-study-settings-group">
                <p class="bilibili-study-settings-group-title">🚀 自动导航（P0）</p>
                <p class="bilibili-study-settings-hint" style="margin: 0 0 10px 0;">关闭分心弹窗后显示3秒倒计时，结束后自动跳转到白名单视频</p>
                <div class="bilibili-study-settings-option-group">
                    <label class="bilibili-study-settings-radio">
                        <input type="radio" name="autoNavigate" value="true" ${config.autoNavigate ? 'checked' : ''}>
                        <span>✅ 开启</span>
                    </label>
                    <label class="bilibili-study-settings-radio">
                        <input type="radio" name="autoNavigate" value="false" ${!config.autoNavigate ? 'checked' : ''}>
                        <span>❌ 关闭</span>
                    </label>
                </div>
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

        // v1.2.4: === 干预设置 tab ===
        // resetStrategy 联动显示/隐藏参数输入框
        settingsElement?.querySelectorAll('input[name="resetStrategy"]').forEach(radio => {
            radio.addEventListener('change', function() {
                const durationRow = document.getElementById('bilibili-study-reset-duration-row');
                const intervalRow = document.getElementById('bilibili-study-reset-interval-row');
                if (durationRow) durationRow.style.display = this.value === 'duration' ? 'flex' : 'none';
                if (intervalRow) intervalRow.style.display = this.value === 'interval' ? 'flex' : 'none';
            });
        });

        // 干预等级切换时更新描述和时间表
        settingsElement?.querySelectorAll('input[name="interventionLevel"]').forEach(radio => {
            radio.addEventListener('change', function() {
                // 重新渲染干预设置面板以更新描述
                const body = document.getElementById('bilibili-study-settings-body');
                if (body) {
                    const config = ConfigManager.get();
                    // 临时更新选择的等级
                    config.interventionLevel = this.value;
                    body.innerHTML = renderSettingsContent('intervention', config);
                    bindSettingsTabEvents();
                }
            });
        });

        // 视觉效果切换时更新描述
        settingsElement?.querySelectorAll('input[name="visualEffectLevel"]').forEach(radio => {
            radio.addEventListener('change', function() {
                const body = document.getElementById('bilibili-study-settings-body');
                if (body) {
                    const config = ConfigManager.get();
                    config.visualEffectLevel = this.value;
                    body.innerHTML = renderSettingsContent('intervention', config);
                    bindSettingsTabEvents();
                }
            });
        });

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

        // v1.2.4: === 保存干预设置 ===
        if (activeSettingsTab === 'intervention') {
            const levelRadio = settingsElement?.querySelector('input[name="interventionLevel"]:checked');
            const visualRadio = settingsElement?.querySelector('input[name="visualEffectLevel"]:checked');
            const strategyRadio = settingsElement?.querySelector('input[name="resetStrategy"]:checked');
            const autoNavRadio = settingsElement?.querySelector('input[name="autoNavigate"]:checked');

            const newLevel = levelRadio ? levelRadio.value : null;
            const newVisual = visualRadio ? visualRadio.value : null;
            const newStrategy = strategyRadio ? strategyRadio.value : null;

            const config = ConfigManager.get();

            if (newLevel && newLevel !== config.interventionLevel) {
                ConfigManager.save({ interventionLevel: newLevel });
                hasChanges = true;
            }
            if (newVisual && newVisual !== config.visualEffectLevel) {
                ConfigManager.save({ visualEffectLevel: newVisual });
                hasChanges = true;
            }
            if (newStrategy && newStrategy !== config.resetStrategy) {
                ConfigManager.save({ resetStrategy: newStrategy });
                hasChanges = true;
            }

            // 保存固定时长/间隔参数
            const durationInput = document.getElementById('bilibili-study-reset-duration');
            const intervalInput = document.getElementById('bilibili-study-reset-interval');
            if (durationInput) {
                const dur = parseInt(durationInput.value) || 30;
                if (dur !== config.resetDuration) {
                    ConfigManager.save({ resetDuration: Math.max(5, Math.min(120, dur)) });
                    hasChanges = true;
                }
            }
            if (intervalInput) {
                const intv = parseInt(intervalInput.value) || 30;
                if (intv !== config.resetInterval) {
                    ConfigManager.save({ resetInterval: Math.max(5, Math.min(120, intv)) });
                    hasChanges = true;
                }
            }

            // v1.3.0: 保存自动导航设置
            if (autoNavRadio) {
                const newAutoNav = autoNavRadio.value === 'true';
                if (newAutoNav !== config.autoNavigate) {
                    ConfigManager.save({ autoNavigate: newAutoNav });
                    hasChanges = true;
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
            // v1.4.1
            DebugTelemetry.incrementMetric('settingsChanges');
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
// ModalManager Module (v1.2.5)
// 统一管理弹窗层级、互斥、z-index
// ==========================================
const ModalManager = (function() {
    // 弹窗层级定义（从低到高）
    const LEVELS = {
        FLOATING:   0,  // 浮窗
        TOAST:      1,  // Toast 提醒（v1.3.0 预留）
        DETAIL:     2,  // 详情面板
        SETTINGS:   3,  // 设置面板
        CONFIRM:    4,  // 确认弹窗 / 添加白名单弹窗
        WORD:       5,  // 单词验证弹窗
        AGGRESSIVE: 6,  // 强拦截全屏遮罩（v1.3.0 预留）
        MULTI_TAB:  7   // 多窗口引导弹窗（v1.2.6）
    };

    // z-index 基数
    const Z_BASE = 1000000;

    // 当前激活的弹窗栈
    let activeModals = [];  // [{ id, level, element }]

    /**
     * 获取弹窗的 z-index
     * @param {number} level - 弹窗层级
     * @returns {number} z-index 值
     */
    function getZIndex(level) {
        return Z_BASE + level;
    }

    /**
     * 注册弹窗
     * - 同级互斥：自动关闭已有的同级弹窗
     * - 自动设置 z-index
     * @param {string} id - 弹窗唯一标识
     * @param {number} level - 弹窗层级（LEVELS 中的值）
     * @param {HTMLElement} element - 弹窗 DOM 元素
     */
    function register(id, level, element) {
        if (!element) return;

        // 同级互斥：关闭已有的同级弹窗
        const existing = activeModals.find(m => m.level === level);
        if (existing) {
            dismiss(existing.id);
        }

        // 如果该 id 已注册，先移除旧记录
        const existingById = activeModals.find(m => m.id === id);
        if (existingById) {
            activeModals = activeModals.filter(m => m.id !== id);
        }

        // 设置 z-index
        element.style.zIndex = getZIndex(level);

        activeModals.push({ id, level, element });

        console.log(`[B站学习助手] ModalManager: 注册弹窗 "${id}" (level=${level}, z-index=${getZIndex(level)})`);
    }

    /**
     * 关闭弹窗
     * @param {string} id - 弹窗唯一标识
     */
    function dismiss(id) {
        const index = activeModals.findIndex(m => m.id === id);
        if (index !== -1) {
            const modal = activeModals[index];
            if (modal.element && modal.element.parentNode) {
                modal.element.remove();
            }
            activeModals.splice(index, 1);
            console.log(`[B站学习助手] ModalManager: 关闭弹窗 "${id}"`);
        }
    }

    /**
     * 关闭所有干预弹窗（保留用户主动打开的详情面板和设置面板）
     */
    function dismissAllIntervention() {
        activeModals = activeModals.filter(m => {
            if (m.level >= LEVELS.CONFIRM) {
                if (m.element && m.element.parentNode) {
                    m.element.remove();
                }
                return false;
            }
            return true;
        });
    }

    /**
     * 获取当前最高优先级弹窗
     * @returns {object|null} 最高优先级弹窗信息
     */
    function getTopModal() {
        if (activeModals.length === 0) return null;
        return activeModals.reduce((a, b) => a.level > b.level ? a : b);
    }

    /**
     * 检查是否有干预弹窗激活
     * @returns {boolean}
     */
    function hasInterventionModal() {
        return activeModals.some(m => m.level >= LEVELS.CONFIRM);
    }

    /**
     * 检查指定弹窗是否激活
     * @param {string} id - 弹窗唯一标识
     * @returns {boolean}
     */
    function isActive(id) {
        return activeModals.some(m => m.id === id);
    }

    /**
     * 获取所有激活的弹窗
     * @returns {Array}
     */
    function getActiveModals() {
        return [...activeModals];
    }

    return {
        LEVELS,
        Z_BASE,
        register,
        dismiss,
        dismissAllIntervention,
        getTopModal,
        hasInterventionModal,
        isActive,
        getActiveModals,
        getZIndex
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
        WORD_VERIFY: 'wordVerify',
        AGGRESSIVE: 'aggressive'  // v1.3.0 P2: 强拦截全屏遮罩
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
        // v1.2.4: 使用 getEffectiveInterventionStages 替代 config.interventionStages
        const stages = ConfigManager.getEffectiveInterventionStages();
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

        // v1.2.4: 根据 visualEffectLevel 控制视觉效果强度
        const effectParams = ConfigManager.getVisualEffectParams();
        const invert = Math.floor(progress * effectParams.maxInvert);
        const grayscale = Math.floor(progress * effectParams.maxGrayscale);
        const opacity = 1 - progress * (1 - effectParams.minOpacity);

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

    /**
     * v1.3.0 P0: 自动跳转到白名单学习视频
     * 跳转前通过 HistoryVideoTracker 记录离开
     */
    function navigateToStudyVideo(options) {
        const opts = options || {};
        const whitelist = ConfigManager.getWhitelistArray();
        if (!whitelist || whitelist.length === 0) return;

        const currentBV = PageMonitor.getCurrentBV();
        if (currentBV) {
            const reason = opts.reason || 'distraction';
            HistoryVideoTracker.record(currentBV, document.title, 'distraction', reason);
        }

        const targetBV = ConfigManager.getDefaultReturnBV();
        if (targetBV) {
            // 【v1.4.0】指标
            if (typeof DebugTelemetry.incrementMetric === 'function') {
                DebugTelemetry.incrementMetric('autoNavigations');
            }
            window.location.href = `https://www.bilibili.com/video/${targetBV}`;
        }
    }

    /**
     * v1.3.0 P0: 显示自动导航倒计时 Toast
     * 弹窗关闭后显示3秒倒计时，结束后自动跳转到白名单视频
     * Toast 上可点击"取消"取消跳转
     */
    function showAutoNavigateToast() {
        const config = ConfigManager.get();
        if (!config.autoNavigate) return;
        const whitelist = ConfigManager.getWhitelistArray();
        if (!whitelist || whitelist.length === 0) return;

        // 移除已有 toast
        const existing = document.getElementById('bilibili-study-auto-navigate-toast');
        if (existing) existing.remove();

        let countdown = 3;
        let cancelled = false;
        let countdownTimer = null;

        const toast = document.createElement('div');
        toast.id = 'bilibili-study-auto-navigate-toast';
        toast.className = 'bilibili-study-auto-nav-toast';
        toast.innerHTML = `
            <div class="bilibili-study-auto-nav-inner">
                <span class="bilibili-study-auto-nav-icon">⏰</span>
                <span class="bilibili-study-auto-nav-text">
                    即将跳转到学习视频 <strong id="bilibili-study-countdown-num" class="bilibili-study-auto-nav-countdown">${countdown}</strong>s
                </span>
                <button id="bilibili-study-auto-nav-cancel" class="bilibili-study-auto-nav-cancel">取消</button>
            </div>
        `;

        document.body.appendChild(toast);
        ModalManager.register('auto-nav-toast', ModalManager.LEVELS.TOAST, toast);

        // 取消按钮
        document.getElementById('bilibili-study-auto-nav-cancel').addEventListener('click', function() {
            cancelled = true;
            clearInterval(countdownTimer);
            toast.style.animation = 'vocabToastOut 0.25s ease-in forwards';
            setTimeout(() => toast.remove(), 300);
        });

        // 倒计时
        countdownTimer = setInterval(function() {
            countdown--;
            const numEl = document.getElementById('bilibili-study-countdown-num');
            if (numEl) numEl.textContent = countdown;
            if (countdown <= 0) {
                clearInterval(countdownTimer);
                toast.remove();
                if (!cancelled) {
                    DebugTelemetry.logIntervention('auto_navigate', { reason: 'popup_close', countdown: 3 });
                    navigateToStudyVideo({ reason: 'auto_navigate' });
                }
            }
        }, 1000);

        console.log('[B站学习助手] showAutoNavigateToast: 开始3秒倒计时');
    }

    function closeCurrentModal() {
        // v1.2.5: 通过 ModalManager 关闭所有干预弹窗
        ModalManager.dismiss('confirm-modal');
        ModalManager.dismiss('word-modal');

        modalState = MODAL_STATES.NONE;
    }

    function returnToLearning() {
        closeCurrentModal();
        // v1.2.3: 记录离开的视频BV号（干预跳转）
        const currentBV = PageMonitor.getCurrentBV();
        if (currentBV) {
            HistoryVideoTracker.record(currentBV, document.title, 'distraction', 'intervention');
        }
        const defaultBV = ConfigManager.getDefaultReturnBV();
        if (defaultBV) {
            window.location.href = `https://www.bilibili.com/video/${defaultBV}`;
        } else {
            window.history.back();
        }
    }

    /**
     * v1.3.0 P2: 温和级别 Toast 提醒（替代 Stage 0 确认弹窗）
     * 首次分心时在底部显示轻量 Toast，15秒后自动消失
     */
    function showToastReminder() {
        if (document.getElementById('bilibili-study-toast-reminder')) return;

        const whitelist = ConfigManager.getWhitelistArray();
        const hasWhitelist = whitelist && whitelist.length > 0;
        const isDark = (typeof DetailPanel !== 'undefined' && typeof DetailPanel.getCurrentTheme === 'function')
            ? DetailPanel.getCurrentTheme() === 'dark'
            : false;

        const bg = isDark ? 'rgba(30, 35, 45, 0.97)' : 'rgba(255, 255, 255, 0.97)';
        const textColor = isDark ? '#e0e0e0' : '#333';
        const accentColor = isDark ? '#60a5fa' : '#3b82f6';
        const mutedColor = isDark ? '#94a3b8' : '#64748b';

        const toast = document.createElement('div');
        toast.id = 'bilibili-study-toast-reminder';
        toast.innerHTML = `
            <div style="
                display: flex; align-items: center; gap: 12px;
                background: ${bg};
                border: 1px solid ${isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.1)'};
                border-radius: 12px;
                padding: 12px 18px;
                box-shadow: 0 4px 24px rgba(0,0,0,0.25);
                backdrop-filter: blur(12px);
                color: ${textColor};
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                min-width: 320px;
                animation: vocabToastIn 0.25s ease-out;
            ">
                <span style="font-size:18px;">⏸️</span>
                <div style="flex:1;">
                    <div style="font-weight: 600; font-size: 14px; margin-bottom: 2px;">你正在学习时段中</div>
                    <div style="font-size: 12px; color: ${mutedColor};">已离开学习状态，请尽快返回</div>
                </div>
                <div style="display: flex; gap: 8px;">
                    ${hasWhitelist ? `<button id="bilibili-study-toast-return" style="
                        background: ${accentColor}; color: white; border: none;
                        border-radius: 6px; padding: 6px 12px; cursor: pointer; font-size: 13px;
                        font-weight: 500;
                    ">返回学习</button>` : ''}
                    <button id="bilibili-study-toast-dismiss" style="
                        background: none; border: 1px solid ${mutedColor}; color: ${mutedColor};
                        border-radius: 6px; padding: 6px 12px; cursor: pointer; font-size: 13px;
                    ">我知道了</button>
                </div>
            </div>
        `;
        toast.style.cssText = `
            position: fixed;
            bottom: 30px;
            left: 50%;
            transform: translateX(-50%);
            z-index: 1000001;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        `;

        document.body.appendChild(toast);

        // 返回学习按钮
        const returnBtn = document.getElementById('bilibili-study-toast-return');
        if (returnBtn) {
            returnBtn.addEventListener('click', function() {
                toast.remove();
                returnToLearning();
            });
        }

        // 我知道了按钮
        document.getElementById('bilibili-study-toast-dismiss').addEventListener('click', function() {
            toast.remove();
        });

        // 15秒后自动消失
        setTimeout(() => {
            if (toast.parentNode) {
                toast.style.animation = 'vocabToastOut 0.25s ease-in forwards';
                setTimeout(() => toast.remove(), 300);
            }
        }, 15000);

        DebugTelemetry.logIntervention('toast_reminder', { level: 'gentle', action: 'show' });
        console.log('[B站学习助手] showToastReminder: 显示温和提醒Toast');
    }

    /**
     * v1.3.0 P2: 强拦截全屏遮罩（Stage 3+）
     * 全屏遮罩 + 10秒倒计时 + 自动跳转
     */
    function showAggressiveIntervention() {
        if (document.getElementById('bilibili-study-aggressive-overlay')) return;

        const state = window.__bilibiliStudyAppState;
        const distractionElapsed = state && state.distractionStartTime
            ? Math.floor((Date.now() - state.distractionStartTime) / 1000)
            : 0;
        const distractionMinutes = Math.floor(distractionElapsed / 60);
        const isDark = (typeof DetailPanel !== 'undefined' && typeof DetailPanel.getCurrentTheme === 'function')
            ? DetailPanel.getCurrentTheme() === 'dark'
            : false;

        let countdown = 10;
        let countdownTimer = null;
        let navigated = false;

        const overlay = document.createElement('div');
        overlay.id = 'bilibili-study-aggressive-overlay';
        overlay.style.cssText = `
            position: fixed; top: 0; left: 0; right: 0; bottom: 0;
            z-index: 1000006;
            display: flex; align-items: center; justify-content: center;
            background: ${isDark ? 'rgba(0,0,0,0.92)' : 'rgba(0,0,0,0.85)'};
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            animation: bilibili-study-fade-in 0.3s ease-out;
        `;
        if (isDark) overlay.classList.add('bilibili-study-dark-mode');

        overlay.innerHTML = `
            <div style="
                text-align: center; color: white; max-width: 450px; padding: 40px;
            ">
                <div style="font-size: 48px; margin-bottom: 16px;">⚠️</div>
                <h2 style="font-size: 24px; margin: 0 0 12px 0; color: ${isDark ? '#f87171' : '#ff6b6b'};">
                    你已分心超过 ${distractionMinutes} 分钟
                </h2>
                <p style="font-size: 16px; color: ${isDark ? '#cbd5e1' : '#e0e0e0'}; margin: 0 0 24px 0;">
                    即将在 <strong id="bilibili-study-aggressive-countdown" style="font-size: 28px; color: #60a5fa;">${countdown}</strong> 秒后跳转回学习视频
                </p>
                <div style="display: flex; gap: 12px; justify-content: center;">
                    <button id="bilibili-study-aggressive-jump" style="
                        background: #3b82f6; color: white; border: none;
                        border-radius: 8px; padding: 12px 24px; cursor: pointer; font-size: 16px;
                        font-weight: 600;
                    ">立即跳转</button>
                    <button id="bilibili-study-aggressive-delay" style="
                        background: transparent; color: ${isDark ? '#94a3b8' : '#ccc'}; 
                        border: 1px solid ${isDark ? '#475569' : '#666'};
                        border-radius: 8px; padding: 12px 24px; cursor: pointer; font-size: 14px;
                    ">再答一题争取时间</button>
                </div>
            </div>
        `;

        document.body.appendChild(overlay);
        ModalManager.register('aggressive-overlay', ModalManager.LEVELS.AGGRESSIVE, overlay);

        function doNavigate() {
            if (navigated) return;
            navigated = true;
            clearInterval(countdownTimer);
            overlay.remove();
            DebugTelemetry.logIntervention('aggressive_jump', { countdown, elapsed: distractionElapsed });
            navigateToStudyVideo({ reason: 'aggressive_auto' });
        }

        // 立即跳转
        document.getElementById('bilibili-study-aggressive-jump').addEventListener('click', doNavigate);

        // 再答一题争取时间
        document.getElementById('bilibili-study-aggressive-delay').addEventListener('click', function() {
            if (navigated) return;
            clearInterval(countdownTimer);
            overlay.remove();
            ModalManager.dismiss('aggressive-overlay');
            // 弹出单词弹窗，答对可延迟5分钟
            lastPopupTime = Date.now();
            const savedLastPopup = lastPopupTime;
            showWordVerifierModal();
            // 记录延迟尝试
            DebugTelemetry.logIntervention('aggressive_delay_attempt', {});
        });

        // 倒计时
        countdownTimer = setInterval(function() {
            countdown--;
            const numEl = document.getElementById('bilibili-study-aggressive-countdown');
            if (numEl) numEl.textContent = countdown;
            if (countdown <= 0) {
                doNavigate();
            }
        }, 1000);

        console.log('[B站学习助手] showAggressiveIntervention: 显示强拦截遮罩');
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

        // v1.2.5: 注册到 ModalManager
        ModalManager.register('confirm-modal', ModalManager.LEVELS.CONFIRM, modal);

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
            // v1.3.0 P0: 触发自动导航倒计时
            showAutoNavigateToast();
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

        // v1.2.5: 注册到 ModalManager
        ModalManager.register('word-modal', ModalManager.LEVELS.WORD, modal);

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
                // v1.3.0 P0: 触发自动导航倒计时
                showAutoNavigateToast();
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

        // v1.4.1
        DebugTelemetry.incrementMetric('wordsAttempted');

        const correct = WordVerifier.checkAnswer(currentWord, answer);
        console.log('[B站学习助手]   correct=', correct, 'target=', currentWord.english, 'answer=', answer);

        const isDark = DetailPanel.getCurrentTheme() === 'dark';
        console.log('[B站学习助手]   isDark=', isDark);

        // 如果有提示字母被揭示，标记为wasHinted
        const wasHinted = revealedIndices.size > 0;
        // v1.2.4 fix: updateMastery 每次提交都更新掌握度（合理），但 recordAnswer/recordWordAttempt
        // 只在最终结果确定时调用，避免同一词出现多条答题记录
        WordVerifier.updateMastery(currentWord, correct, wasHinted);

        if (correct) {
            console.log('[B站学习助手]   → 回答正确! 弹窗即将关闭');
            // v1.2.4 fix: 答对时才记录最终结果
            WordVerifier.recordAnswer(currentWord, true);
            StatisticsTracker.recordWordAttempt(true);
            // v1.4.1
            DebugTelemetry.incrementMetric('wordsMastered');
            feedback.innerHTML = `<span style="color: ${isDark ? '#4ade80' : '#16a34a'}; font-weight: bold;">✅ 回答正确！</span>`;
            // 正确答案直接关闭
            setTimeout(() => {
                closeCurrentModal();
                // v1.3.0 P0: 触发自动导航倒计时
                showAutoNavigateToast();
            }, 300);
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
                // v1.2.4 fix: 全部字母揭示 = 该轮答题最终失败，记录一次错误
                WordVerifier.recordAnswer(currentWord, false);
                StatisticsTracker.recordWordAttempt(false);
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
                        // v1.3.0 P0: 触发自动导航倒计时
                        showAutoNavigateToast();
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
        // v1.2.4: 使用 getEffectiveInterventionStages 替代 config.interventionStages
        const stages = ConfigManager.getEffectiveInterventionStages();
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
            // v1.3.0: 根据干预级别分流
            const interventionLevel = ConfigManager.getInterventionLevel(stage);
            if (interventionLevel === 'strict' || interventionLevel === 'aggressive') {
                // 强拦截级别：全屏遮罩 + 自动跳转
                if (!document.getElementById('bilibili-study-aggressive-overlay')) {
                    showAggressiveIntervention();
                }
            } else {
                // 标准/温和级别：单词验证弹窗
                showWordVerifierModal();
            }
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
            // v1.2.3: 同步到全局状态
            GlobalStateManager.syncFromAppState();
            totalHiddenTime = 0;
        }

        // v1.2.3: 休息时段不干预
        if (!isStudyTime && ConfigManager.isRestPeriod()) {
            return;
        }

        if (!isStudyTime) {
            state.isStudying = true;
            state.currentStage = 0;
            state.distractionStartTime = null;
            removeVisualIntervention();
            reset();
            // v1.2.3: 同步到全局状态
            GlobalStateManager.syncFromAppState();
            return;
        }

        if (isWhitelisted) {
            state.isStudying = true;
            state.currentStage = 0;
            state.distractionStartTime = null;
            removeVisualIntervention();
            reset();
            // v1.2.3: 同步到全局状态
            GlobalStateManager.syncFromAppState();
            return;
        }

        if (!isWhitelisted) {
            if (state.distractionStartTime === null) {
                state.distractionStartTime = Date.now();
                state.isStudying = false;
                // v1.2.3: 同步到全局状态
                GlobalStateManager.syncFromAppState();
                console.log('[B站学习助手] check: 首次分心，弹出温和提醒Toast');
                // v1.3.0 P2: 使用 Toast 提醒替代确认弹窗
                showToastReminder();
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
                // v1.2.3: 同步到全局状态
                GlobalStateManager.syncFromAppState();
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
        returnToLearning,
        // v1.3.0 新增
        navigateToStudyVideo,
        showAutoNavigateToast,
        showToastReminder,
        showAggressiveIntervention
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
        lastDistractionCount: 0,
        multiWindowPaused: false
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

        // ── v1.2.6: 更新 TabManager 注册信息 ──
        TabManager.updateRegistration({
            bv: currentBV || '',
            isWhitelisted: isWhitelisted,
            isStudying: isWhitelisted && isStudyTime,
            windowTitle: document.title,
        });

        // ── v1.2.6: 多窗口暂停检查 ──
        // 如果 TabManager 暂停了计时（多窗口协商中），跳过计时和干预
        if (TabManager.isPaused()) {
            // 仍然更新浮窗状态（显示暂停状态）
            if (FloatingWindow.create()) {
                const todayStats = StatisticsTracker.getTodayStats();
                FloatingWindow.updateStatus({
                    isStudying: state.isStudying,
                    stage: state.currentStage,
                    studyTime: todayStats.studyTime,
                    distractionTime: todayStats.distractionTime,
                    isMaster: TabManager.isMaster(),
                    isPaused: true
                });
            }
            return;
        }

        // ── v1.2.3: 全局状态重置策略检查 ──
        // 在干预逻辑之前执行，确保时段结束时及时重置
        GlobalStateManager.checkAndReset(isStudyTime);
        // 从全局状态同步到 appState（兼容现有代码）
        GlobalStateManager.syncToAppState();

        // 每60秒输出一次心跳日志，确认定时器在运行
        if (++_mainTimerLogCounter % 60 === 0) {
            console.log('[B站学习助手] 主定时器心跳:', {
                isVideoPage, isPageActive, isStudyTime, isWhitelisted,
                currentBV, currentStage: state.currentStage, url: window.location.href,
                resetStrategy: ConfigManager.get().resetStrategy,
                isMaster: TabManager.isMaster(),
                isPaused: TabManager.isPaused(),
            });
        }

        // ── v1.2.6: Master 分支 ──
        if (TabManager.isMaster()) {
            // ═══ Master 窗口：正常计时 + 干预 ═══

            // Update statistics based on current state
            if (isVideoPage && isPageActive && isStudyTime) {
                // 更新活动时间（interval策略用）
                GlobalStateManager.touchActivity();

                if (isWhitelisted) {
                    // Studying on whitelisted video
                    state.isStudying = true;
                    StatisticsTracker.addStudyTime(1);
                    // 累加学习时间（duration策略用）
                    GlobalStateManager.addStudySeconds(1);
                } else {
                    // Distracted on non-whitelisted video
                    state.isStudying = false;
                    StatisticsTracker.addDistractionTime(1);
                }

                // ── v1.2.3: 同步 appState 到全局状态 ──
                GlobalStateManager.syncFromAppState();
            }

            // Run intervention check
            InterventionController.check();

        } else {
            // ═══ 非 Master 窗口：只更新本地状态，不计时、不干预 ═══
            if (isVideoPage && isPageActive && isStudyTime) {
                state.isStudying = isWhitelisted;
            }
            console.log('[B站学习助手] 主定时器: 非 Master 窗口，跳过计时和干预');
        }

        // Update floating window status
        if (FloatingWindow.create()) {
            const todayStats = StatisticsTracker.getTodayStats();
            FloatingWindow.updateStatus({
                isStudying: state.isStudying,
                stage: state.currentStage,
                studyTime: todayStats.studyTime,
                distractionTime: todayStats.distractionTime,
                isMaster: TabManager.isMaster(),
                isPaused: false
            });
        }
    }, 1000);

    // Set up SPA navigation handling
    PageMonitor.observeSPAChanges(function(newBV) {
        const state = window.__bilibiliStudyAppState;
        const isWhitelisted = ConfigManager.isWhitelisted(newBV);

        // v1.2.3: SPA导航时记录旧视频的BV号
        // 注意：此时 URL 已变化，无法获取旧 BV，但可以在 PageMonitor 中记录
        // 使用 _lastBVBeforeSPA 追踪（在下面 beforeunload 钩子中也有记录）

        if (isWhitelisted || !ConfigManager.isStudyTime()) {
            // 切到白名单视频或非学习时段：重置干预状态
            // v1.2.3: 记录离开原因
            if (state) {
                // 记录旧视频BV号（如果有的话）
                const oldBV = PageMonitor.getLastBV();
                if (oldBV && oldBV !== newBV) {
                    const reason = isWhitelisted ? 'return_learning' : 'user_navigate';
                    HistoryVideoTracker.record(oldBV, document.title,
                        state.isStudying ? 'study' : 'distraction', reason);
                }
                state.currentStage = 0;
                state.distractionStartTime = null;
                state.isStudying = true;
            }
            InterventionController.reset();
            removeVisualIntervention();
            GlobalStateManager.syncFromAppState();
            console.log('[B站学习助手] SPA导航到白名单视频/非学习时段，重置干预状态');
        } else {
            // 切到另一个非白名单视频：保留干预状态，关闭已有弹窗
            // 不重置 distractionStartTime 和 currentStage，让干预计时延续
            // v1.2.3: 记录旧视频BV号
            if (state) {
                const oldBV = PageMonitor.getLastBV();
                if (oldBV && oldBV !== newBV) {
                    HistoryVideoTracker.record(oldBV, document.title,
                        state.isStudying ? 'study' : 'distraction', 'user_navigate');
                }
            }
            InterventionController.closeCurrentModal();
            GlobalStateManager.syncFromAppState();
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

    // ── v1.2.3: 初始化 GlobalStateManager ──
    // 在所有模块初始化后调用，从 localStorage 加载全局状态
    GlobalStateManager.init();

    // ── v1.2.6: 初始化 TabManager ──
    // Master选举 + 心跳 + 多窗口检测
    try {
        TabManager.init();
        console.log('[B站学习助手] init: TabManager.init 完成');
    } catch(e) {
        console.error('[B站学习助手] init: TabManager.init 失败!', e);
    }

    // ── v1.2.4: 恢复视觉干预效果 ──
    // 全局状态同步了 currentStage 但 DOM 上的 CSS class 不会自动恢复
    // 新窗口/刷新后需要根据持久化的 stage 重新应用视觉效果
    try {
        const restoredStage = GlobalStateManager.get('currentStage');
        if (restoredStage > 0 && PageMonitor.isVideoPage()) {
            console.log('[B站学习助手] init: 恢复视觉干预效果, stage=', restoredStage);
            InterventionController.applyVisualIntervention(restoredStage);
        }
    } catch(e) {
        console.error('[B站学习助手] init: 恢复视觉干预效果失败', e);
    }

    // ── v1.2.3: beforeunload 钩子 ──
    // 用户关闭标签页/窗口时，记录当前视频的BV号
    window.addEventListener('beforeunload', function() {
        const currentBV = PageMonitor.getCurrentBV();
        const state = window.__bilibiliStudyAppState;
        if (currentBV && state) {
            HistoryVideoTracker.record(currentBV, document.title,
                state.isStudying ? 'study' : 'distraction', 'user_close');
        }
        // 确保全局状态已同步
        if (state) {
            GlobalStateManager.syncFromAppState();
        }
    });

    console.log('B站学习专注提醒助手 initialized successfully');

})();