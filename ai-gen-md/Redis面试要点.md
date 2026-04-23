# Redis 面试要点（互联网大厂高频题）

> 汇总 BAT、字节、美团、京东、蚂蚁、拼多多、滴滴等互联网公司后端岗位高频 Redis 面试题，按主题分类，提供**答题框架 + 踩坑点 + 加分项**。与《Redis 重点知识总结》配套食用。

---

## 面试考察地图

| 主题 | 高频度 | 难度 | 典型问法 |
|------|--------|------|---------|
| 数据类型与底层结构 | ⭐⭐⭐⭐⭐ | 中 | ZSet 底层？skiplist vs 红黑树？ |
| 单线程 & 6.0 多线程 | ⭐⭐⭐⭐⭐ | 中 | 为什么单线程快？6.0 改了啥？ |
| 持久化 | ⭐⭐⭐⭐⭐ | 高 | RDB/AOF 对比？fork 阻塞？混合持久化？ |
| 过期 & 淘汰 | ⭐⭐⭐⭐⭐ | 中 | 过期怎么删？8 种淘汰策略？ |
| 主从 / 哨兵 / 集群 | ⭐⭐⭐⭐⭐ | 高 | PSYNC？脑裂？16384 槽？ |
| 缓存三大问题 | ⭐⭐⭐⭐⭐ | 中 | 穿透/击穿/雪崩？ |
| 缓存一致性 | ⭐⭐⭐⭐⭐ | 高 | Cache Aside？延时双删？Canal？ |
| 分布式锁 | ⭐⭐⭐⭐⭐ | 高 | SETNX 的坑？Redlock？Redisson？ |
| BigKey / HotKey | ⭐⭐⭐⭐ | 中 | 如何排查？如何优化？ |
| 事务 | ⭐⭐⭐ | 低 | Redis 事务为什么不回滚？ |

---

## 一、基础概念

### Q1: Redis 为什么这么快？

**答题框架**：
1. **纯内存**：RAM 随机访问纳秒级。
2. **单线程**：避免锁竞争和上下文切换（6.0 前命令执行线程）。
3. **IO 多路复用**：epoll/kqueue，一线程处理海量连接。
4. **高效数据结构**：SDS、skiplist、hashtable、ziplist/listpack 等。
5. **C 语言实现**，性能高。

**加分**：
- 6.0 引入 IO 多线程处理网络读写、协议解析，但**命令执行仍单线程**。
- 对比 Memcached：Memcached 多线程，但数据结构单一（仅 K-V），无持久化。

### Q2: Redis 6.0 多线程，具体多线程了什么？

- 多线程只应用于 **网络 IO 读写 + RESP 协议解析**。
- 命令执行仍是单线程（避免复杂同步）。
- 启用方式：
  ```
  io-threads 4
  io-threads-do-reads yes
  ```
- 场景：CPU 充足、带宽大时能显著提升吞吐。

---

## 二、数据类型与底层结构

### Q3: Redis 有哪些数据类型？底层编码是什么？

5 大基础 + 4 大高级：String、Hash、List、Set、ZSet、Bitmap、HyperLogLog、GEO、Stream。

| 类型 | 编码 |
|------|------|
| String | int（小整数）/ embstr（≤44B） / raw（SDS） |
| List | quicklist（ziplist + 链表）/ 7.0+ listpack |
| Hash | listpack / hashtable |
| Set | intset（全整数小集合） / hashtable / listpack(7.2+) |
| ZSet | listpack（小 ZSet） / skiplist + dict |

**加分**：讲清为什么要两种编码 → 小数据用紧凑结构省内存，大数据用高效结构保证性能。

### Q4: ZSet 为什么用 skiplist 而不是红黑树/B+Tree？

**答题**：
1. **实现简单**：跳表代码量远少于红黑树。
2. **性能相当**：查找 O(log N)，插入删除也是。
3. **范围查询更好**：跳表底层本身是有序链表，范围遍历 O(log N + M)；红黑树需要中序遍历。
4. **内存局部性灵活**：跳表节点可按需增长层数。
5. **ZSet 需要 dict（member→score）+ skiplist（score 排序）双结构**，skiplist 配合更自然。

### Q5: String 的 value 能存多大？为什么 embstr 和 raw 分界在 44 字节？

- 最大 512MB。
- **embstr**：redisObject + SDS 连续分配，一次 malloc，适合小字符串。jemalloc 按 16/32/64 字节分配，64 字节 - 16(redisObject) - 3(SDS header) - 1(结尾 '\0') = 44 字节。
- **raw**：redisObject 与 SDS 分开分配，适合大字符串。

---

## 三、持久化

### Q6: RDB 和 AOF 区别？生产怎么选？

| | RDB | AOF |
|---|---|---|
| 格式 | 二进制快照 | 追加文本命令 |
| 体积 | 小 | 大（可重写） |
| 恢复速度 | 快 | 慢 |
| 丢数据 | 可能几分钟 | 最多 1s（everysec） |
| fork | 是 | 重写时 fork |

**生产选择**：
- **只做缓存**：关 AOF，开 RDB 即可，性能最高。
- **重要数据**：开 AOF（everysec）+ RDB + 混合持久化。
- **高并发写场景**：开混合持久化减少 AOF 体积。

### Q7: BGSAVE 的 fork 会阻塞主线程吗？

- **会**，但时间短（毫秒级）。
- 原理：Linux COW（写时复制），fork 时只复制页表，子进程与父进程共享物理内存。**fork 本身需要复制页表**，内存越大越慢。
- 大内存实例 fork 可能阻塞几百 ms → 避免在高峰期 BGSAVE。

**优化**：
- 合理设置 `save` 阈值避免频繁 fork。
- 关闭 Linux 透明大页（THP）：`echo never > /sys/kernel/mm/transparent_hugepage/enabled`。
- 单实例内存控制在 10~20GB 以内。

### Q8: AOF 重写流程？

1. 主进程 fork 子进程。
2. 子进程根据**当前内存状态**生成最小命令集，写入新 AOF。
3. 主进程继续处理写请求，并将新命令同时写入：
   - 旧 AOF
   - AOF 重写缓冲区
4. 子进程完成后，主进程把重写缓冲区内容追加到新 AOF，替换旧 AOF。

**注意**：AOF 重写不是读旧 AOF 文件，而是读取当前内存中的数据结构，反向生成命令。

### Q9: 混合持久化是什么？

Redis 4.0+ 引入，`aof-use-rdb-preamble yes`：
- AOF 重写时，先把当前数据以 **RDB 格式** 写入 AOF 文件头。
- 后续增量写命令以 AOF 格式追加。
- 恢复：先加载 RDB 部分（快）→ 再重放 AOF 增量（完整）。

---

## 四、过期与淘汰

### Q10: Redis 怎么删除过期 key？

**定期删除 + 惰性删除**：
- **定期**：每 100ms 随机抽 20 个带 TTL 的 key 检查；超过 1/4 过期则再抽一批；执行时间受限防止阻塞。
- **惰性**：访问 key 时检查过期则删除。

**不完美之处**：可能有过期 key 残留内存 → 通过内存淘汰兜底。

### Q11: 内存满了怎么办？（8 种淘汰策略）

见知识总结。**记忆技巧**：`{allkeys, volatile} × {lru, lfu, random, ttl} + noeviction`。

**面试高频选择**：
- 纯缓存：`allkeys-lru`
- 访问频次差异大：`allkeys-lfu`
- 有 TTL 区分：`volatile-lru/ttl`

### Q12: LRU 和 LFU 区别？Redis 怎么实现的？

- **LRU**：最近最少使用（Least Recently Used），淘汰最久没访问的。
- **LFU**：最不频繁使用（Least Frequently Used），淘汰访问次数少的（4.0+）。
- Redis **不是严格 LRU/LFU**，而是**随机采样 N 个，淘汰其中最旧的**，`maxmemory-samples 5` 可调。
- LFU 使用 Morris counter 概率计数器，避免频次 int 溢出，且有**衰减机制**。

---

## 五、主从复制

### Q13: 讲讲 Redis 的主从复制原理？

**全量同步**：
1. 从 → 主：`PSYNC ? -1`
2. 主 `BGSAVE` 生成 RDB + 记录期间命令到**复制缓冲区**。
3. 主发送 RDB 给从。
4. 从加载 RDB。
5. 主发送复制缓冲区的增量命令。
6. 后续**命令传播**持续同步。

**部分同步（2.8+ PSYNC）**：
- 依赖 `runid + offset + 复制积压缓冲区（backlog）`。
- 从断线重连，若 offset 还在 backlog 内，只补缺失命令。

### Q14: 主从延迟怎么办？

**原因**：
- 网络延迟
- 主写入过快，从执行过慢
- 从在做 BGSAVE/慢查询
- 大命令（BigKey 操作）

**优化**：
- 增大 `repl-backlog-size`，减少全量概率。
- 拆分 BigKey。
- 读业务容忍延迟，强一致读走主。
- 使用 `WAIT numreplicas timeout` 同步等待从（半同步思想）。

### Q15: Redis 复制是同步还是异步？会丢数据吗？

- **异步**：默认不等从 ACK 就返回。
- 会丢：主写入成功返回客户端后，未同步到从时主宕机 → 从切主后数据丢失。
- 缓解：`min-replicas-to-write 1` + `min-replicas-max-lag 10` 限制主必须至少有 N 个从延迟 ≤ 某秒才允许写入。

---

## 六、哨兵

### Q16: 哨兵 Sentinel 如何工作？

**三大职责**：监控、通知、自动故障转移、客户端发现。

**监控**：
- 每 1s PING 主、从、其他 Sentinel。
- 主 PING 不通 → 标记**主观下线 SDOWN**。
- 达到 `quorum` 个 Sentinel 都认为下线 → **客观下线 ODOWN**。

**故障转移**：
1. Sentinel 间 Raft 选领头。
2. 领头从剩余从节点选新主（优先级 → 偏移量 → runid）。
3. 其他从 `SLAVEOF 新主`。
4. 客户端收到 `+switch-master` 事件切换。

### Q17: Redis 脑裂怎么解决？

**场景**：主因网络分区与哨兵断联，哨兵选出新主，但旧主仍在接收部分客户端写入，网络恢复后旧主数据丢失。

**解决**：
```
min-replicas-to-write 1
min-replicas-max-lag 10
```
- 主必须至少有 1 个从在 10s 内同步过，否则拒写。
- 结合半同步 + `WAIT` 命令。

---

## 七、集群

### Q18: Redis Cluster 怎么分片？

- 16384 个哈希槽，`slot = CRC16(key) mod 16384`。
- 每个主节点负责一部分 slot。
- 客户端请求任一节点，若 key 不归它 → 返回 `MOVED slot ip:port` 重定向。
- **ASK**：slot 正在迁移，临时重定向到目标节点。

### Q19: 为什么是 16384 个槽而不是 65536？

**作者 antirez 原话**（GitHub Issue #2576）：
1. 节点间心跳包携带 slot bitmap，16384 bits = 2KB，65536 = 8KB，**压缩效率**：2KB 足够识别节点负责的槽，且心跳频繁。
2. Redis Cluster 主节点不建议超过 1000，16384 已能提供足够细粒度。
3. Bitmap 压缩时填充率越高压缩比越好，节点少、槽多会使 bitmap 稀疏。

### Q20: Cluster 怎么保证高可用？

- 每个主节点有若干从节点。
- 主节点失联 `cluster-node-timeout`（默认 15s）→ 标记 PFAIL。
- 过半数主节点确认 → FAIL → 从节点选举（Raft-like）→ 晋升为新主。

### Q21: 多 key 操作（MSET、事务、Lua）在 Cluster 下怎么处理？

- 所有 key 必须落到**同一个 slot**，否则报错 `CROSSSLOT`。
- 使用 **Hash Tag**：`{user}:name`、`{user}:age` → 相同 slot。
- 或用 Pipeline 拆分到各自节点。

---

## 八、缓存经典问题

### Q22: 缓存穿透、击穿、雪崩的区别与解决？

| | 现象 | 原因 | 方案 |
|---|---|---|---|
| **穿透** | 查不存在的 key | 恶意攻击 / 参数错误 | 布隆过滤器 / 缓存空值 |
| **击穿** | 单热点 key 过期 | 热点 key 失效瞬间高并发 | 互斥锁 / 永不过期 |
| **雪崩** | 大量 key 同时失效 | 过期时间一致 / Redis 宕机 | 过期加随机 / 高可用 / 多级缓存 / 降级 |

### Q23: 布隆过滤器（Bloom Filter）原理？有什么缺点？

- 由 **位数组 + K 个哈希函数** 构成。
- 插入：把 key 经过 K 个 hash 得到 K 个位置都置 1。
- 查询：K 个位置都为 1 → 可能存在；有一个为 0 → 一定不存在。

**缺点**：
1. 有**误判率**（false positive）。
2. 不支持删除（可用 Counting Bloom Filter 解决）。
3. 需预估容量，动态扩容困难。

**Redis 实现**：RedisBloom 模块（`BF.ADD`、`BF.EXISTS`）或 Redisson 的 RBloomFilter。

### Q24: 如何保证缓存与数据库一致性？

**经典方案 Cache Aside**：
- 读：先读缓存 → miss 读 DB → 回填缓存。
- 写：**先更新 DB → 再删除缓存**。

**为什么是删除不是更新**：
- 避免并发更新导致覆盖：A 更新 DB 1→2，B 更新 DB 2→3，但缓存写入顺序可能相反。
- 删除 + 懒加载更简单安全。

**为什么是先 DB 后删缓存**：
- 若先删缓存再更新 DB，中间有读请求会把**旧 DB 值**回填到缓存，不一致更久。

**极端并发问题 + 延时双删**：
```
删缓存 → 更新 DB → sleep(500ms) → 再删缓存
```
针对读请求在第一次删缓存后更新 DB 前回填缓存的场景。

**更强方案**：
- **订阅 binlog（Canal/Maxwell）**：DB 变更事件 → 异步更新 Redis，彻底解耦，最终一致性。

### Q25: 能做强一致性缓存吗？

**很难**。Redis 与 DB 分布式系统 → CAP 限制。
- 方案：**不要用缓存**（强一致业务如支付、库存走 DB）。
- 或 **2PC/分布式事务**（代价高）。
- 或 **读写都串行**（牺牲性能）。

---

## 九、分布式锁

### Q26: 怎么实现 Redis 分布式锁？可能有哪些坑？

**基础实现**：
```bash
SET lock_key unique_id NX EX 30
```

**坑 1：锁被误删**
- A 业务超 30s 执行完，锁已过期，B 获取锁，A 释放时误删 B 的锁。
- **解决**：value 用 UUID，释放时 Lua 校验后删除。

**坑 2：业务执行超过锁 TTL**
- **解决**：看门狗（Watchdog）续期，Redisson 默认每 10s 续到 30s。

**坑 3：主从切换丢锁**
- 主写入锁成功返回但未同步到从 → 主宕机 → 从升主 → 锁丢失。
- **解决**：Redlock 多实例加锁 / 改用 ZooKeeper / etcd。

**释放锁 Lua**：
```lua
if redis.call("get", KEYS[1]) == ARGV[1] then
    return redis.call("del", KEYS[1])
else
    return 0
end
```

### Q27: Redlock 原理？为什么有争议？

**原理**：
1. 客户端获取当前时间 t1。
2. 依次向 N（通常 5）个**独立 Redis 实例** SETNX 加锁，设置超时时间 T。
3. 获取时间 t2，计算耗时 = t2 - t1。
4. 若在过半数（≥ N/2+1）实例加锁成功且耗时 < T → 锁持有成功，有效时间 = T - 耗时。
5. 失败则向所有实例释放。

**争议**：
- **Martin Kleppmann** 批评：依赖时钟同步（NTP 跳变）、GC Stop-The-World 期间锁可能失效，在"强一致分布式锁"场景不可靠。
- **antirez** 反驳：Redlock 在容错场景下足够好，若追求强一致应使用 Paxos/Raft 系统（ZK、etcd）。

**结论**：一般业务用单 Redis + Redisson 够用；金融级强一致场景用 **ZooKeeper/etcd**。

---

## 十、事务

### Q28: Redis 事务原子性如何？为什么不支持回滚？

- MULTI/EXEC 保证命令**按顺序执行**，中间不会被打断。
- **不保证原子性**：命令执行时失败（如类型错），其他命令仍执行，不回滚。
- **官方理由**：
  - 失败通常是程序 bug，生产应避免。
  - 不回滚保持 Redis 简洁高效。
- 如需原子性强保证 → 用 **Lua 脚本**（单次执行原子）。

### Q29: Redis 的事务和 Lua 脚本有什么区别？

| | 事务（MULTI/EXEC） | Lua 脚本 |
|---|---|---|
| 原子性 | 命令入队原子，执行不回滚 | 整体原子（单线程执行） |
| 中间结果 | 无法用上一步结果 | 可以 |
| 使用 | 简单组合命令 | 复杂业务逻辑 |
| WATCH | 支持乐观锁 | 内部无法 |

**推荐**：复杂业务用 Lua。

---

## 十一、BigKey / HotKey

### Q30: 如何排查 BigKey？有什么危害？怎么优化？

**排查**：
- `redis-cli --bigkeys`（每种类型最大 key）
- `MEMORY USAGE key`
- 离线分析 RDB：`rdb -c memory dump.rdb`（redis-rdb-tools）

**危害**：
- 集群分片数据倾斜
- 删除阻塞（大 Hash DEL 可能几秒）
- 迁移慢、主从同步延迟
- 网络带宽瓶颈

**优化**：
- **拆分**：大 Hash 按 field hash 分片到多个 key。
- `UNLINK` 异步删除（4.0+）。
- `lazyfree-lazy-*` 开启懒惰释放。
- 压缩序列化（ProtoBuf、Kryo）。

### Q31: 热点 Key 怎么排查和优化？

**排查**：
- `redis-cli --hotkeys`（需 LFU 策略）
- 客户端/Proxy 采样统计
- 监控网卡流量异常

**优化**：
- **本地缓存**（Caffeine、Guava）二级缓存。
- **Key 分片**：`hot_item_1`、`hot_item_2`... 读时随机选一个。
- **读写分离**：从库分担。
- 限流降级。

---

## 十二、运维场景题

### Q32: 线上 Redis CPU 飙升 100%，怎么排查？

1. `redis-cli --latency` 看是否命令慢。
2. `SLOWLOG GET 10` 查慢查询（KEYS、HGETALL、ZRANGE 大 key）。
3. `INFO commandstats` 看各命令调用耗时。
4. `CLIENT LIST` 看连接数异常。
5. `MONITOR`（谨慎）短时间抓包。
6. 是否在做 BGSAVE/BGREWRITEAOF。
7. `INFO stats` 看 `rejected_connections`、`total_commands_processed`。
8. 系统层 top/iostat。

**常见根因**：BigKey 操作、热点 key、持久化 fork、客户端暴涨、Lua 死循环。

### Q33: Redis 内存占用比实际数据大很多，为什么？

1. **jemalloc 内存碎片**：`INFO memory` 看 `mem_fragmentation_ratio`（>1.5 碎片严重）。
   - 解决：`CONFIG SET activedefrag yes` 开启自动碎片整理（4.0+）。
2. **Copy-On-Write** 期间：BGSAVE/重写时主进程写请求会产生页复制，占用额外内存。
3. **buffer**：客户端输出缓冲、复制缓冲、AOF 缓冲。
4. **数据过期但未触发惰性/定期删除**。
5. **redisObject 开销**：小对象 overhead 大。

### Q34: Redis 客户端连接暴涨怎么办？

- `CLIENT LIST` 看连接来源。
- `CLIENT KILL` 清理异常。
- 限制 `maxclients`。
- 客户端侧启用连接池（Lettuce / Jedis Pool）。
- 排查是否有未关闭 Jedis 实例导致泄露。

### Q35: 百万 QPS 的热 key 场景怎么设计？

```
多级缓存：
[本地缓存 Caffeine 1s TTL] → [Redis 集群] → [DB]

分片：
hot_item_0, hot_item_1, ..., hot_item_9 → 客户端随机选一个
```

加上：
- 布隆过滤器挡穿透
- 熔断 + 降级（Sentinel/Hystrix）
- 限流（令牌桶）
- 预热：活动前主动加载热点

---

## 十三、场景 & 编码题

### Q36: 用 Redis 实现一个排行榜

```bash
ZADD game_rank 1500 user1
ZADD game_rank 2000 user2
ZINCRBY game_rank 10 user1       # 加分
ZREVRANGE game_rank 0 9 WITHSCORES  # 前 10
ZREVRANK game_rank user1         # 某用户排名
```

**海量用户**：按业务维度（如服务器、月榜）分片 + ZSet。

### Q37: 用 Redis 实现延迟队列

**方案 1 ZSet**：
```bash
ZADD delay_queue <trigger_timestamp> <message>
```
消费端轮询：
```bash
ZRANGEBYSCORE delay_queue 0 <now> LIMIT 0 10
ZREM delay_queue <message>
```

**方案 2 Redisson**：`RDelayedQueue`，基于 ZSet + List 实现。

**方案 3 Stream**：暂不原生支持延迟，可配合 ZSet。

**生产大规模延迟任务**：RocketMQ 延时消息 / Kafka + 时间轮。

### Q38: 实现一个每日签到（签到率、连续天数）

**用 Bitmap**：
```bash
SETBIT sign:user1:202604 22 1          # 4 月 23 日签到（索引 22 因从0）
GETBIT sign:user1:202604 22
BITCOUNT sign:user1:202604             # 本月签到总次数
```

**连续签到天数**：用位运算 `BITPOS`/`BITFIELD` 扫描。

**全局日活**：
```bash
SETBIT uv:20260423 <userId> 1
BITCOUNT uv:20260423
```

### Q39: 实现一个简单的分布式限流

**固定窗口 INCR**：
```bash
key = "ratelimit:user1:minute:202604232210"
INCR key
EXPIRE key 60
如果 > 100 → 拒绝
```

**滑动窗口 ZSet**：
```bash
ZADD ratelimit_user1 <now_ms> <uuid>
ZREMRANGEBYSCORE ratelimit_user1 0 <now_ms - 60000>
ZCARD ratelimit_user1
```

**令牌桶 Lua**：更精确，生产推荐用 Redisson `RRateLimiter` 或 Sentinel。

### Q40: 实现一个"附近的人"

```bash
GEOADD people 116.40 39.90 "alice"
GEOADD people 116.41 39.92 "bob"
GEOSEARCH people FROMLONLAT 116.40 39.90 BYRADIUS 1000 m ASC COUNT 10
```

底层：ZSet 按 GeoHash 做 score。

---

## 十四、8.0 / 7.x 新特性（加分）

- **7.0**：
  - Function 替代部分 Lua 场景
  - ACL 增强
  - Sharded Pub/Sub
  - Listpack 替代 Ziplist
  - 客户端驱逐（client-eviction）
- **7.2**：Set 引入 listpack 编码节省内存
- **8.0**（预览/方向）：哈希字段级 TTL、更强 JSON、向量检索等（关注官方公告）

---

## 附录：面试技巧

1. **分层作答**：是什么 → 为什么 → 怎么做 → 坑/对比。
2. **能扯到底层结构**就显深度，如 SDS、skiplist、listpack。
3. **给生产数据**：我们项目 Redis 单实例 QPS xx，内存 xx GB，命中率 xx%。
4. **主动对比**：讲 Redis 时对比 Memcached、HBase、本地缓存。
5. **不会就说思路**：即使不知道 Redlock 细节，也能说"N 个实例、过半成功"。
6. **结合项目**：把知识点挂到简历项目上，避免纯八股。

---

**参考资料**：
- 参考文档：`Redis2.pdf`
- 《Redis 设计与实现》黄健宏
- 《Redis 深度历险：核心原理和应用实践》钱文品
- Redis 官方文档 https://redis.io/docs/
- 极客时间《Redis 核心技术与实战》蒋德钧
- Martin Kleppmann vs antirez Redlock 论战：https://martin.kleppmann.com/2016/02/08/how-to-do-distributed-locking.html
