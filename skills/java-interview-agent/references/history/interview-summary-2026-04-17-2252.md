# 模拟面试总结报告

> 面试时间：2026-04-17 22:52
> 面试方向：Java 后端开发
> 总体评级：良好

---

## 一、面试内容回顾

### 1.1 Java 基础与 JVM

**Q1: Java 反射的性能开销主要体现在哪些方面？在你的项目中有没有遇到过反射带来的性能问题？Spring 框架大量使用反射，为什么在实际项目中我们感受不到明显的性能瓶颈？**

📝 **参考答案（完整版）**：

**反射的性能开销主要体现在三个方面：**

1. **安全检查开销**：每次反射调用都要做访问权限检查（`setAccessible(true)` 可以跳过，但有安全风险）
2. **无法 JIT 优化**：正常方法调用可以被 JVM 内联优化，但反射调用是动态解析的，JIT 编译器很难优化
3. **装箱拆箱**：反射调用参数和返回值都是 Object 类型，基本类型需要频繁装箱拆箱

**补充开销：**
- 方法/字段查找：`Class.getMethod()` 需要遍历方法列表匹配，比直接调用慢
- 无法编译期检查：错误延迟到运行时，增加排查成本

**Spring 为什么感受不到性能问题？**

关键不是动态代理，而是 Spring 在**启动阶段**集中做反射（Bean 实例化、依赖注入、AOP 代理创建），运行时调用的是已经创建好的代理对象和缓存好的 Method 对象，**热路径上几乎不走反射**。

具体优化手段：
- **Method 缓存**：`CachedIntrospectionResults` 缓存 BeanInfo，避免重复反射
- **CGLIB 代理**：运行时生成子类字节码，后续调用走正常方法调用，不走反射
- **Bean 单例**：默认 singleton，反射创建只发生一次

一句话总结：**"启动时慢一点做反射，运行时不受影响"**

👤 **候选人回答**：
- 说反射性能开销主要在"反射对象的实例化阶段"——不够准确
- 提到 Spring 用 CGLIB 动态代理——方向沾边但不是核心原因
- 将 Spring 性能优化归因于"根据不同类和属性动态代理反射来优化性能"——表述模糊

📊 **评价**：⚠️ 方向有感觉但核心原因不准确。反射开销的三个核心点（安全检查/JIT/装箱）都没提到。Spring 不卡的原因是"启动时反射运行时缓存"，不是动态代理本身。

💡 **面试官补充讲解**：纠正了反射三大开销，强调了 Spring "启动时反射+运行时缓存" 的核心优化策略。

---

### 1.2 中间件与数据存储

**Q2: RocketMQ 的延迟消息是怎么实现的？RocketMQ 原生支持的延迟级别能满足需求吗？如果需要任意时间的精确延迟，怎么实现？**

📝 **参考答案（完整版）**：

**固定级别延迟（RocketMQ 4.x）：**
- 18 个级别：`1s 5s 10s 30s 1m 2m 3m 4m 5m 6m 7m 8m 9m 10m 20m 30m 1h 2h`
- 原理：消息投递到内部 `SCHEDULE_TOPIC_XXXX`，每个延迟级别对应一个 Queue
- 定时任务（ScheduleMessageService）按级别扫描到期消息，投递到真实 Topic

**任意时间延迟（RocketMQ 5.x）：**
- 基于 **TimerWheel + TimerLog** 实现
- TimerLog：顺序追加写入，记录延迟消息的元数据（投递时间、原 Topic 等）
- TimerWheel：时间轮索引结构，每个 slot 存储 TimerLog 的偏移量链表
- 到期时：通过 TimerWheel slot → TimerLog 偏移量 → 读取消息 → 投递到真实 Topic
- 支持任意秒级精度的延迟时间

**经典时间轮机制（通用知识）：**
- 环形数组，每个 slot 代表一个时间刻度
- 指针每秒前进一格，执行当前 slot 上的所有任务
- 超过一圈的任务通过"圈数"字段控制，圈数减到 0 时才执行（多层时间轮）

👤 **候选人回答**：
- 固定级别延迟：知道有 18 段，投递到内部延迟 Topic，定时任务扫描消费 ✅
- 知道固定级别不满足任意时间要求 ✅
- 时间轮机制：描述了时间轮基本原理——每秒扫描 slot、按 key 取消息、超过一圈用圈数扣减 ✅
- 细节比较到位，圈数扣减机制讲清了

📊 **评价**：✅ 回答质量不错。两种实现机制都有了解，时间轮的圈数扣减细节讲得清楚。可补充 RocketMQ 5.x 具体是 TimerWheel + TimerLog 的组合（不完全是经典时间轮）。

💡 **面试官补充讲解**：补充了 RocketMQ 5.x 的 TimerWheel + TimerLog 具体实现，区分于经典时间轮。

---

### 1.3 Spring 框架

**Q3: 假设 Service 类方法 A 调用同类方法 B，方法 B 标注了 @Async 但没有异步执行。为什么？怎么解决？和 @Transactional 失效有什么共同点？**

📝 **参考答案（完整版）**：

**根因：同类自调用绕过代理对象**

`@Async`、`@Transactional`、`@Cacheable` 等注解本质都是通过 AOP 代理实现的。`this.methodB()` 是直接调用目标对象的方法，绕过了代理对象，所以所有基于 AOP 的注解在同类自调用时都会失效。

**三种解决方案：**

1. **拆分到不同类**（最推荐）：将 methodB 移到另一个 Service 中，通过依赖注入调用
2. **注入自身**：`@Autowired private MyService self;` 然后用 `self.methodB()` 调用
3. **AopContext.currentProxy()**：`((MyService) AopContext.currentProxy()).methodB()`，需要 `@EnableAspectJAutoProxy(exposeProxy = true)`

**@Async 和 @Transactional 的共同点：**
- 都基于 AOP 代理实现
- 都在同类自调用时失效
- 都可以通过上述三种方案解决
- 都要求方法是 public（Spring AOP 限制）

**@Async 特有注意点：**
- 需要 `@EnableAsync` 开启
- 建议配置自定义线程池（避免默认的 SimpleAsyncTaskExecutor 每次创建新线程）
- 返回值需要用 `Future`/`CompletableFuture` 包装

👤 **候选人回答**：
- 核心原因准确：同类自调用拿不到代理对象，导致 @Async 失效 ✅
- 解决方案：拆分到不同类 ✅
- 与 @Transactional 的共同点：都基于 AOP，自调用都会失效 ✅
- 没有提到"注入自身"和"AopContext.currentProxy()"另外两种方案

📊 **评价**：✅ 核心原因一针见血，能主动关联 @Transactional 的同类问题，说明对 AOP 代理机制的理解在体系化。解决方案只说了一种（拆分），建议补充另外两种。

💡 **面试官补充讲解**：补充了注入自身和 AopContext.currentProxy() 两种方案。

---

### 1.4 项目经验深入

**Q4: CosyVoice 大模型 TTS 语音生成服务——推理延迟多少？外呼场景实时性要求？最大技术挑战？怎么保证高并发下模型推理不成为瓶颈？**

📝 **参考答案（面试官视角）**：

**候选人的完整方案（非常清晰）：**

```
推理延迟：10-20 个字的文本 → 约 2 秒生成语音
实时性要求：不高（预生成策略，非实时合成）

架构设计：
任务导入（200万名单）
    → 按任务解析话术流程涉及的所有语音
    → 按不同音色/内容预生成 TTS（异步批量）
    → 全部语音就绪后 → 开始外呼

三大挑战及解决方案：

1. 异步并发生成 + QPS 管控
   - MQ 异步削峰
   - Redis 滑动窗口严格控制 QPS（阿里限制 100→后扩到 300）
   - 实际控流到 280 留 buffer，防止超限导致生成失败

2. 文件上传瓶颈
   - 生成后上传到 NAS
   - 高并发上传失败 → 指数退避重试
   - 重试日志记录，便于排查

3. 多音色多话术差异化
   - 每个任务对应不同音色和话术内容
   - 需要按任务维度差异化生成
```

👤 **候选人回答**：
- 推理延迟 2 秒（10-20字）✅
- 预生成策略（非实时）✅——架构决策清晰合理
- QPS 管控：从 100 扩到 300，实际控流 280 留 buffer ✅——有实战深度
- MQ 削峰 + Redis 滑动窗口限流 ✅
- 文件上传失败：指数退避重试 + 日志记录 ✅
- 多任务差异化（音色/内容不同）✅

📊 **评价**：✅ **本次面试最大亮点之一**。预生成策略、QPS 精细管控（280/300 留 buffer）、MQ+Redis 组合限流、指数退避重试，展现了完整的大模型工程化落地能力。

💡 **面试官补充讲解**：建议面试时用结构化表达——"三大挑战：异步编排、QPS 管控、失败兜底"，先总后分，面试官更容易跟上。

---

**Q5: BFF 聚合层并行编排 8 项能力，某一项超时怎么处理？降级策略是什么？用什么技术实现并行编排？**

📝 **参考答案（面试官视角）**：

**候选人的分级降级策略：**

```
非核心能力（逆地址解析、POI 消歧等）：
    → 超时/失败 → 返回兜底文案 → 让模型重新决策 → 用户重新操作

核心能力（下单、支付等）：
    → 超时/失败 → 严格返回错误原因 → 用户重新操作

并行编排技术：CompletableFuture
```

**CompletableFuture 并行编排三大要点（面试加分项）：**

1. **自定义线程池**：`supplyAsync(task, customExecutor)`，不用默认的 ForkJoinPool
2. **超时控制**：`orTimeout(2, TimeUnit.SECONDS)` 或 `allOf().get(3, SECONDS)`
3. **单个降级**：`exceptionally(e -> defaultValue)`，单个失败不影响其他

```java
CompletableFuture<Address> geoFuture = CompletableFuture
    .supplyAsync(() -> geoService.resolve(poi), executor)
    .orTimeout(2, TimeUnit.SECONDS)
    .exceptionally(e -> Address.defaultValue());
```

👤 **候选人回答**：
- 按接口重要程度区分降级策略 ✅——非核心返回兜底，核心严格报错
- 使用 CompletableFuture 做并行编排 ✅
- 没有提到自定义线程池、超时控制、单个降级的具体实现

📊 **评价**：⚠️ 降级策略设计合理，CompletableFuture 方向正确。但缺少三个关键实现细节：自定义线程池（避免 ForkJoinPool 共享）、超时控制、单个 exceptionally 降级。

💡 **面试官补充讲解**：补充了 CompletableFuture 三大要点（自定义线程池 + 超时 + 单个降级），给出代码示例。

---

### 1.5 系统设计

**Q6: 设计一个分布式任务调度系统（支持定时/延迟任务，日均 500 万次调度，不丢失不重复，失败重试，动态增删改）**

📝 **参考答案（完整版）**：

**四层架构：**

```
┌─────────────────────────────────────────────────┐
│                  管理层（API + 控制台）             │
│   任务 CRUD / Cron 表达式配置 / 执行日志查看        │
├─────────────────────────────────────────────────┤
│                  调度层（Scheduler）               │
│   时间轮扫描到期任务 → 分片策略选择执行节点          │
│   分布式锁防重复调度 / 主从选举保证只有一个调度器     │
├─────────────────────────────────────────────────┤
│                  执行层（Worker 集群）              │
│   拉取任务 → 执行 → 上报结果                       │
│   失败重试（指数退避）→ 超时取消 → 日志记录          │
├─────────────────────────────────────────────────┤
│                  存储层                            │
│   MySQL：任务元数据 + 执行日志（分库分表）           │
│   Redis：时间轮索引 + 分布式锁 + 任务状态缓存       │
│   MQ：失败重试队列 + 任务分发（削峰）               │
└─────────────────────────────────────────────────┘
```

**关键设计：**

1. **定时/延迟任务**：时间轮（TimerWheel）扫描到期任务
2. **不丢失**：任务元数据持久化 MySQL + 执行状态严格记录
3. **不重复**：分布式锁（Redis）保证同一任务只被一个 Worker 执行
4. **调度器高可用**：基于 ZooKeeper/Redis 的 Leader Election，只有一个调度器在扫描
5. **分片策略**：按 taskId 哈希分配到不同 Worker 节点
6. **失败重试**：MQ 重试队列 + 指数退避 + 最大重试次数 + 失败落库
7. **超时监控**：超时扫描线程定期检查执行中但超时的任务
8. **动态增删改**：每次执行前检查任务状态，已删除/停用则跳过
9. **容量评估**：500 万/天 ≈ 峰值 QPS 约 200-300，MySQL 分库分表 + Redis 能扛

👤 **候选人回答**：
- 参照 XxlJob 核心思想 ✅
- 时间轮调度 ✅（结合 RocketMQ 5.0 的 TimerLog + 时间轮）
- 分库分表 + Redis 存储 ✅
- 分布式锁防重复执行 ✅
- MQ 重试 + 指数退避 + 重试次数限制 + 失败落库 ✅
- 动态增删改：执行前检查任务状态 ✅
- 缺少：清晰的分层架构、调度器高可用（Leader Election）、分片策略、容量评估、超时监控

📊 **评价**：⚠️ 核心模块都提到了，思路正确。但回答偏散，缺少清晰的分层架构表达。关键缺失：调度器高可用（谁来触发任务？）、分片策略（500 万任务怎么分配到多台 Worker？）、容量评估。

💡 **面试官补充讲解**：给出了四层架构图，补充了 Leader Election、分片策略、容量评估和超时监控。强调系统设计要"先画分层架构再逐层展开"。

---

### 1.6 AI / Agent

**Q7: 用户表达复合意图（"查价+条件判断+下单"），是模型自主 Plan 串联 Tool，还是 BFF 层流程编排？各自优缺点？实际选了哪种？**

📝 **参考答案（完整版）**：

**两种编排方案对比：**

| 维度 | 方案一：模型自主 Plan | 方案二：Prompt/BFF 硬编排 |
|------|------|------|
| 灵活性 | ✅ 高，模型自主拆解意图 | ❌ 低，非预期流程会失败 |
| 可控性 | ⚠️ 模型可能调错 Tool | ✅ 高，流程确定性强 |
| 适用场景 | 开放式对话、复合意图 | 流程固定的标准化场景 |
| 成本 | 多轮 LLM 调用，Token 高 | 单次调用，成本低 |

**最佳实践（候选人的方案）：**
- 选择模型自主 Plan（Router Agent → 子 Agent 分发）
- 中间状态（estimateId、价格等）存 Redis，Key 传递到下一节点
- 每个 Tool 内部前置校验必要参数，防止模型跳步
- "最小粒度人工干预 + 最大程度动态化"

**安全卡点设计：**
- Tool 内部前置校验（没有 estimateId 就不能下单）
- 不依赖模型的调用顺序，而是在 Tool 层做硬校验

👤 **候选人回答**：
- 方案选择：模型自主 Plan（Router Agent → 子 Agent 分发）✅
- 模型分解意图 → 按顺序编排 → 并发调用 Agent → 组装结果 ✅
- Prompt 硬编排的缺点：非预期流程（B→A→C→D）会失效 ✅——有实际踩坑经验
- Redis 存中间状态 + Key 传递到下一节点 ✅
- 每个 Tool 前置校验必要参数，防止模型幻觉 ✅
- "最小粒度人工干预 + 最大程度动态化" ✅——表述精炼

📊 **评价**：✅ 回答质量高。两种方案的优缺点对比清晰，实际方案选择合理，防幻觉的 Tool 内部校验是正确做法，"最小干预最大动态化"表述精炼有亮点。

💡 **面试官补充讲解**：建议补充安全卡点的更多细节（如频次限制、用户确认卡点），以及 Token 成本优化策略。

---

### 1.7 算法与编程

**Q8: LeetCode 146. LRU 缓存（Medium）**

📝 **参考答案（完整版）**：

**题目**：设计 LRU 缓存，支持 O(1) 的 get 和 put。

**核心数据结构：HashMap + 双向链表**

- HashMap：key → Node，O(1) 查找
- 双向链表：维护访问顺序，头部是最近使用的，尾部是最久未使用的

**手写实现：**

```java
class LRUCache {
    class Node {
        int key, value;
        Node prev, next;
        Node(int k, int v) { key = k; value = v; }
    }
    
    private Map<Integer, Node> map = new HashMap<>();
    private Node head = new Node(0, 0); // 哨兵头
    private Node tail = new Node(0, 0); // 哨兵尾
    private int capacity;
    
    public LRUCache(int capacity) {
        this.capacity = capacity;
        head.next = tail;
        tail.prev = head;
    }
    
    public int get(int key) {
        if (!map.containsKey(key)) return -1;
        Node node = map.get(key);
        removeNode(node);
        addToHead(node);
        return node.value;
    }
    
    public void put(int key, int value) {
        if (map.containsKey(key)) {
            Node node = map.get(key);
            node.value = value;
            removeNode(node);
            addToHead(node);
        } else {
            Node node = new Node(key, value);
            map.put(key, node);
            addToHead(node);
            if (map.size() > capacity) {
                Node lru = tail.prev;
                removeNode(lru);
                map.remove(lru.key);
            }
        }
    }
    
    private void removeNode(Node node) {
        node.prev.next = node.next;
        node.next.prev = node.prev;
    }
    
    private void addToHead(Node node) {
        node.next = head.next;
        node.prev = head;
        head.next.prev = node;
        head.next = node;
    }
}
```

**LinkedHashMap 快捷实现（加分项）：**

```java
class LRUCache extends LinkedHashMap<Integer, Integer> {
    private int capacity;
    
    public LRUCache(int capacity) {
        super(capacity, 0.75f, true); // accessOrder=true
        this.capacity = capacity;
    }
    
    public int get(int key) {
        return super.getOrDefault(key, -1);
    }
    
    @Override
    protected boolean removeEldestEntry(Map.Entry<Integer, Integer> eldest) {
        return size() > capacity;
    }
}
```

**复杂度分析：**
- 时间复杂度：get 和 put 均为 O(1)
- 空间复杂度：O(capacity)

👤 **候选人回答**：
- 数据结构选择正确：HashMap + 双向链表 ✅
- get 逻辑正确：查到移到头部，查不到返回 -1 ✅
- put 逻辑正确：已存在更新+移到头部，不存在插入头部+超容量删尾部 ✅
- 知道是 O(1) 时间复杂度 ✅
- 没有写代码（说之前写过）
- 不了解 LinkedHashMap 快捷实现

📊 **评价**：⚠️ 思路和逻辑完全正确，说明理解了 LRU 的核心原理。但面试时拒绝写代码会被扣分（即使之前写过），且 LinkedHashMap 是常见追问点需要掌握。比前几次算法题（岛屿数量用滑动窗口、LCA 无法写代码）有明显进步。

💡 **面试官补充讲解**：给出了手写版完整代码和 LinkedHashMap 快捷实现。强调 `accessOrder=true` + `removeEldestEntry()` 是核心。

---

## 二、面试评价

### 各维度评分（满分 5 分）

| 维度 | 评分 | 评语 |
|------|------|------|
| Java 基础 | 2.5/5 | 反射性能开销核心原因不准确（说成"实例化阶段耗性能"），缺少安全检查/JIT/装箱三个核心点 |
| 框架理解 | 4/5 | @Async 自调用失效原因和解决方案答得准确，能关联 @Transactional 同类问题，AOP 代理机制理解到位 |
| 中间件与存储 | 4/5 | RocketMQ 延迟消息两种实现（固定级别 + 时间轮）都有了解，时间轮机制描述基本准确 |
| 项目深度 | 4.5/5 | **最大亮点**。CosyVoice 工程化三大挑战清晰，BFF 降级策略合理，Redis 缓存透传+Tool 前置校验 |
| 系统设计 | 3/5 | 核心模块都提到了（时间轮/分布式锁/MQ重试），但缺少清晰分层架构、调度器高可用、分片策略、容量评估 |
| AI / Agent | 4/5 | 模型自主 Plan vs Prompt 硬编排对比清晰，防幻觉的 Tool 内部校验思路正确，"最小干预最大动态化"精炼 |
| 算法与编程 | 3.5/5 | LRU 思路和逻辑完全正确（HashMap+双向链表），比前几次算法有进步，但未写代码且不了解 LinkedHashMap |
| 表达与沟通 | 3.5/5 | 项目讲述有深度（CosyVoice 最佳），但基础知识回答组织偏散，建议先总后分 |

### 与历史面试对比

| 维度 | 04-12 | 04-13 | 04-14 | 04-15(1) | 04-15(2) | 04-16 | 04-17(本次) | 趋势 |
|------|-------|-------|-------|----------|----------|-------|------------|------|
| Java 基础 | 3/5 | 2/5 | 3.5/5 | 3.5/5 | 2.5/5 | 2.5/5 | 2.5/5 | ➡️ 新题型暴露新薄弱点（反射） |
| 框架理解 | 3.5/5 | 3.5/5 | 3/5 | 3/5 | 3.5/5 | 3.5/5 | **4/5** | 📈 AOP 代理理解体系化 |
| 中间件与存储 | 3.5/5 | 2.5/5 | 3.5/5 | 4/5 | 2.5/5 | 3/5 | **4/5** | 📈 延迟消息原理掌握扎实 |
| 项目深度 | 4.5/5 | 4.5/5 | 4.5/5 | 4.5/5 | 4.5/5 | 4.5/5 | 4.5/5 | ➡️ 稳定高水平 |
| 系统设计 | 3.5/5 | 3.5/5 | 3.5/5 | 4/5 | 3.5/5 | 3/5 | 3/5 | ➡️ 仍缺分层架构和生产级能力 |
| AI / Agent | 3/5 | 3.5/5 | 4/5 | 3.5/5 | 4.5/5 | 3.5/5 | **4/5** | 📈 编排方案对比成熟 |
| 算法与编程 | - | 3.5/5 | 3/5 | 2.5/5 | 2.5/5 | 2/5 | **3.5/5** | 📈 LRU 思路正确，明显回升 |
| 表达与沟通 | 3.5/5 | 3.5/5 | 4/5 | 3.5/5 | 4/5 | 4/5 | 3.5/5 | ➡️ 项目好，基础偏散 |

### 亮点
- **CosyVoice 工程化是本次最大亮点**：预生成策略、QPS 从 100→300 扩容、Redis 滑动窗口限流到 280 留 buffer、指数退避重试，完整的大模型工程化落地能力
- **AOP 代理理解体系化**：@Async 自调用一针见血，主动关联 @Transactional，说明对代理机制的理解在加深
- **RocketMQ 延迟消息**两种实现讲得清楚，时间轮圈数扣减细节有深度
- **AI Agent 编排方案**对比清晰，防幻觉的 Tool 前置校验+Redis 状态透传设计成熟
- **算法明显回升**：LRU 思路和逻辑完全正确，比前几次（岛屿用滑动窗口、LCA 无法写码）进步显著

### 待改进
- **Java 反射性能开销**：记住三个核心原因——安全检查、无法 JIT 优化、装箱拆箱；Spring "启动时反射运行时缓存"
- **系统设计分层架构**：养成"管理层→调度层→执行层→存储层"的四层模板，先画架构再展开
- **系统设计生产级能力**：结尾必补——调度器高可用（Leader Election）、分片策略、容量评估、监控告警
- **LinkedHashMap 实现 LRU**：`accessOrder=true` + 重写 `removeEldestEntry()`，不到 15 行代码
- **CompletableFuture 三大要点**：自定义线程池 + 超时控制 + 单个降级，面试时主动带出来
- **回答结构化**：基础知识用"一二三"列点，项目用"先总后分"，避免散乱

---

## 三、后续学习计划

### 高优先级（面试高频 + 当前薄弱）

| 知识点 | 当前水平 | 目标水平 | 学习方法 | 建议时长 |
|--------|---------|---------|---------|---------|
| Java 反射性能开销 | 核心原因不准确 | 能说出三个核心点 | 背"安全检查/无法 JIT/装箱拆箱"三大开销 + Spring "启动时反射运行时缓存"优化策略 | 0.5 小时 |
| 系统设计分层模板 | 核心模块到位但散乱 | 能画清晰四层架构 | 默写"管理层→调度层→执行层→存储层"模板，每次练习系统设计先画分层再展开 | 2 小时 |
| 系统设计生产级能力 | 提到幂等和重试 | 能说完整五件套 | 背"限流+熔断+幂等+监控告警+容量评估"，每次系统设计结尾必补。补充：调度器高可用（Leader Election）、分片策略 | 1 小时 |
| LinkedHashMap 实现 LRU | 不了解 | 能手写代码 | 记住 `accessOrder=true` + 重写 `removeEldestEntry()`，对照 LinkedHashMap 源码理解双向链表维护 | 1 小时 |

### 中优先级（面试常考 + 需要巩固）

| 知识点 | 当前水平 | 目标水平 | 学习方法 | 建议时长 |
|--------|---------|---------|---------|---------|
| CompletableFuture 三大要点 | 知道用法 | 能说出三大要点+写代码 | 自定义线程池 + orTimeout 超时 + exceptionally 单个降级，写一个模拟 BFF 并行调用的 Demo | 1.5 小时 |
| @Async 注解完整知识 | 核心原因对 | 全面掌握 | 补充 @EnableAsync、自定义线程池配置、Future 返回值、异常处理 | 1 小时 |
| RocketMQ 5.x TimerWheel+TimerLog | 时间轮基本对 | 精确区分 | 区分经典时间轮 vs RocketMQ 5.x 的 TimerWheel+TimerLog 实现，理解 TimerLog 顺序写+TimerWheel 索引 | 1 小时 |
| Spring 反射优化机制 | 方向模糊 | 精确掌握 | 了解 CachedIntrospectionResults 缓存、CGLIB 字节码生成、Bean 单例只反射一次 | 1 小时 |

### 低优先级（加分项 + 持续积累）

| 知识点 | 当前水平 | 目标水平 | 学习方法 | 建议时长 |
|--------|---------|---------|---------|---------|
| 分布式调度系统设计深入 | 了解框架 | 能讲清细节 | 学习 XxlJob/Elastic-Job 源码中的分片算法、Leader Election 实现、任务重试策略 | 3 小时 |
| Agent Token 成本优化 | 有方案 | 能讲清策略 | estimateId 减少上下文、System Prompt 精简、多轮对话历史裁剪策略 | 1 小时 |
| LeetCode Hot 100 高频题 | LRU 思路对 | 能手写 | 继续按类型刷：链表（LRU/反转/合并）、哈希表（两数之和）、双指针（三数之和）| 持续练习 |
