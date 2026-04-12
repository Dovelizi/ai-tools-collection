# 面试题库

本题库基于候选人简历中的技术栈设计，按领域分类。每题包含：问题、追问方向、参考答案要点、评分标准。

---

## 一、Java 基础与 JVM

### 1.1 集合框架

**Q: HashMap 的底层数据结构是什么？put 操作的完整流程？**

追问方向：
- JDK 7 和 JDK 8 的区别（链表 vs 红黑树）
- 扩容机制和 rehash 过程
- 为什么线程不安全？如何保证线程安全？
- ConcurrentHashMap 的分段锁 vs CAS 实现

参考答案要点：
- 数组 + 链表 + 红黑树（JDK 8）
- hash 计算 → 取模定位桶 → 判空/hash碰撞 → 链表尾插/树化
- 负载因子 0.75，树化阈值 8，退化阈值 6
- resize 时的 2 倍扩容与高低位链拆分

评分标准：
- 3分：能说清基本结构和 put 流程
- 4分：能说清扩容机制和红黑树转化条件
- 5分：能对比 JDK 7/8 差异，理解并发问题和 ConcurrentHashMap

**Q: ArrayList 和 LinkedList 的区别？什么场景下选择哪个？**

追问方向：
- 时间复杂度对比
- 随机访问 vs 顺序访问
- 内存占用差异
- 实际项目中的选择

### 1.2 多线程与并发

**Q: synchronized 和 ReentrantLock 的区别？在你的项目中如何处理并发问题？**

追问方向：
- 锁升级过程（偏向锁 → 轻量级锁 → 重量级锁）
- AQS 原理
- volatile 的作用和与 synchronized 的区别
- 结合简历中"高并发系统优化经验"追问具体场景

参考答案要点：
- synchronized：JVM 内置，自动释放，可重入，非公平
- ReentrantLock：API 级别，手动释放，可中断，可公平/非公平，支持条件变量
- 锁升级：偏向锁（Mark Word 存线程 ID）→ 轻量级锁（CAS 自旋）→ 重量级锁（Monitor）
- AQS：CLH 队列 + state 状态 + CAS

**Q: 线程池的核心参数有哪些？如何合理配置？**

追问方向：
- 拒绝策略有哪些
- 核心线程数的经验公式（CPU密集 vs IO密集）
- 线程池的工作流程
- 结合项目中的实际使用场景

参考答案要点：
- 7 大参数：corePoolSize, maximumPoolSize, keepAliveTime, unit, workQueue, threadFactory, handler
- CPU 密集型：N+1；IO 密集型：2N 或根据等待比计算
- 工作流程：核心线程 → 队列 → 最大线程 → 拒绝策略
- 四种拒绝策略：Abort/Calller/Discard/DiscardOldest

### 1.3 JVM

**Q: 说说 JVM 的内存模型？如何排查线上 OOM 问题？**

追问方向：
- 堆/栈/方法区/本地方法栈/程序计数器
- GC 算法：标记清除、标记整理、复制算法
- 常用 GC 收集器：CMS、G1、ZGC 的区别和适用场景
- 实际的 OOM 排查经验（jmap、jstack、MAT）
- 结合简历中"JVM原理"追问实际调优经验

参考答案要点：
- 运行时数据区：堆（新生代+老年代）、方法区/元空间、虚拟机栈、本地方法栈、PC
- GC Roots：虚拟机栈引用、类静态属性、常量引用、JNI 引用
- G1：Region 分区、Mixed GC、可预测停顿
- OOM 排查：先看日志 → jmap dump → MAT 分析 → 定位泄漏对象

**Q: 反射机制在你的项目中有什么实际应用？性能开销如何优化？**

追问方向：
- 反射的原理
- Spring 中反射的应用
- 反射的性能问题和优化手段（缓存、MethodHandle、CGLib）

---

## 二、Spring 框架

### 2.1 IoC 与 Bean 生命周期

**Q: 你提到阅读过 Spring 源码，能说说 Spring IoC 容器的启动流程吗？**

追问方向：
- refresh() 方法的核心步骤
- BeanDefinition 的注册过程
- BeanFactoryPostProcessor 和 BeanPostProcessor 的区别
- FactoryBean 和 BeanFactory 的区别

参考答案要点：
- refresh() 12 步：准备上下文 → 创建 BeanFactory → 注册 BeanDefinition → 调用 BeanFactoryPostProcessor → 注册 BeanPostProcessor → 初始化事件广播器 → 注册监听器 → 实例化非懒加载单例 → 发布完成事件
- BeanFactoryPostProcessor：修改 BeanDefinition（如 PropertyPlaceholderConfigurer）
- BeanPostProcessor：在 Bean 初始化前后做增强（如 AOP 代理）

评分标准：
- 3分：能说清 IoC 是什么，Bean 的基本生命周期
- 4分：能说清 refresh 主要步骤，区分 PostProcessor
- 5分：能深入 refresh 细节，结合源码说明关键节点

**Q: Spring 如何解决循环依赖问题？三级缓存分别存什么？**

追问方向：
- 为什么需要三级缓存而不是两级
- 构造器注入的循环依赖能否解决
- 原型模式的循环依赖能否解决
- @Lazy 注解的作用

参考答案要点：
- 一级缓存 singletonObjects：完整 Bean
- 二级缓存 earlySingletonObjects：早期引用（可能是代理）
- 三级缓存 singletonFactories：ObjectFactory Lambda
- 三级缓存的作用：延迟 AOP 代理创建，保证代理对象唯一性
- 构造器注入无法解决（对象还没创建，无法暴露早期引用）

### 2.2 AOP

**Q: Spring AOP 的实现原理？JDK 动态代理和 CGLIB 的区别？**

追问方向：
- 代理对象的创建时机
- AspectJ 和 Spring AOP 的区别
- 在你的项目中 AOP 的实际应用（如鉴权、日志）

### 2.3 Spring Boot

**Q: Spring Boot 自动配置的原理是什么？@SpringBootApplication 做了什么？**

追问方向：
- @EnableAutoConfiguration 的作用
- spring.factories / META-INF/spring/xxx.imports 的加载机制
- 条件注解：@ConditionalOnClass、@ConditionalOnMissingBean
- 如何自定义 Starter

---

## 三、中间件与数据存储

### 3.1 RocketMQ / Kafka

**Q: 你在卡单方案中用到了"分段延迟消息"，能详细说说这个方案的设计吗？**

追问方向：
- RocketMQ 延迟消息的实现原理
- 为什么选择分段延迟而不是定时任务
- 消息丢失如何保障（生产者确认、Broker 刷盘、消费者幂等）
- 消息堆积如何处理
- 结合简历中"日均30万+发单"的规模追问容量评估

参考答案要点：
- 延迟消息：投递到 SCHEDULE_TOPIC_XXXX → 定时扫描 → 投递到目标 Topic
- 分段延迟策略：根据里程动态调整轮询间隔，短途5min一次，长途15min
- 可靠性保障：同步刷盘 + 主从同步 + 消费端幂等（唯一键去重）
- 消息堆积：扩容消费者、降级非核心消费、临时 Topic 转储

**Q: RocketMQ 和 Kafka 的区别？在什么场景下选择哪个？**

追问方向：
- 架构差异（NameServer vs ZooKeeper）
- 消息模型（推/拉模式）
- 事务消息的支持
- 在你的项目中为什么选择 RocketMQ

### 3.2 Redis

**Q: 你在 MCP 化项目中设计了 Redis 缓存透传机制，能详细讲讲吗？**

追问方向：
- estimateId 是怎么设计的？怎么保证唯一性？
- 缓存过期策略怎么定的？
- 缓存穿透、缓存击穿、缓存雪崩怎么防？
- Redis 的数据结构选择理由

参考答案要点：
- 缓存穿透：布隆过滤器 / 缓存空值
- 缓存击穿：互斥锁 / 逻辑过期
- 缓存雪崩：过期时间随机 / 集群高可用
- 数据一致性：Cache Aside / 延迟双删

**Q: Redis 的持久化方案？如何选择 RDB 和 AOF？**

追问方向：
- RDB 和 AOF 的优缺点
- 混合持久化
- Redis 集群方案（哨兵 vs Cluster）

### 3.3 MySQL

**Q: 你提到 MySQL 分库分表经验，能说说具体方案和分片策略吗？**

追问方向：
- 水平分片 vs 垂直分片
- 分片键的选择
- 分布式事务怎么处理
- 跨分片查询怎么解决
- 使用了什么中间件（ShardingSphere / MyCat）

**Q: 一条慢 SQL 你会怎么排查和优化？**

追问方向：
- EXPLAIN 各字段含义
- 索引优化：覆盖索引、最左前缀
- 结合项目中实际的 SQL 调优经验

参考答案要点：
- 排查路径：慢查询日志 → EXPLAIN → Profile → 优化
- EXPLAIN 关注：type（ALL/index/range/ref/const）、Extra（Using filesort/Using temporary）
- 索引优化：联合索引顺序、覆盖索引避免回表、避免索引失效

### 3.4 Elasticsearch

**Q: 你做过 ES 与 DB 数据同步，能说说同步方案的设计？如何保证一致性？**

追问方向：
- 全量同步 vs 增量同步
- 同步延迟如何降低
- 异常补偿机制
- 结合简历中"一致性从95%提升至99.9%"追问具体做了什么

参考答案要点：
- 增量同步方案：Binlog → Canal → MQ → ES
- 异常补偿：定时对账 + 手动修复接口
- 写入优化：Bulk API 批量写入、合理设置 refresh_interval
- 查询优化：合理的 mapping 设计、分片数规划

---

## 四、项目经验深入

### 4.1 顺风车 MCP 化 Agent 出行

**Q: 你主导的 MCP 化方案是怎么设计的？为什么选择 BFF + MCP 的架构？**

追问方向：
- MCP 协议的核心概念（Resource / Tool / Prompt）
- 6 个 MCP 接口的具体设计（询价、下单、查单、取消、重发单等）
- BFF 层并行编排的实现（CompletableFuture？响应式？）
- Agent 侧只需 1 个 ID 下单，是怎么做到上下文串联的
- 多端入口（微信、手图）的适配策略
- 和传统 RESTful API 的对比优势

评分标准：
- 3分：能说清 MCP 的基本概念和整体架构
- 4分：能说清 BFF 编排细节和缓存透传设计
- 5分：能从架构演进角度说明为什么这样设计，以及可复用的范式价值

### 4.2 卡单能力建设

**Q: "分段延迟消息 + 里程动态延迟 + 主动轮询双通道"这个方案具体怎么实现的？**

追问方向：
- 为什么要设计双通道（消息 + 轮询）
- 里程动态延迟的策略是怎么计算的
- 4家服务商的异构状态映射怎么做的（适配器模式？策略模式？）
- 一致性从 80% 到 95% 具体做了哪些改进
- 订单状态/高速费/违约金三维度各自的同步策略
- 异常情况的兜底方案

### 4.3 CosyVoice TTS 集成

**Q: CosyVoice TTS 在外呼场景的集成方案是怎么做的？日均百万通的性能如何保障？**

追问方向：
- TTS 服务的调用方式（同步/异步/预生成）
- 音频缓存策略
- 高并发下的降级方案
- MOS 评分 4.2+ 是怎么评估的
- 与传统 TTS 的对比

### 4.4 鉴权工具建设

**Q: 域内鉴权工具从 0 到 1 是怎么设计的？细粒度接口级鉴权怎么实现？**

追问方向：
- 权限模型：RBAC？ABAC？
- 50+ 核心接口的鉴权粒度
- 权限变更从小时级到分钟级怎么做到的
- 与 Spring Security 的关系
- 动态权限加载机制

---

## 五、系统设计

### 5.1 订单状态同步系统

**Q: 设计一个日均 30 万+的订单状态同步系统，你会怎么设计？**

考察要点：
- 整体架构分层
- 消息队列选型与使用
- 状态机设计
- 幂等性保障
- 异常处理与兜底
- 监控告警
- 容量评估

### 5.2 多服务商聚合架构

**Q: 设计一个聚合多服务商的 BFF 层，支持动态扩展新服务商，你会怎么做？**

考察要点：
- 抽象层设计（统一接口 + 适配器）
- 并行调用与超时控制
- 降级与熔断策略
- 路由与负载均衡
- 监控与可观测性

---

## 六、AI 与 Agent

### 6.1 MCP 协议

**Q: 对 MCP 协议的理解？它和传统 API 有什么本质区别？**

追问方向：
- MCP 的 Tool / Resource / Prompt 三要素
- MCP 在 Agent 架构中的定位
- 你在项目中如何封装 MCP 接口
- MCP 的局限性和未来发展

### 6.2 Agent 架构

**Q: 你对 Agent 架构有什么理解？在出行场景中 Agent 和传统应用的区别是什么？**

追问方向：
- Agent 的核心能力（规划、工具调用、记忆）
- Skills 的概念
- 多 Agent 协作
- Agent 的可靠性和安全性

### 6.3 Prompt Engineering

**Q: 在实际项目中，Prompt 的设计和调优你是怎么做的？**

追问方向：
- Prompt 模板化的实践
- Few-shot 和 Chain-of-Thought 的应用
- Prompt 的版本管理和 A/B 测试
- 降低幻觉的策略

### 6.4 AI 工程化

**Q: AI 能力落地到生产环境，和传统后端服务有什么不同的挑战？**

追问方向：
- 延迟和成本控制
- 输出的不确定性处理
- 评估体系建设
- 灰度发布和回滚策略
