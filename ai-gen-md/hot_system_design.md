# 🎯 高频系统设计题完整总结

> 📅 创建日期：2026-04-21
> 🎯 覆盖场景：面试高频 + 真实大厂出现率前列
> 📝 内容：点赞系统 / 评论系统 / 排行榜系统 / 秒杀系统
> 💡 使用指南：每题按"分层架构 → 数据模型 → 核心链路 → 热点问题 → 生产级能力 → 容量评估 → 金句集锦 → 常见追问"结构组织，可直接背诵使用

---

## 📋 目录

- [通用答题框架（必背）](#通用答题框架必背)
- [一、点赞系统](#一点赞系统)
- [二、评论系统](#二评论系统)
- [三、排行榜系统](#三排行榜系统)
- [四、秒杀系统](#四秒杀系统)
- [生产级五件套（通用）](#生产级五件套通用)
- [核心金句汇总](#核心金句汇总)

---

## 通用答题框架（必背）

**任何系统设计题都用这 4 步答：**

```
第一步：澄清需求（30 秒）
  - 业务量级？QPS 多少？数据量多大？
  - 读多写多？一致性要求？
  - 关键功能边界？
  
第二步：画分层架构（1 分钟）
  - 接入层 → 业务层 → 异步层 → 存储层
  - 一图胜千言，先画骨架再填肉
  
第三步：讲核心链路（3 分钟）
  - 选 1-2 个核心操作的完整路径
  - 突出：缓存策略 + 异步削峰 + 数据一致性
  
第四步：补生产级 + 容量评估（2 分钟）
  - 限流 / 熔断 / 幂等 / 监控 / 容量评估
  - 用具体数字算账（QPS → 实例数 → 分片数）
```

**万能金句：**
> **"先画分层架构，再讲核心链路，最后补生产级能力和容量评估——这是系统设计的标准打开方式。"**

---

## 一、点赞系统

### 📌 1.1 澄清需求（面试开场必做）

**主动向面试官确认：**

> "面试官，我想先确认几个边界条件：
> 1. **业务场景**是视频/帖子/评论点赞？量级多大？
> 2. **展示需求**：只要总数，还是要展示'谁点过赞'列表？
> 3. **用户能否取消点赞**？能否看到自己是否点过赞？
> 4. **是否需要防刷**？一人一赞？"

**典型假设（直接说给面试官）：**
- 类似小红书/B站视频点赞
- 日活 5000 万，峰值点赞 QPS 5 万，查询点赞状态 QPS 20 万
- 需要：**点赞数** + **用户是否点过赞** + **点赞者列表**（Top100）
- 一人一赞，可取消

### 📌 1.2 分层架构

```
┌───────────────────────────────────────────────────┐
│ ① 接入层（API Gateway）                            │
│   鉴权 / 限流 / 防刷 / 参数校验                      │
├───────────────────────────────────────────────────┤
│ ② 业务层（Like Service）                           │
│   点赞/取消/查询状态/查询总数/查询列表                │
│   ↑ 读写分离：读走 Redis，写走 MQ 异步落库          │
├───────────────────────────────────────────────────┤
│ ③ 异步层（Worker）                                 │
│   消费 MQ → 批量写 MySQL → 更新计数                 │
├───────────────────────────────────────────────────┤
│ ④ 存储层                                           │
│   Redis（热数据）+ MySQL（持久化）+ MQ（削峰）      │
└───────────────────────────────────────────────────┘
```

**一句话金句：** **"写异步削峰、读 Redis 兜底、MySQL 最终一致"**

### 📌 1.3 核心数据模型

#### 🔸 MySQL 表设计（2 张表）

**表 1：点赞明细表 `t_like`（分库分表）**

```sql
CREATE TABLE t_like (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    target_id BIGINT NOT NULL,       -- 被点赞的视频/帖子 id
    target_type TINYINT NOT NULL,    -- 1=视频, 2=评论
    status TINYINT NOT NULL,         -- 1=已点赞, 0=已取消
    create_time DATETIME,
    update_time DATETIME,
    UNIQUE KEY uk_user_target (user_id, target_id, target_type),
    INDEX idx_target (target_id, target_type, status)
);
-- 分片策略：按 user_id 分库（方便查"我点过赞的所有内容"）
-- 或按 target_id 分片（方便查"谁点过这个视频"）
-- 两种诉求冲突时，通常做双写（热点问题里讲）
```

**表 2：点赞计数表 `t_like_count`**

```sql
CREATE TABLE t_like_count (
    target_id BIGINT PRIMARY KEY,
    target_type TINYINT NOT NULL,
    like_count BIGINT NOT NULL DEFAULT 0,
    update_time DATETIME
);
```

> **为什么拆计数表？** 明细表分库分表后 `COUNT(*)` 性能灾难，必须独立计数。

#### 🔸 Redis 数据结构（3 种 Key）

| Key 模式 | 数据结构 | 用途 | TTL |
|---------|---------|------|-----|
| `like:count:{targetId}` | String | 点赞总数 | 7 天 |
| `like:user:{userId}` | Set/BitMap | 用户点过的 target 列表 | 30 天 |
| `like:target:{targetId}` | ZSet | 点赞者列表（score=时间）| 7 天 |

### 📌 1.4 核心链路

#### 🔸 操作 1：点赞（写路径）

```
用户点赞
  ↓
① 接入层鉴权 + 限流（令牌桶）
  ↓
② 查 Redis：user 是否已点过？（防重复，SISMEMBER）
  ↓ 未点过
③ Redis Lua 脚本原子操作：
    - INCR like:count:{targetId}
    - SADD like:user:{userId} targetId
    - ZADD like:target:{targetId} userId, now()
  ↓
④ 发 MQ 消息（异步落库）
  ↓ 立即返回成功给用户
⑤ Worker 消费 MQ → 写 t_like 明细 + UPDATE t_like_count
```

**关键技术点：**
1. **Redis Lua 保证原子性**（3 个操作同步）
2. **MQ 异步削峰**：5 万 QPS → MQ 缓冲 → MySQL 按 1 千 QPS 批量写
3. **幂等键**：`user_id + target_id + action` 作为 MQ 幂等键

#### 🔸 操作 2：查询"我是否点过赞"（难点）

**难点：** 用户点过赞的 target 可能有**几百万个**，直接存 Set 内存爆炸。

| 方案 | 优点 | 缺点 |
|------|------|------|
| Redis Set | 简单 | 用户点过赞很多时内存爆炸 |
| Redis BitMap | 超省内存（1 亿 target = 12MB）| 仅适合连续 ID |
| Bloom Filter | 省内存 | 有假阳性 |
| **✅ Redis ZSet + 冷热分离** | 热数据 Redis，冷数据走 MySQL | 实现较复杂 |

**推荐：** 热数据（近 30 天）→ Redis ZSet；冷数据 → MySQL `uk_user_target` 唯一键 O(1) 查。

### 📌 1.5 热点问题（**面试加分必讲**）

#### 🔥 热点 1：超级大 V 的视频（千万级点赞）

**问题：** `INCR like:count:{targetId}` 压到单个 Redis Key，QPS 被单机 CPU 卡死。

**解决：Key 分片**
```
原 Key：like:count:123 （压力集中）
分 10 片：
  like:count:123:shard0
  like:count:123:shard1
  ...
写：按 userId % 10 分散到分片
读：SUM 10 个分片值
```

#### 🔥 热点 2：点赞风暴（明星发帖瞬间 10 万 QPS）

**解决：本地缓存 + 批量合并**
```
应用层本地维护：map<targetId, AtomicLong>
每 1 秒批量合并后写 Redis
```
牺牲 1 秒实时性换 **100 倍性能**。

#### 🔥 热点 3：数据一致性（Redis vs MySQL）

**三重保障：**
1. **MQ 幂等消费** + 失败自动重试
2. **定时对账**：每小时扫 `like:count` vs `t_like_count` 差异修复
3. **降级**：Redis 挂了直接读 MySQL + 限流保护

### 📌 1.6 容量评估

```
日活 5000 万 × 人均点赞 10 次 = 5 亿次/天
峰值 QPS = 5 亿 / 86400 × 10 (波动系数) ≈ 5 万 QPS 点赞
查询状态 QPS ≈ 20 万（每次浏览都查）

Redis：
  20 万 QPS / 单机 10 万 = 2 主 2 从 + Key 分片
  用户点赞 Set：5000 万用户 × 100 target × 16B ≈ 80GB → 3 主 3 从

MySQL：
  写入：5 万 QPS / 10 (批量) = 5000 QPS 落库 → 分 8 库 16 表
  明细：5 亿/天 × 365 ≈ 1800 亿行 → 按月分表 + 冷热分离

Kafka：
  5 万 QPS × 3 倍 = 15 万 QPS → 16 分区 3 副本
```

### 📌 1.7 常见追问 + 标准答案

**Q1：Redis 和 MySQL 不一致怎么办？**
> "三重保障：①MQ 幂等消费自动重试；②定时对账任务每小时纠偏；③读时发现差异异步修复。接受最终一致性。"

**Q2：为什么不用 Redis INCR 直接搞定？**
> "单 Key 写压力集中 → 热点问题。大 V 视频用分片 Key，10 片横向扩展。"

**Q3：用户取消又重新点赞，计数不会出错吗？**
> "明细表用 UNIQUE(user_id, target_id) + status 字段，不删除只改 status。MQ 带幂等键拦截重复消费。"

**Q4：如何防刷赞？**
> "四层防刷：①网关 QPS 限流；②业务层 Redis 判重；③风控打分（IP/设备/行为）；④异步反作弊扫描批量清理。"

### 📌 1.8 一句话总结

> **"点赞系统本质是高并发读写 + 最终一致性。核心是：Redis Lua 原子操作扛峰值写、MQ 异步批量落库、Redis 三种数据结构支撑三类查询（总数/是否点过/列表），大 V 用分片 Key 防热点，每小时对账保证一致性。"**

---

## 二、评论系统

### 📌 2.1 澄清需求

**面试开场确认：**
1. 评论是否支持**多级回复**（楼中楼）？
2. **展示需求**：按时间排序？按热度排序？
3. **量级**：日均评论数？QPS？
4. 是否支持 **@ 提醒、图片、表情**？

**典型假设：**
- 类似微博/B站评论区
- 日评论 1000 万，峰值 QPS 2 万
- 支持二级回复（评论 + 楼中楼）
- 默认按时间倒序，可切热度排序

### 📌 2.2 分层架构

```
┌───────────────────────────────────────────────────┐
│ ① 接入层：鉴权 / 限流 / 敏感词过滤 / 防刷           │
├───────────────────────────────────────────────────┤
│ ② 业务层（Comment Service）                        │
│   发布 / 删除 / 查询 / 点赞 / 回复                   │
│   ↑ 调用审核服务（NLP/人工）                        │
├───────────────────────────────────────────────────┤
│ ③ 异步层：审核 Worker + 统计 Worker + 推送 Worker   │
├───────────────────────────────────────────────────┤
│ ④ 存储层：MySQL（评论）+ Redis（热评）+ ES（搜索）  │
│           + MQ（削峰+推送）                          │
└───────────────────────────────────────────────────┘
```

### 📌 2.3 核心数据模型

#### 🔸 MySQL 评论表设计（支持多级回复）

```sql
CREATE TABLE t_comment (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    target_id BIGINT NOT NULL,         -- 被评论对象（视频/帖子）
    target_type TINYINT NOT NULL,
    user_id BIGINT NOT NULL,           -- 评论者
    content TEXT NOT NULL,
    parent_id BIGINT DEFAULT 0,        -- 一级评论 id（=0 表示这是一级评论）
    reply_to_id BIGINT DEFAULT 0,      -- 被回复的评论 id
    reply_to_user BIGINT DEFAULT 0,    -- 被回复用户
    like_count INT DEFAULT 0,
    reply_count INT DEFAULT 0,
    status TINYINT DEFAULT 0,          -- 0=审核中, 1=显示, 2=删除
    create_time DATETIME,
    INDEX idx_target (target_id, target_type, create_time),
    INDEX idx_parent (parent_id, create_time)
);
-- 分片策略：按 target_id 分库（评论查询都是基于被评论对象）
```

**两层结构（推荐）而非深度树：**
- 一级评论（parent_id=0）
- 楼中楼（所有对一级评论的回复都挂在同一个 parent_id 下）
- **为什么不做深度树？** 深度 N 的树查询复杂度高、分页难、体验差（微博/B站都是两层）

#### 🔸 Redis 缓存策略

| Key | 结构 | 用途 |
|-----|------|------|
| `cmt:hot:{targetId}` | ZSet | 热门评论 Top100（score=热度分）|
| `cmt:new:{targetId}:{page}` | List | 分页缓存最新评论 |
| `cmt:detail:{cmtId}` | Hash | 评论详情（防止 DB 热读）|
| `cmt:count:{targetId}` | String | 评论总数 |

### 📌 2.4 核心链路

#### 🔸 操作 1：发布评论（写路径）

```
用户发表评论
  ↓
① 接入层：鉴权 + 限流（单用户 1 条/秒）+ 敏感词前置过滤
  ↓
② 业务层：插入 MySQL（status=0 审核中）
  ↓
③ 发 MQ 消息（审核+推送+统计）
  ↓ 立即返回（乐观返回：告诉用户"审核中"）
④ 审核 Worker：
   - 机器审核（敏感词 + NLP 色情政治识别）
   - 命中 → 人工复审
   - 通过 → UPDATE status=1
  ↓
⑤ 审核通过后：
   - 刷新 Redis 热评/新评
   - 评论总数 INCR
   - 推送 Worker 发送 @ 提醒
   - 被评论者收到通知
```

**关键技术点：**
1. **乐观返回**：用户看到自己的评论立刻显示（前端本地加），其他用户看到是审核通过后
2. **MQ 解耦审核 + 推送 + 统计**
3. **敏感词 Trie 树** + NLP 双层审核

#### 🔸 操作 2：查询评论列表（读路径 — 最复杂）

**需求：** 支持"按时间"和"按热度"两种排序 + 分页。

**按最新评论（常规）：**
```sql
SELECT * FROM t_comment 
WHERE target_id=? AND parent_id=0 AND status=1
ORDER BY create_time DESC LIMIT 20 OFFSET N;
```

**按热度评论：**
```
热度分 = 点赞数 × 3 + 回复数 × 2 + 时间衰减因子
预计算：Worker 每 5 分钟扫描并更新 ZSet
查询：ZREVRANGE cmt:hot:{targetId} 0 19
```

**楼中楼加载：**
```
第一屏：每条一级评论只带 2-3 条热门回复
用户点击"查看更多回复"：分页查 parent_id=X 的子评论
```

#### 🔸 操作 3：查询评论数（读路径）

```
① Redis GET cmt:count:{targetId} → 命中返回
② 未命中 → SELECT COUNT(*) FROM t_comment WHERE target_id=? AND status=1
③ 回写 Redis，TTL 5 分钟
```

### 📌 2.5 热点问题

#### 🔥 热点 1：爆款内容评论风暴（1 分钟 10 万条评论）

**问题：** 顶流明星/爆炸新闻的视频，评论 QPS 飙升。

**解决：**
- **写路径限流降级**：单 target 评论 QPS 超过 1000 → 随机拒绝 50%（用户提示"评论过于火爆"）
- **审核队列优先级**：热门内容审核 Worker 单独隔离，避免拖累普通评论
- **前端频率控制**：单用户 3 秒只能发 1 条

#### 🔥 热点 2：第一页缓存一致性

**问题：** 新评论发出来，第一页缓存什么时候失效？

**方案：Cache-Aside + 写后延时双删**
```
1. 写 MySQL
2. 删 Redis 第一页缓存（cmt:new:{targetId}:1）
3. 延时 500ms 再删一次（防并发读回旧数据）
```

**或：** 干脆不缓存第一页，只缓存 2+ 页（新评论都进第一页，缓存价值低）。

#### 🔥 热点 3：深度分页性能

**问题：** `LIMIT 10000, 20` 扫 10020 行性能灾难。

**解决：游标分页**
```sql
-- 原（差）：
SELECT * FROM t_comment WHERE target_id=? ORDER BY id DESC LIMIT 10000, 20;

-- 优化（好）：
SELECT * FROM t_comment WHERE target_id=? AND id < ${lastId} ORDER BY id DESC LIMIT 20;
```

### 📌 2.6 容量评估

```
日评论 1000 万 × 365 = 36 亿条/年
峰值 QPS 2 万（写）+ 20 万（读，评论查看远多于评论）

MySQL：
  按 target_id 分 8 库 16 表
  单表年增 2.25 亿 → 按季度归档冷数据到 TiDB/Hive

Redis：
  热评/新评 ZSet+List：热门 target 约 100 万个 × 100KB ≈ 100GB → 3 主 3 从

Kafka：
  评论 MQ 2 万 QPS × 3 副本 → 8 分区

ES：
  评论搜索场景，按 target_id 建索引，支持按关键词搜评论
```

### 📌 2.7 常见追问

**Q1：怎么保证被评论者收到通知？**
> "MQ 消息里带被评论者 user_id，推送 Worker 消费后调用推送服务。失败落库 + 重试队列。"

**Q2：评论点赞怎么做？**
> "和一级点赞系统完全一样（见第一题），target_type=comment，复用同一套 Redis+MQ+MySQL 链路。"

**Q3：如何做评论审核？**
> "三层漏斗：①前置敏感词 Trie 树拦 80%；②NLP 模型识别色情/政治（腾讯天御/阿里绿网）；③人工复审 0.1%。机器审核延时 < 500ms。"

**Q4：楼中楼展开的数据怎么取？**
> "parent_id=一级评论id 查子评论，按时间正序或热度，默认展示 3 条，点击'查看更多'分页加载。"

### 📌 2.8 一句话总结

> **"评论系统本质是树形数据 + 审核异步 + 热点缓存。核心是：两层结构替代深度树简化查询、MQ 解耦审核+推送+统计、ZSet 维护热评、游标分页解决深度分页、爆款时限流降级保护。"**

---

## 三、排行榜系统

### 📌 3.1 澄清需求

**面试开场确认：**
1. 排行榜**类型**：实时 / 日榜 / 周榜 / 历史总榜？
2. **维度**：全局 / 分地域 / 分品类？
3. **数据量**：用户量级？Top N 的 N 多大？
4. **更新频率**：实时 / 准实时（分钟级）/ 离线（小时级）？
5. **查询需求**：Top N 列表？查询某用户排名？上下名次？

**典型假设：**
- 类似王者荣耀战力榜
- 1 亿用户，Top 100 展示
- 实时分数更新，排名准实时（秒级）
- 需要：Top N + 查自己排名 + 查上下名次

### 📌 3.2 分层架构

```
┌───────────────────────────────────────────────────┐
│ ① 接入层：鉴权 / 限流                               │
├───────────────────────────────────────────────────┤
│ ② 业务层（Rank Service）                           │
│   更新分数 / 查询 Top N / 查询个人排名                │
├───────────────────────────────────────────────────┤
│ ③ 异步层：离线计算 Worker（Spark/Flink）            │
│   日榜/周榜聚合、数据归档                             │
├───────────────────────────────────────────────────┤
│ ④ 存储层：                                          │
│   Redis ZSet（实时排行）+ MySQL（快照）             │
│   + Kafka（分数事件流）                              │
└───────────────────────────────────────────────────┘
```

### 📌 3.3 核心数据模型

#### 🔸 Redis ZSet（核心数据结构）

```
Key: rank:battle:{日期或周期}
  member: userId
  score:  战力分数

操作：
  ZADD rank:battle:2026-04-21 1000 userA  -- 更新分数
  ZREVRANGE rank:battle:2026-04-21 0 99 WITHSCORES  -- Top 100
  ZREVRANK rank:battle:2026-04-21 userA  -- 查自己排名
  ZRANGEBYSCORE + ZREVRANGEBYSCORE  -- 分数区间查询
```

**核心公式：**
- **Top N**：`ZREVRANGE key 0 N-1 WITHSCORES` → O(log N + M)
- **查排名**：`ZREVRANK key userId` → O(log N)
- **上下名次**：`ZREVRANGE key (myRank-3) (myRank+3) WITHSCORES` → O(log N)

#### 🔸 MySQL 快照表

```sql
CREATE TABLE t_rank_snapshot (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    rank_type VARCHAR(32) NOT NULL,    -- battle / wealth / ...
    period VARCHAR(32) NOT NULL,       -- 2026-04-21 / 2026-W16
    user_id BIGINT NOT NULL,
    score BIGINT NOT NULL,
    rank_num INT NOT NULL,
    create_time DATETIME,
    INDEX idx_type_period_rank (rank_type, period, rank_num)
);
```

**用途：** 每天 0 点/每周一 0 点**固化 Top 10000**，支持历史榜查询。

### 📌 3.4 核心链路

#### 🔸 操作 1：更新分数（写路径）

```
用户完成一场战斗
  ↓
① 业务系统发 MQ 消息（userId, deltaScore）
  ↓
② Rank Service 消费：
   ZINCRBY rank:battle:2026-04-21 deltaScore userId
  ↓
③ 同时多维度更新：
   ZINCRBY rank:battle:2026-W16 deltaScore userId  -- 周榜
   ZINCRBY rank:battle:all-time deltaScore userId  -- 总榜
   ZINCRBY rank:battle:region:北京 deltaScore userId -- 地域榜
```

**关键技术点：**
1. **MQ 异步更新**：避免战斗服务同步调用排行服务
2. **批量累加优化**：高频更新用本地累加 + 定时批量 ZINCRBY

#### 🔸 操作 2：查询 Top N（读路径）

```
ZREVRANGE rank:battle:2026-04-21 0 99 WITHSCORES
 ↓
批量查询 user 信息（Redis Pipeline MGET user:{id}）
 ↓
返回展示
```

**优化：** Top 100 结果本地缓存 5 秒（避免所有人都打 Redis）。

#### 🔸 操作 3：查询个人排名 + 上下名次

```
rank = ZREVRANK rank:battle:... userId
score = ZSCORE rank:battle:... userId

上下 3 名：
ZREVRANGE rank:battle:... MAX(0, rank-3) rank+3 WITHSCORES
```

### 📌 3.5 热点问题

#### 🔥 热点 1：单 Key ZSet 过大（1 亿用户）

**问题：** 单个 ZSet 存 1 亿成员 → 内存消耗大、单机 CPU 瓶颈。

**方案 A：分段 ZSet + 合并**
```
rank:shard0 / rank:shard1 / ... / rank:shard9
每个分片存 1000 万用户

Top N 查询：
  10 个分片各取 Top N → 合并排序
  带来一定性能损耗但可扩展
```

**方案 B：冷热分离**
```
高分区（Top 10 万用户）→ 单独 ZSet
低分区（10 万名以后）→ 只在 MySQL 快照中
```

用户查询排名 > 10 万 → 返回"10 万名以后"（实际场景多数用户不关心精确排名）。

#### 🔥 热点 2：排行榜数据一致性

**问题：** 实时分数变化 vs 榜单定格时间（日榜按 0 点定格）

**解决：双 ZSet 切换**
```
rank:battle:2026-04-20 （昨日榜，锁定不更新）
rank:battle:2026-04-21 （今日榜，持续更新）

0 点切换：
  - 把 2026-04-21 的 Top 10000 固化到 MySQL
  - 生成 2026-04-22 的空 ZSet
  - 业务层路由到新 Key
```

#### 🔥 热点 3：高频更新性能

**问题：** 每场战斗都 ZINCRBY，10 万/秒 QPS。

**解决：本地累加 + 批量刷新**
```
应用本地：ConcurrentHashMap<userId, AtomicLong>
每 1 秒批量：
  for (userId, delta) : localMap)
    ZINCRBY rank:battle:... delta userId
  localMap.clear()
```

牺牲 1 秒实时性换 **100 倍性能**。

### 📌 3.6 容量评估

```
1 亿用户，战斗 QPS 峰值 10 万，查询 Top 100 QPS 5 万

Redis ZSet：
  1 亿成员 × (32B skiplist节点 + 16B score + 平均 userId 8B) ≈ 56GB
  单实例扛不住 → 10 个分片（每个 5.6GB），3 主 3 从

MySQL 快照：
  每日 Top 10000 × 365 天 = 365 万行/年，单表即可

Kafka：
  10 万 QPS × 3 副本 → 32 分区
```

### 📌 3.7 常见追问

**Q1：ZSet 底层实现？为什么用它？**
> "ZSet 底层是 **SkipList（跳表）+ HashMap**，插入/删除/查找/按排名范围查询都是 O(log N)，查具体成员 O(1)。相比平衡树实现更简单、调试友好，且支持按分数范围查询。"

**Q2：如果分数相同怎么排名？**
> "ZSet 默认按 score 排序，score 相同按 member 字典序。业务需要可以设计复合 score：`score = 基础分 × 1000000 + 时间戳倒数`，保证唯一性和稳定排序。"

**Q3：如果要做地域/品类多维榜单？**
> "ZSet Key 按维度切分：`rank:battle:region:北京` / `rank:battle:class:战士`。每次更新多个 Key（Lua 脚本保原子）。查询时直接指定维度 Key。"

**Q4：离线榜（周榜/月榜）怎么算？**
> "方案 A：Redis 实时累加（ZINCRBY）+ 每周/月切换 Key。方案 B：离线 Spark/Flink 聚合明细日志，批量写 MySQL 历史榜。高频实时用 A，大数据量长周期用 B。"

### 📌 3.8 一句话总结

> **"排行榜核心就是 Redis ZSet——跳表 + HashMap 双数据结构实现 O(log N) 全操作。核心思路：ZINCRBY 更新分、ZREVRANGE 查 Top N、ZREVRANK 查个人排名，大数据量用分片+冷热分离，高频更新用本地累加+批量刷新。"**

---

## 四、秒杀系统

### 📌 4.1 澄清需求

**面试开场确认：**
1. **商品数量**？（100 件？1000 件？）
2. **瞬时并发**？（1 万 QPS？50 万 QPS？）
3. **一致性要求**：**绝不超卖、尽量不少卖**
4. 是否有**未支付自动取消**？时间？
5. 是否有**限购**（一人一件）？

**典型假设：**
- 商品 1000 件
- 瞬时 50 万请求
- 绝不超卖 + 一人一件 + 15 分钟未支付自动释放
- 需要：防重放 + 削峰 + 最终一致

### 📌 4.2 分层架构

```
┌───────────────────────────────────────────────────┐
│ ① 前端层：按钮防重 + 验证码 + 静态化                 │
├───────────────────────────────────────────────────┤
│ ② 接入层（网关）：限流 + 防刷 + 黑名单                │
├───────────────────────────────────────────────────┤
│ ③ 业务层（Seckill Service）                        │
│   库存校验（Redis+Lua） → 发 MQ                     │
├───────────────────────────────────────────────────┤
│ ④ 异步层（Order Worker）                            │
│   消费 MQ → 落订单 → 扣真实库存 → 推支付              │
├───────────────────────────────────────────────────┤
│ ⑤ 存储层：Redis（库存+用户去重）+ MySQL（订单+库存）│
│           + MQ（削峰+延迟回补）                       │
└───────────────────────────────────────────────────┘
```

**一句话金句：** **"削峰+原子扣减+异步下单+最终一致，秒杀五步走"**

### 📌 4.3 核心数据模型

#### 🔸 MySQL 表设计

```sql
-- 商品库存表
CREATE TABLE t_seckill_stock (
    item_id BIGINT PRIMARY KEY,
    stock INT NOT NULL,              -- 剩余库存
    version INT NOT NULL DEFAULT 0,  -- 乐观锁版本号
    create_time DATETIME,
    update_time DATETIME
);

-- 秒杀订单表（分库分表）
CREATE TABLE t_seckill_order (
    id BIGINT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    item_id BIGINT NOT NULL,
    order_id VARCHAR(64) NOT NULL,       -- 业务订单号（幂等键）
    status TINYINT NOT NULL,             -- 0=待支付, 1=已支付, 2=已取消, 3=已发货
    create_time DATETIME,
    pay_deadline DATETIME,               -- 支付截止时间
    UNIQUE KEY uk_user_item (user_id, item_id),  -- 防重复下单
    UNIQUE KEY uk_order_id (order_id)            -- 幂等
);
```

#### 🔸 Redis 数据结构

| Key | 结构 | 用途 |
|-----|------|------|
| `seckill:stock:{itemId}` | String | 实时库存计数 |
| `seckill:bought:{itemId}` | Set | 已购用户去重（防一人多买）|
| `seckill:user:limit:{userId}` | String | 单用户 QPS 限流 |

### 📌 4.4 核心链路（**秒杀 8 步走**）

```
用户点击秒杀按钮
  ↓
① 前端层：
   - 按钮点击后置灰 3 秒（防连点）
   - 验证码校验（防机器人）
   - 页面静态化 + CDN（减少后端压力）
  ↓
② 网关层：
   - 令牌桶限流（如全局 5 万 QPS）
   - 单用户限流（Redis 1 QPS）
   - 黑名单拦截（风控名单）
  ↓
③ 业务层 - Redis Lua 原子扣减：
   local stock = redis.call('GET', 'seckill:stock:item1')
   if tonumber(stock) <= 0 then return -1 end
   if redis.call('SISMEMBER', 'seckill:bought:item1', userId) == 1 
     then return -2 end  -- 已购
   redis.call('DECR', 'seckill:stock:item1')
   redis.call('SADD', 'seckill:bought:item1', userId)
   return 1
  ↓
④ Redis 扣减成功 → 发 MQ 消息：
   { userId, itemId, orderId(UUID), timestamp }
  ↓ 立即返回用户"抢购成功，正在创建订单"
⑤ Order Worker 消费 MQ：
   - 插入 t_seckill_order（status=0, pay_deadline=now+15min）
   - UPDATE t_seckill_stock SET stock=stock-1 WHERE item_id=? AND stock>0 (乐观锁)
   - 发送延迟消息（15 分钟）到"订单超时队列"
  ↓
⑥ 用户 15 分钟内支付：
   - 订单 status=0 → 1
   - 取消延迟消息
  ↓ 或 15 分钟超时
⑦ 超时 Worker：
   - 订单 status=0 → 2（取消）
   - Redis 库存 INCR +1（回补）
   - Redis 去重 Set SREM userId
   - MySQL 库存 +1
  ↓
⑧ 监控告警：
   - Redis 库存 vs MySQL 库存对账
   - QPS/成功率/失败率
```

### 📌 4.5 核心技术点

#### 🔸 1. 如何防止超卖？

**三层防护：**
1. **Redis Lua 原子扣减**（第一道门）
2. **MQ 异步落 MySQL**（异步削峰，避免同步锁冲突）
3. **MySQL 乐观锁兜底**：
   ```sql
   UPDATE t_seckill_stock SET stock=stock-1 
   WHERE item_id=? AND stock>0;
   ```
   `WHERE stock>0` 这一行是最后防线——即使前面 Redis 异常也不会超卖。

#### 🔸 2. 如何防止一人多买？

**两层防护：**
1. **Redis SADD 判重**（Lua 脚本内判断）
2. **MySQL UNIQUE KEY(user_id, item_id)** 兜底
   - MQ 重复消费时，SQL 抛 DuplicateKeyException → Worker 直接丢弃

#### 🔸 3. 如何做库存预热？

```
秒杀前 5 分钟：
  定时任务：加载 MySQL 库存 → Redis（避免冷启动 DB 压力）
  SET seckill:stock:item1 1000
  DEL seckill:bought:item1
```

#### 🔸 4. 如何做幂等？

- **用户维度**：UNIQUE(user_id, item_id) → 用户重复下单被拦
- **消息维度**：orderId 作为幂等键，Worker 消费前判重（SETNX orderId）
- **HTTP 维度**：前端生成 requestId，后端 Redis 判重 5 秒内相同 requestId 直接返回

#### 🔸 5. 未支付回补机制

**方案 A：RocketMQ 延迟消息（推荐）**
```
下单时发延迟消息（delayLevel=14，15分钟）
到时自动消费：检查订单状态 → 未支付则取消 + 回补库存
```

**方案 B：定时任务扫表（降级兜底）**
```
每分钟扫描 status=0 AND pay_deadline < now() 的订单
取消并回补库存
```

### 📌 4.6 热点问题

#### 🔥 热点 1：Redis 热 Key（单商品 50 万 QPS）

**解决：分段库存**
```
原 Key：seckill:stock:item1 = 1000
拆成 10 片：
  seckill:stock:item1:shard0 = 100
  seckill:stock:item1:shard1 = 100
  ...
  seckill:stock:item1:shard9 = 100

用户请求按 userId % 10 路由到对应分片
单分片 5 万 QPS，压力分散
```

**代价：** 某些分片可能先卖完，存在"A 分片有货但路由到 B 分片返回无货"的小概率失败，需要**二次兜底查询**。

#### 🔥 热点 2：防黑产/脚本抢购

**多层防刷：**
1. **滑块验证码** / 图形验证码
2. **设备指纹 + IP 黑名单**
3. **风控打分**：注册时间、历史行为、下单速度
4. **答题验证**：秒杀前回答简单问题（如 `1+1=?`）
5. **异步反作弊**：事后扫描异常订单批量取消

#### 🔥 热点 3：Redis 故障降级

**方案：**
- **Redis 主节点挂** → Sentinel 自动切从
- **Redis 集群全挂** → 熔断，直接返回"活动火爆"，保护下游 MySQL
- **MQ 挂** → 本地 Disruptor 队列兜底

### 📌 4.7 容量评估

```
50 万 QPS 瞬时 × 5 秒 = 250 万请求冲击

网关层：
  Nginx + LVS：单机 10 万 QPS × 5 台 = 50 万

业务层：
  Redis Lua：单实例 10 万 QPS → 分片 10 片 = 100 万
  应用：单机 2000 QPS × 30 台 = 6 万（够用）

MQ：
  Kafka 16 分区 × 3 副本，扛 30 万 QPS

MySQL：
  异步写入，峰值 1000 QPS 完全够用
  订单表：1000 件/场 × 100 场/天 × 365 天 = 3650 万/年，单表即可
```

### 📌 4.8 常见追问

**Q1：Redis 扣减成功但 MQ 挂了怎么办？**
> "补偿机制：①Redis 与 MQ 之间用本地事务消息（先写 MySQL 记录 tx_status=待发送，再发 MQ）；②定时扫描未发送的事务消息重发；③最坏情况：对账任务发现 Redis 扣减但无订单，手动回补。"

**Q2：Redis Lua 脚本为什么快？**
> "①原子性：整个脚本在 Redis 单线程中一次执行，不会被其他命令打断；②减少网络往返：多个命令合并成一次调用；③服务端执行：避免客户端多次 round-trip。"

**Q3：如何保证订单不丢？**
> "三重保障：①MQ at-least-once 投递 + 消费端幂等；②订单表 UNIQUE 键兜底；③对账任务扫 Redis 扣减日志 vs MySQL 订单，差异补偿。"

**Q4：秒杀结果怎么展示给用户？**
> "①乐观返回'抢购中'立即返回 → 前端轮询订单状态（或 WebSocket 推送）；②创建成功 → 跳转支付页；③失败 → 显示'已售罄'或'活动结束'。"

**Q5：秒杀接口跟普通下单接口为什么要拆开？**
> "①流量隔离：50 万 QPS 冲击不能影响正常购物；②技术栈不同：秒杀重 Redis + MQ，普通下单重事务一致性；③降级策略不同：秒杀可以返回失败，普通下单要尽量成功。"

### 📌 4.9 一句话总结

> **"秒杀核心是削峰+原子+异步。关键五步：前端防重 → 网关限流 → Redis Lua 原子扣减 → MQ 异步下单 → MySQL 乐观锁兜底。加上库存预热、延迟回补、分段库存防热点、多层幂等，就是一套完整的生产级秒杀方案。"**

---

## 生产级五件套（通用）

**任何系统设计题结尾必须补这五件套：**

| 能力 | 核心要点 | 技术方案 |
|------|---------|---------|
| **限流** | 保护系统不被打垮 | 网关令牌桶 + 单用户 Redis 限流 + 接口级 Sentinel |
| **熔断** | 故障不扩散 | Sentinel/Hystrix 慢调用熔断 + 降级预案 |
| **幂等** | 重试不重复 | 业务唯一键 + MQ 幂等键 + Redis SETNX |
| **监控告警** | 问题早发现 | QPS/成功率/P99 时延 + 业务指标 + 对账告警 |
| **容量评估** | 不是拍脑袋 | QPS → 实例数 → Redis/MQ/MySQL 分片数 |

**万能金句：**
> **"系统设计不只是画图，还要讲清生产级五件套——限流、熔断、幂等、监控、容量评估，每一项都要有具体方案和数字支撑。"**

---

## 核心金句汇总

### 🎯 架构层面

| 场景 | 金句 |
|------|------|
| **开场白** | "先画分层架构，再讲核心链路，最后补生产级能力" |
| **点赞系统** | "写异步削峰、读 Redis 兜底、MySQL 最终一致" |
| **评论系统** | "两层结构替代深度树、MQ 解耦审核推送统计" |
| **排行榜** | "ZSet 是跳表 + HashMap，O(log N) 搞定所有排名操作" |
| **秒杀系统** | "削峰+原子扣减+异步下单+最终一致" |

### 🎯 技术选型层面

| 场景 | 金句 |
|------|------|
| **Redis+MQ+MySQL** | "Redis 扛读写，MQ 削峰落库，MySQL 保持久化" |
| **计数场景** | "明细表分库分表后 COUNT(*) 是灾难，必须独立计数表" |
| **热点 Key** | "超级大 V 用分片 Key，牺牲 1 秒实时性换 100 倍性能" |
| **冷热分离** | "热数据走 Redis，冷数据走 MySQL 唯一键 O(1) 查" |
| **一致性** | "Redis 先行、MQ 兜底、对账纠偏" |

### 🎯 思辨能力层面

| 场景 | 金句 |
|------|------|
| **面对选型** | "没有银弹，关键看约束条件——业务复杂度、团队栈、SLA 要求" |
| **技术权衡** | "牺牲 X 秒实时性换 100 倍性能，这是可接受的取舍" |
| **生产思维** | "系统不只要能跑，还要能扛、能看、能降级" |

---

## 📊 学习建议

### 掌握顺序（从易到难）

1. **排行榜系统** ⭐⭐ — 最简单，ZSet 一套到底
2. **点赞系统** ⭐⭐⭐ — 标准的"Redis+MQ+MySQL"组合
3. **评论系统** ⭐⭐⭐⭐ — 多了审核异步和树形数据
4. **秒杀系统** ⭐⭐⭐⭐⭐ — 最综合，涉及所有生产级能力

### 每个系统必练内容

1. **画分层架构图**（白板/纸上手绘）
2. **写 1-2 个核心链路**（用数字箭头标清顺序）
3. **讲 1 个热点问题 + 解决方案**
4. **做 1 次容量评估**（用具体数字算账）

### 推荐延伸阅读

- 📖 [JavaGuide - 高并发系统设计](https://javaguide.cn/high-performance/)
- 📖 [小林 coding - 图解系统设计](https://xiaolincoding.com/)
- 📖 [美团技术博客 - 秒杀系统设计](https://tech.meituan.com/)
- 📖 [阿里技术 - 排行榜设计](https://developer.aliyun.com/)

---

## 🎯 收尾：系统设计的三个境界

1. **能画分层**：接入 → 业务 → 异步 → 存储
2. **能讲链路**：核心操作的完整流程，包括缓存、MQ、数据库
3. **能讲取舍**：热点问题、容量评估、一致性 vs 可用性的权衡

> **最高境界：** 当面试官问"如果 XX 变了怎么办"，你能立刻讲出演进方案 —— 这就是架构师思维。

---

> 📝 持续更新中。下次计划新增：消息推送系统、短链系统、Feed 流系统、搜索系统、红包系统...
