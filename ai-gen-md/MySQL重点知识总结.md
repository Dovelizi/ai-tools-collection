# MySQL 重点知识总结

> 面向后端开发工程师的 MySQL 系统性知识梳理，涵盖架构、存储引擎、索引、事务、锁、日志、性能优化、主从复制、分库分表与高可用方案等核心主题。

---

## 目录

1. [MySQL 整体架构](#一mysql-整体架构)
2. [存储引擎 InnoDB vs MyISAM](#二存储引擎-innodb-vs-myisam)
3. [索引（Index）](#三索引index)
4. [事务与 MVCC](#四事务与-mvcc)
5. [锁机制](#五锁机制)
6. [日志系统](#六日志系统redo-logundo-logbinlog)
7. [SQL 执行流程](#七sql-执行流程)
8. [性能优化](#八性能优化)
9. [主从复制与高可用](#九主从复制与高可用)
10. [分库分表](#十分库分表)
11. [常见数据类型与设计规范](#十一常见数据类型与设计规范)

---

## 一、MySQL 整体架构

MySQL 采用分层架构，自顶向下分为以下几层：

```
+-----------------------------------------------+
|           连接层 Connectors                   |   线程池、鉴权、连接管理
+-----------------------------------------------+
|           服务层 Server                        |
|   - 查询缓存（8.0 已删除）                    |
|   - 解析器 Parser                              |
|   - 预处理器 Preprocessor                      |
|   - 优化器 Optimizer                           |
|   - 执行器 Executor                            |
+-----------------------------------------------+
|           存储引擎层 Storage Engine            |   InnoDB / MyISAM / Memory ...
+-----------------------------------------------+
|           文件系统层                           |   数据文件、日志文件
+-----------------------------------------------+
```

**核心组件职责：**
- **连接器**：负责与客户端建立连接、权限校验、维护会话。
- **分析器**：词法分析 + 语法分析，生成解析树。
- **优化器**：决定执行计划（选择索引、连接顺序等）。
- **执行器**：调用存储引擎接口实际执行 SQL。
- **存储引擎**：负责数据的存储与读取，插件化设计。

---

## 二、存储引擎 InnoDB vs MyISAM

| 特性 | InnoDB（默认，推荐） | MyISAM |
|------|---------------------|--------|
| 事务 | 支持 ACID | 不支持 |
| 外键 | 支持 | 不支持 |
| 锁粒度 | 行锁（支持表锁） | 表锁 |
| MVCC | 支持 | 不支持 |
| 崩溃恢复 | 支持（redo log） | 不支持 |
| 索引结构 | 聚簇索引（B+Tree） | 非聚簇索引 |
| 全文索引 | 5.6+ 支持 | 支持 |
| 适用场景 | 高并发 OLTP | 读多写少、日志类 |

**InnoDB 内存结构**：
- **Buffer Pool**：缓存数据页、索引页（通过 LRU 改进算法管理）。
- **Change Buffer**：缓存非唯一二级索引的修改，减少随机 IO。
- **Log Buffer**：缓存 redo log，定时刷盘。
- **Adaptive Hash Index**：自适应哈希索引，对热点页建立哈希加速查询。

**InnoDB 磁盘结构**：
- **System Tablespace**：系统表空间（ibdata1）。
- **File-Per-Table Tablespaces**：`.ibd` 文件，每张表独立。
- **UNDO Tablespaces**：回滚日志。
- **Redo Log Files**：`ib_logfile0/1`。

---

## 三、索引（Index）

### 3.1 索引数据结构

MySQL 默认使用 **B+Tree**：
- 所有数据都在叶子节点，非叶子节点只存索引键 → 树更矮，磁盘 IO 少。
- 叶子节点之间通过双向链表相连 → 范围查询高效。
- 3~4 层 B+Tree 即可支撑千万级数据。

**B+Tree vs B-Tree vs 哈希索引**：
- B-Tree 非叶子节点也存数据，范围查询需要中序遍历。
- Hash 查询 O(1)，但不支持范围、排序、模糊匹配，Memory 引擎默认哈希。

### 3.2 索引分类

| 分类维度 | 类型 |
|----------|------|
| 数据结构 | B+Tree、Hash、R-Tree（空间）、Full-Text |
| 物理存储 | 聚簇索引（Clustered）、非聚簇索引（Secondary） |
| 字段特性 | 主键索引、唯一索引、普通索引、前缀索引、全文索引 |
| 字段个数 | 单列索引、联合/复合索引 |

### 3.3 聚簇索引 vs 非聚簇索引

- **聚簇索引**：叶子节点存储完整行数据；InnoDB 的主键即聚簇索引（若没有主键则选唯一非空列，否则隐式 rowid）。
- **非聚簇索引（二级索引）**：叶子节点存储主键值，查询时需**回表**。
- **覆盖索引**：查询字段全部在索引中，无需回表，Explain 中 Extra 显示 `Using index`。

### 3.4 联合索引与最左前缀原则

联合索引 `(a, b, c)` 生效场景：
- `where a=?` ✅
- `where a=? and b=?` ✅
- `where a=? and b=? and c=?` ✅
- `where b=?` ❌（违反最左前缀）
- `where a=? and c=?` → 只 a 用到索引

**ICP（Index Condition Pushdown，索引下推）**：5.6+，把部分 where 条件下推到存储引擎层用索引过滤，减少回表次数。

### 3.5 索引失效场景（重点）

1. 违反最左前缀原则
2. 在索引列上使用函数或计算：`where YEAR(create_time) = 2024`
3. 类型隐式转换：`where phone = 13800000000`（phone 是 varchar）
4. `like '%xx'`（左模糊）
5. `or` 条件中一侧无索引
6. 索引区分度低，优化器认为全表扫描更快
7. `!=`、`<>`、`not in`、`is not null` 常导致失效（并非绝对）
8. 联合索引顺序错误或中间断档

### 3.6 索引设计原则

- 区分度高（离散度）的列优先建索引。
- 频繁作为查询条件、排序、分组的字段建索引。
- 字符串可使用前缀索引：`index(col(10))`。
- 避免冗余索引：`(a,b,c)` 已存在时不必再建 `(a)`。
- 单表索引数量建议 ≤ 5，过多会影响写入性能。
- 使用 `EXPLAIN` 验证索引是否命中。

---

## 四、事务与 MVCC

### 4.1 ACID 特性

| 特性 | 说明 | 保证机制 |
|------|------|---------|
| Atomicity 原子性 | 要么全成功，要么全回滚 | undo log |
| Consistency 一致性 | 数据从一个一致性状态到另一个一致性状态 | 其他三个共同保证 |
| Isolation 隔离性 | 并发事务互不干扰 | 锁 + MVCC |
| Durability 持久性 | 提交后数据不丢 | redo log |

### 4.2 隔离级别

| 隔离级别 | 脏读 | 不可重复读 | 幻读 |
|----------|------|-----------|------|
| READ UNCOMMITTED | ✓ | ✓ | ✓ |
| READ COMMITTED | ✗ | ✓ | ✓ |
| **REPEATABLE READ**（MySQL 默认） | ✗ | ✗ | ✓* |
| SERIALIZABLE | ✗ | ✗ | ✗ |

> *InnoDB 的 RR 级别通过 **MVCC + Next-Key Lock** 基本解决了幻读问题。

### 4.3 MVCC（多版本并发控制）

MVCC 使读操作不加锁也能读到一致性快照。依赖三要素：

1. **隐藏字段**：每行包含
   - `DB_TRX_ID`：最近一次修改事务 ID
   - `DB_ROLL_PTR`：指向 undo log 旧版本的指针
   - `DB_ROW_ID`：隐藏主键
2. **undo log**：版本链，保存行的历史版本。
3. **ReadView**：事务快照，包含
   - `m_ids`：活跃事务 ID 列表
   - `min_trx_id` / `max_trx_id`
   - `creator_trx_id`：当前事务 ID

**可见性判断规则**：
- 行的 `trx_id == creator_trx_id` → 可见
- `trx_id < min_trx_id` → 可见（已提交）
- `trx_id >= max_trx_id` → 不可见
- 在 `m_ids` 中 → 不可见（还未提交）
- 不在 `m_ids` 中且 `< max_trx_id` → 可见

**RC vs RR 区别**：RC 每次 select 都生成新 ReadView；RR 只在事务第一次 select 时生成，之后复用。

---

## 五、锁机制

### 5.1 锁分类

**粒度**：全局锁、表锁、行锁、页锁。

**模式**：
- **共享锁 S（读锁）**：多个事务可同时持有。
- **排他锁 X（写锁）**：互斥。
- **意向锁 IS/IX**：表级，标记表内有行锁，用于协调表锁和行锁。

### 5.2 InnoDB 行锁类型

| 锁类型 | 说明 |
|--------|------|
| **Record Lock** | 锁定单行索引记录 |
| **Gap Lock** | 锁定索引记录之间的间隙（防止插入） |
| **Next-Key Lock** | Record + Gap，默认锁类型（RR 级别） |
| **Insert Intention Lock** | 插入意向锁，间隙锁的子类 |

> 行锁是加在**索引**上的。若查询没走索引，会升级为表锁。

### 5.3 死锁

- **死锁条件**：互斥、持有并等待、不可抢占、循环等待。
- **MySQL 处理**：
  - `innodb_deadlock_detect=ON`（默认）自动检测，回滚权重较小的事务。
  - `innodb_lock_wait_timeout` 锁等待超时。
- **避免死锁**：
  1. 固定访问资源顺序
  2. 缩短事务
  3. 使用合理索引减少锁范围
  4. 业务侧降级成乐观锁或重试

---

## 六、日志系统（redo log、undo log、binlog）

### 6.1 三大日志对比

| 日志 | 所在层 | 作用 | 写入方式 |
|------|--------|------|---------|
| **redo log** | InnoDB 引擎层 | 崩溃恢复，保证持久性 | 物理日志，循环写 |
| **undo log** | InnoDB 引擎层 | 回滚 + MVCC | 逻辑日志 |
| **binlog** | Server 层 | 主从复制、数据恢复 | 逻辑日志，追加写 |

### 6.2 redo log

- 采用 **WAL（Write-Ahead Logging）**：先写日志，再刷数据页。
- 关键参数 `innodb_flush_log_at_trx_commit`：
  - `0`：每秒写 OS cache 并 flush，性能最高，崩溃丢 1s 数据。
  - `1`（默认）：每次事务提交都刷盘，最安全。
  - `2`：每次提交写 OS cache，每秒 flush。

### 6.3 binlog

- 三种格式：
  - **STATEMENT**：记录 SQL 语句，可能主从不一致。
  - **ROW**：记录行变更（推荐）。
  - **MIXED**：折中。
- `sync_binlog`：
  - `0`：依赖 OS flush
  - `1`（推荐）：每次提交 fsync

### 6.4 两阶段提交（保证 redo log 与 binlog 一致）

```
prepare 阶段: 写 redo log (prepare)
commit 阶段:  写 binlog → 写 redo log (commit)
```

崩溃恢复：
- redo log 有 prepare 但 binlog 无 → 回滚
- redo log 有 prepare 且 binlog 完整 → 提交

---

## 七、SQL 执行流程

### 7.1 查询语句执行过程

```
客户端 → 连接器 → 查询缓存(8.0已删) → 分析器 → 优化器 → 执行器 → 存储引擎
```

### 7.2 更新语句执行过程（以 UPDATE 为例）

1. 执行器调用引擎接口取数据（内存命中则直接返回，否则从磁盘读入 Buffer Pool）。
2. 执行器修改数据。
3. 写 **undo log**（用于回滚）。
4. 写 **redo log（prepare）**。
5. 写 **binlog**。
6. 提交事务，写 **redo log（commit）**。
7. 后台线程异步刷脏页。

---

## 八、性能优化

### 8.1 EXPLAIN 关键字段

| 字段 | 说明 |
|------|------|
| `id` | 查询序号 |
| `select_type` | 查询类型：SIMPLE、PRIMARY、SUBQUERY、DERIVED、UNION |
| `table` | 表名 |
| `type` | 访问类型：system > const > eq_ref > ref > range > index > ALL |
| `possible_keys` | 可能用到的索引 |
| `key` | 实际使用的索引 |
| `key_len` | 使用的索引长度 |
| `ref` | 与索引比较的列 |
| `rows` | 估算扫描行数 |
| `Extra` | 额外信息：Using index（覆盖索引）、Using where、Using filesort、Using temporary |

**关注红线**：`type=ALL`、`Using filesort`、`Using temporary` → 需优化。

### 8.2 慢查询优化路径

1. 开启慢查询日志：`slow_query_log=ON`，`long_query_time=1`。
2. 用 `mysqldumpslow` 或 `pt-query-digest` 分析。
3. `EXPLAIN` 查看执行计划。
4. 添加/调整索引、改写 SQL、分页优化、反范式设计、缓存。

### 8.3 常见 SQL 优化技巧

- **避免 `SELECT *`**：只查必要列，方便使用覆盖索引。
- **分页优化**：`LIMIT 1000000, 10` → 子查询延迟关联：
  ```sql
  SELECT * FROM t INNER JOIN (SELECT id FROM t ORDER BY id LIMIT 1000000, 10) x USING(id);
  ```
- **小表驱动大表**：`IN` 适合外小内大，`EXISTS` 适合外大内小。
- **使用连接代替子查询**。
- **批量插入**：`INSERT INTO ... VALUES (...),(...),(...)`。
- **避免 NULL**：索引区分度差，改默认值。
- **COUNT 优化**：`count(*)` 与 `count(1)` 一样，`count(列)` 会忽略 NULL。

### 8.4 硬件 & 参数调优

- `innodb_buffer_pool_size`：设为物理内存 50%~70%。
- `innodb_log_file_size`：增大提升写性能。
- `max_connections`、`thread_cache_size`。
- 使用 SSD、启用 RAID。

---

## 九、主从复制与高可用

### 9.1 主从复制原理

```
主库:  事务 → binlog → dump thread
从库:  IO thread → relay log → SQL thread → 应用到从库
```

### 9.2 复制模式

- **异步复制**（默认）：主库不等从库，性能最佳，可能丢数据。
- **半同步复制**：至少一个从库接收到 binlog 主库才返回，兼顾性能与一致性。
- **组复制（MGR）**：Paxos 协议，多主高可用。

### 9.3 主从延迟原因与优化

- 原因：大事务、从库单线程、网络、硬件差异。
- 优化：并行复制（MySQL 5.7+ 基于 group commit，8.0 WRITESET）、读写分离、拆分大事务。

### 9.4 高可用方案

- **MHA**：经典方案，故障切换。
- **MGR**（Group Replication）：官方原生集群。
- **Orchestrator**：拓扑管理 + 故障转移。
- **MySQL InnoDB Cluster**：MGR + MySQL Router + MySQL Shell。
- **云方案**：AWS Aurora、TDSQL、PolarDB（存算分离）。

---

## 十、分库分表

### 10.1 何时需要

- 单表数据量 > 1000w 或 > 20GB，查询性能明显下降。
- 单库 QPS 过高，磁盘/CPU 瓶颈。

### 10.2 拆分策略

- **垂直拆分**：按业务拆库；表按列拆分（热冷字段分离）。
- **水平拆分**：按行拆分。
  - 范围分片（按时间、ID 区间）
  - Hash 分片（一致性哈希减少扩容迁移）
  - 路由表/地理位置

### 10.3 分库分表带来的问题

1. **分布式 ID**：Snowflake、Leaf、TinyID、UUID。
2. **跨库 Join**：业务层聚合、全局表、ER 分片。
3. **分布式事务**：2PC、TCC、Saga、本地消息表、最大努力通知。
4. **跨库分页**：二次查询法、禁止深分页。
5. **聚合查询**：建立 ES/ClickHouse 宽表。
6. **扩容迁移**：双写、一致性哈希。

### 10.4 常见中间件

- **Sharding-JDBC**（客户端）
- **MyCAT**（Proxy）
- **Vitess**
- **TDSQL / PolarDB-X**

---

## 十一、常见数据类型与设计规范

### 11.1 数据类型选择

| 类型 | 建议 |
|------|------|
| INT / BIGINT | 自增主键用 BIGINT UNSIGNED |
| DECIMAL | 金额字段必须使用，禁止 FLOAT/DOUBLE |
| VARCHAR(N) | N 按需设置，UTF8MB4 下 N 最大 16383 |
| CHAR | 定长场景（MD5、手机号可选） |
| DATETIME vs TIMESTAMP | DATETIME 范围大，TIMESTAMP 带时区但 2038 问题 |
| TEXT/BLOB | 尽量独立拆表 |
| JSON | 半结构化数据，5.7+ 支持 |

### 11.2 设计规范（阿里巴巴开发手册摘录）

- 所有字段 NOT NULL，提供默认值。
- 表必须有 `id`、`create_time`、`update_time` 三字段。
- 字符集统一 `utf8mb4`。
- 主键自增，避免业务含义。
- 禁止使用外键，由应用层保证。
- 超过三张表不允许 Join。
- VARCHAR 长度不超过 5000，超过改 TEXT 并拆表。

---

## 附录：快速自检 Checklist

- [ ] 能说清 B+Tree 为什么适合数据库索引
- [ ] 能手画 MVCC ReadView 可见性规则
- [ ] 能写出主从复制全流程与延迟优化方法
- [ ] 能结合 EXPLAIN 诊断一个慢 SQL
- [ ] 能解释两阶段提交崩溃恢复逻辑
- [ ] 能给出亿级数据分库分表方案
- [ ] 能说清 RR 级别下幻读是否存在与 Next-Key Lock 工作机制
- [ ] 能回答死锁检测与避免策略

---

**参考资料**：
- 《高性能 MySQL》第 4 版
- 《MySQL 技术内幕：InnoDB 存储引擎》
- MySQL 8.0 Reference Manual
- 极客时间《MySQL 实战 45 讲》（丁奇）
