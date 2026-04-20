# 模拟面试总结报告

> 面试时间：2026-04-20 22:13
> 面试方向：Java 后端开发
> 总体评级：良好（有明显进步，但基础仍需打牢）

---

## 一、面试内容回顾

### 1.1 Java 基础与 JVM

**Q1: JDK 15 之后 HotSpot 默认禁用偏向锁的原因是什么？如何观察锁的状态？**

📝 **参考答案（完整版）**：

**1. 为什么禁用偏向锁（JEP 374）—— 收益 < 成本：**

- **撤销成本高**：偏向锁被第二个线程争用时，必须把所有持有偏向锁的线程**暂停到全局安全点（Safepoint）**，然后修改对象头、遍历栈帧、重置偏向状态。STW 开销在大型应用里不可忽视
- **批量撤销更贵**：同一个类的对象被多个线程访问时，触发"批量重偏向"→"批量撤销"，全局 Safepoint 次数暴涨
- **现代应用没收益**：现代框架（Netty、Disruptor、并发容器）本来就是多线程设计，偏向锁几乎必然被撤销
- **维护成本高**：偏向锁代码在 HotSpot 里非常复杂

**2. 观察锁状态的手段：**

| 手段 | 用法 | 说明 |
|------|------|------|
| **JOL 工具**（推荐） | `ClassLayout.parseInstance(obj).toPrintable()` | 打印对象头二进制 |
| **-XX:+PrintFlagsFinal** | 启动参数查看 `UseBiasedLocking` | 确认 JVM 是否启用偏向锁 |
| **JFR / async-profiler** | `-e lock` 采样锁竞争事件 | 观察 `jdk.JavaMonitorEnter` |

**Mark Word 锁标志位：**
- `01` + biased=0 → 无锁
- `01` + biased=1 → 偏向锁
- `00` → 轻量级锁
- `10` → 重量级锁
- `11` → GC 标记

一句话记忆：**"偏向锁只对单线程有收益，但撤销要 STW，现代应用都是多线程，所以干脆默认关掉。"**

👤 **候选人回答**：
- 直接回答"不清楚"

📊 **评价**：⚠️ 这题比较底层，不了解可以接受，但 Mark Word 锁标志位和 JOL 工具是 Java 并发必备工具。

💡 **面试官补充讲解**：给出了完整答案，建议花 30 分钟用 JOL 跑 Demo 观察锁升级过程。

---

### 1.2 中间件与数据存储（MySQL）

**Q2: 给定联合索引 `idx_user_status(user_id, status)`，SQL 为 `SELECT id, user_id, status FROM t_order WHERE user_id=1001 AND status=2 AND create_time > '2026-01-01'`，问：能用上索引吗？ICP 和覆盖索引哪个生效？怎么改让它完全走覆盖索引？**

📝 **参考答案（完整版）**：

**1. 能用上索引吗？** ✅ 能。`user_id` 是最左列，`status` 是第二列，两个等值条件都能走索引。

**2. ICP vs 覆盖索引（核心区别）：**

| 维度 | 索引下推 ICP | 覆盖索引 |
|------|-------------|---------|
| **解决什么问题** | **减少回表次数** | **完全不回表** |
| **触发条件** | 索引里有部分列，WHERE 还有其他条件能在索引中判断 | SELECT 的所有列都在索引中 |
| **效果** | 先在索引层过滤一轮，再回表查剩下的 | 直接从索引返回结果 |
| **EXPLAIN 标志** | `Using index condition` | `Using index` |

**关键：** 本题中 `status` 本身在索引里，是**正常的索引查找**，不是 ICP。`create_time` 不在索引里，没法下推 → **本题 ICP 没有生效机会**。

**ICP 经典例子：**
```sql
INDEX idx_name_age (name, age)
SELECT * FROM user WHERE name LIKE '张%' AND age = 20;
-- 没 ICP：索引找 name LIKE '张%' → 全部回表 → Server 层过滤 age=20
-- 有 ICP：索引层一起过滤 age=20 → 只回表符合条件的
```

**3. 完全走覆盖索引的建法：**

```sql
-- SELECT: id, user_id, status
-- WHERE:  user_id, status, create_time
INDEX idx_cover (user_id, status, create_time)
-- InnoDB 辅助索引叶子节点自带主键 id，所以 id 不用显式加
```

**一句话记忆：** **"主键索引=聚簇索引（数据即索引）；辅助索引叶子存主键值，拿主键再回表。覆盖索引=辅助索引里能拿到所有需要的数据，不回表。"**

👤 **候选人回答**：
- 能用上索引：答对，说出"最左匹配原则" ✅
- ICP：**说错了**——把 `status` 在索引里的正常过滤说成了 ICP ❌
- 覆盖索引：方向"不回表"对 ✅，但把"ID 作主键"当解决方案 ❌（ID 已经是主键了）

📊 **评价**：⚠️ 最左匹配答对，但 ICP 概念理解错误，覆盖索引的建法没抓到核心（SELECT+WHERE 所有列都在一个辅助索引里）。

💡 **面试官补充讲解**：给出了 ICP 经典例子（`name LIKE '张%' AND age=20`），强调 ICP 是"索引外条件下推"、覆盖索引是"SELECT 所有列在索引里"。

---

**Q3（追问）: InnoDB 辅助索引叶子节点为什么存主键值而不是像 MyISAM 那样存物理地址？**

📝 **参考答案**：

**核心原因：应对数据行的"移动"。**

- **MyISAM**：数据独立存于 `.MYD`，辅助索引存物理地址，直接读文件偏移 → 但**行移动时要改所有辅助索引**
- **InnoDB**：数据按主键有序存于聚簇索引 B+ 树 → 页分裂/变长字段更新/GC 合并都会导致行移动 → 如果辅助索引存物理地址，**每次行移动都要更新所有辅助索引**，成本极高

**InnoDB 设计：辅助索引存主键值**
- 数据行怎么移动，辅助索引都不用改
- 代价是回表一次，所以**覆盖索引和合理的联合索引很重要**

**为什么推荐自增主键：** 单调递增 → 新数据总是追加到 B+ 树最右侧 → 很少页分裂 → 数据页空间利用率高

👤 **候选人回答**：直接说"不清楚"

📊 **评价**：⚠️ 底层原理不掌握，但理解这个有助于深入理解 InnoDB 索引设计。

💡 **面试官补充讲解**：完整讲解了"主键换稳定性"的设计取舍，解释了为什么推荐自增主键。

---

### 1.3 Spring 框架 / 并发

**Q4: CompletableFuture 三个深度问题：(1) supplyAsync 不传线程池用的是哪个？生产隐患？(2) 8 个并行任务，一个超时兜底不拖垮其他，怎么写？(3) thenApply 和 thenApplyAsync 区别？**

📝 **参考答案（完整版）**：

**1. 默认线程池：`ForkJoinPool.commonPool()`**

**生产隐患：**
| 隐患 | 说明 |
|------|------|
| **线程数太少** | 默认大小 = `CPU 核数 - 1` |
| **全局共享污染** | 整个 JVM 共用，一个业务慢任务拖垮所有 |
| **阻塞任务灾难** | ForkJoinPool 为 CPU 密集型设计，IO 阻塞任务会卡所有线程 |

**正确做法：自定义业务隔离的 ThreadPoolExecutor**

**2. 并行+超时+单独降级（BFF 标准写法）：**

```java
ExecutorService executor = ...;

CompletableFuture<ResultA> futureA = CompletableFuture
    .supplyAsync(() -> serviceA.call(), executor)
    .orTimeout(2, TimeUnit.SECONDS)               // 单独超时
    .exceptionally(e -> ResultA.fallback());      // 单独降级

// ... 其他 7 个同理

CompletableFuture.allOf(futureA, futureB, ...).join();
return new BffResponse(futureA.join(), ...);
```

**三大要点（必背）：**
1. `supplyAsync(task, executor)` —— 自定义线程池
2. `.orTimeout(2, SECONDS)` —— JDK 9+ 单独超时
3. `.exceptionally(e -> fallback)` —— 单独降级

**⚠️ 常见坑**：不要在 `allOf().get(3, SECONDS)` 上设超时——那是**整体超时**，到时间没结束就全部失败。

**3. thenApply vs thenApplyAsync：**

| 方法 | 执行线程 | 场景 |
|------|---------|------|
| **`thenApply(fn)`** | **上一步完成时所在的线程**（可能工作线程，也可能调用线程） | 轻量计算 |
| **`thenApplyAsync(fn)`** | **重新提交到线程池执行** | 耗时操作、线程池隔离 |

**关键：`thenApply` 不保证线程切换！** 如果前一步已 complete，会在当前调用线程执行（可能阻塞主线程）。

**生产最佳实践：IO + CPU 线程池隔离**
```java
CompletableFuture.supplyAsync(() -> rpcCall(), ioPool)
    .thenApplyAsync(data -> complexCompute(data), cpuPool);
```

👤 **候选人回答**：
- 默认线程池：说出 ForkJoinPool ✅，但隐患描述模糊（"固定大小导致堵塞"不准确） ⚠️
- 超时+降级：没用过 ❌
- thenApply/Async：方向对（异步执行）⚠️，但核心是"线程切换控制"不是"加快速度"

📊 **评价**：⚠️ 三个核心点都有知识盲区。CompletableFuture 是 BFF 场景的标配，建议写 Demo 实践。

💡 **面试官补充讲解**：给出了完整的三大要点代码模板，强调"超时和降级必须挂在每个 Future 上，不能用 allOf 整体超时"。

---

### 1.4 项目经验深入

**Q5: 顺风车 Router Agent 的三个细节：(1) 意图识别如何判断？(2) estimateId 如何跨轮次跨 Agent 传递？Redis vs 上下文各自的坑？(3) 子 Agent 调用失败的容错策略？**

📝 **参考答案（候选人的优秀方案）**：

**1. 意图识别三板斧：关键词 + 配置 + Prompt 定义**

**架构层次：**
```
出行服务 Root Agent（意图分类）
    ↓  路由分发
顺风车子 Agent（意图执行）
    ↓  Tool 调用
MCP 能力
```

**"肚子疼"例子（亮点）**：用户输入模糊时，LLM 主动引导意图（是否要去医院？是否打车？），而不是硬匹配关键词。

**2. estimateId 跨轮次传递：**

| 方案 | 坑 |
|------|-----|
| **Redis 缓存** | 多一次网络开销 |
| **塞上下文** | 上下文爆炸、压缩丢失 |

**候选人方案：Redis + 覆盖策略（一轮对话内只保留一个 estimateId）**

**生产级细节（补充）：**
- Key 设计：`agent:{sessionId}:estimateId` 带会话隔离
- TTL：5-10 分钟，匹配询价有效期
- 幂等保护：下单 Tool 内部校验 estimateId 过期就强制重询价
- 监控：estimateId 命中率长期缺失 = 模型跳步信号

**3. 接口容错分级（候选人原则+补充）：**

| 等级 | 特征 | 例子 | 策略 |
|------|------|------|------|
| **L1 核心写接口** | 有副作用，重试可能重复下单 | 下单、支付 | ❌ 不重试，返回用户失败 |
| **L2 核心读接口** | 幂等但关键 | 询价、账户查询 | ✅ 重试 1-2 次 + 熔断 |
| **L3 非核心辅助** | 丢失不影响主流程 | 逆地址解析、POI | ✅ 重试 + 兜底文案 |

**面试加分句：** **"所有重试都要加幂等键（requestId），防止下游部分成功上游重试造成重复扣款/重复下单"**

👤 **候选人回答**：
- 架构层次澄清：顺风车是子 Agent，上游 Root Agent ✅（真实项目细节）
- 意图识别三板斧：关键词 + 配置 + Prompt ✅
- "肚子疼"例子展示对话式引导 ✅
- Redis 方案 + 覆盖策略 ✅
- 主动对比两种方案的坑 ✅
- 接口重要性分级容错：询价可重试、下单不重试 ✅

📊 **评价**：✅ **本次面试最大亮点**。三个问题都给出了真实项目架构级的细节，讲得有血有肉。

💡 **面试官补充讲解**：补充了"意图漏斗"概念、Key 设计/TTL/幂等保护/监控四件套、接口容错分级表+幂等键强调。

---

### 1.5 系统设计

**Q6: 设计 LLM 网关——对接多厂商，日均 1000 万请求，峰值 QPS 2000，业务方优先级 + 厂商 QPS 限额，解决路由、限流、降级、成本核算、监控告警。**

📝 **参考答案（LLM 网关 4 层架构）**：

```
┌──────────────────────────────────────────────────┐
│ ① 接入层：鉴权 / 参数校验 / 全局限流 / SSE 长连接   │
├──────────────────────────────────────────────────┤
│ ② 编排层：业务路由 / 模型选型 / Prompt 改写 / 上下文│ ← 核心
├──────────────────────────────────────────────────┤
│ ③ 执行层：厂商适配器 / QPS 限流 / 重试 / 熔断 / 流式│
├──────────────────────────────────────────────────┤
│ ④ 存储观测层：MySQL 配置+账单 / Redis 令牌+缓存 / │
│               Kafka 日志 / Prometheus 指标        │
└──────────────────────────────────────────────────┘
```

**LLM 网关 vs 普通 API 网关的 5 大差异：**

| 特性 | 普通网关 | LLM 网关特有 |
|------|---------|------------|
| 流式响应 | 请求-响应 | SSE/WebSocket 转发 |
| Token 计算 | 无 | 预估 + 实际计数 |
| 上下文 | 无 | 自动裁剪/摘要 |
| 语义缓存 | URL+参数 | **向量化语义指纹** |
| 降级 | 切厂商 | **模型降级**（GPT-4→3.5→规则模板）|

**限流 4 维度：**
| 维度 | 算法 |
|------|------|
| 厂商 QPS | 令牌桶 |
| **厂商 TPM**（每分钟 token）| 滑动窗口 |
| 业务方优先级 | 加权令牌桶 |
| 单用户防刷 | Redis + Lua |

**金句：** **"LLM 限流真正卡的是 token，不是请求次数"**

**容量评估示范：**
```
峰值 QPS 2000，每请求 P99 3s → 并发连接 6000
→ 单机 500 长连接 → 12 实例（留 buffer=15 台）
→ Redis QPS：2000×4=8000 → 3 主 3 从
→ Kafka：50GB/天 → 3 分区 2 副本
```

👤 **候选人回答**：
- 分层：接入层 / 业务处置层 / 基础设施层 ✅（3 层，稍粗）
- 关键链路：鉴权 → 业务路由 → QPS 校验 → 重试 → 降级兜底 ✅
- 路由策略：按优先级 A→B→C 顺延 ✅
- 成本核算：记录 token → 查单价 → 算成本 ✅
- 监控：请求量/成功率/失败率 ✅
- 缺失：LLM 特色（流式/语义缓存/Token限流/模型降级）、幂等、容量评估

📊 **评价**：📈 **明显进步**——主动先讲分层是 8 次面试里第一次。但讲成了"通用多厂商路由网关"，缺 LLM 场景特有设计。

💡 **面试官补充讲解**：给出 4 层架构（把"编排层"独立出来）、LLM 5 大差异、限流 4 维度、容量评估模板。

---

### 1.6 AI / Agent

**Q7: 技术选型思辨——自研 Agent 编排（Java+MCP） vs 引入 LangGraph（Python）？从开发效率、运行时性能、调试可观测、团队能力四个维度分析，并给出选型结论。**

📝 **参考答案（完整版）**：

**维度对比：**

| 维度 | Java 自研 | LangGraph |
|------|----------|-----------|
| 开发效率（简单线性流程）| ✅ 快 | ⚠️ 学 API 反而慢 |
| 开发效率（复杂 DAG）| ❌ 自己写状态机痛苦 | ✅ 原生支持快 |
| 运行时性能 | ✅ JVM 性能好，虚拟线程并发强 | ❌ GIL 限制，解释执行慢 3-10 倍 |
| **但：LLM 瓶颈 99% 在推理**  | 编排层性能差异可忽略 | — |
| 调试：断点/Trace | ✅ IDE 成熟 + 公司监控生态 | ⚠️ 框架黑盒，需接 LangSmith |
| 调试：Prompt 可视化 | ❌ 要自己做 | ✅ LangGraph Studio 天然支持 |
| 团队能力（Java 栈）| ✅ 无学习成本 | ❌ 学 Python + LangGraph + 新监控体系 |

**🎯 推荐方案 A：混合架构**

```
核心业务链路（下单/支付/询价） → Java 自研
复杂编排/实验性场景（多 Agent/研究） → Python + LangGraph
两者通过 MCP 协议或 gRPC 互通
```

**金句：** **"成熟业务用 Java 保稳定，探索业务用 LangGraph 跑速度，用 MCP 协议打通——既不牺牲稳定性，又不错过生态红利。"**

**技术选型题"三段论"模板：**
1. 客观对比维度（横向比较）
2. 结合团队/业务约束筛选（判断主要矛盾）
3. 给出明确结论 + 兜底方案（带 Plan B）

**万能金句：**
> **"没有银弹，关键看约束条件——结合业务复杂度、团队栈、SLA 要求，我倾向于 XX 方案。如果 YY 条件变化，可以演进到 ZZ。"**

👤 **候选人回答**：
- 开发效率：框架快 ✅（但没区分简单/复杂场景）
- 运行时性能：**框架更好** ❌（判断反了——Java 其实更快）
- 调试：差不多 ❌（两边各有优势，不是持平）
- 团队能力：学 Python 成本高 ✅
- **没有给选型结论** ❌（这是思辨题的灵魂）

📊 **评价**：⚠️ 运行时性能判断反了，调试维度过度简化，**最大问题是没给选型结论**——这是思辨题最关键的一步。

💡 **面试官补充讲解**：纠正了运行时性能判断（Java 反而更快），给出了"混合架构"最佳方案和"三段论"选型模板。

---

### 1.7 算法与编程

**Q8: LeetCode 146. LRU 缓存（Medium）—— 要求 O(1)，写代码。**

📝 **参考答案（完整版）**：

**方式 A：HashMap + 自定义双向链表（标准答案）**

```java
class LRUCache {
    class Node {
        int key, value;
        Node prev, next;
        Node(int k, int v) { key = k; value = v; }
    }
    
    private Map<Integer, Node> map = new HashMap<>();  // key → Node 引用（关键）
    private Node head = new Node(0, 0);
    private Node tail = new Node(0, 0);
    private int capacity;
    
    public LRUCache(int capacity) {
        this.capacity = capacity;
        head.next = tail;
        tail.prev = head;
    }
    
    public int get(int key) {
        if (!map.containsKey(key)) return -1;
        Node node = map.get(key);
        moveToHead(node);
        return node.value;
    }
    
    public void put(int key, int value) {
        if (map.containsKey(key)) {
            Node node = map.get(key);
            node.value = value;
            moveToHead(node);
        } else {
            Node node = new Node(key, value);
            map.put(key, node);
            addToHead(node);
            if (map.size() > capacity) {
                Node lru = tail.prev;
                removeNode(lru);
                map.remove(lru.key);  // Node 必须存 key
            }
        }
    }
    
    private void addToHead(Node node) {
        node.next = head.next;
        node.prev = head;
        head.next.prev = node;
        head.next = node;
    }
    
    private void removeNode(Node node) {
        node.prev.next = node.next;
        node.next.prev = node.prev;
    }
    
    private void moveToHead(Node node) {
        removeNode(node);
        addToHead(node);
    }
}
```

**必背 3 技巧：**
| 技巧 | 作用 |
|------|------|
| HashMap 存 Node 引用（不是 value）| O(1) 定位节点才能 O(1) 删除 |
| Node 必须存 key | 淘汰尾节点时从 HashMap 里 remove(key) |
| 哨兵头尾节点 | 避免 null 判断 |

**方式 B：LinkedHashMap 快捷版（加分项）**

```java
class LRUCache extends LinkedHashMap<Integer, Integer> {
    private int capacity;
    
    public LRUCache(int capacity) {
        super(capacity, 0.75f, true);  // accessOrder=true 是关键
        this.capacity = capacity;
    }
    
    public int get(int key) {
        return super.getOrDefault(key, -1);
    }
    
    public void put(int key, int value) {
        super.put(key, value);
    }
    
    @Override
    protected boolean removeEldestEntry(Map.Entry<Integer, Integer> eldest) {
        return size() > capacity;
    }
}
```

**关键 2 点：** `accessOrder=true` + 重写 `removeEldestEntry()`

**复杂度：** 两种方式都是 **时间 O(1) / 空间 O(capacity)**

👤 **候选人回答**：
- 用 `Deque<Integer>` + `HashMap<Integer, Integer>` 实现
- 逻辑完全正确（LeetCode 能 AC）✅
- **但致命性能问题**：`deque.remove(key)` 是 O(N) ❌
  - JDK `LinkedList.remove(Object)` 内部要遍历链表找节点
- 不了解 LinkedHashMap 版本

📊 **评价**：✅ **愿意写代码是重大进步**（上次拒绝写）。逻辑对，但踩了 `LinkedList.remove(Object) 是 O(N)` 的经典坑，不满足题目 O(1) 要求。

💡 **面试官补充讲解**：
- 讲清 LinkedList 的 remove(Object) 是 O(N) 的原因（遍历找节点）
- 给出标准答案（HashMap 存 Node 引用 + 自定义双向链表）
- 给出 LinkedHashMap 快捷版本作为加分项

---

## 二、面试评价

### 各维度评分（满分 5 分）

| 维度 | 评分 | 评语 |
|------|------|------|
| Java 基础 | 2.5/5 | 偏向锁禁用原因不清楚，Mark Word 观察工具不熟 |
| 框架理解 | 3/5 | CompletableFuture 三大要点未完全掌握，thenApply/Async 理解偏差 |
| 中间件与存储 | 3/5 | ICP 概念错误（把正常索引当 ICP），覆盖索引建法思路偏 |
| 项目深度 | **4.5/5** | ✅ **本次最大亮点**——Router Agent 架构层次、Redis 状态管理、接口分级容错 |
| 系统设计 | 3.5/5 | 📈 **主动先讲分层**是重大进步，但缺 LLM 场景特色 |
| AI / Agent | 2.5/5 | 技术选型思辨题没给结论，运行时性能判断反了 |
| 算法与编程 | 3/5 | ✅ **愿意写代码大进步**，但踩了 LinkedList.remove O(N) 坑 |
| 表达与沟通 | 4/5 | 项目表达清晰，逻辑有条理 |

### 与历史面试对比

| 维度 | 04-14 | 04-15(1) | 04-15(2) | 04-16 | 04-17 | **04-20(本次)** | 趋势 |
|------|-------|----------|----------|-------|-------|----------------|------|
| Java 基础 | 3.5/5 | 3.5/5 | 2.5/5 | 2.5/5 | 2.5/5 | **2.5/5** | ➡️ 持续偏弱，新题型暴露新薄弱点 |
| 框架理解 | 3/5 | 3/5 | 3.5/5 | 3.5/5 | 4/5 | **3/5** | 📉 CompletableFuture 核心点仍未掌握 |
| 中间件与存储 | 3.5/5 | 4/5 | 2.5/5 | 3/5 | 4/5 | **3/5** | 📉 ICP 和覆盖索引新暴露薄弱点 |
| 项目深度 | 4.5/5 | 4.5/5 | 4.5/5 | 4.5/5 | 4.5/5 | **4.5/5** | ➡️ 稳定高水平 |
| 系统设计 | 3.5/5 | 4/5 | 3.5/5 | 3/5 | 3/5 | **3.5/5** | 📈 首次主动讲分层 |
| AI / Agent | 4/5 | 3.5/5 | 4.5/5 | 3.5/5 | 4/5 | **2.5/5** | 📉 思辨题未给结论 |
| 算法与编程 | 3/5 | 2.5/5 | 2.5/5 | 2/5 | 3.5/5 | **3/5** | ➡️ 敢写代码但有新坑 |
| 表达与沟通 | 4/5 | 3.5/5 | 4/5 | 4/5 | 3.5/5 | **4/5** | ➡️ 稳定 |

### 亮点

- **Router Agent 项目讲述**：架构层次清晰（顺风车是子 Agent 上游 Root Agent）、Redis 状态管理+覆盖策略、接口重要性分级容错，真实做过的细节感强
- **系统设计首次主动讲分层**：8 次面试里重大突破，"先画分层再展开"的习惯建立
- **算法首次愿意写代码**：虽然有 O(N) 坑但敢写 >> 拒绝写
- **意图漏斗"肚子疼"例子**：展示了对话式 Agent 的意图引导能力

### 待改进

- **MySQL ICP 概念混淆**：ICP 是"**索引外的条件**下推到索引层判断"，不是索引内的正常过滤
- **CompletableFuture 三大要点**：`supplyAsync(task, executor)` + `.orTimeout()` + `.exceptionally()`，必须掌握并能写出代码模板
- **LinkedList.remove(Object) 是 O(N)** 这个坑必须记住，LRU 标准答案是 HashMap 存 Node 引用
- **思辨题必须给结论**：这类题灵魂是"你选哪个、为什么"，用"三段论"模板（对比→约束→结论+兜底）
- **LLM 网关特色**：流式 SSE + 语义缓存 + Token 限流 + 模型降级，是区别于普通 API 网关的 5 大差异

---

## 三、后续学习计划

### 高优先级（面试高频 + 当前薄弱）

| 知识点 | 当前水平 | 目标水平 | 学习方法 | 建议时长 |
|--------|---------|---------|---------|---------|
| **ICP vs 覆盖索引** | ICP 概念错误 | 精确区分 | 背"ICP=索引外条件下推减少回表；覆盖索引=SELECT+WHERE 所有列在索引内不回表"，记经典例子 `name LIKE '张%' AND age=20` | 1 小时 |
| **CompletableFuture 三大要点** | 未掌握 | 能写代码模板 | 背 `supplyAsync(task, executor) + .orTimeout() + .exceptionally()`，写一个 BFF 8 并行降级 Demo | 2 小时 |
| **LinkedHashMap + LRU 手写** | 不了解+踩坑 | 两种方式都能手写 | 方式 A 背 3 技巧（Map 存 Node 引用/Node 存 key/哨兵节点）；方式 B 背 2 点（accessOrder=true + removeEldestEntry） | 1.5 小时 |
| **LinkedList.remove(Object) 是 O(N) 的坑** | 踩了 | 记住 | 背"LinkedList 的 remove(Object) 是 O(N)，因为要遍历找节点。所以 LRU 不能用 LinkedList+key，必须用 HashMap 存 Node 引用" | 0.5 小时 |
| **技术选型题三段论模板** | 没给结论 | 必给结论 | 背"对比维度→约束筛选→结论+Plan B"三段论，准备金句"成熟业务 Java 保稳定，探索业务 LangGraph 跑速度，MCP 打通" | 1 小时 |

### 中优先级（面试加分项）

| 知识点 | 当前水平 | 目标水平 | 学习方法 | 建议时长 |
|--------|---------|---------|---------|---------|
| **LLM 网关 5 大特色** | 讲成通用网关 | 能主动带出 | 背 5 大差异：SSE 流式 + Token 计算 + 上下文裁剪 + 语义缓存 + 模型降级 | 1 小时 |
| **LLM 限流 4 维度** | 只会厂商 QPS | 掌握 4 维度 | 背"厂商 QPS + TPM + 业务方优先级 + 单用户防刷"；金句"LLM 限流真正卡的是 token" | 1 小时 |
| **thenApply vs thenApplyAsync** | 方向对但核心偏 | 精确掌握 | 核心是"线程切换控制"不是"速度"；thenApply 可能复用主线程要警惕 | 0.5 小时 |
| **偏向锁禁用原因** | 不清楚 | 能答主要原因 | 背"撤销要 STW + 批量撤销更贵 + 现代应用都是多线程无收益 + 维护成本高" | 0.5 小时 |
| **Mark Word + JOL 工具** | 不熟 | 会用 | 用 JOL 跑一个 Demo 观察锁升级；背锁标志位 01/00/10/11 | 1 小时 |
| **InnoDB 辅助索引设计** | 不清楚 | 能讲清 | 背"存主键不存地址——应对行移动"；理解自增主键推荐理由 | 0.5 小时 |

### 低优先级（持续积累）

| 知识点 | 当前水平 | 目标水平 | 学习方法 | 建议时长 |
|--------|---------|---------|---------|---------|
| **LLM 网关容量评估** | 未提 | 能估算 | 背模板：QPS→并发连接→实例数→Redis 分片→Kafka 分区 | 1.5 小时 |
| **语义缓存设计** | 未了解 | 理解原理 | 向量化 query → Embedding → 相似度匹配缓存 Key | 1.5 小时 |
| **LeetCode 链表题** | LRU 通过 | 手写反转链表、合并 K 链表 | LeetCode 206/23 手写，对照 LRU 模式理解 | 2 小时 |
| **@Async 完整知识** | 部分了解 | 全面掌握 | @EnableAsync + 自定义线程池 + Future 返回值 + 异常处理 | 1 小时 |

---

## 📝 本次面试关键进步追踪

| 进步点 | 上次 | 本次 |
|--------|------|------|
| 系统设计主动讲分层 | ❌ 从未 | ✅ **首次主动** |
| 算法愿意写代码 | ❌ 拒绝写 | ✅ **主动写** |
| 项目层次清晰度 | ✅ 4.5/5 | ✅ 4.5/5 持续高水平 |
| 主动对比方案并讲坑 | ⚠️ 偶尔 | ✅ Redis vs 上下文主动讲坑 |

## 📝 新暴露薄弱点（优先学习）

1. **MySQL ICP** vs **覆盖索引** 概念混淆
2. **InnoDB 辅助索引存主键** 的设计原理不清楚
3. **CompletableFuture 三大要点** 仍未掌握（P1-10，持续暴露）
4. **`LinkedList.remove(Object)` O(N) 坑**
5. **LLM 网关特色设计**（流式 / 语义缓存 / Token 限流 / 模型降级）
6. **技术选型思辨题** 未给结论
7. **Mark Word + JOL 工具**不熟悉
8. **偏向锁禁用原理** 不清楚

---

> **下次面试建议重点验证 P0：ICP 概念、CompletableFuture 模板代码、LRU 手写方式 A、技术选型结论**
