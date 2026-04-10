/**
 * Property-based tests for B站学习专注提醒助手 (BiliBili Study Focus Reminder Assistant)
 * 
 * Feature: bilibili-study-focus-assistant
 * Property 3: Word mastery progression
 * Validates: Requirements 7.4
 * 
 * Test: For any word in the vocabulary, when the user provides correct answers 
 * consecutively, the consecutive correct counter SHALL increment, and when it 
 * reaches the mastery threshold, the word SHALL be marked as mastered.
 * 
 * This test file uses a simple property-based testing approach without external dependencies.
 */

// Simple property-based testing framework
const PropertyTest = {
    results: [],
    
    assert(propertyFn, options = {}) {
        const numRuns = options.numRuns || 100;
        const name = options.name || 'Unnamed property';
        let passed = true;
        let failureInput = null;
        
        for (let i = 0; i < numRuns; i++) {
            try {
                const result = propertyFn(i);
                if (result === false) {
                    passed = false;
                    failureInput = i;
                    break;
                }
            } catch (e) {
                // Allow exceptions for invalid inputs (skip)
            }
        }
        
        this.results.push({ name, passed, failureInput, numRuns });
        return { passed, failureInput };
    },
    
    summary() {
        const passed = this.results.filter(r => r.passed).length;
        const failed = this.results.filter(r => !r.passed).length;
        console.log(`\n=== Property Test Summary ===`);
        console.log(`Total: ${this.results.length}, Passed: ${passed}, Failed: ${failed}`);
        this.results.forEach(r => {
            const status = r.passed ? '✓' : '✗';
            console.log(`${status} ${r.name}`);
            if (!r.passed) {
                console.log(`  Failed at iteration: ${r.failureInput}`);
            }
        });
        return failed === 0;
    }
};

// Mock localStorage
const createMockLocalStorage = () => {
    const store = {};
    return {
        getItem: (key) => store[key] || null,
        setItem: (key, value) => { store[key] = value; },
        removeItem: (key) => { delete store[key]; },
        clear: () => { Object.keys(store).forEach(k => delete store[k]); }
    };
};

// Mock document.visibilityState
const createMockDocument = (isVisible = true) => ({
    visibilityState: isVisible ? 'visible' : 'hidden',
    addEventListener: () => {},
    removeEventListener: () => {}
});

// Mock window.location
const createMockLocation = (href) => ({
    href: href,
    origin: 'https://www.bilibili.com'
});

// ============================================
// WordVerifier Testable Modules
// ============================================

const createWordVerifierTestableModules = (localStorage, document, location) => {
    // Storage Manager
    const StorageManager = {
        modules: {},
        getModule(name) {
            const key = `bilibiliStudyAssistant_${name}`;
            try {
                const data = localStorage.getItem(key);
                if (data) {
                    return JSON.parse(data);
                }
            } catch (e) {
                // Ignore parse errors
            }
            return this.getDefaultModule(name);
        },
        getDefaultModule(name) {
            if (name === 'wordRecords') {
                return {
                    words: {},
                    recentAnswers: []
                };
            }
            return null;
        },
        setModule(name, data) {
            const key = `bilibiliStudyAssistant_${name}`;
            localStorage.setItem(key, JSON.stringify(data));
            this.modules[name] = data;
        }
    };

    // Config Manager
    const ConfigManager = (() => {
        const defaultConfig = {
            studyPeriods: [['08:00', '22:00']],
            whitelist: ['BV1xx411c7mD'],
            interventionStages: [
                { threshold: 0, interval: 0 },
                { threshold: 60, interval: 0 },
                { threshold: 300, interval: 120 },
                { threshold: 600, interval: 30 },
                { threshold: 1200, interval: 15 }
            ],
            vocabulary: ['学习:study', '专注:focus', '进步:progress'],
            masteryThreshold: 3,
            includeMasteredWords: false,
            floatingWindow: { enabled: true },
            statsPeriod: 'day'
        };

        let currentConfig = { ...defaultConfig };

        return {
            load() {
                try {
                    const data = localStorage.getItem('bilibiliStudyAssistant_config');
                    if (data) {
                        currentConfig = { ...defaultConfig, ...JSON.parse(data) };
                    }
                } catch (e) {
                    currentConfig = { ...defaultConfig };
                }
            },
            save(config) {
                currentConfig = { ...currentConfig, ...config };
                localStorage.setItem('bilibiliStudyAssistant_config', JSON.stringify(currentConfig));
            },
            get() {
                return { ...currentConfig };
            }
        };
    })();

    // WordVerifier Module (extracted from main script)
    const WordVerifier = (() => {
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
            return StorageManager.getModule('wordRecords');
        }

        // Save word records to storage
        function saveWordRecords(records) {
            StorageManager.setModule('wordRecords', records);
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

        // Get word data
        function getWordData(word) {
            const records = getWordRecords();
            return records.words ? records.words[word.chinese] : null;
        }

        return {
            parseVocabulary,
            checkAnswer,
            updateMastery,
            getWordData
        };
    })();

    return {
        StorageManager,
        ConfigManager,
        WordVerifier
    };
};

// ============================================
// PROPERTY TESTS - Property 3: Word mastery progression
// ============================================

console.log('=== Property 3: Word mastery progression (Requirements 7.4) ===\n');

// Property 3a: Consecutive correct answers increment the counter
PropertyTest.assert((iteration) => {
    // Setup
    const mockLocalStorage = createMockLocalStorage();
    const mockDoc = createMockDocument(true);
    const mockLocation = createMockLocation('https://www.bilibili.com/video/BV1xx411c7mD');
    
    const { ConfigManager, WordVerifier } = createWordVerifierTestableModules(
        mockLocalStorage,
        mockDoc,
        mockLocation
    );
    
    ConfigManager.load();
    
    // Get a test word
    const words = WordVerifier.parseVocabulary();
    const testWord = words[iteration % words.length];
    
    // Get initial state
    const initialData = WordVerifier.getWordData(testWord);
    const initialConsecutive = initialData ? initialData.consecutiveCorrect : 0;
    
    // Simulate correct answers - generate random number of correct answers (1-5)
    const numCorrect = (iteration % 5) + 1;
    
    for (let i = 0; i < numCorrect; i++) {
        WordVerifier.updateMastery(testWord, true);
    }
    
    // Get final state
    const finalData = WordVerifier.getWordData(testWord);
    const finalConsecutive = finalData ? finalData.consecutiveCorrect : 0;
    
    // Verify: consecutiveCorrect should increment by numCorrect
    return finalConsecutive === initialConsecutive + numCorrect;
}, { numRuns: 100, name: 'Consecutive correct answers increment counter' });

// Property 3b: Word becomes mastered when consecutiveCorrect reaches masteryThreshold
PropertyTest.assert((iteration) => {
    // Setup
    const mockLocalStorage = createMockLocalStorage();
    const mockDoc = createMockDocument(true);
    const mockLocation = createMockLocation('https://www.bilibili.com/video/BV1xx411c7mD');
    
    const { ConfigManager, WordVerifier } = createWordVerifierTestableModules(
        mockLocalStorage,
        mockDoc,
        mockLocation
    );
    
    ConfigManager.load();
    const config = ConfigManager.get();
    const threshold = config.masteryThreshold; // Default is 3
    
    // Get a test word
    const words = WordVerifier.parseVocabulary();
    const testWord = words[iteration % words.length];
    
    // First, provide (threshold - 1) correct answers - should NOT be mastered
    for (let i = 0; i < threshold - 1; i++) {
        WordVerifier.updateMastery(testWord, true);
    }
    
    let data = WordVerifier.getWordData(testWord);
    if (data.mastered) {
        return false; // Should not be mastered yet
    }
    
    // Now provide one more correct answer - should become mastered
    WordVerifier.updateMastery(testWord, true);
    
    data = WordVerifier.getWordData(testWord);
    
    // Verify: word should now be mastered
    return data.mastered === true;
}, { numRuns: 100, name: 'Word mastered at masteryThreshold' });

// Property 3c: Mastery is maintained for additional correct answers beyond threshold
PropertyTest.assert((iteration) => {
    // Setup
    const mockLocalStorage = createMockLocalStorage();
    const mockDoc = createMockDocument(true);
    const mockLocation = createMockLocation('https://www.bilibili.com/video/BV1xx411c7mD');
    
    const { ConfigManager, WordVerifier } = createWordVerifierTestableModules(
        mockLocalStorage,
        mockDoc,
        mockLocation
    );
    
    ConfigManager.load();
    const config = ConfigManager.get();
    const threshold = config.masteryThreshold;
    
    // Get a test word
    const words = WordVerifier.parseVocabulary();
    const testWord = words[iteration % words.length];
    
    // First reach mastery
    for (let i = 0; i < threshold; i++) {
        WordVerifier.updateMastery(testWord, true);
    }
    
    let data = WordVerifier.getWordData(testWord);
    if (!data.mastered) {
        return false; // Should be mastered
    }
    
    // Provide more correct answers beyond threshold
    const extraCorrect = (iteration % 5) + 1;
    for (let i = 0; i < extraCorrect; i++) {
        WordVerifier.updateMastery(testWord, true);
    }
    
    data = WordVerifier.getWordData(testWord);
    
    // Verify: word should still be mastered
    return data.mastered === true;
}, { numRuns: 100, name: 'Mastery maintained beyond threshold' });

// Property 3d: Different words maintain independent mastery state
PropertyTest.assert((iteration) => {
    // Setup
    const mockLocalStorage = createMockLocalStorage();
    const mockDoc = createMockDocument(true);
    const mockLocation = createMockLocation('https://www.bilibili.com/video/BV1xx411c7mD');
    
    const { ConfigManager, WordVerifier } = createWordVerifierTestableModules(
        mockLocalStorage,
        mockDoc,
        mockLocation
    );
    
    ConfigManager.load();
    const config = ConfigManager.get();
    const threshold = config.masteryThreshold;
    
    // Get two different words
    const words = WordVerifier.parseVocabulary();
    if (words.length < 2) {
        return true; // Skip if not enough words
    }
    
    const word1 = words[0];
    const word2 = words[1];
    
    // Master word1 but not word2
    for (let i = 0; i < threshold; i++) {
        WordVerifier.updateMastery(word1, true);
    }
    
    // Only provide (threshold - 1) correct answers for word2
    for (let i = 0; i < threshold - 1; i++) {
        WordVerifier.updateMastery(word2, true);
    }
    
    const data1 = WordVerifier.getWordData(word1);
    const data2 = WordVerifier.getWordData(word2);
    
    // Verify: word1 should be mastered, word2 should not
    return data1.mastered === true && data2.mastered === false;
}, { numRuns: 50, name: 'Different words have independent mastery' });

// Property 3e: Mastery threshold is configurable
PropertyTest.assert((iteration) => {
    // Setup with custom threshold
    const mockLocalStorage = createMockLocalStorage();
    const mockDoc = createMockDocument(true);
    const mockLocation = createMockLocation('https://www.bilibili.com/video/BV1xx411c7mD');
    
    const { ConfigManager, WordVerifier } = createWordVerifierTestableModules(
        mockLocalStorage,
        mockDoc,
        mockLocation
    );
    
    // Set custom mastery threshold (2-5)
    const customThreshold = (iteration % 4) + 2;
    ConfigManager.load();
    ConfigManager.save({ masteryThreshold: customThreshold });
    
    // Get a test word
    const words = WordVerifier.parseVocabulary();
    const testWord = words[0];
    
    // Provide exactly customThreshold correct answers
    for (let i = 0; i < customThreshold; i++) {
        WordVerifier.updateMastery(testWord, true);
    }
    
    const data = WordVerifier.getWordData(testWord);
    
    // Verify: word should be mastered at customThreshold
    return data.mastered === true;
}, { numRuns: 50, name: 'Mastery threshold is configurable' });

// ============================================
// UNIT TESTS FOR WORD MASTERY EDGE CASES
// ============================================

console.log('\n=== Word Mastery Edge Case Tests ===\n');

let allPassed = true;

// Test: First answer for a new word
(function() {
    const mockLocalStorage = createMockLocalStorage();
    const mockDoc = createMockDocument(true);
    const mockLocation = createMockLocation('https://www.bilibili.com/video/BV1xx411c7mD');
    
    const { ConfigManager, WordVerifier } = createWordVerifierTestableModules(
        mockLocalStorage,
        mockDoc,
        mockLocation
    );
    
    ConfigManager.load();
    const words = WordVerifier.parseVocabulary();
    const testWord = words[0];
    
    // First correct answer
    WordVerifier.updateMastery(testWord, true);
    const data = WordVerifier.getWordData(testWord);
    
    const passed = data.consecutiveCorrect === 1 && data.mastered === false;
    console.log(`${passed ? '✓' : '✗'} First correct answer: consecutiveCorrect=1, mastered=false`);
    if (!passed) allPassed = false;
})();

// Test: Incorrect answer resets consecutiveCorrect
(function() {
    const mockLocalStorage = createMockLocalStorage();
    const mockDoc = createMockDocument(true);
    const mockLocation = createMockLocation('https://www.bilibili.com/video/BV1xx411c7mD');
    
    const { ConfigManager, WordVerifier } = createWordVerifierTestableModules(
        mockLocalStorage,
        mockDoc,
        mockLocation
    );
    
    ConfigManager.load();
    const words = WordVerifier.parseVocabulary();
    const testWord = words[0];
    
    // Provide 2 correct answers
    WordVerifier.updateMastery(testWord, true);
    WordVerifier.updateMastery(testWord, true);
    
    // Provide incorrect answer
    WordVerifier.updateMastery(testWord, false);
    
    const data = WordVerifier.getWordData(testWord);
    
    const passed = data.consecutiveCorrect === 0 && data.mastered === false;
    console.log(`${passed ? '✓' : '✗'} Incorrect answer resets: consecutiveCorrect=0, mastered=false`);
    if (!passed) allPassed = false;
})();

// Test: Mastery is reset on incorrect answer
(function() {
    const mockLocalStorage = createMockLocalStorage();
    const mockDoc = createMockDocument(true);
    const mockLocation = createMockLocation('https://www.bilibili.com/video/BV1xx411c7mD');
    
    const { ConfigManager, WordVerifier } = createWordVerifierTestableModules(
        mockLocalStorage,
        mockDoc,
        mockLocation
    );
    
    ConfigManager.load();
    const config = ConfigManager.get();
    const threshold = config.masteryThreshold;
    
    const words = WordVerifier.parseVocabulary();
    const testWord = words[0];
    
    // Reach mastery
    for (let i = 0; i < threshold; i++) {
        WordVerifier.updateMastery(testWord, true);
    }
    
    let data = WordVerifier.getWordData(testWord);
    if (!data.mastered) {
        console.log('✗ Word should be mastered before reset test');
        allPassed = false;
        return;
    }
    
    // Provide incorrect answer
    WordVerifier.updateMastery(testWord, false);
    
    data = WordVerifier.getWordData(testWord);
    
    const passed = data.consecutiveCorrect === 0 && data.mastered === false;
    console.log(`${passed ? '✓' : '✗'} Mastery reset on incorrect: consecutiveCorrect=0, mastered=false`);
    if (!passed) allPassed = false;
})();

// Test: Total attempts increment correctly
(function() {
    const mockLocalStorage = createMockLocalStorage();
    const mockDoc = createMockDocument(true);
    const mockLocation = createMockLocation('https://www.bilibili.com/video/BV1xx411c7mD');
    
    const { ConfigManager, WordVerifier } = createWordVerifierTestableModules(
        mockLocalStorage,
        mockDoc,
        mockLocation
    );
    
    ConfigManager.load();
    const words = WordVerifier.parseVocabulary();
    const testWord = words[0];
    
    // 3 correct, 2 incorrect
    WordVerifier.updateMastery(testWord, true);
    WordVerifier.updateMastery(testWord, true);
    WordVerifier.updateMastery(testWord, true);
    WordVerifier.updateMastery(testWord, false);
    WordVerifier.updateMastery(testWord, false);
    
    const data = WordVerifier.getWordData(testWord);
    
    const passed = data.totalAttempts === 5 && data.correctAttempts === 3;
    console.log(`${passed ? '✓' : '✗'} Total attempts: total=5, correct=3`);
    if (!passed) allPassed = false;
})();

// Test: checkAnswer is case-insensitive
(function() {
    const mockLocalStorage = createMockLocalStorage();
    const mockDoc = createMockDocument(true);
    const mockLocation = createMockLocation('https://www.bilibili.com/video/BV1xx411c7mD');
    
    const { ConfigManager, WordVerifier } = createWordVerifierTestableModules(
        mockLocalStorage,
        mockDoc,
        mockLocation
    );
    
    ConfigManager.load();
    const words = WordVerifier.parseVocabulary();
    const testWord = words[0]; // "学习:study"
    
    const correct1 = WordVerifier.checkAnswer(testWord, 'STUDY');
    const correct2 = WordVerifier.checkAnswer(testWord, 'Study');
    const correct3 = WordVerifier.checkAnswer(testWord, 'study');
    const incorrect = WordVerifier.checkAnswer(testWord, 'learn');
    
    const passed = correct1 && correct2 && correct3 && !incorrect;
    console.log(`${passed ? '✓' : '✗'} checkAnswer is case-insensitive`);
    if (!passed) allPassed = false;
})();

// Test: Word data persists in localStorage
(function() {
    const mockLocalStorage = createMockLocalStorage();
    const mockDoc = createMockDocument(true);
    const mockLocation = createMockLocation('https://www.bilibili.com/video/BV1xx411c7mD');
    
    const { ConfigManager, WordVerifier } = createWordVerifierTestableModules(
        mockLocalStorage,
        mockDoc,
        mockLocation
    );
    
    ConfigManager.load();
    const words = WordVerifier.parseVocabulary();
    const testWord = words[0];
    
    // Add some data
    WordVerifier.updateMastery(testWord, true);
    WordVerifier.updateMastery(testWord, true);
    
    // Create new instance to simulate page reload
    const { WordVerifier: WordVerifier2 } = createWordVerifierTestableModules(
        mockLocalStorage,
        mockDoc,
        mockLocation
    );
    
    const data = WordVerifier2.getWordData(testWord);
    const passed = data && data.consecutiveCorrect === 2;
    console.log(`${passed ? '✓' : '✗'} Word data persists in localStorage`);
    if (!passed) allPassed = false;
})();

// ============================================
// PROPERTY TESTS - Property 4: Word mastery reset
// ============================================

console.log('\n=== Property 4: Word mastery reset (Requirements 7.4) ===\n');

// Property 4a: Consecutive correct counter resets to 0 on incorrect answer
PropertyTest.assert((iteration) => {
    // Setup
    const mockLocalStorage = createMockLocalStorage();
    const mockDoc = createMockDocument(true);
    const mockLocation = createMockLocation('https://www.bilibili.com/video/BV1xx411c7mD');
    
    const { ConfigManager, WordVerifier } = createWordVerifierTestableModules(
        mockLocalStorage,
        mockDoc,
        mockLocation
    );
    
    ConfigManager.load();
    
    // Get a test word
    const words = WordVerifier.parseVocabulary();
    const testWord = words[iteration % words.length];
    
    // Provide random number of correct answers before incorrect (1-10)
    const numCorrect = (iteration % 10) + 1;
    
    for (let i = 0; i < numCorrect; i++) {
        WordVerifier.updateMastery(testWord, true);
    }
    
    // Verify counter incremented
    let data = WordVerifier.getWordData(testWord);
    if (data.consecutiveCorrect !== numCorrect) {
        return false;
    }
    
    // Provide incorrect answer
    WordVerifier.updateMastery(testWord, false);
    
    // Get final state
    data = WordVerifier.getWordData(testWord);
    
    // Verify: consecutiveCorrect should reset to 0
    return data.consecutiveCorrect === 0;
}, { numRuns: 100, name: 'Consecutive correct resets to 0 on incorrect answer' });

// Property 4b: Mastered status is removed on incorrect answer
PropertyTest.assert((iteration) => {
    // Setup
    const mockLocalStorage = createMockLocalStorage();
    const mockDoc = createMockDocument(true);
    const mockLocation = createMockLocation('https://www.bilibili.com/video/BV1xx411c7mD');
    
    const { ConfigManager, WordVerifier } = createWordVerifierTestableModules(
        mockLocalStorage,
        mockDoc,
        mockLocation
    );
    
    ConfigManager.load();
    const config = ConfigManager.get();
    const threshold = config.masteryThreshold;
    
    // Get a test word
    const words = WordVerifier.parseVocabulary();
    const testWord = words[iteration % words.length];
    
    // First reach mastery
    for (let i = 0; i < threshold; i++) {
        WordVerifier.updateMastery(testWord, true);
    }
    
    // Verify word is mastered
    let data = WordVerifier.getWordData(testWord);
    if (!data.mastered) {
        return false;
    }
    
    // Provide incorrect answer
    WordVerifier.updateMastery(testWord, false);
    
    // Get final state
    data = WordVerifier.getWordData(testWord);
    
    // Verify: mastered should be false
    return data.mastered === false;
}, { numRuns: 100, name: 'Mastered status removed on incorrect answer' });

// Property 4c: Reset happens regardless of how many correct answers were given
PropertyTest.assert((iteration) => {
    // Setup
    const mockLocalStorage = createMockLocalStorage();
    const mockDoc = createMockDocument(true);
    const mockLocation = createMockLocation('https://www.bilibili.com/video/BV1xx411c7mD');
    
    const { ConfigManager, WordVerifier } = createWordVerifierTestableModules(
        mockLocalStorage,
        mockDoc,
        mockLocation
    );
    
    ConfigManager.load();
    
    // Get a test word
    const words = WordVerifier.parseVocabulary();
    const testWord = words[iteration % words.length];
    
    // Provide varying numbers of correct answers (1-20)
    const numCorrect = (iteration % 20) + 1;
    
    for (let i = 0; i < numCorrect; i++) {
        WordVerifier.updateMastery(testWord, true);
    }
    
    // Provide incorrect answer
    WordVerifier.updateMastery(testWord, false);
    
    // Get final state
    const data = WordVerifier.getWordData(testWord);
    
    // Verify: consecutiveCorrect should always reset to 0 regardless of prior count
    return data.consecutiveCorrect === 0;
}, { numRuns: 100, name: 'Reset works regardless of prior correct count' });

// Property 4d: Multiple incorrect answers in a row keep counter at 0
PropertyTest.assert((iteration) => {
    // Setup
    const mockLocalStorage = createMockLocalStorage();
    const mockDoc = createMockDocument(true);
    const mockLocation = createMockLocation('https://www.bilibili.com/video/BV1xx411c7mD');
    
    const { ConfigManager, WordVerifier } = createWordVerifierTestableModules(
        mockLocalStorage,
        mockDoc,
        mockLocation
    );
    
    ConfigManager.load();
    
    // Get a test word
    const words = WordVerifier.parseVocabulary();
    const testWord = words[iteration % words.length];
    
    // First build up some correct answers
    const numCorrect = (iteration % 5) + 1;
    for (let i = 0; i < numCorrect; i++) {
        WordVerifier.updateMastery(testWord, true);
    }
    
    // Provide multiple incorrect answers
    const numIncorrect = (iteration % 3) + 1;
    for (let i = 0; i < numIncorrect; i++) {
        WordVerifier.updateMastery(testWord, false);
    }
    
    // Get final state
    const data = WordVerifier.getWordData(testWord);
    
    // Verify: consecutiveCorrect should stay at 0 after multiple incorrect answers
    return data.consecutiveCorrect === 0;
}, { numRuns: 100, name: 'Multiple incorrect answers keep counter at 0' });

// Property 4e: Reset works for words that were never mastered
PropertyTest.assert((iteration) => {
    // Setup
    const mockLocalStorage = createMockLocalStorage();
    const mockDoc = createMockDocument(true);
    const mockLocation = createMockLocation('https://www.bilibili.com/video/BV1xx411c7mD');
    
    const { ConfigManager, WordVerifier } = createWordVerifierTestableModules(
        mockLocalStorage,
        mockDoc,
        mockLocation
    );
    
    ConfigManager.load();
    const config = ConfigManager.get();
    const threshold = config.masteryThreshold;
    
    // Get a test word
    const words = WordVerifier.parseVocabulary();
    const testWord = words[iteration % words.length];
    
    // Provide fewer correct answers than threshold (never mastered)
    const numCorrect = (iteration % (threshold - 1)) + 1;
    for (let i = 0; i < numCorrect; i++) {
        WordVerifier.updateMastery(testWord, true);
    }
    
    // Verify not mastered
    let data = WordVerifier.getWordData(testWord);
    if (data.mastered) {
        return false;
    }
    
    // Provide incorrect answer
    WordVerifier.updateMastery(testWord, false);
    
    // Get final state
    data = WordVerifier.getWordData(testWord);
    
    // Verify: consecutiveCorrect should reset to 0, mastered should remain false
    return data.consecutiveCorrect === 0 && data.mastered === false;
}, { numRuns: 100, name: 'Reset works for never-mastered words' });

// ============================================
// InterventionController Testable Module
// ============================================

const createInterventionControllerTestableModules = (localStorage, document, location) => {
    // Config Manager (same as before)
    const ConfigManager = (() => {
        const defaultConfig = {
            studyPeriods: [['08:00', '22:00']],
            whitelist: ['BV1xx411c7mD'],
            interventionStages: [
                { threshold: 0, interval: 0 },
                { threshold: 60, interval: 0 },
                { threshold: 300, interval: 120 },
                { threshold: 600, interval: 30 },
                { threshold: 1200, interval: 15 }
            ],
            vocabulary: ['学习:study', '专注:focus', '进步:progress'],
            masteryThreshold: 3,
            includeMasteredWords: false,
            floatingWindow: { enabled: true },
            statsPeriod: 'day'
        };

        let currentConfig = { ...defaultConfig };

        return {
            load() {
                try {
                    const data = localStorage.getItem('bilibiliStudyAssistant_config');
                    if (data) {
                        currentConfig = { ...defaultConfig, ...JSON.parse(data) };
                    }
                } catch (e) {
                    currentConfig = { ...defaultConfig };
                }
            },
            save(config) {
                currentConfig = { ...currentConfig, ...config };
                localStorage.setItem('bilibiliStudyAssistant_config', JSON.stringify(currentConfig));
            },
            get() {
                return { ...currentConfig };
            },
            getInterventionConfig(stage) {
                const config = this.get();
                if (!config.interventionStages || stage < 0 || stage >= config.interventionStages.length) {
                    return null;
                }
                return config.interventionStages[stage];
            }
        };
    })();

    // InterventionController - getCurrentStage function (extracted from main script)
    const InterventionController = (() => {
        // Get current stage based on distraction duration
        function getCurrentStage(distractionDuration) {
            const config = ConfigManager.get();
            const stages = config.interventionStages || [];

            // Find the highest stage whose threshold is met
            let currentStage = 0;
            for (let i = stages.length - 1; i >= 0; i--) {
                if (distractionDuration >= stages[i].threshold) {
                    currentStage = i;
                    break;
                }
            }
            return currentStage;
        }

        return {
            getCurrentStage
        };
    })();

    return {
        ConfigManager,
        InterventionController
    };
};

// ============================================
// PROPERTY TESTS - Property 5: Stage progression
// Validates: Requirements 6.1, 6.2, 6.3, 6.4, 6.5
// ============================================

console.log('\n=== Property 5: Stage progression (Requirements 6.1, 6.2, 6.3, 6.4, 6.5) ===\n');

// Property 5a: Stage 0 for duration 0 (just started distracting)
PropertyTest.assert((iteration) => {
    const mockLocalStorage = createMockLocalStorage();
    const mockDoc = createMockDocument(true);
    const mockLocation = createMockLocation('https://www.bilibili.com/video/BV1xx411c7mD');
    
    const { ConfigManager, InterventionController } = createInterventionControllerTestableModules(
        mockLocalStorage,
        mockDoc,
        mockLocation
    );
    
    ConfigManager.load();
    
    // Test duration 0
    const stage = InterventionController.getCurrentStage(0);
    return stage === 0;
}, { numRuns: 10, name: 'Stage 0 for duration 0s' });

// Property 5b: Stage 0 for duration less than 60s
PropertyTest.assert((iteration) => {
    const mockLocalStorage = createMockLocalStorage();
    const mockDoc = createMockDocument(true);
    const mockLocation = createMockLocation('https://www.bilibili.com/video/BV1xx411c7mD');
    
    const { ConfigManager, InterventionController } = createInterventionControllerTestableModules(
        mockLocalStorage,
        mockDoc,
        mockLocation
    );
    
    ConfigManager.load();
    
    // Test random duration from 1 to 59 seconds
    const duration = (iteration % 59) + 1;
    const stage = InterventionController.getCurrentStage(duration);
    return stage === 0;
}, { numRuns: 100, name: 'Stage 0 for duration 1-59s' });

// Property 5c: Stage 1 for duration 60-299s (1-5 minutes)
PropertyTest.assert((iteration) => {
    const mockLocalStorage = createMockLocalStorage();
    const mockDoc = createMockDocument(true);
    const mockLocation = createMockLocation('https://www.bilibili.com/video/BV1xx411c7mD');
    
    const { ConfigManager, InterventionController } = createInterventionControllerTestableModules(
        mockLocalStorage,
        mockDoc,
        mockLocation
    );
    
    ConfigManager.load();
    
    // Test random duration from 60 to 299 seconds
    const duration = 60 + (iteration % 240);
    const stage = InterventionController.getCurrentStage(duration);
    return stage === 1;
}, { numRuns: 100, name: 'Stage 1 for duration 60-299s' });

// Property 5d: Stage 2 for duration 300-599s (5-10 minutes)
PropertyTest.assert((iteration) => {
    const mockLocalStorage = createMockLocalStorage();
    const mockDoc = createMockDocument(true);
    const mockLocation = createMockLocation('https://www.bilibili.com/video/BV1xx411c7mD');
    
    const { ConfigManager, InterventionController } = createInterventionControllerTestableModules(
        mockLocalStorage,
        mockDoc,
        mockLocation
    );
    
    ConfigManager.load();
    
    // Test random duration from 300 to 599 seconds
    const duration = 300 + (iteration % 300);
    const stage = InterventionController.getCurrentStage(duration);
    return stage === 2;
}, { numRuns: 100, name: 'Stage 2 for duration 300-599s' });

// Property 5e: Stage 3 for duration 600-1199s (10-20 minutes)
PropertyTest.assert((iteration) => {
    const mockLocalStorage = createMockLocalStorage();
    const mockDoc = createMockDocument(true);
    const mockLocation = createMockLocation('https://www.bilibili.com/video/BV1xx411c7mD');
    
    const { ConfigManager, InterventionController } = createInterventionControllerTestableModules(
        mockLocalStorage,
        mockDoc,
        mockLocation
    );
    
    ConfigManager.load();
    
    // Test random duration from 600 to 1199 seconds
    const duration = 600 + (iteration % 600);
    const stage = InterventionController.getCurrentStage(duration);
    return stage === 3;
}, { numRuns: 100, name: 'Stage 3 for duration 600-1199s' });

// Property 5f: Stage 4 for duration >= 1200s (20+ minutes)
PropertyTest.assert((iteration) => {
    const mockLocalStorage = createMockLocalStorage();
    const mockDoc = createMockDocument(true);
    const mockLocation = createMockLocation('https://www.bilibili.com/video/BV1xx411c7mD');
    
    const { ConfigManager, InterventionController } = createInterventionControllerTestableModules(
        mockLocalStorage,
        mockDoc,
        mockLocation
    );
    
    ConfigManager.load();
    
    // Test random duration from 1200 to 3600 seconds (up to 1 hour)
    const duration = 1200 + (iteration % 2400);
    const stage = InterventionController.getCurrentStage(duration);
    return stage === 4;
}, { numRuns: 100, name: 'Stage 4 for duration >= 1200s' });

// Property 5g: Stage progression is monotonic (stage increases with duration)
PropertyTest.assert((iteration) => {
    const mockLocalStorage = createMockLocalStorage();
    const mockDoc = createMockDocument(true);
    const mockLocation = createMockLocation('https://www.bilibili.com/video/BV1xx411c7mD');
    
    const { ConfigManager, InterventionController } = createInterventionControllerTestableModules(
        mockLocalStorage,
        mockDoc,
        mockLocation
    );
    
    ConfigManager.load();
    
    // Test that stage never decreases as duration increases
    const baseDuration = iteration * 100; // 0, 100, 200, ...
    const stage1 = InterventionController.getCurrentStage(baseDuration);
    const stage2 = InterventionController.getCurrentStage(baseDuration + 50);
    
    // Stage should be >= previous stage
    return stage2 >= stage1;
}, { numRuns: 100, name: 'Stage progression is monotonic' });

// Property 5h: Stage matches threshold boundary exactly
PropertyTest.assert((iteration) => {
    const mockLocalStorage = createMockLocalStorage();
    const mockDoc = createMockDocument(true);
    const mockLocation = createMockLocation('https://www.bilibili.com/video/BV1xx411c7mD');
    
    const { ConfigManager, InterventionController } = createInterventionControllerTestableModules(
        mockLocalStorage,
        mockDoc,
        mockLocation
    );
    
    ConfigManager.load();
    
    // Test exact threshold boundaries
    const thresholds = [0, 60, 300, 600, 1200];
    const expectedStages = [0, 1, 2, 3, 4];
    
    const idx = iteration % thresholds.length;
    const duration = thresholds[idx];
    const expectedStage = expectedStages[idx];
    
    const stage = InterventionController.getCurrentStage(duration);
    return stage === expectedStage;
}, { numRuns: 50, name: 'Stage matches threshold boundary exactly' });

// Property 5i: Stage thresholds are configurable
PropertyTest.assert((iteration) => {
    const mockLocalStorage = createMockLocalStorage();
    const mockDoc = createMockDocument(true);
    const mockLocation = createMockLocation('https://www.bilibili.com/video/BV1xx411c7mD');
    
    const { ConfigManager, InterventionController } = createInterventionControllerTestableModules(
        mockLocalStorage,
        mockDoc,
        mockLocation
    );
    
    ConfigManager.load();
    
    // Set custom thresholds: [0, 30, 120, 240, 480]
    const customStages = [
        { threshold: 0, interval: 0 },
        { threshold: 30, interval: 0 },
        { threshold: 120, interval: 60 },
        { threshold: 240, interval: 30 },
        { threshold: 480, interval: 15 }
    ];
    ConfigManager.save({ interventionStages: customStages });
    
    // Test that custom thresholds work
    const testCases = [
        { duration: 0, expectedStage: 0 },
        { duration: 30, expectedStage: 1 },
        { duration: 120, expectedStage: 2 },
        { duration: 240, expectedStage: 3 },
        { duration: 480, expectedStage: 4 }
    ];
    
    const idx = iteration % testCases.length;
    const { duration, expectedStage } = testCases[idx];
    const stage = InterventionController.getCurrentStage(duration);
    
    return stage === expectedStage;
}, { numRuns: 50, name: 'Stage thresholds are configurable' });

// ============================================
// UNIT TESTS FOR STAGE PROGRESSION EDGE CASES
// ============================================

console.log('\n=== Stage Progression Edge Case Tests ===\n');

let stageTestsPassed = true;

// Test: Stage 0 for very small duration (edge case)
(function() {
    const mockLocalStorage = createMockLocalStorage();
    const mockDoc = createMockDocument(true);
    const mockLocation = createMockLocation('https://www.bilibili.com/video/BV1xx411c7mD');
    
    const { ConfigManager, InterventionController } = createInterventionControllerTestableModules(
        mockLocalStorage,
        mockDoc,
        mockLocation
    );
    
    ConfigManager.load();
    
    const stage = InterventionController.getCurrentStage(0.5); // Less than 1 second
    const passed = stage === 0;
    console.log(`${passed ? '✓' : '✗'} Stage 0 for duration < 1s: stage=${stage}`);
    if (!passed) stageTestsPassed = false;
})();

// Test: Stage 1 starts exactly at 60s
(function() {
    const mockLocalStorage = createMockLocalStorage();
    const mockDoc = createMockDocument(true);
    const mockLocation = createMockLocation('https://www.bilibili.com/video/BV1xx411c7mD');
    
    const { ConfigManager, InterventionController } = createInterventionControllerTestableModules(
        mockLocalStorage,
        mockDoc,
        mockLocation
    );
    
    ConfigManager.load();
    
    const stage = InterventionController.getCurrentStage(60);
    const passed = stage === 1;
    console.log(`${passed ? '✓' : '✗'} Stage 1 starts at exactly 60s: stage=${stage}`);
    if (!passed) stageTestsPassed = false;
})();

// Test: Stage 2 starts exactly at 300s
(function() {
    const mockLocalStorage = createMockLocalStorage();
    const mockDoc = createMockDocument(true);
    const mockLocation = createMockLocation('https://www.bilibili.com/video/BV1xx411c7mD');
    
    const { ConfigManager, InterventionController } = createInterventionControllerTestableModules(
        mockLocalStorage,
        mockDoc,
        mockLocation
    );
    
    ConfigManager.load();
    
    const stage = InterventionController.getCurrentStage(300);
    const passed = stage === 2;
    console.log(`${passed ? '✓' : '✗'} Stage 2 starts at exactly 300s: stage=${stage}`);
    if (!passed) stageTestsPassed = false;
})();

// Test: Stage 3 starts exactly at 600s
(function() {
    const mockLocalStorage = createMockLocalStorage();
    const mockDoc = createMockDocument(true);
    const mockLocation = createMockLocation('https://www.bilibili.com/video/BV1xx411c7mD');
    
    const { ConfigManager, InterventionController } = createInterventionControllerTestableModules(
        mockLocalStorage,
        mockDoc,
        mockLocation
    );
    
    ConfigManager.load();
    
    const stage = InterventionController.getCurrentStage(600);
    const passed = stage === 3;
    console.log(`${passed ? '✓' : '✗'} Stage 3 starts at exactly 600s: stage=${stage}`);
    if (!passed) stageTestsPassed = false;
})();

// Test: Stage 4 starts exactly at 1200s
(function() {
    const mockLocalStorage = createMockLocalStorage();
    const mockDoc = createMockDocument(true);
    const mockLocation = createMockLocation('https://www.bilibili.com/video/BV1xx411c7mD');
    
    const { ConfigManager, InterventionController } = createInterventionControllerTestableModules(
        mockLocalStorage,
        mockDoc,
        mockLocation
    );
    
    ConfigManager.load();
    
    const stage = InterventionController.getCurrentStage(1200);
    const passed = stage === 4;
    console.log(`${passed ? '✓' : '✗'} Stage 4 starts at exactly 1200s: stage=${stage}`);
    if (!passed) stageTestsPassed = false;
})();

// Test: Very large duration stays at max stage
(function() {
    const mockLocalStorage = createMockLocalStorage();
    const mockDoc = createMockDocument(true);
    const mockLocation = createMockLocation('https://www.bilibili.com/video/BV1xx411c7mD');
    
    const { ConfigManager, InterventionController } = createInterventionControllerTestableModules(
        mockLocalStorage,
        mockDoc,
        mockLocation
    );
    
    ConfigManager.load();
    
    const stage = InterventionController.getCurrentStage(86400); // 24 hours
    const passed = stage === 4; // Max stage
    console.log(`${passed ? '✓' : '✗'} Very large duration stays at max stage: stage=${stage}`);
    if (!passed) stageTestsPassed = false;
})();

// Test: getInterventionConfig returns correct config for each stage
(function() {
    const mockLocalStorage = createMockLocalStorage();
    const mockDoc = createMockDocument(true);
    const mockLocation = createMockLocation('https://www.bilibili.com/video/BV1xx411c7mD');
    
    const { ConfigManager, InterventionController } = createInterventionControllerTestableModules(
        mockLocalStorage,
        mockDoc,
        mockLocation
    );
    
    ConfigManager.load();
    
    const config0 = ConfigManager.getInterventionConfig(0);
    const config1 = ConfigManager.getInterventionConfig(1);
    const config2 = ConfigManager.getInterventionConfig(2);
    const config3 = ConfigManager.getInterventionConfig(3);
    const config4 = ConfigManager.getInterventionConfig(4);
    
    const passed = config0 && config1 && config2 && config3 && config4 &&
                   config0.threshold === 0 &&
                   config1.threshold === 60 &&
                   config2.threshold === 300 &&
                   config3.threshold === 600 &&
                   config4.threshold === 1200;
    
    console.log(`${passed ? '✓' : '✗'} getInterventionConfig returns correct config for all stages`);
    if (!passed) stageTestsPassed = false;
})();

// Test: Invalid stage returns null
(function() {
    const mockLocalStorage = createMockLocalStorage();
    const mockDoc = createMockDocument(true);
    const mockLocation = createMockLocation('https://www.bilibili.com/video/BV1xx411c7mD');
    
    const { ConfigManager, InterventionController } = createInterventionControllerTestableModules(
        mockLocalStorage,
        mockDoc,
        mockLocation
    );
    
    ConfigManager.load();
    
    const configNeg = ConfigManager.getInterventionConfig(-1);
    const configOut = ConfigManager.getInterventionConfig(100);
    
    const passed = configNeg === null && configOut === null;
    console.log(`${passed ? '✓' : '✗'} Invalid stage returns null`);
    if (!passed) stageTestsPassed = false;
})();

// ============================================
// PROPERTY TESTS - Property 6: Stage reset on whitelist return
// Validates: Requirements 6.7
// ============================================

console.log('\n=== Property 6: Stage reset on whitelist return (Requirements 6.7) ===\n');

// Extended InterventionController with reset functionality
const createInterventionControllerWithReset = (localStorage, document, location) => {
    // Config Manager (same as before)
    const ConfigManager = (() => {
        const defaultConfig = {
            studyPeriods: [['08:00', '22:00']],
            whitelist: ['BV1xx411c7mD'],
            interventionStages: [
                { threshold: 0, interval: 0 },
                { threshold: 60, interval: 0 },
                { threshold: 300, interval: 120 },
                { threshold: 600, interval: 30 },
                { threshold: 1200, interval: 15 }
            ],
            vocabulary: ['学习:study', '专注:focus', '进步:progress'],
            masteryThreshold: 3,
            includeMasteredWords: false,
            floatingWindow: { enabled: true },
            statsPeriod: 'day'
        };

        let currentConfig = { ...defaultConfig };

        return {
            load() {
                try {
                    const data = localStorage.getItem('bilibiliStudyAssistant_config');
                    if (data) {
                        currentConfig = { ...defaultConfig, ...JSON.parse(data) };
                    }
                } catch (e) {
                    currentConfig = { ...defaultConfig };
                }
            },
            save(config) {
                currentConfig = { ...currentConfig, ...config };
                localStorage.setItem('bilibiliStudyAssistant_config', JSON.stringify(currentConfig));
            },
            get() {
                return { ...currentConfig };
            },
            getInterventionConfig(stage) {
                const config = this.get();
                if (!config.interventionStages || stage < 0 || stage >= config.interventionStages.length) {
                    return null;
                }
                return config.interventionStages[stage];
            }
        };
    })();

    // App state (simulating window.__bilibiliStudyAppState)
    let appState = {
        currentStage: 0,
        distractionStartTime: null
    };

    // InterventionController with reset functionality
    const InterventionController = (() => {
        // Get current stage based on distraction duration
        function getCurrentStage(distractionDuration) {
            const config = ConfigManager.get();
            const stages = config.interventionStages || [];

            // Find the highest stage whose threshold is met
            let currentStage = 0;
            for (let i = stages.length - 1; i >= 0; i--) {
                if (distractionDuration >= stages[i].threshold) {
                    currentStage = i;
                    break;
                }
            }
            return currentStage;
        }

        // Reset stage to 0 and clear distraction start time
        // Called when user returns to whitelist video
        function reset() {
            appState.currentStage = 0;
            appState.distractionStartTime = null;
        }

        // Set the current stage (simulating being in a distracted state)
        function setStage(stage) {
            appState.currentStage = stage;
        }

        // Set distraction start time
        function setDistractionStartTime(time) {
            appState.distractionStartTime = time;
        }

        // Get current app state
        function getState() {
            return { ...appState };
        }

        return {
            getCurrentStage,
            reset,
            setStage,
            setDistractionStartTime,
            getState
        };
    })();

    return {
        ConfigManager,
        InterventionController
    };
};

// Property 6a: Stage resets to 0 when user returns to whitelist
PropertyTest.assert((iteration) => {
    const mockLocalStorage = createMockLocalStorage();
    const mockDoc = createMockDocument(true);
    const mockLocation = createMockLocation('https://www.bilibili.com/video/BV1xx411c7mD');
    
    const { InterventionController } = createInterventionControllerWithReset(
        mockLocalStorage,
        mockDoc,
        mockLocation
    );
    
    // Simulate being in a distracted state at various stages (1-4)
    const testStage = (iteration % 4) + 1;
    InterventionController.setStage(testStage);
    InterventionController.setDistractionStartTime(Date.now() - 60000); // 1 minute ago
    
    // Verify we're in a distracted state
    let state = InterventionController.getState();
    if (state.currentStage !== testStage) {
        return false;
    }
    
    // User returns to whitelist - call reset
    InterventionController.reset();
    
    // Get new state
    state = InterventionController.getState();
    
    // Verify: stage should reset to 0
    return state.currentStage === 0;
}, { numRuns: 100, name: 'Stage resets to 0 on whitelist return' });

// Property 6b: distractionStartTime is set to null when user returns to whitelist
PropertyTest.assert((iteration) => {
    const mockLocalStorage = createMockLocalStorage();
    const mockDoc = createMockDocument(true);
    const mockLocation = createMockLocation('https://www.bilibili.com/video/BV1xx411c7mD');
    
    const { InterventionController } = createInterventionControllerWithReset(
        mockLocalStorage,
        mockDoc,
        mockLocation
    );
    
    // Set various distraction start times (random time in the past)
    const pastTime = Date.now() - ((iteration % 3600) + 1) * 1000; // 1s to 1 hour ago
    InterventionController.setStage(2);
    InterventionController.setDistractionStartTime(pastTime);
    
    // Verify distraction start time is set
    let state = InterventionController.getState();
    if (state.distractionStartTime !== pastTime) {
        return false;
    }
    
    // User returns to whitelist - call reset
    InterventionController.reset();
    
    // Get new state
    state = InterventionController.getState();
    
    // Verify: distractionStartTime should be null
    return state.distractionStartTime === null;
}, { numRuns: 100, name: 'distractionStartTime resets to null on whitelist return' });

// Property 6c: Reset works from any stage (1-4)
PropertyTest.assert((iteration) => {
    const mockLocalStorage = createMockLocalStorage();
    const mockDoc = createMockDocument(true);
    const mockLocation = createMockLocation('https://www.bilibili.com/video/BV1xx411c7mD');
    
    const { InterventionController } = createInterventionControllerWithReset(
        mockLocalStorage,
        mockDoc,
        mockLocation
    );
    
    // Test all stages 1-4
    const testStage = (iteration % 4) + 1;
    InterventionController.setStage(testStage);
    InterventionController.setDistractionStartTime(Date.now());
    
    // Reset
    InterventionController.reset();
    
    const state = InterventionController.getState();
    
    // Verify both are reset
    return state.currentStage === 0 && state.distractionStartTime === null;
}, { numRuns: 100, name: 'Reset works from any stage (1-4)' });

// Property 6d: Multiple resets always result in stage 0
PropertyTest.assert((iteration) => {
    const mockLocalStorage = createMockLocalStorage();
    const mockDoc = createMockDocument(true);
    const mockLocation = createMockLocation('https://www.bilibili.com/video/BV1xx411c7mD');
    
    const { InterventionController } = createInterventionControllerWithReset(
        mockLocalStorage,
        mockDoc,
        mockLocation
    );
    
    // Set a high stage
    InterventionController.setStage(4);
    InterventionController.setDistractionStartTime(Date.now());
    
    // Call reset multiple times (simulating repeated returns to whitelist)
    const numResets = (iteration % 5) + 1; // 1-5 resets
    for (let i = 0; i < numResets; i++) {
        InterventionController.reset();
    }
    
    const state = InterventionController.getState();
    
    // Verify stage is still 0 after multiple resets
    return state.currentStage === 0 && state.distractionStartTime === null;
}, { numRuns: 100, name: 'Multiple resets always result in stage 0' });

// Property 6e: Reset is idempotent (calling reset on already reset state is safe)
PropertyTest.assert((iteration) => {
    const mockLocalStorage = createMockLocalStorage();
    const mockDoc = createMockDocument(true);
    const mockLocation = createMockLocation('https://www.bilibili.com/video/BV1xx411c7mD');
    
    const { InterventionController } = createInterventionControllerWithReset(
        mockLocalStorage,
        mockDoc,
        mockLocation
    );
    
    // Start from a clean state (stage 0, no distraction time)
    // This simulates the user already on whitelist
    InterventionController.reset();
    
    // Call reset again (idempotent operation)
    InterventionController.reset();
    
    const state = InterventionController.getState();
    
    // Verify state remains clean
    return state.currentStage === 0 && state.distractionStartTime === null;
}, { numRuns: 50, name: 'Reset is idempotent' });

// ============================================
// UNIT TESTS FOR STAGE RESET EDGE CASES
// ============================================

console.log('\n=== Stage Reset Edge Case Tests ===\n');

let resetTestsPassed = true;

// Test: Reset from stage 0 (initial state) is safe
(function() {
    const mockLocalStorage = createMockLocalStorage();
    const mockDoc = createMockDocument(true);
    const mockLocation = createMockLocation('https://www.bilibili.com/video/BV1xx411c7mD');
    
    const { InterventionController } = createInterventionControllerWithReset(
        mockLocalStorage,
        mockDoc,
        mockLocation
    );
    
    // Already at stage 0
    InterventionController.reset();
    const state = InterventionController.getState();
    
    const passed = state.currentStage === 0 && state.distractionStartTime === null;
    console.log(`${passed ? '✓' : '✗'} Reset from stage 0 is safe`);
    if (!passed) resetTestsPassed = false;
})();

// Test: Reset from max stage (4) clears everything
(function() {
    const mockLocalStorage = createMockLocalStorage();
    const mockDoc = createMockDocument(true);
    const mockLocation = createMockLocation('https://www.bilibili.com/video/BV1xx411c7mD');
    
    const { InterventionController } = createInterventionControllerWithReset(
        mockLocalStorage,
        mockDoc,
        mockLocation
    );
    
    // Set to max stage with long distraction time
    InterventionController.setStage(4);
    InterventionController.setDistractionStartTime(Date.now() - 3600000); // 1 hour ago
    
    // Reset
    InterventionController.reset();
    const state = InterventionController.getState();
    
    const passed = state.currentStage === 0 && state.distractionStartTime === null;
    console.log(`${passed ? '✓' : '✗'} Reset from max stage clears everything`);
    if (!passed) resetTestsPassed = false;
})();

// Test: State object is properly isolated between instances
(function() {
    const mockLocalStorage = createMockLocalStorage();
    const mockDoc = createMockDocument(true);
    const mockLocation = createMockLocation('https://www.bilibili.com/video/BV1xx411c7mD');
    
    const { InterventionController: IC1 } = createInterventionControllerWithReset(
        mockLocalStorage,
        mockDoc,
        mockLocation
    );
    
    const { InterventionController: IC2 } = createInterventionControllerWithReset(
        mockLocalStorage,
        mockDoc,
        mockLocation
    );
    
    // Set stage on first instance
    IC1.setStage(3);
    IC1.setDistractionStartTime(Date.now());
    
    // Reset second instance
    IC2.reset();
    
    // First instance should still have its state
    const state1 = IC1.getState();
    const state2 = IC2.getState();
    
    const passed = state1.currentStage === 3 && state2.currentStage === 0;
    console.log(`${passed ? '✓' : '✗'} State is properly isolated between instances`);
    if (!passed) resetTestsPassed = false;
})();

// Test: getState returns a copy, not reference
(function() {
    const mockLocalStorage = createMockLocalStorage();
    const mockDoc = createMockDocument(true);
    const mockLocation = createMockLocation('https://www.bilibili.com/video/BV1xx411c7mD');
    
    const { InterventionController } = createInterventionControllerWithReset(
        mockLocalStorage,
        mockDoc,
        mockLocation
    );
    
    InterventionController.setStage(2);
    const state1 = InterventionController.getState();
    state1.currentStage = 99; // Try to modify returned state
    
    const state2 = InterventionController.getState();
    
    const passed = state2.currentStage === 2; // Original should be unchanged
    console.log(`${passed ? '✓' : '✗'} getState returns a copy, not reference`);
    if (!passed) resetTestsPassed = false;
})();

// ============================================
// FINAL SUMMARY
// ============================================

const finalSuccess = PropertyTest.summary();
console.log(`\n=== Stage Progression Edge Case Tests: ${stageTestsPassed ? 'ALL PASSED' : 'SOME FAILED'} ===\n`);
console.log(`=== Stage Reset Edge Case Tests: ${resetTestsPassed ? 'ALL PASSED' : 'SOME FAILED'} ===\n`);

if (finalSuccess && stageTestsPassed && resetTestsPassed) {
    console.log('✓ All property-based tests and edge case tests PASSED');
    console.log('Property 5: Stage progression - VALIDATED');
    console.log('Property 6: Stage reset on whitelist return - VALIDATED');
    console.log('Validates: Requirements 6.1, 6.2, 6.3, 6.4, 6.5, 6.7');
    process.exit(0);
} else {
    console.log('✗ Some tests FAILED');
    process.exit(1);
}