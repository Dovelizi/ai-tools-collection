# Redis 重点知识总结

> 面向后端开发工程师的 Redis 系统性知识梳理，融合参考文档《Redis2.pdf》并结合互联网生产实践，覆盖数据类型、持久化、事务、发布订阅、主从、哨兵、集群、缓存设计、分布式锁、性能调优等核心主题。

---

## 目录

1. [Redis 简介与背景](#一redis-简介与背景)
2. [五大基础数据类型](#二五大基础数据类型)
3. [高级数据类型](#三高级数据类型-bitmaphyperloglog-geostream)
4. [底层数据结构](#四底层数据结构)
5. [线程模型与性能](#五线程模型与性能)
6. [持久化：RDB 与 AOF](#六持久化rdb-与-aof)
7. [事务](#七事务)
8. [发布订阅](#八发布订阅)
9. [过期策略与内存淘汰](#九过期策略与内存淘汰)
10. [主从复制](#十主从复制)
11. [哨兵模式 Sentinel](#十一哨兵模式-sentinel)
12. [集群模式 Cluster](#十二集群模式-cluster)
13. [缓存设计问题](#十三缓存设计问题)
14. [分布式锁](#十四分布式锁)
15. [性能优化与运维](#十五性能优化与运维)

---

## 一、Redis 简介与背景

### 1.1 什么是 Redis

Redis（**RE**mote **DI**ctionary **S**erver）：开源、基于内存的 K-V 数据库，支持持久化、事务、发布订阅、集群等高可用功能。

**核心特征**：
- **内存存储**：性能极高，读写可达 10w+ QPS。
- **单线程模型**（6.0 前命令执行单线程）：原子性操作，避免锁竞争。
- **丰富数据结构**：String、Hash、List、Set、ZSet、Bitmap、HyperLogLog、GEO、Stream。
- **持久化**：RDB 快照 + AOF 日志。
- **高可用**：主从复制、哨兵、集群。
- **事务**：弱事务（MULTI/EXEC，无回滚）。

### 1.2 NoSQL 与关系型数据库对比

| 维度 | SQL（关系型） | NoSQL |
|------|--------------|-------|
| 数据模型 | 表/关系 | K-V、文档、列族、图 |
| 事务 | 强 ACID | 弱一致、BASE |
| 扩展 | 垂直扩展为主 | 水平扩展 |
| 典型产品 | MySQL、Oracle | Redis、MongoDB、HBase、Neo4j |

**NoSQL 四大类**：
1. K-V：Redis、Memcached
2. 文档：MongoDB
3. 列族：HBase、Cassandra
4. 图：Neo4j

### 1.3 CAP 与 BASE

**CAP 定理**：一致性 C、可用性 A、分区容错性 P，三者不可兼得。
- CA：传统关系数据库（单点/集群）。
- **CP**：Redis、MongoDB、ZooKeeper。
- AP：大多数互联网架构（最终一致）。

**BASE**：
- **B**asically **A**vailable：基本可用。
- **S**oft state：软状态。
- **E**ventually consistent：最终一致。

---

## 二、五大基础数据类型

### 2.1 String（字符串）

最基础的类型，value 最大 512MB。

**常用命令**：
```bash
SET key value [EX seconds] [NX|XX]
GET key
INCR / DECR / INCRBY / DECRBY
APPEND key value
STRLEN key
SETNX key value        # 不存在才设置（分布式锁）
MSET k1 v1 k2 v2       # 批量
GETSET key value       # 原子 get+set
SETEX key seconds value
```

**典型场景**：
- 缓存对象（JSON 序列化）
- 计数器（点赞、阅读量）
- 分布式 ID（INCR）
- 分布式锁（SETNX）

### 2.2 Hash（哈希）

field-value 映射，适合存对象，节省空间。

```bash
HSET key field value
HGET key field
HMSET key f1 v1 f2 v2
HMGET key f1 f2
HGETALL key
HDEL key field
HEXISTS key field
HINCRBY key field increment
HLEN key
```

**典型场景**：购物车（userId → {itemId: count}）、对象缓存。

### 2.3 List（列表）

双端链表（3.2+ 底层为 quicklist），按插入顺序排序。

```bash
LPUSH / RPUSH key value
LPOP / RPOP key
LRANGE key start stop
LLEN key
LINDEX key index
LTRIM key start stop
BRPOP key timeout       # 阻塞弹出，消息队列
BLPOP key timeout
```

**典型场景**：
- 简易消息队列（LPUSH + BRPOP）
- 最新列表（朋友圈、文章列表）
- 栈（LPUSH + LPOP）

### 2.4 Set（集合）

无序、不重复字符串集合。

```bash
SADD key member [member...]
SMEMBERS key
SISMEMBER key member
SREM key member
SCARD key               # 基数
SRANDMEMBER key [count]
SPOP key [count]        # 抽奖
SINTER / SUNION / SDIFF key1 key2  # 交/并/差
```

**典型场景**：
- 标签
- 共同好友、共同关注（SINTER）
- 抽奖（SRANDMEMBER / SPOP）
- UV 统计（每个 IP 一个成员）

### 2.5 ZSet（有序集合）

带分数 score 排序的 Set，底层 **skiplist + dict**（或 ziplist/listpack 小数据优化）。

```bash
ZADD key score member
ZRANGE key 0 -1 [WITHSCORES]
ZREVRANGE key 0 -1
ZRANGEBYSCORE key min max
ZINCRBY key increment member
ZRANK / ZREVRANK key member
ZREM key member
ZCARD / ZCOUNT
ZSCORE key member
```

**典型场景**：
- 排行榜（游戏积分、热搜）
- 延迟队列（score = 执行时间戳）
- 带权重的消息队列

---

## 三、高级数据类型 (Bitmap、HyperLogLog、 GEO、Stream)

### 3.1 Bitmap（位图）

基于 String，按 bit 操作。
```bash
SETBIT key offset value
GETBIT key offset
BITCOUNT key [start end]
BITOP AND/OR/XOR destkey key1 key2
```
**场景**：签到、用户在线状态、日活统计。

### 3.2 HyperLogLog（基数估计）

用极小内存（12KB）估计大集合基数，误差 0.81%。
```bash
PFADD key element
PFCOUNT key
PFMERGE destkey key1 key2
```
**场景**：UV 统计（不需要精确）。

### 3.3 GEO（地理位置）

基于 ZSet + GeoHash。
```bash
GEOADD key longitude latitude member
GEOPOS / GEODIST / GEORADIUS / GEOSEARCH
```
**场景**：附近的人、附近餐厅。

### 3.4 Stream（消息流，5.0+）

真正的消息队列数据结构，支持消费组、ACK、回溯。
```bash
XADD stream * field value
XREAD COUNT n STREAMS stream 0
XGROUP CREATE stream group $
XREADGROUP GROUP g c COUNT n STREAMS stream >
XACK stream group id
```
**优势**：解决 List 不支持多消费者、Pub/Sub 不持久化的问题。

---

## 四、底层数据结构

| 对外类型 | 底层编码（2 选 1 或混合） |
|---------|-------------------------|
| String | int / embstr（≤44 字节）/ raw（SDS） |
| List | quicklist（ziplist + linkedlist）/ 7.0+ listpack |
| Hash | listpack / hashtable |
| Set | intset / hashtable / 7.2+ listpack |
| ZSet | listpack / skiplist + dict |

### 4.1 SDS（Simple Dynamic String）

Redis 自己的字符串实现：
- 记录 `len`、`free`，O(1) 获取长度。
- 二进制安全（可包含 `\0`）。
- 预分配 + 惰性释放。
- 杜绝缓冲区溢出。

### 4.2 跳表（Skiplist）

ZSet 核心结构。
- 多层有序链表，通过"索引"加速查找。
- 平均 O(log N)，实现简单（相比红黑树）。
- 支持范围查询高效。

### 4.3 Listpack / Ziplist

紧凑顺序存储，节省内存。Ziplist 在极端情况有"连锁更新"问题，Listpack（7.0）解决此问题并逐步替代 Ziplist。

---

## 五、线程模型与性能

### 5.1 为什么单线程还这么快

1. **纯内存操作**：无磁盘 IO。
2. **非阻塞 IO 多路复用**（epoll/kqueue）：一个线程处理成千上万连接。
3. **避免锁竞争、上下文切换**。
4. **高效的数据结构与编码**。
5. **C 语言实现**。

### 5.2 Redis 6.0 多线程

- **命令执行仍然是单线程**。
- IO 读写、协议解析变为多线程，解决网络 IO 瓶颈。
- 通过 `io-threads 4` / `io-threads-do-reads yes` 启用。

### 5.3 不要在 Redis 中做的事

- 执行大 KEY 的全扫描（KEYS *、HGETALL 大 Hash）。
- 存储 GB 级别的单个 value。
- 大范围 ZRANGE / SMEMBERS。
- 慢命令放到主流程（会阻塞所有后续命令）。

---

## 六、持久化：RDB 与 AOF

### 6.1 RDB（快照）

**原理**：定时 fork 子进程生成二进制快照 `dump.rdb`。

**触发方式**：
- 配置 `save 900 1 / 300 10 / 60 10000`
- `SAVE`（阻塞，不推荐）
- `BGSAVE`（子进程异步）
- 主从全量复制时
- 执行 `SHUTDOWN` 时

**优点**：文件紧凑，恢复快，适合备份、灾备。
**缺点**：fork 可能阻塞；两次快照之间数据可能丢失。

### 6.2 AOF（Append Only File）

**原理**：以追加方式把每条写命令写入 `appendonly.aof`。

**fsync 策略** `appendfsync`：
- `always`：每命令 fsync，最安全，最慢。
- **`everysec`**（默认，推荐）：每秒一次，最多丢 1s 数据。
- `no`：由 OS 决定。

**AOF 重写（rewrite）**：
- 把冗余命令压缩成最小命令集（不是读旧 AOF 而是读当前内存状态生成）。
- 触发：`auto-aof-rewrite-percentage 100`、`auto-aof-rewrite-min-size 64mb`。
- 主进程 fork → 子进程重写 → 期间新命令写入 AOF 重写缓冲区 → 子进程完成后合并。

### 6.3 两者对比

| 维度 | RDB | AOF |
|------|-----|-----|
| 文件 | 二进制 | 文本命令 |
| 体积 | 小 | 大（可重写） |
| 恢复速度 | 快 | 慢 |
| 数据丢失 | 可能几分钟 | 最多 1 秒 |
| 适合 | 备份、灾备 | 持久化完整性 |

### 6.4 混合持久化（4.0+）

`aof-use-rdb-preamble yes`：AOF 重写时，先以 RDB 二进制写入文件头，后续再追加增量命令。兼顾恢复速度 + 数据完整。

**生产建议**：主库开启 AOF（everysec），从库可关 AOF 减少 IO，开启混合持久化。

---

## 七、事务

### 7.1 三阶段

```
MULTI     # 开启
...       # 命令入队（不立即执行）
EXEC      # 统一执行
DISCARD   # 放弃
```

### 7.2 三特性

1. **单独隔离**：队列中命令按顺序串行执行，中间不会被其他客户端打断。
2. **没有隔离级别**：EXEC 之前队列中命令都不会执行。
3. **不保证原子性**：命令入队后 EXEC 时某条失败，**其他命令仍执行**，不会回滚。

### 7.3 错误类型

- **入队时语法错误**：整个事务取消（全体连坐）。
- **执行时逻辑错误**（如对 String 做 INCR）：其他命令继续执行（冤头债主）。

### 7.4 乐观锁 WATCH

```bash
WATCH key
MULTI
...
EXEC   # 若 WATCH 的 key 被其他客户端改动，EXEC 返回 nil，事务失败
```

### 7.5 为什么 Redis 不支持回滚

官方解释：Redis 事务中的错误通常是程序 bug（如类型用错），生产环境应避免；不做回滚保持简洁高效。

---

## 八、发布订阅

```bash
SUBSCRIBE channel
PSUBSCRIBE pattern.*
PUBLISH channel message
UNSUBSCRIBE / PUNSUBSCRIBE
```

**缺点**：
- 消息不持久化，订阅者掉线即丢消息。
- 无消费确认。
- 无消费组。

**生产可用方案**：使用 Stream 或 Kafka 替代。

---

## 九、过期策略与内存淘汰

### 9.1 过期删除策略

Redis 采用 **定期删除 + 惰性删除** 组合：
- **定期删除**：每 100ms 随机抽取一批 key 检查并删除过期。
- **惰性删除**：访问 key 时检查过期则删除。
- 两者结合避免 CPU 过高和内存堆积。

### 9.2 内存淘汰策略 `maxmemory-policy`

超过 `maxmemory` 时触发，8 种策略：

| 策略 | 说明 |
|------|------|
| `noeviction` | 写报错（默认） |
| `allkeys-lru` | 所有 key 中 LRU |
| `allkeys-lfu` | 所有 key 中 LFU（4.0+） |
| `allkeys-random` | 所有 key 中随机 |
| `volatile-lru` | 有过期时间的 key 中 LRU |
| `volatile-lfu` | 有过期时间的 LFU |
| `volatile-random` | 有过期时间的随机 |
| `volatile-ttl` | 有过期时间的按 TTL 升序 |

**生产推荐**：`allkeys-lru`（热点场景）或 `allkeys-lfu`（访问频次差异大）。

### 9.3 LRU 的近似实现

Redis LRU 不是严格 LRU，而是**随机采样**（默认 `maxmemory-samples 5`）取最久未访问的淘汰，减少内存开销。

---

## 十、主从复制

### 10.1 作用

- **数据冗余**：热备份。
- **故障恢复**：主挂从顶。
- **读写分离**：从库分担读压力。
- **高可用基石**：哨兵/集群依赖复制。

### 10.2 全量同步流程

1. 从节点发 `PSYNC` 请求。
2. 主节点 `BGSAVE` 生成 RDB，同时把期间的写命令写入 **复制缓冲区**。
3. 主节点发送 RDB 文件给从节点。
4. 从节点加载 RDB。
5. 主节点发送复制缓冲区中的增量命令。
6. 后续通过**命令传播**保持一致。

### 10.3 部分同步 PSYNC（2.8+）

基于 **复制偏移量 offset + 复制积压缓冲区 backlog + 主节点 runid**：
- 从节点断线重连，如果 offset 还在 backlog 中，只同步缺失部分，避免全量。

### 10.4 常见部署

- **一主二仆**：一个 master 两个 slave。
- **薪火相传**：slave 下挂 slave，减轻 master 压力。
- **反客为主**：手动 `SLAVEOF no one` 切主。

### 10.5 复制缺点

- 异步复制 → 主从延迟 → 数据不一致窗口。
- 无法自动故障转移（需要哨兵）。

---

## 十一、哨兵模式 Sentinel

### 11.1 作用

- 监控主从
- 自动故障转移
- 通知
- 客户端发现

### 11.2 原理

每个 Sentinel 每秒向主、从、其他 Sentinel 发 PING：
- **主观下线 SDOWN**：单个 Sentinel 认为节点挂了。
- **客观下线 ODOWN**：`quorum` 个 Sentinel 都认为挂了 → 启动故障转移。

### 11.3 故障转移流程

1. Sentinel 间通过 **Raft** 选举出领头哨兵。
2. 领头哨兵从剩余从节点中按优先级选新主：
   - `slave-priority` 越小越优先
   - 复制偏移量最大（数据最新）
   - runid 字典序最小
3. 对其他从节点执行 `SLAVEOF 新主`。
4. 旧主恢复后降为从。

### 11.4 客户端感知

客户端连接哨兵获取主节点地址，监听 `+switch-master` 事件刷新。

---

## 十二、集群模式 Cluster

### 12.1 特点

- **去中心化**：每个节点都知道集群所有节点。
- **数据分片**：16384 个哈希槽 slot，`slot = CRC16(key) mod 16384`。
- **主从高可用**：每主挂多从。
- **无需代理**：客户端直连，节点可重定向（MOVED/ASK）。

### 12.2 为什么是 16384 个槽

作者 antirez 回答：
1. 集群节点间心跳消息要携带槽位图（bitmap），16384/8=2KB，65536 则 8KB，开销大。
2. Redis 集群主节点不建议超过 1000 个，16384 已足够分配。
3. 压缩效率更高。

### 12.3 路由

- 客户端随机连任意节点。
- 节点计算 slot，如果归自己处理；否则返回 `MOVED` 让客户端重定向。
- **ASK**：槽正在迁移中，临时重定向。

### 12.4 Hash Tag

`mset user:{info}:name x user:{info}:age 18` → `{info}` 内的内容参与 CRC16 计算，保证同一 slot → 支持 mget/mset 等多 key 操作。

### 12.5 故障转移

- 节点间 gossip 发 PING，`cluster-node-timeout` 超时标记 PFAIL。
- 过半数主节点 PFAIL → FAIL → 从节点选举替换。

### 12.6 配置项

```
cluster-enabled yes
cluster-config-file nodes.conf
cluster-node-timeout 15000
cluster-require-full-coverage no   # 默认 yes，任一 slot 无主则整个集群不可用；设 no 更灵活
```

---

## 十三、缓存设计问题

### 13.1 缓存穿透

**现象**：查询不存在的 key，绕过缓存直接打 DB。

**方案**：
1. **布隆过滤器**（Bloom Filter）：启动时把所有合法 key 放入。
2. **缓存空值**：短过期时间（如 30s）。
3. 接口参数校验。

### 13.2 缓存击穿

**现象**：单个热点 key 过期瞬间大量请求击穿到 DB。

**方案**：
1. **互斥锁**（SETNX）：只有拿到锁的请求去查 DB 重建缓存。
2. **永不过期** + 逻辑过期：后台异步刷新。
3. 热点 key 持久缓存 + 定时刷新。

### 13.3 缓存雪崩

**现象**：大量 key 同时过期 or Redis 宕机，请求瞬间涌向 DB。

**方案**：
1. 过期时间**加随机扰动**：`expire + rand(0, 300)`。
2. 高可用部署（哨兵/集群）。
3. 熔断降级（Hystrix、Sentinel）。
4. 多级缓存（本地缓存 Caffeine + Redis）。

### 13.4 缓存一致性（数据库 + 缓存）

**主流方案：Cache Aside**
- 读：先读缓存，没有则读 DB 并回填。
- 写：**先更新 DB，再删除缓存**。

**为什么先 DB 后删除缓存而不是更新缓存**：
- 删除成本低，懒加载时再写入最新值。
- 避免并发更新导致短暂不一致。

**并发场景仍可能不一致 → 延时双删**：
```
删缓存 → 更新 DB → sleep(500ms) → 再次删缓存
```

**最终一致的更稳方案**：
- **订阅 MySQL binlog**（Canal）→ 异步更新缓存。

---

## 十四、分布式锁

### 14.1 基础实现 SETNX

```bash
SET lock_key unique_id NX EX 30
```
- `NX`：不存在才写（互斥）。
- `EX`：过期时间，防止死锁。
- `unique_id`：请求唯一标识，释放时校验，避免误删别人的锁。

**释放锁（Lua 保证原子）**：
```lua
if redis.call("get", KEYS[1]) == ARGV[1] then
    return redis.call("del", KEYS[1])
else
    return 0
end
```

### 14.2 存在问题

1. **锁过期业务未完成**：需要**看门狗（Watchdog）**自动续期。
2. **主从切换锁丢失**：主写入锁但未同步到从就宕机，新主没有锁。

### 14.3 Redisson（Java 推荐）

- 内部封装 Lua + 看门狗自动续期。
- 支持可重入、公平锁、读写锁、联锁。

### 14.4 Redlock（红锁）

在 N 个独立 Redis 实例上依次加锁：
- 过半（≥ N/2+1）成功才算成功。
- 解决单节点故障问题。
- 有争议（Martin Kleppmann vs antirez），**强一致场景建议用 ZK/etcd**。

---

## 十五、性能优化与运维

### 15.1 BigKey 问题

**定义**：
- String 超过 10KB
- Hash/List/Set/ZSet 元素超过 1w 或总大小超过 10MB

**危害**：内存倾斜、主从同步阻塞、删除卡顿、集群迁移慢。

**排查**：
```bash
redis-cli --bigkeys
MEMORY USAGE key
redis-cli --memkeys
```

**优化**：
- 拆分大 key（Hash 按字段分片）。
- 使用 `UNLINK` 代替 `DEL`（异步删除，4.0+）。
- `lazyfree-lazy-eviction/expire/server-del yes` 开启懒惰删除。

### 15.2 HotKey 问题

**危害**：单节点流量过载，集群不均。

**排查**：
- `redis-cli --hotkeys`（需 LFU 策略）。
- 监控网络流量。

**优化**：
- 本地缓存 + 多级缓存。
- Key 分片：`hot:1/hot:2/...`，读时随机取一个。
- 读写分离。

### 15.3 慢查询

```bash
CONFIG SET slowlog-log-slower-than 10000  # 微秒
SLOWLOG GET 10
SLOWLOG RESET
```

### 15.4 常见危险命令

- `KEYS *`：O(N) 阻塞，生产禁用，改用 `SCAN`。
- `FLUSHALL / FLUSHDB`：清库，线上禁用。
- `SHUTDOWN`、`CONFIG`：需 rename-command 屏蔽。

```
rename-command FLUSHALL ""
rename-command KEYS ""
```

### 15.5 连接数与 maxmemory

- `maxclients`：默认 10000。
- `maxmemory`：建议设为物理内存 70%，剩余给 RDB fork/复制缓冲。
- `tcp-keepalive 60`

### 15.6 监控指标

- QPS（`info stats`）
- 内存（`used_memory` / `used_memory_peak`）
- 命中率（`keyspace_hits / (hits+misses)`）
- 持久化 RDB/AOF 耗时
- 主从延迟（`master_repl_offset - slave_offset`）
- 慢查询数
- 客户端数

### 15.7 客户端

- **Java**：Lettuce（推荐，基于 Netty，支持异步/响应式）、Jedis（连接池）、Redisson（丰富分布式工具）。
- **Go**：go-redis、redigo。
- **Spring**：Spring Data Redis + Lettuce（默认）。

---

## 附录：快速自检 Checklist

- [ ] 能解释 Redis 为什么单线程还能 10w+ QPS
- [ ] 能手画 ZSet 的 skiplist 结构
- [ ] 能解释 RDB / AOF / 混合持久化的流程与取舍
- [ ] 能讲清主从全量/部分同步的 PSYNC 机制
- [ ] 能描述哨兵故障转移的完整过程
- [ ] 能说清 Cluster 16384 slot、MOVED/ASK、Hash Tag
- [ ] 能给出缓存穿透/击穿/雪崩的方案与权衡
- [ ] 能实现一个安全的 SETNX 分布式锁（Lua 释放、唯一 ID、看门狗）
- [ ] 能排查并优化 BigKey / HotKey
- [ ] 能解释缓存一致性方案（Cache Aside、延时双删、Canal）

---

**参考资料**：
- 参考文档：`Redis2.pdf`（本总结基于其结构并大量扩展）
- 《Redis 设计与实现》黄健宏
- 《Redis 深度历险：核心原理和应用实践》钱文品
- Redis 官方文档 https://redis.io/docs/
- 极客时间《Redis 核心技术与实战》蒋德钧
