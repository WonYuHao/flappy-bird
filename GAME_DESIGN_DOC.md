# Flappy Bird H5 游戏 - 详细制作方案

## 一、项目概述

### 1.1 游戏简介
经典 Flappy Bird 飞行躲避玩法，纯 H5 + Canvas 实现，打开网页即玩。支持手机/PC、微信/钉钉内嵌、扫码等多种入口。配备全服排行榜系统，提升社交传播性。

### 1.2 核心体验循环
```
打开页面 → 开始界面 → 点击/空格开始 → [飞行 + 躲避障碍物 + 得分] → 碰撞死亡
    → Game Over 界面 → 输入昵称提交分数 → 查看排行榜 → 重新开始
```

---

## 二、技术架构

### 2.1 整体架构图

```
┌──────────────────────────────────────────────────┐
│                    用户浏览器                      │
│  ┌────────────────────────────────────────────┐  │
│  │           H5 前端 (纯静态)                   │  │
│  │  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────────┐  │  │
│  │  │ 游戏  │ │  UI  │ │ 音频  │ │ 排行榜    │  │  │
│  │  │ 引擎  │ │ 层   │ │ 模块  │ │ 面板     │  │  │
│  │  └──────┘ └──────┘ └──────┘ └──────────┘  │  │
│  └────────────────────────────────────────────┘  │
│                        │ HTTP/HTTPS              │
└────────────────────────┼─────────────────────────┘
                         │
              ┌──────────▼──────────┐
              │   后端 API 服务       │
              │  POST /api/scores    │  ← 提交分数 + 昵称
              │  GET  /api/rankings  │  ← 获取 Top 20
              └──────────┬──────────┘
                         │
              ┌──────────▼──────────┐
              │   数据库             │
              │   (SQLite/PostgreSQL │
              │    或 BaaS)          │
              └─────────────────────┘
```

### 2.2 技术选型

| 层级 | 方案 | 说明 |
|------|------|------|
| **游戏本体** | HTML5 Canvas + 原生 JS | 零依赖，Canvas 2D 绑制，70KB 以内 |
| **样式** | 纯 CSS | 配合 Canvas，少量 DOM 用于 UI 层 |
| **音效** | Web Audio API / Howler.js | 跳跃音效、得分音效、死亡音效 |
| **后端** | Node.js (Express) 或 云函数 | 两个接口，极轻量 |
| **数据库** | Supabase / LeanCloud / SQLite | 按部署方式选择 |
| **前端部署** | Vercel / GitHub Pages / 阿里云OSS | 纯静态，CDN 加速 |
| **后端部署** | Vercel Functions / 阿里云函数计算 | Serverless，按量付费 |

---

## 三、游戏核心设计

### 3.1 游戏参数

| 参数 | 默认值 | 说明 |
|------|--------|------|
| 画布宽 | 400px | 逻辑宽度（会等比缩放适配屏幕） |
| 画布高 | 600px | 逻辑高度 |
| 重力加速度 | 0.5 px/frame | 每帧下落速度增量 |
| 跳跃力度 | -8 px/frame | 向上初速度 |
| 管道间距 | 150px | 上下管道之间可通过的间隙 |
| 管道宽度 | 52px | 单个管道宽度 |
| 管道生成间隔 | 1500ms | 每 1.5 秒生成一对管道 |
| 管道移动速度 | 2 px/frame | 向左移动速度 |
| 帧率 | 60fps | requestAnimationFrame |

### 3.2 游戏状态机

```
        ┌──────────┐
        │  IDLE    │  初始状态，显示开始界面
        └────┬─────┘
             │ 点击/空格
        ┌────▼─────┐
        │  PLAYING │  游戏进行中
        └────┬─────┘
             │ 碰撞检测命中
        ┌────▼─────┐
        │  DEAD    │  死亡动画 → 显示结算界面
        └────┬─────┘
             │ 点击重新开始
        ┌────▼─────┐
        │  PLAYING │  回到游戏中
        └──────────┘
```

### 3.3 物理与碰撞

- **重力模拟**：每帧 `velocityY += gravity`，`playerY += velocityY`
- **跳跃**：点击时 `velocityY = JUMP_FORCE`（负值即向上）
- **碰撞检测**：AABB 矩形碰撞，检测小鸟 bounding box 是否与管道矩形重叠，或是否超出上下边界
- **边界**：飞出顶部或掉落底部均判定死亡

### 3.4 难度曲线

| 分数区间 | 管道移动速度 | 管道间隙 | 体验 |
|----------|------------|---------|------|
| 0-10 | 2.0 px/frame | 150px | 新手友好 |
| 10-30 | 2.5 px/frame | 140px | 逐步加速 |
| 30-50 | 3.0 px/frame | 130px | 有挑战 |
| 50+ | 3.5+ px/frame | 120px | 高手区 |

> 难度调整平滑递增，避免突兀感。

---

## 四、界面设计

### 4.1 界面层级

```
┌──────────────────────────┐
│       游戏 Canvas         │  ← 游戏主画布（全屏居中）
│                          │
│   ┌──────────────┐       │
│   │   UI 浮层     │       │  ← DOM 元素覆盖在 Canvas 上
│   │   (开始/结算  │       │
│   │    排行榜)    │       │
│   └──────────────┘       │
└──────────────────────────┘
```

### 4.2 各界面详情

#### 4.2.1 开始界面
- 游戏标题 "Flappy Bird" 大字 + 小鸟动画
- "点击开始" 提示文字（带呼吸动画）
- 右上角排行榜按钮
- 底部操作说明：📱点击屏幕 / 🖥空格键或鼠标点击

#### 4.2.2 游戏中界面
- 左上角实时分数（大号数字）
- Canvas 内绘制滚动背景、管道、小鸟
- 得分时分数短暂放大动画

#### 4.2.3 结算界面
- "Game Over" 标题 + 本局分数
- 历史最高分
- 昵称输入框（限 12 字）
- "提交分数" 按钮
- 排行榜面板（Top 20，当前玩家高亮）
- "再来一局" 按钮

#### 4.2.4 排行榜弹窗
- 半透明遮罩 + 居中卡片
- Top 20 列表：排名、昵称、分数、日期
- 当前玩家若无上榜则显示名次（如 "第 156 名"）

---

## 五、视觉与音频

### 5.1 美术资源（全部用代码生成/Canvas 绘制）

为避免额外资源加载，第一版所有图形均用 Canvas API 绘制：

| 元素 | 绘制方式 |
|------|---------|
| 小鸟 | 圆形 + 眼睛 + 嘴巴 + 翅膀（简易卡通风） |
| 管道 | 绿色矩形 + 深绿边缘 + 管道口高光 |
| 背景 | 渐变天空 + 简单云朵 + 远山剪影 |
| 地面 | 滚动条纹地面 |
| 分数 | fillText 大号白色字体 + 阴影 |
| 粒子 | 死亡时爆散彩色粒子 |

> 后续迭代可替换为精灵图（Sprite Sheet），一张 PNG 包含所有元素。

### 5.2 配色方案

```
天空渐变：  #4EC0CA → #87CEEB
地面：      #DED895
管道：      #73BF2E (亮面) / #558B2F (暗面)
小鸟主体：  #FFD54F (黄色)
小鸟翅膀：  #FF8F00
小鸟眼睛：  #FFFFFF + #333333 瞳孔
文字：      #FFFFFF + 黑色阴影
```

### 5.3 音效

| 音效 | 触发时机 | 实现方式 |
|------|---------|---------|
| 跳跃音效 | 点击/空格 | Web Audio 短促音 |
| 得分音效 | 通过管道 | Web Audio 叮咚音 |
| 死亡音效 | 碰撞 | Web Audio 撞击音 |
| 按钮音效 | 点击 UI 按钮 | Web Audio 点击音 |

> 音效可用 Web Audio API 编程生成（振荡器），避免加载音频文件。

---

## 六、核心代码结构

### 6.1 文件组织

```
flappy-bird/
├── index.html          # 主页面，引入 JS/CSS
├── css/
│   └── style.css       # UI 浮层样式
├── js/
│   ├── main.js         # 入口，初始化
│   ├── Game.js         # 游戏主循环、状态管理
│   ├── Bird.js         # 小鸟类（位置、物理、绘制）
│   ├── Pipe.js         # 管道类（生成、移动、碰撞）
│   ├── Background.js   # 背景（天空、远山、云朵、地面）
│   ├── Score.js        # 分数显示与动画
│   ├── Particles.js    # 粒子特效
│   ├── Audio.js        # 音效管理
│   ├── Input.js        # 输入处理（触摸、键盘、鼠标）
│   ├── UI.js           # DOM UI 控制（开始/结束/排行榜面板）
│   └── API.js          # 排行榜接口调用
├── backend/
│   ├── package.json
│   ├── server.js       # Express 服务 或 api/目录（云函数）
│   └── schema.sql      # 数据库建表语句
└── README.md
```

### 6.2 Game 类（核心主循环）

```javascript
class Game {
  constructor(canvas) {
    this.state = 'IDLE';        // IDLE | PLAYING | DEAD
    this.bird = new Bird();
    this.pipes = [];
    this.score = 0;
    this.bestScore = localStorage.getItem('best') || 0;
    this.frameCount = 0;
  }

  loop() {
    if (this.state === 'PLAYING') {
      this.update();
    }
    this.render();
    requestAnimationFrame(() => this.loop());
  }

  update() {
    this.bird.update();
    this.pipes.forEach(p => p.update());
    this.spawnPipes();
    this.checkCollisions();
    this.checkScore();
    this.updateDifficulty();
  }

  render() {
    this.background.render();
    this.pipes.forEach(p => p.render());
    this.bird.render();
    this.scoreDisplay.render();
    if (this.state === 'DEAD') this.particles.render();
  }
}
```

### 6.3 关键算法

#### 管道生成
```
每 1500ms / 速度倍率 生成一对管道
上管道高度 = random(80, canvasHeight - gap - groundHeight - 80)
下管道高度 = canvasHeight - groundHeight - 上管道高度 - gap
```

#### 得分判定
```
当管道右边缘刚越过小鸟左边缘时（且未计分），Score +1
用 scored 标记防止重复计分
```

#### 碰撞检测
```javascript
function checkCollision(bird, pipe) {
  // AABB 碰撞
  return (
    bird.x + bird.width > pipe.x &&
    bird.x < pipe.x + pipe.width &&
    bird.y < pipe.topHeight || bird.y + bird.height > pipe.bottomY
  );
}
```

---

## 七、排行榜后端设计

### 7.1 API 接口

#### POST `/api/scores`
提交分数

**请求体：**
```json
{
  "nickname": "玩家昵称",
  "score": 42,
  "timestamp": 1751856400000
}
```

**响应：**
```json
{
  "rank": 15,
  "total": 230,
  "rankings": [
    { "rank": 1, "nickname": "大佬", "score": 999, "date": "2026-07-06" },
    ...
  ]
}
```

> 提交分数时直接返回最新排行榜，减少请求次数。

#### GET `/api/rankings?limit=20`
获取排行榜

**响应：**
```json
{
  "rankings": [
    { "rank": 1, "nickname": "大佬", "score": 999, "date": "2026-07-06" },
    ...
  ],
  "total": 230
}
```

### 7.2 数据库设计

```sql
CREATE TABLE scores (
  id          SERIAL PRIMARY KEY,
  nickname    VARCHAR(20) NOT NULL,
  score       INTEGER NOT NULL,
  created_at  TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_scores_score ON scores(score DESC);
```

### 7.3 防作弊策略

| 策略 | 说明 |
|------|------|
| 分数合理性校验 | 服务端验证时间窗口内最大可能分数 |
| 昵称过滤 | 过滤敏感词、限制长度、去首尾空格 |
| IP 限流 | 同一 IP 每分钟最多提交 10 次 |
| 客户端校验 | 前端提交校验 token（简单 HMAC），增加伪造门槛 |

> 第一版以体验为主，防作弊做到基础级别即可。后续可按需加强。

---

## 八、适配与兼容

### 8.1 屏幕适配

```
Canvas 逻辑尺寸：400 × 600
根据实际屏幕等比缩放并居中：
  - 移动端竖屏：宽度撑满，高度自适应
  - 移动端横屏：提示旋转设备
  - PC 端：限制最大尺寸，居中显示
```

关键代码逻辑：
```javascript
function resizeCanvas() {
  const ratio = Math.min(
    window.innerWidth / GAME_WIDTH,
    window.innerHeight / GAME_HEIGHT
  );
  canvas.width = GAME_WIDTH;
  canvas.height = GAME_HEIGHT;
  canvas.style.width = GAME_WIDTH * ratio + 'px';
  canvas.style.height = GAME_HEIGHT * ratio + 'px';
}
```

### 8.2 输入适配

| 平台 | 触发方式 |
|------|---------|
| 手机浏览器 | touchstart 事件 |
| 电脑浏览器 | 鼠标 click、键盘 Space / ArrowUp / W |
| 微信内置浏览器 | touchstart（需处理微信默认行为） |
| 钉钉内置浏览器 | touchstart |

### 8.3 浏览器兼容

| 浏览器 | 最低版本 |
|--------|---------|
| Chrome | 60+ |
| Safari | 11+ (iOS 11+) |
| Firefox | 55+ |
| Edge | 79+ |
| 微信内置浏览器 | iOS 11+ / Android 5+ |
| 钉钉内置浏览器 | iOS 11+ / Android 5+ |

---

## 九、部署方案

### 9.1 推荐方案：Vercel + Supabase

```
┌─────────────────┐     ┌──────────────────┐
│   Vercel        │     │   Supabase       │
│                 │     │                  │
│  静态页面部署    │────▶│  scores 表       │
│  (自动 HTTPS)   │     │  (PostgreSQL)    │
│                 │     │                  │
│  /api/scores    │     │  Row Level       │
│  /api/rankings  │     │  Security        │
│  (Serverless    │     │                  │
│   Functions)    │     │                  │
└─────────────────┘     └──────────────────┘
```

**优势：**
- 前端 + 后端一站式部署
- 自动 HTTPS 和 CDN
- 免费额度足够初期使用
- Supabase 提供 PostgreSQL + 实时订阅

### 9.2 备选方案

| 方案 | 前端 | 后端 | 数据库 | 适用场景 |
|------|------|------|--------|---------|
| A | Vercel | Vercel Functions | Supabase | 推荐首选 |
| B | GitHub Pages | LeanCloud | LeanCloud | 国内访问快 |
| C | 阿里云 OSS | 阿里云函数计算 | 阿里云 RDS | 企业级/国内合规 |
| D | Netlify | Netlify Functions | Supabase | 与 Vercel 类似 |

---

## 十、开发计划

### 10.1 里程碑

| 阶段 | 内容 | 预计工时 | 产出 |
|------|------|---------|------|
| **M1: 游戏核心** | Canvas 游戏引擎、小鸟、管道、碰撞、分数 | 2天 | 可玩的单机版 |
| **M2: 视觉打磨** | 背景、粒子特效、动画、音效 | 1天 | 完整视觉体验 |
| **M3: UI 与状态** | 开始界面、结算界面、状态机 | 1天 | 完整游戏流程 |
| **M4: 排行榜** | 后端 API、数据库、前端接入 | 1天 | 可提交分数看排行 |
| **M5: 适配与优化** | 多端适配、性能优化、防作弊 | 1天 | 多端可用 |
| **M6: 部署上线** | 部署、域名、二维码、分享 | 0.5天 | 上线发布 |

**总预计：6-7 个工作日**

### 10.2 每个里程碑的详细任务

#### M1: 游戏核心（2天）
- [ ] 搭建项目结构（index.html + JS 模块）
- [ ] 实现 Canvas 渲染循环（Game 类）
- [ ] 实现小鸟的物理（重力、跳跃、旋转动画）
- [ ] 实现管道系统（生成、移动、回收）
- [ ] 实现 AABB 碰撞检测
- [ ] 实现分数计算与显示
- [ ] 实现地面滚动
- [ ] 实现难度递增

#### M2: 视觉打磨（1天）
- [ ] 天空渐变背景 + 云朵
- [ ] 远山剪影
- [ ] 小鸟细节（眼睛、翅膀扇动动画）
- [ ] 管道细节（高光、边缘）
- [ ] 死亡粒子爆炸效果
- [ ] 得分数字弹跳动画
- [ ] 编程生成音效（跳跃、得分、死亡）

#### M3: UI 与状态（1天）
- [ ] 开始界面（标题、开始按钮、动画效果）
- [ ] Game Over 界面（分数展示、按钮）
- [ ] 昵称输入框
- [ ] 本地最高分存储（localStorage）
- [ ] 游戏状态机串联所有界面
- [ ] 排行榜面板设计

#### M4: 排行榜（1天）
- [ ] 数据库设计与建表
- [ ] POST /api/scores 接口
- [ ] GET /api/rankings 接口
- [ ] 前端 API 调用封装
- [ ] 排行榜 UI 渲染
- [ ] 提交后自动刷新排行

#### M5: 适配与优化（1天）
- [ ] 移动端触摸适配
- [ ] 键盘/鼠标多输入支持
- [ ] 屏幕自适应缩放
- [ ] 横屏提示
- [ ] 微信/钉钉内置浏览器测试
- [ ] 性能优化（对象池、减少 GC）
- [ ] 基础防作弊

#### M6: 部署上线（0.5天）
- [ ] Vercel 部署前端
- [ ] Vercel Functions 部署 API
- [ ] Supabase 数据库配置
- [ ] 生成二维码
- [ ] 分享文案准备
- [ ] 全流程测试

---

## 十一、性能优化要点

1. **对象池**：管道对象复用，避免频繁创建/销毁
2. **离屏 Canvas**：背景等静态内容用离屏 Canvas 预渲染
3. **requestAnimationFrame**：统一渲染循环，不要多个 RAF
4. **避免 GC**：在 update 中复用临时对象
5. **移动端 60fps**：降低绘制复杂度，必要时降到 30fps
6. **资源内联**：CSS/JS 内联到 HTML，减少 HTTP 请求

---

## 十二、扩展方向（后续迭代）

| 功能 | 说明 |
|------|------|
| 皮肤系统 | 不同小鸟外观（黄金鸟、火焰鸟等） |
| 道具系统 | 无敌护盾、磁铁吸分、减速等 |
| 每日挑战 | 每日刷新特殊关卡 |
| 好友对战 | 分享链接实时对战 |
| 成就系统 | 里程碑成就徽章 |
| 数据统计 | 个人历史数据可视化 |
| 多语言 | i18n 支持英文/中文切换 |
| PWA | 支持离线玩、添加到主屏幕 |

---

## 十三、风险与应对

| 风险 | 影响 | 应对 |
|------|------|------|
| iOS Safari 音频限制 | 音效无声 | 首次交互时初始化 AudioContext |
| 微信内置浏览器缓存 | 更新不生效 | URL 加版本号参数 |
| 排行榜刷分 | 数据失真 | 基础防作弊 + 后期升级 |
| 高并发排行榜查询 | 接口慢 | 加缓存（内存/Redis），定时刷新 Top 20 |
| 移动端性能不足 | 掉帧 | 简化粒子、降低管道数量 |