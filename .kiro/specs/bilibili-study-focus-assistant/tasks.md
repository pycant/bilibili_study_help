# Implementation Plan: B站学习专注提醒助手 (BiliBili Study Focus Reminder Assistant)

## Overview

This Tampermonkey script provides progressive, non-intrusive focus interventions during user-defined study periods on Bilibili video pages. Implementation follows modular JavaScript with localStorage persistence.

## Tasks

- [x] 1. Set up Tampermonkey script header and metadata
  - Create complete Tampermonkey header with @name, @description, @version, @author
  - Add @match pattern for Bilibili video pages: *://www.bilibili.com/video/BV*
  - Add @grant directives: GM_addStyle, GM_getValue, GM_setValue, GM_deleteValue
  - Add @license and @supportURL
  - _Requirements: 11.1, 11.2_

- [x] 2. Create user configuration system
  - [x] 2.1 Define USER_CONFIG constant with all editable parameters
    - studyPeriods array of [start, end] pairs
    - whitelist array of BV numbers
    - interventionStages array with threshold and interval
    - vocabulary array of "Chinese:English" strings
    - masteryThreshold, includeMasteredWords
    - floatingWindow settings (enabled, defaultPosition, showStats)
    - statsPeriod
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8_

  - [x] 2.2 Implement ConfigManager module
    - load(): load config from localStorage or return defaults
    - save(config): save to localStorage
    - get(): return current config
    - isStudyTime(): check if current time is within study periods
    - isWhitelisted(bv): check if BV is in whitelist
    - getInterventionConfig(stage): get config for specific stage
    - _Requirements: 9.1, 9.4, 9.5_

- [x] 3. Set up localStorage data modules
  - [x] 3.1 Implement StorageManager for localStorage operations
    - getModule(name): retrieve module data
    - setModule(name, data): save module data
    - handle localStorage unavailability with in-memory fallback
    - _Requirements: 9.1, 9.2, 9.3, 9.4_

  - [x] 3.2 Define data structures for three modules
    - userConfig: version, studyPeriods, whitelist, interventionConfig, vocabulary, masteryThreshold, includeMasteredWords, floatingWindow, statsPeriod
    - timeStats: lastResetDate, today (studyTime, distractionTime, distractionCount, wordAccuracy), history array (up to 30 days)
    - wordRecords: words object with mastery data, recentAnswers array (up to 50)
    - _Requirements: 9.1, 9.2, 9.3_

- [x] 4. Implement page monitoring system
  - [x] 4.1 Implement PageMonitor module
    - isVideoPage(): check if URL matches Bilibili video pattern
    - getCurrentBV(): extract BV number from URL
    - isPageActive(): check if page is visible (not background tab)
    - isFullscreen(): check video fullscreen state
    - _Requirements: 2.1, 2.2_

  - [x] 4.2 Set up SPA monitoring
    - Implement MutationObserver for DOM changes
    - Listen for popstate events for route changes
    - Re-check URL after navigation completes
    - _Requirements: 2.4_

- [x] 5. Create floating window component
  - [x] 5.1 Implement FloatingWindow module - creation and rendering
    - create(): create and append floating window element
    - apply base styles (position fixed, z-index, border-radius, shadow)
    - _Requirements: 3.1, 3.2, 3.3_

  - [x] 5.2 Implement drag functionality
    - onDragStart(e): track mouse down position
    - onDragMove(e): update element position during drag
    - onDragEnd(e): finalize position, use 5px threshold to distinguish drag from click
    - constrain to viewport bounds
    - _Requirements: 3.4_

  - [x] 5.3 Implement position persistence
    - getPosition(): retrieve saved position from localStorage
    - setPosition(x, y): save position to localStorage on drag end
    - restore position on page load
    - _Requirements: 3.5_

  - [x] 5.4 Add fullscreen handling
    - Listen for fullscreenchange event
    - autoHide when entering fullscreen
    - restore on exit fullscreen
    - _Requirements: 3.6, 3.7_

  - [x] 5.5 Implement status display updates
    - updateStatus(status): update visual state based on studying/distracted
    - Show green background + "学习中" + "今日学习：XhXm" when studying
    - Show red background (varying opacity by stage) + "分心中" + "已停留：XmXs" when distracted
    - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [x] 6. Create detail panel modal
  - [x] 6.1 Implement DetailPanel module - modal structure
    - open(): create modal overlay and content container
    - close(): remove modal from DOM
    - Add close handlers: overlay click, close button click, Escape key
    - _Requirements: 5.7_

  - [x] 6.2 Render Module 1: Today's overview
    - Display effective study time, distraction time, distraction count, word accuracy
    - Format time as "Xh Xm" or "Xm Xs"
    - _Requirements: 5.2_

  - [x] 6.3 Render Module 2: Real-time status
    - Show current BV, whitelist status, intervention stage
    - Add action buttons: "手动停止干预", "添加到白名单"
    - _Requirements: 5.3_

  - [x] 6.4 Render Module 3: Word learning records
    - Show total words, mastered count, progress bar
    - List mastered words
    - Show recent 10 answers with correct/incorrect indicators
    - _Requirements: 5.4_

  - [x] 6.5 Render Module 4: Focus suggestions
    - Expandable section with suggestions based on:
      - Distraction patterns
      - Study duration
      - Word learning progress
    - _Requirements: 5.5_

  - [x] 6.6 Render Module 5: Historical trends
    - Show 7-day trend data
    - Visual bar chart or text representation
    - _Requirements: 5.6_

- [x] 7. Implement progressive intervention system
  - [x] 7.1 Implement InterventionController module
    - check(): main intervention check called every second
    - getCurrentStage(): calculate stage based on distraction duration
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6_

  - [x] 7.2 Implement visual interventions
    - applyVisualIntervention(stage): add CSS class to page
    - Stage 1: invert 10%
    - Stage 2: grayscale 20%
    - Stage 3: opacity 80%
    - Stage 4: opacity 60% + grayscale 10%
    - removeVisualIntervention(): remove all intervention classes
    - _Requirements: 6.2, 6.3, 6.4, 6.5_

  - [x] 7.3 Implement popup system
    - showPopupIfNeeded(): check interval and show popup
    - showConfirmModal(): Stage 0 confirmation modal
    - Different popup intervals per stage
    - _Requirements: 6.3, 6.4, 6.5_

  - [x] 7.4 Implement stage reset logic
    - Reset to stage 0 when returning to whitelist
    - Reset when leaving study period
    - _Requirements: 6.7_

- [x] 8. Implement word verification system
  - [x] 8.1 Implement WordVerifier module
    - selectWord(): random word selection (exclude mastered if configured)
    - checkAnswer(word, answer): compare input with English translation
    - updateMastery(word, correct): increment or reset consecutiveCorrect
    - getMasteredWords(): return all mastered words
    - recordAnswer(word, correct): add to recentAnswers
    - getRecentAnswers(count): get last N answers
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7_

  - [x] 8.2 Create word verification UI
    - Display Chinese word
    - Input field for English translation
    - Submit button
    - Immediate feedback (correct/incorrect)
    - _Requirements: 7.5, 7.6_

- [x] 9. Implement statistics tracking
  - [x] 9.1 Implement StatisticsTracker module
    - init(): load or initialize statistics
    - addStudyTime(seconds): increment study time
    - addDistractionTime(seconds): increment distraction time
    - incrementDistractionCount(): increment distraction count
    - recordWordAttempt(correct): update word accuracy
    - getTodayStats(): return today's statistics
    - getStatsForPeriod(period): return day/week statistics
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.6_

  - [x] 9.2 Implement daily archive
    - checkDailyArchive(): check if date changed, archive if needed
    - Archive current day's data to history
    - Keep only last 30 days of history
    - Reset today's counters
    - _Requirements: 8.5_

  - [x] 9.3 Implement trend data
    - getTrendData(): return 7-day trend for Module 5
    - _Requirements: 5.6_

- [ ] 10. CSS injection and styling
  - [x] 10.1 Inject all CSS using GM_addStyle
    - Floating window styles
    - Detail panel modal styles
    - Intervention popup styles
    - Word verification input styles
    - Visual intervention filter classes
    - Utility classes
    - _Requirements: 11.3_

- [x] 11. Main initialization and event wiring
  - [x] 11.1 Create main initialization function
    - Inject CSS
    - Initialize ConfigManager
    - Initialize StorageManager
    - Initialize all modules
    - Set up event listeners
    - Start main timer loop (1 second interval)
    - _Requirements: 11.5_

  - [x] 11.2 Wire up all event handlers
    - Floating window drag events
    - Modal close events
    - Fullscreen change events
    - SPA navigation events
    - _Requirements: 11.5_

- [x] 12. Checkpoint - Ensure all core modules compile
  - Ensure all code has no syntax errors
  - Verify all required functions are defined
  - Ask the user if questions arise.

- [ ] 13. Property-based testing tasks
  - [x]* 13.1 Write property test for study time accumulation
    - **Property 1: Study time accumulation**
    - **Validates: Requirements 8.1**
    - Test that study time increments by 1 second per second of elapsed time during whitelist video + study period

  - [x]* 13.2 Write property test for distraction time accumulation
    - **Property 2: Distraction time accumulation**
    - **Validates: Requirements 8.2**
    - Test that distraction time increments by 1 second per second during non-whitelist + study period

  - [x]* 13.3 Write property test for word mastery progression
    - **Property 3: Word mastery progression**
    - **Validates: Requirements 7.4**
    - Test that consecutive correct answers increment and word becomes mastered at threshold

  - [x]* 13.4 Write property test for word mastery reset
    - **Property 4: Word mastery reset**
    - **Validates: Requirements 7.4**
    - Test that consecutive correct counter resets to 0 on incorrect answer

  - [x]* 13.5 Write property test for stage progression
    - **Property 5: Stage progression**
    - **Validates: Requirements 6.1, 6.2, 6.3, 6.4, 6.5**
    - Test that intervention stage matches distraction duration thresholds

  - [x]* 13.6 Write property test for stage reset
    - **Property 6: Stage reset on whitelist return**
    - **Validates: Requirements 6.7**
    - Test that stage resets to 0 when user returns to whitelist video

  - [ ]* 13.7 Write property test for configuration persistence
    - **Property 7: Configuration persistence**
    - **Validates: Requirements 9.1, 9.4, 9.5**
    - Test that config changes persist to localStorage and restore correctly

  - [ ]* 13.8 Write property test for floating window position
    - **Property 8: Floating window position persistence**
    - **Validates: Requirements 3.5**
    - Test that position saves to localStorage and restores on reload

- [ ] 14. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Implementation uses pure JavaScript with no external libraries
- All data persists via localStorage with three modules
- Progressive interventions escalate from visual-only to word verification