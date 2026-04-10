# Requirements Document

## Introduction

This document specifies the requirements for a B站学习专注提醒助手 (BiliBili Study Focus Reminder Assistant), a Tampermonkey script that provides progressive, non-intrusive focus interventions during user-defined study periods on Bilibili video pages.

## Glossary

- **System**: The Tampermonkey script being developed
- **Study_Period**: User-defined time ranges when focus interventions are active
- **Whitelist**: List of Bilibili video BV numbers that are considered study-related and exempt from interventions
- **Intervention**: Focus reminder action taken when user is watching non-study content during study periods
- **Effective_Study_Time**: Time spent watching whitelisted videos while page is active and video is playing
- **Distraction_Time**: Time spent watching non-whitelisted videos during study periods while page is active
- **Floating_Window**: Draggable status indicator showing current study/distraction status
- **Detail_Panel**: Modal overlay showing comprehensive learning statistics
- **Word_Verification**: Interactive quiz requiring correct English translation of Chinese words
- **Stage**: Current intervention escalation level (0-4) based on distraction duration

## Requirements

### Requirement 1: Global Configuration System

**User Story:** As a user, I want all core parameters configurable at the script top without coding knowledge, so that I can customize the assistant to my needs.

#### Acceptance Criteria

1. THE System SHALL provide a configuration section at the script top with all user-editable parameters
2. THE Configuration SHALL include study time periods as an array of [start, end] pairs in "HH:MM" format
3. THE Configuration SHALL include a whitelist array of Bilibili BV numbers
4. THE Configuration SHALL include intervention time ladder with thresholds and popup intervals for each stage
5. THE Configuration SHALL include word verification vocabulary as array of "Chinese:English" format
6. THE Configuration SHALL include word mastery threshold (number of consecutive correct answers)
7. THE Configuration SHALL include floating window position, enabled state, and statistics preferences
8. THE Configuration SHALL include statistics period option (day/week)

### Requirement 2: Page Activation and Scope Control

**User Story:** As a user, I want the script to only activate on Bilibili video pages during study periods, so that interventions don't occur at inappropriate times.

#### Acceptance Criteria

1. WHEN the page URL matches *://www.bilibili.com/video/BV*, THE System SHALL initialize and become active
2. WHEN the current time is outside all defined study periods, THE System SHALL disable interventions and only display status
3. WHEN the current video BV is in the whitelist, THE System SHALL disable interventions and count effective study time
4. THE System SHALL use MutationObserver to monitor SPA route changes and DOM updates on Bilibili
5. THE System SHALL store all state in localStorage with three modules: userConfig, timeStats, wordRecords

### Requirement 3: Draggable Floating Status Window

**User Story:** As a user, I want a floating status window that I can drag freely, so that I can position it where it doesn't obstruct my viewing.

#### Acceptance Criteria

1. THE Floating_Window SHALL appear on all Bilibili video pages after script initialization
2. THE Floating_Window SHALL remain visible on scroll and have appropriate z-index
3. THE Floating_Window SHALL NOT block Bilibili elements or video player core area
4. THE Floating_Window SHALL be draggable via left mouse button within viewport bounds
5. THE Floating_Window SHALL save position to localStorage and restore on page reload
6. THE Floating_Window SHALL auto-hide when entering video fullscreen mode and restore on exit
7. THE Floating_Window SHALL distinguish between drag and click to prevent accidental panel opening

### Requirement 4: Floating Window Status Display

**User Story:** As a user, I want the floating window to show my current status clearly, so that I know whether I'm studying or distracted.

#### Acceptance Criteria

1. WHEN studying (whitelist video OR outside study period), THE Floating_Window SHALL display low-saturation green with text "学习中" and "今日学习：XhXm"
2. WHEN distracted (study period + non-whitelist video), THE Floating_Window SHALL display low-saturation red with increasing transparency based on intervention stage
3. WHEN distracted, THE Floating_Window SHALL show "分心中" and "已停留：XmXs"
4. THE Floating_Window SHALL update status in real-time as conditions change

### Requirement 5: Detailed Learning Status Panel

**User Story:** As a user, I want to click the floating window to see comprehensive learning data, so that I can review my study patterns.

#### Acceptance Criteria

1. WHEN the Floating_Window is clicked (non-drag), THE System SHALL open a centered modal with translucent black overlay
2. THE Detail_Panel SHALL display Module 1: Today's study overview including effective study time, distraction time, distraction count, and word accuracy
3. THE Detail_Panel SHALL display Module 2: Real-time status including current BV, whitelist status, intervention stage, and action buttons
4. THE Detail_Panel SHALL display Module 3: Word learning records including total words, mastered count, progress bar, mastered word list, and recent 10 answers
5. THE Detail_Panel SHALL display Module 4: Expandable focus suggestions based on distraction patterns, study duration, and word data
6. THE Detail_Panel SHALL display Module 5: Historical data trends showing 7-day trends
7. THE Detail_Panel SHALL close when clicking overlay, clicking close button, or pressing Esc key

### Requirement 6: Progressive Intervention Escalation

**User Story:** As a user, I want interventions to escalate gradually from light to heavy, so that I have multiple chances to refocus before strong measures.

#### Acceptance Criteria

1. WHEN distraction first begins during study period, THE System SHALL show Stage 0 modal: "您当前处于学习时段，是否确认访问无关视频页面？"
2. WHEN distraction duration is 1-5 minutes, THE System SHALL apply Stage 1 visual intervention (invert, grayscale, opacity changes)
3. WHEN distraction duration is 5-10 minutes, THE System SHALL apply Stage 2 intervention with low-frequency popup every 2 minutes
4. WHEN distraction duration is 10-20 minutes, THE System SHALL apply Stage 3 intervention with medium-frequency popup + word verification every 30 seconds
5. WHEN distraction duration exceeds 20 minutes, THE System SHALL apply Stage 4 intervention with high-frequency popup + strict verification every 15 seconds
6. THE System SHALL NOT skip any intervention stages
7. THE System SHALL reset intervention stage when user returns to whitelist video or leaves study period

### Requirement 7: Word Verification System

**User Story:** As a user, I want word verification quizzes during interventions, so that I can learn vocabulary while being reminded to focus.

#### Acceptance Criteria

1. THE System SHALL select random words from configured vocabulary for verification
2. WHEN include_mastered_words is false, THE System SHALL exclude mastered words from selection
3. THE System SHALL track consecutive correct answers for each word
4. WHEN consecutive correct answers reach mastery threshold, THE System SHALL mark word as mastered
5. THE Word_Verification SHALL display Chinese word and require English translation input
6. THE System SHALL provide immediate feedback on answer correctness
7. THE System SHALL record all verification attempts in wordRecords module

### Requirement 8: Duration Statistics Tracking

**User Story:** As a user, I want accurate time tracking for study and distraction, so that I can analyze my learning patterns.

#### Acceptance Criteria

1. THE System SHALL count effective study time when whitelist video is playing and page is active
2. THE System SHALL count distraction time when non-whitelist video is playing during study period and page is active
3. THE System SHALL track distraction count (number of times entering distraction state)
4. THE System SHALL track word verification accuracy (correct/total)
5. THE System SHALL archive data daily at 00:00 and retain 30 days of history
6. THE Statistics SHALL support day and week period views

### Requirement 9: Data Persistence

**User Story:** As a user, I want my settings and data to persist across browser restarts, so that I don't lose my progress.

#### Acceptance Criteria

1. THE System SHALL store user configuration in localStorage module "userConfig"
2. THE System SHALL store time statistics in localStorage module "timeStats"
3. THE System SHALL store word learning records in localStorage module "wordRecords"
4. THE System SHALL load persisted data on script initialization
5. THE System SHALL automatically save data changes to localStorage

### Requirement 10: Non-Intrusiveness Guarantee

**User Story:** As a user, I want the script to never affect core Bilibili functionality, so that my viewing experience remains unaffected.

#### Acceptance Criteria

1. THE System SHALL NOT modify video playback speed, quality, or any player controls
2. THE System SHALL NOT block access to any Bilibili pages or features
3. THE System SHALL NOT affect whitelisted videos in any way
4. THE System SHALL only show interventions during active study periods
5. THE System SHALL allow all popups to be closed with Esc key

### Requirement 11: Technical Implementation Standards

**User Story:** As a user, I want a well-documented script that follows best practices, so that it works reliably.

#### Acceptance Criteria

1. THE Script SHALL include complete Tampermonkey header metadata (@name, @description, @match, @grant, etc.)
2. THE Script SHALL use pure native JavaScript with no third-party libraries
3. THE Script SHALL use GM_addStyle for CSS injection
4. THE Script SHALL have clear code comments explaining each module
5. THE Script SHALL implement modular development with separate functions for each feature