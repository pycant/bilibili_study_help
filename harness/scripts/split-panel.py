#!/usr/bin/env python3
"""Split PanelRenderer out of DetailPanel by function name."""
import sys, re

text = sys.stdin.read()

# Find the DetailPanel IIFE
dp_match = re.search(r'(const DetailPanel = \(function\(\) \{)(.*?)\n\}\)\(\);\n', text, re.DOTALL)
if not dp_match:
    print("ERROR: Can't find DetailPanel IIFE", file=sys.stderr)
    sys.exit(1)

full_iife = dp_match.group(0)
header = dp_match.group(1)
body = dp_match.group(2)

# Functions to move TO PanelRenderer
RENDERER_FUNCS = {
    'loadTheme', 'detectBilibiliTheme', 'saveTheme', 'toggleTheme', 'applyTheme',
    'getTodayStats', 'getTrendData',
    'renderModule1', 'renderModule2', 'renderModule5', 'renderModule6',
    'renderStatusSections', 'createPanelContent',
    'close', 'handleKeyDown', 'open', 'showAddWhitelistModal',
}

# Functions to keep IN DetailPanel
VOCAB_FUNCS = {
    'getWordRecords',
    'handleRefreshVocabBtn', 'handleResetVocabBtn', 'refreshVocabDisplay',
    'renderModule3', 'renderModule4',
}

# Parse the body line by line
lines = body.split('\n')
renderer_lines = []
vocab_lines = []
current_target = 'renderer'  # start with renderer (header/var declarations)
return_buf = []

in_return = False
for line in lines:
    stripped = line.strip()
    
    # Detect return block start
    if stripped.startswith('return {'):
        in_return = True
        
    if in_return:
        return_buf.append(line)
        continue
    
    # Skip original variable declarations (they're now in PanelRenderer)
    if re.match(r'\s*(const|let|var)\s+(MODAL_ID|THEME_KEY|modalElement|isOpen|currentTheme)\b', stripped):
        continue
    
    # Detect function definitions
    func_match = re.match(r'\s*function (\w+)', stripped)
    if func_match:
        name = func_match.group(1)
        if name in RENDERER_FUNCS:
            current_target = 'renderer'
        elif name in VOCAB_FUNCS:
            current_target = 'vocab'
    
    # Detect non-function content (comments, etc.) - classify based on context
    if current_target == 'renderer':
        renderer_lines.append(line)
    else:
        vocab_lines.append(line)

# Build PanelRenderer IIFE
panel_iife = f'''// ==========================================
// PanelRenderer Module (面板渲染 + 主题管理，从 DetailPanel 拆分)
// ==========================================
const PanelRenderer = (function() {{
    var MODAL_ID = 'bilibili-study-detail-modal';
    var THEME_KEY = 'bilibiliStudyAssistant_theme';
    var modalElement = null;
    var isOpen = false;
    var currentTheme = 'light';

    // VocabPanel 回调（由 DetailPanel 在初始化时注入）
    var _vocab = {{
        handleRefreshVocabBtn: null,
        handleResetVocabBtn: null,
        renderModule3: null,
        renderModule4: null
    }};
    function _injectVocabCallbacks(cbs) {{ _vocab = cbs; }}

{chr(10).join(renderer_lines).strip()}

    return {{
        open: open,
        close: close,
        isOpen: function() {{ return isOpen; }},
        getCurrentTheme: function() {{ return currentTheme; }},
        detectTheme: detectBilibiliTheme,
        loadTheme: loadTheme,
        renderModule1: renderModule1,
        renderModule2: renderModule2,
        renderModule5: renderModule5,
        renderModule6: renderModule6,
        renderStatusSections: renderStatusSections,
        _injectVocabCallbacks: _injectVocabCallbacks
    }};
}})();
'''

# Build new DetailPanel IIFE
# The vocab functions remain, the return block is replaced
new_return = '''    // 注入 VocabPanel 回调到 PanelRenderer
    PanelRenderer._injectVocabCallbacks({
        handleRefreshVocabBtn: handleRefreshVocabBtn,
        handleResetVocabBtn: handleResetVocabBtn,
        renderModule3: renderModule3,
        renderModule4: renderModule4
    });

    // SettingsPanel 注入
    SettingsPanel._injectAPI({
        close: PanelRenderer.close,
        open: PanelRenderer.open,
        getCurrentTheme: PanelRenderer.getCurrentTheme
    });

    return {
        open: PanelRenderer.open,
        close: PanelRenderer.close,
        isOpen: PanelRenderer.isOpen,
        getCurrentTheme: PanelRenderer.getCurrentTheme,
        detectTheme: PanelRenderer.detectTheme,
        loadTheme: PanelRenderer.loadTheme,
        openSettings: SettingsPanel.openSettings
    };
'''

new_dp_iife = f'''// ==========================================
// DetailPanel Module (VocabPanel)
// ==========================================
const DetailPanel = (function() {{
{chr(10).join(vocab_lines).strip()}

{new_return}
}})();
'''

# Replace the original DetailPanel
# Find SettingsPanel end marker
settings_close = text.index('// ==========================================\n// DetailPanel Module')
# Remove the old IIFE and everything between the markers
text_before = text[:settings_close]
text_after = text[settings_close:]

# Skip the old header comment and IIFE
next_iife = text_after.index('})();') + 5
text_after = text_after[next_iife:]

new_text = text_before + panel_iife + '\n\n' + new_dp_iife + '\n' + text_after
sys.stdout.write(new_text)
