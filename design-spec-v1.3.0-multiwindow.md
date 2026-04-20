# 第八章：多窗口计时与弹窗体系（替代 design-spec 中旧 8-11 章）

> 本章将多窗口计时逻辑、广播状态、弹窗优先级三者统一设计，
> 因为它们本质上解决的是同一个问题：**多窗口并存时，谁有权做什么**。

---

## 8.1 问题全景

油猴脚本在每个 B站标签页中独立运行，每个实例有独立的 `setInterval(1s)`、`state`、`StatisticsTracker`。

**单窗口**时一切正常。**多窗口**时会出现三类问题：

| 问题 | 通俗解释 | 后果 |
|------|---------|------|
| 重复计时 | 两个窗口各自往同一本账上 +1s | 学习时间/分心时间多算 |
| 写账竞态 | 两个窗口同时读→改→写 localStorage | 数据丢失 |
| 状态不感知 | A 窗口不知道 B 窗口在干什么 | 干预逻辑各干各的 |

---

## 8.2 多窗口场景全览

### 8.2.1 场景矩阵

| # | 场景 | visible窗口数 | 现有行为 | 正确? | 风险 |
|---|------|:---:|---------|:---:|:---:|
| A | 1个窗口看学习视频 | 1 | +1s 学习时间 | ✅ | 无 |
| B | 1个窗口看分心视频 | 1 | +1s 分心时间 | ✅ | 无 |
| C | 同窗口切换：学习→分心 | 1 | 只有分心窗口计时 | ✅ | 无 |
| D | 同窗口切换：分心→学习 | 1 | 只有学习窗口计时 | ✅ | 无 |
| **E** | **2窗口并排都看学习** | **2** | **两个都 +1s** | ❌ | 🔴 |
| **F** | **2窗口并排：1学+1分** | **2** | **同时 +1学 +1分** | ❌ | 🔴 |
| **G** | **2窗口并排都看分心** | **2** | **两个都 +1s** | ❌ | 🟡 |
| H | 学习窗口最小化+分心前台 | 1 | 只有分心窗口计时 | ✅ | 无 |

**关键认知**：场景 E/F/G 只在用户把标签页拖成独立窗口并排时才会出现。

### 8.2.2 解决策略：引导优先 + 自动兜底

```
                    检测到多窗口
                         │
              ┌──────────┴──────────┐
              ▼                     ▼
         引导用户选择            自动兜底
       （主动解决）           （被动防御）
              │                     │
   弹出"选择主窗口"弹窗      Master 选举机制
   记录副窗口 BV 号          非Master不写统计
   引导关闭/最小化副窗口     非Master只弹Toast
```

**为什么需要引导？**

自动兜底（Master选举）是技术保障，但用户可能完全不知道自己开了两个窗口在同时跑脚本。主动引导有两个好处：
1. **消除问题根源**——用户关闭副窗口后，多窗口问题直接消失
2. **记住 BV 号**——关掉的窗口内容不会丢，随时可以跳回去

---

## 8.3 多窗口检测与引导流程

### 8.3.1 检测时机

```
每个标签页启动时：
  1. 写入自己的 tabId 到 localStorage 的注册表
  2. 读注册表，检查有没有其他标签页
  3. 如果有 ≥2 个标签页 → 触发多窗口引导

主定时器中：
  每 10 秒检查一次注册表
  如果发现新标签页加入 → 在新标签页触发引导
```

### 8.3.2 注册表结构

```javascript
// localStorage key: bilibiliStudy_tabRegistry
{
    tabs: {
        'tab_abc123_1700000000': {
            bv: 'BV1xx411c7mD',       // 当前观看的 BV 号
            isWhitelisted: true,       // 是否白名单视频
            isStudying: true,          // 是否学习中
            lastHeartbeat: 1700000010, // 最后心跳时间
            windowTitle: '高等数学...', // 窗口标题（便于用户识别）
        },
        'tab_def456_1700000001': {
            bv: 'BV1yy411c7mE',
            isWhitelisted: false,
            isStudying: false,
            lastHeartbeat: 1700000010,
            windowTitle: '搞笑视频合集',
        }
    }
}
```

### 8.3.3 引导弹窗设计

当检测到多窗口时，在**新加入的窗口**（或后获得焦点的窗口）弹出引导：

```
┌════════════════════════════════════════════════════┐
║                                                    ║
║   🖥️ 检测到多个学习窗口                            ║
║                                                    ║
║   同时打开多个窗口会导致计时不准确，                 ║
║   请选择一个作为主窗口继续学习：                     ║
║                                                    ║
║   ┌──────────────────────────────────────────┐    ║
║   │ ✅ 高等数学第三章  BV1xx...  [学习视频]    │    ║  ← 白名单视频优先
║   │    当前正在播放 • 推荐作为主窗口             │    ║
║   └──────────────────────────────────────────┘    ║
║   ┌──────────────────────────────────────────┐    ║
║   │    搞笑视频合集  BV1yy...  [非学习视频]    │    ║
║   │    可以关闭或最小化                          │    ║
║   └──────────────────────────────────────────┘    ║
║                                                    ║
║   📌 关闭的窗口内容已记住，随时可从浮窗跳转回来     ║
║                                                    ║
║   [将「高数第三章」设为主窗口]                       ║
║   [暂时忽略，稍后提醒]                              ║
║                                                    ║
└════════════════════════════════════════════════════┘
```

**选择"设为主窗口"后**：

```
主窗口（用户选的）:
  → 成为 Master → 正常计时 + 干预

副窗口（另一个）:
  → 收到广播：自己被降为非 Master
  → 弹出 Toast：「已切换为主窗口模式，本窗口已暂停计时」
  → 浮窗显示"非主窗口"标识
  → BV 号被记录到 localStorage（方便后续跳转）
```

**选择"暂时忽略"后**：
  → 不做任何改变，但记录忽略次数
  → 下次检测到（10秒后）再次提醒
  → 忽略 3 次后不再主动提醒，走自动兜底逻辑

### 8.3.4 BV 号记忆与快速跳转

副窗口被关闭/最小化后，其 BV 号保存在 localStorage 中：

```javascript
// localStorage key: bilibiliStudy_rememberedTabs
[
    { bv: 'BV1yy411c7mE', title: '搞笑视频合集', closedAt: 1700000010 },
    { bv: 'BV1zz411c7mF', title: '音乐MV', closedAt: 1700000020 },
]
```

**快速跳转入口**：

1. **浮窗**：点击浮窗 → 详情面板中显示「📂 最近关闭的标签页」模块
2. **P0 自动跳转**：强拦截时优先跳转到白名单视频，但也提供"跳到之前关闭的标签页"选项
3. **P6 休闲时段**：休闲时间到 → 可以选择跳到之前关闭的非学习视频（挣取的奖励）

---

## 8.4 Master 窗口机制（自动兜底）

引导弹窗是理想路径，但用户可能忽略或关闭。此时走自动兜底。

### 8.4.1 Master 仲裁规则

**核心原则：谁被用户关注，谁是 Master。**

```
触发条件                              Master 变化
──────────────────────────────────────────────────────────
Tab A 可见，无其他 Master            → A 成为 Master
Tab A 切到后台 (visibilitychange)    → A 释放 Master
Tab B 可见，无 Master               → B 成为 Master
两个窗口并排，用户点击 A (focus)     → A 抢夺 Master
两个窗口并排，用户点击 B (focus)     → B 抢夺 Master
Master 窗口关闭 (beforeunload)      → 释放 Master，其他窗口接管
Master 崩溃 (心跳超时 8s)           → 其他窗口自动接管
```

### 8.4.2 Master 与非 Master 的权限表

| 功能 | 🟢 Master | 🔵 非 Master |
|------|:---------:|:----------:|
| 写统计 (localStorage) | ✅ | ❌ |
| 执行干预检测 (check) | ✅ | ❌ |
| 弹全屏弹窗 (单词/强拦截) | ✅ | ❌ |
| 弹 Toast 轻提醒 | ✅ | ✅ |
| 显示浮窗 | ✅（实时数据） | ✅（广播数据） |
| 打开详情面板 | ✅ | ✅ |
| 导航跳转 | ✅ | ✅ |
| 记录 BV 号 | ✅ | ✅ |

### 8.4.3 焦点切换时的状态交接

```
用户从 Tab A 切到 Tab B：

Tab A (旧 Master):
  → visibilitychange → hidden
  → 释放 Master 标记 (localStorage)
  → 暂停统计和干预
  → 广播 MASTER_RELEASE

Tab B (新 Master):
  → visibilitychange → visible
  → 检测无 Master → 接管
  → 写入 Master 标记
  → 从 localStorage 读取最新统计数据
  → 恢复统计和干预
  → 广播 MASTER_CLAIM
```

### 8.4.4 TabManager 模块（伪代码）

```javascript
const TabManager = (function() {
    const TAB_ID = 'tab_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
    const MASTER_KEY = 'bilibiliStudy_masterTab';
    const REGISTRY_KEY = 'bilibiliStudy_tabRegistry';
    const REMEMBERED_KEY = 'bilibiliStudy_rememberedTabs';
    const HEARTBEAT_INTERVAL = 3000;
    const HEARTBEAT_TIMEOUT = 8000;
    const MULTI_WINDOW_CHECK_INTERVAL = 10000;

    let isMaster = false;
    let heartbeatTimer = null;
    let multiWindowCheckTimer = null;
    let ignoreCount = 0;
    const MAX_IGNORE = 3;

    // 初始化
    function init() {
        registerSelf();
        elect();
        startHeartbeat();
        startMultiWindowCheck();
        listenForVisibilityChange();  // hidden → 释放, visible → 接管
        listenForFocus();             // focus → 抢夺 Master
        listenForUnload();            // 关闭 → 释放 + 记住 BV
    }

    // 注册自己到注册表
    function registerSelf() { /* ... */ }

    // 更新自己的注册信息（主定时器调用）
    function updateRegistration(data) { /* ... */ }

    // Master 选举
    function elect() {
        // 无 Master 或 Master 心跳超时 → claimMaster()
        // 否则 → isMaster = false
    }

    function claimMaster() {
        localStorage.setItem(MASTER_KEY, JSON.stringify({ tabId: TAB_ID, heartbeat: Date.now() }));
        isMaster = true;
        TabMessenger.emit('MASTER_CLAIM', { tabId: TAB_ID });
    }

    function releaseMaster() {
        if (isMaster) {
            localStorage.removeItem(MASTER_KEY);
            isMaster = false;
            TabMessenger.emit('MASTER_RELEASE', { tabId: TAB_ID });
        }
    }

    // 心跳（3秒一次）
    function startHeartbeat() { /* Master 写心跳, 非 Master 检查心跳 */ }

    // 多窗口检测（10秒一次）
    function startMultiWindowCheck() {
        // 读注册表 → 清理失联标签 → 如果 ≥2 个活跃标签 → showMultiWindowGuide()
        // 忽略3次后不再主动提醒
    }

    // BV 号记忆
    function rememberTab(bv, title) {
        // 去重后写入 rememberedTabs，最多10条
    }
    function getRemembered() { /* 读取 rememberedTabs */ }

    return {
        TAB_ID, init, isMaster: () => isMaster,
        updateRegistration, getRegistry, getRemembered, rememberTab,
        claimMaster, releaseMaster
    };
})();
```

---

## 8.5 BroadcastChannel 通信

### 8.5.1 消息类型

| 消息类型 | 方向 | 时机 | 数据 |
|---------|------|------|------|
| `STATE_UPDATE` | Master→All | 每秒 | 完整状态包 |
| `MASTER_CLAIM` | 新Master→All | 接管时 | { tabId, timestamp } |
| `MASTER_RELEASE` | 旧Master→All | 释放时 | { tabId } |
| `INTERVENTION_TRIGGERED` | Master→All | 干预触发 | { level, stage } |
| `REQUEST_SYNC` | 任意→Master | 需要完整状态 | {} |
| `SYNC_RESPONSE` | Master→请求者 | 响应 | 完整状态包 |
| `TAB_REGISTER` | 任意→All | 新标签页启动 | { tabId, bv } |
| `TAB_UNREGISTER` | 任意→All | 标签页关闭 | { tabId, bv } |

### 8.5.2 广播状态包

```javascript
// Master 每秒广播
{
    tabId: 'tab_abc123',
    isStudying: true,
    currentStage: 0,
    interventionLevel: 'none',   // none | gentle | moderate | aggressive
    studyTime: 3600,
    distractionTime: 300,
    distractionElapsed: 0,
    activeModal: null,           // 当前弹出的弹窗类型
    currentBV: 'BV1xx411c7mD',
    isWhitelisted: true,
}
```

### 8.5.3 非 Master 窗口行为表

根据收到的广播，非 Master 窗口的行为：

| 收到的广播状态 | 本窗口在白名单视频 | 本窗口在非白名单视频 |
|:---:|:---:|:---:|
| Master `isStudying=true` | 浮窗正常，无提示 | Toast：「学习视频还在播放哦」 |
| Master `interventionLevel=gentle` | 浮窗正常 | Toast：「你正在学习时段中」 |
| Master `interventionLevel=moderate` | 浮窗正常 | Toast：「请返回学习视频」 |
| Master `interventionLevel=aggressive` | 浮窗正常 | Toast：「请返回学习视频」（语气更重） |
| Master 心跳丢失 | 尝试接管为 Master | 尝试接管为 Master |

**关键规则**：
1. 非 Master **永远不弹全屏弹窗**——避免两个窗口同时弹
2. 非 Master **可以弹 Toast**——轻量级，不打断操作
3. 非 Master **不写统计、不执行 check()**——防止重复计时

---

## 8.6 弹窗优先级体系

### 8.6.1 弹窗层级定义

从低到高，**数字越大越在上面**：

```
┌──────────────────────────────────────────────────────────────┐
│ Level 7 (z-index: 1000006) 🖥️ 多窗口引导弹窗               │  新增
│ ── 检测到多窗口时弹出，引导用户选择主窗口                     │
├──────────────────────────────────────────────────────────────┤
│ Level 6 (z-index: 1000005) 🔴 强拦截全屏遮罩               │
│ ── 不可关闭，倒计时跳转，覆盖一切                             │
├──────────────────────────────────────────────────────────────┤
│ Level 5 (z-index: 1000004) 🟠 单词验证弹窗                 │
│ ── 需交互关闭，可以被强拦截/多窗口引导覆盖                    │
├──────────────────────────────────────────────────────────────┤
│ Level 4 (z-index: 1000003) 🟡 确认弹窗/添加白名单弹窗       │
│ ── 需交互关闭，可以被更高级覆盖                               │
├──────────────────────────────────────────────────────────────┤
│ Level 3 (z-index: 1000002) 📋 设置面板                     │
│ ── 用户主动打开，可以被干预弹窗覆盖                           │
├──────────────────────────────────────────────────────────────┤
│ Level 2 (z-index: 1000001) 📊 详情面板                     │
│ ── 用户主动打开，可以被设置面板覆盖                           │
├──────────────────────────────────────────────────────────────┤
│ Level 1 (z-index: 1000000) 💬 Toast 提醒                  │
│ ── 不阻塞，自动消失，可以在任何弹窗之上显示                   │
├──────────────────────────────────────────────────────────────┤
│ Level 0 (z-index: 999999)  🟢 浮窗                        │  最低
│ ── 始终存在，在所有弹窗下面                                   │
└──────────────────────────────────────────────────────────────┘
```

### 8.6.2 弹窗互斥规则

| 规则 | 说明 |
|------|------|
| **同级互斥** | 同时只能有1个 Level 4 弹窗，只能有1个 Level 5 弹窗 |
| **高级覆盖低级** | 强拦截出现时自动关闭底下的确认/单词弹窗 |
| **用户主动弹窗不自动关闭** | 详情面板/设置面板被盖住但不销毁，关闭上层后仍可见 |
| **Toast 独立** | 不受任何弹窗影响，可以在弹窗之上显示；同时最多1条，新的替换旧的 |
| **多窗口引导特殊** | 可以盖住一切（包括强拦截），因为解决多窗口是最高优先级 |
| **仅 Master 弹全屏** | 非 Master 永远只弹 Toast，不弹 Level 4+ 弹窗 |

### 8.6.3 ModalManager 统一管理

```javascript
const ModalManager = (function() {
    const LEVELS = {
        FLOATING:   0,
        TOAST:      1,
        DETAIL:     2,
        SETTINGS:   3,
        CONFIRM:    4,
        WORD:       5,
        AGGRESSIVE: 6,
        MULTI_TAB:  7,    // 多窗口引导
    };

    const Z_BASE = 999999;
    let activeModals = [];  // [{ id, level, element }]

    function getZIndex(level) { return Z_BASE + level; }

    function register(id, level, element) {
        // 同级互斥
        const existing = activeModals.find(m => m.level === level);
        if (existing) dismiss(existing.id);
        element.style.zIndex = getZIndex(level);
        activeModals.push({ id, level, element });
        // 广播弹窗状态
        TabMessenger.emit('INTERVENTION_TRIGGERED', {
            level: Object.keys(LEVELS).find(k => LEVELS[k] === level),
            activeModal: id
        });
    }

    function dismiss(id) {
        const index = activeModals.findIndex(m => m.id === id);
        if (index !== -1) {
            const modal = activeModals[index];
            modal.element?.parentNode?.removeChild(modal.element);
            activeModals.splice(index, 1);
        }
    }

    // 关闭所有干预弹窗（保留用户主动打开的 + 多窗口引导）
    function dismissAllIntervention() {
        activeModals = activeModals.filter(m => {
            if (m.level >= LEVELS.CONFIRM && m.level !== LEVELS.MULTI_TAB) {
                m.element?.parentNode?.removeChild(m.element);
                return false;
            }
            return true;
        });
    }

    function getTopModal() {
        if (!activeModals.length) return null;
        return activeModals.reduce((a, b) => a.level > b.level ? a : b);
    }

    function hasInterventionModal() {
        return activeModals.some(m => m.level >= LEVELS.CONFIRM);
    }

    return { LEVELS, register, dismiss, dismissAllIntervention, getTopModal, hasInterventionModal };
})();
```

### 8.6.4 弹窗与 P2 三级干预的对应

| P2 干预级别 | 弹窗类型 | 层级 | z-index | 可关闭性 | 哪些窗口弹 |
|:---:|:---:|:---:|:---:|:---:|:---:|
| 🟡 gentle | Toast | 1 | 1000000 | 自动消失(15s) | 所有窗口 |
| 🟠 moderate | 单词弹窗 | 5 | 1000004 | 需交互 | 仅 Master |
| 🔴 aggressive | 全屏遮罩 | 6 | 1000005 | 仅跳转可解除 | 仅 Master |
| — | 多窗口引导 | 7 | 1000006 | 用户选择后关闭 | 检测到多窗口时 |

### 8.6.5 弹窗场景示例

**场景1：详情面板 + 单词弹窗**
```
0s    详情面板 (Level 2)
180s  单词弹窗 (Level 5) → 盖在详情面板上面
185s  答对，单词弹窗关闭 → 详情面板重新可见
```

**场景2：单词弹窗 + 强拦截**
```
0s    单词弹窗 (Level 5)
600s  强拦截 (Level 6) → 盖在单词弹窗上面
610s  倒计时结束 → dismissAllIntervention() → 两个都关
```

**场景3：多窗口检测到**
```
0s    用户打开第二个窗口
3s    新窗口弹出多窗口引导 (Level 7) → 盖住一切
      用户选择主窗口 → 副窗口变为非 Master
      副窗口弹出 Toast：「已切换为主窗口模式，本窗口暂停计时」
```

**场景4：非 Master 窗口分心**
```
0s    Tab A (Master) 在看学习视频
      Tab B (非 Master) 在看分心视频
3s    Tab B 检测到自己在非白名单 + Master 在学习
      → Tab B 弹出 Toast (Level 1)：「学习视频还在播放哦」
      → 不弹全屏弹窗
```

---

## 8.7 主定时器改造（整合全部逻辑）

```javascript
setInterval(function() {
    const state = window.__bilibiliStudyAppState;
    if (!state) return;

    const isVideoPage = PageMonitor.isVideoPage();
    const isPageActive = PageMonitor.isPageActive();
    const isStudyTime = ConfigManager.isStudyTime();
    const currentBV = PageMonitor.getCurrentBV();
    const isWhitelisted = ConfigManager.isWhitelisted(currentBV);

    // 更新标签页注册信息（所有窗口都做）
    TabManager.updateRegistration({
        bv: currentBV || '',
        isWhitelisted,
        isStudying: isWhitelisted && isStudyTime,
        windowTitle: document.title,
    });

    if (TabManager.isMaster()) {
        // ═══ Master 窗口：正常计时 + 干预 ═══
        if (isVideoPage && isPageActive && isStudyTime) {
            if (isWhitelisted) {
                state.isStudying = true;
                StatisticsTracker.addStudyTime(1);
            } else {
                state.isStudying = false;
                StatisticsTracker.addDistractionTime(1);
            }
        }
        InterventionController.check();

        // 广播状态
        TabMessenger.emit('STATE_UPDATE', { /* 完整状态包 */ });

    } else {
        // ═══ 非 Master 窗口：只更新本地状态 + Toast ═══
        if (isVideoPage && isPageActive && isStudyTime) {
            state.isStudying = isWhitelisted;
            // 非 Master 且在非白名单视频 → 轻提醒
            if (!isWhitelisted && !state.toastShown) {
                showToastReminder('你正在学习时段中');
                state.toastShown = true;
            }
        }
    }

    // 浮窗更新（所有窗口都做，数据来源不同）
    if (FloatingWindow.create()) {
        const stats = TabManager.isMaster()
            ? StatisticsTracker.getTodayStats()
            : getLastBroadcastStats();  // 从广播缓存读取
        FloatingWindow.updateStatus({
            isStudying: state.isStudying,
            stage: state.currentStage,
            studyTime: stats.studyTime,
            distractionTime: stats.distractionTime,
            isMaster: TabManager.isMaster(),  // 新增：显示主/副标识
        });
    }
}, 1000);
```

---

## 8.8 分版本实施计划

| 版本 | 内容 | 改动量 | 风险 |
|------|------|:---:|:---:|
| **v1.2.3** | TabManager 选举 + 心跳 + 主定时器 `if (isMaster())` | ~80行 | 低 |
| **v1.2.4** | TabMessenger (BroadcastChannel) + 状态广播 | ~60行 | 低 |
| **v1.2.5** | 多窗口引导弹窗 + BV 号记忆 + 非 Master Toast | ~120行 | 低 |
| **v1.2.6** | ModalManager 弹窗优先级统一管理 | ~80行 | 中 |
| **v1.3.0** | P0 + P2（基于稳定的多窗口+弹窗基础设施） | ~300行 | 中 |
