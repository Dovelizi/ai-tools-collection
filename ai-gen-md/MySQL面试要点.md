# MySQL 面试要点（互联网大厂高频题）

> 汇总互联网公司（BAT、字节、美团、京东、蚂蚁、拼多多等）后端/Java/Go 岗位常见 MySQL 面试题，按主题分类，提供**标准答案框架 + 踩坑点 + 加分项**。

---

## 面试考察地图

| 主题 | 高频度 | 难度 | 典型问法 |
|------|--------|------|---------|
| 索引 B+Tree | ⭐⭐⭐⭐⭐ | 中 | 为什么用 B+Tree？层高？回表？覆盖索引？ |
| 事务 & 隔离级别 | ⭐⭐⭐⭐⭐ | 中 | 四个级别？RR 解决幻读吗？ |
| MVCC | ⭐⭐⭐⭐⭐ | 高 | ReadView？undo 链？RC 和 RR 区别？ |
| 锁 | ⭐⭐⭐⭐⭐ | 高 | 行锁/间隙锁/Next-Key？死锁？ |
| redo/undo/binlog | ⭐⭐⭐⭐ | 高 | 两阶段提交？崩溃恢复？ |
| SQL 优化 | ⭐⭐⭐⭐⭐ | 中 | 慢查询排查？分页优化？ |
| 主从复制 | ⭐⭐⭐⭐ | 中 | 原理？延迟？并行复制？ |
| 分库分表 | ⭐⭐⭐⭐ | 高 | 策略？分布式 ID？跨库事务？ |
| 存储引擎 | ⭐⭐⭐ | 低 | InnoDB vs MyISAM？ |

---

## 一、索引相关（必考）

### Q1: 为什么 MySQL 索引使用 B+Tree 而不是 B-Tree / 红黑树 / Hash？

**答题框架**：
1. **与磁盘 IO 相关**：数据库索引需要落盘，IO 是瓶颈 → 降低树高即可降低 IO 次数。
2. **B+Tree vs B-Tree**：
   - B+Tree 非叶子节点不存数据，同样大小的节点能存更多索引键 → 扇出更大 → 树更矮。
   - 叶子节点形成有序双向链表 → **范围查询**高效（B-Tree 要中序遍历）。
3. **B+Tree vs 红黑树/AVL**：红黑树高度 O(log₂N)，数据量大时高度过深，磁盘 IO 多；B+Tree 以磁盘页为节点大小（16KB），扇出可达上千，3~4 层支撑千万级数据。
4. **B+Tree vs Hash**：Hash 是 O(1)，但不支持范围查询、排序、模糊匹配、最左前缀。

**加分项**：
- 估算：InnoDB 主键索引一个页 16KB，存 1170 个索引项（8字节主键 + 6字节指针），叶子节点存 16 条记录（1KB/行）→ 3 层 = 1170×1170×16 ≈ 2000 万行。
- 提及 LSM-Tree（HBase、RocksDB 用于写密集场景）作为对比。

---

### Q2: 聚簇索引和非聚簇索引区别？什么是回表？

**答题框架**：
- **聚簇索引**：叶子节点存整行数据，InnoDB 主键即聚簇索引。
- **非聚簇索引（二级索引）**：叶子节点存主键值，查询非索引字段时需要拿主键回主键索引查 → **回表**。
- **覆盖索引**：查询字段全部在索引中，无需回表（EXPLAIN Extra=Using index）。

**踩坑点**：
- MyISAM 是非聚簇，叶子节点存的是**数据地址**，没有回表概念。
- InnoDB 如果没有主键，选第一个唯一非空索引；都没有则生成 6 字节隐藏 rowid。

---

### Q3: 什么是最左前缀？联合索引 `(a,b,c)` 下哪些查询能命中？

| 查询 | 是否命中 | 说明 |
|------|---------|------|
| `where a=1` | ✅ | 命中 a |
| `where a=1 and b=2` | ✅ | 命中 a、b |
| `where a=1 and b=2 and c=3` | ✅ | 全命中 |
| `where b=2 and c=3` | ❌ | 违反最左 |
| `where a=1 and c=3` | 部分 | 命中 a，c 需 ICP |
| `where a>1 and b=2` | 部分 | 范围后 b 不能走索引（5.6+ 可 ICP） |
| `where a=1 order by b` | ✅ | 使用索引排序 |

**加分项**：
- **ICP（Index Condition Pushdown）**：MySQL 5.6 引入，把 where 条件下推到引擎层用索引过滤，减少回表。
- 范围查询后的列无法用索引排序（会 Using filesort）。

---

### Q4: 索引失效的场景有哪些？

1. 违反最左前缀原则
2. 索引列上使用函数：`where DATE(create_time)='2024-01-01'`
3. 隐式类型转换：`where varchar_phone = 13800000000`（右侧数字）
4. 左模糊：`like '%xx'`
5. `or` 条件两侧不都有索引
6. `!=`、`<>`、`not in`（非绝对，优化器决定）
7. 索引区分度低（优化器走全表扫描）
8. 使用 `select *` 无法覆盖索引
9. 对索引列使用负向查询（is null 某些版本会失效）

---

### Q5: 怎么设计一个好的索引？

- 高频查询字段建索引；区分度高的字段优先。
- 遵循最左匹配原则设计联合索引。
- 字符串用前缀索引（注意区分度）：`index(url(20))`。
- 避免过多索引（影响写性能，通常 ≤ 5）。
- 避免冗余索引。
- 使用 `EXPLAIN` 验证。

---

## 二、事务 & MVCC（必考）

### Q6: 事务的 ACID 及其实现原理？

| 特性 | 实现 |
|------|------|
| **原子性** | undo log |
| **持久性** | redo log |
| **隔离性** | 锁 + MVCC |
| **一致性** | 前三者共同保证 |

---

### Q7: 四种隔离级别？MySQL 默认是哪个？可能出现什么问题？

| 级别 | 脏读 | 不可重复读 | 幻读 |
|------|------|-----------|------|
| RU | ✓ | ✓ | ✓ |
| RC | ✗ | ✓ | ✓ |
| **RR（默认）** | ✗ | ✗ | ✓（InnoDB 基本解决）|
| Serializable | ✗ | ✗ | ✗ |

**互联网大厂实践**：
- 默认 RR，但**阿里/美团等很多公司线上用 RC**（减少间隙锁带来的死锁，提升并发度）。
- 面试可展开讨论：为什么大厂偏好 RC？
  1. 减少间隙锁 → 并发更好，死锁更少。
  2. 主从复制使用 ROW 格式后不再依赖 RR。
  3. binlog 格式从 STATEMENT 切换到 ROW 解决了 RC 下的主从不一致问题。

---

### Q8: MVCC 的原理？ReadView 如何判断可见性？

**三要素**：
1. 行的隐藏字段：`DB_TRX_ID`（最近修改事务 ID）、`DB_ROLL_PTR`（undo 指针）、`DB_ROW_ID`。
2. undo log 版本链。
3. ReadView：`m_ids`（活跃事务 ID）、`min_trx_id`、`max_trx_id`、`creator_trx_id`。

**可见性判断**：
```
if trx_id == creator_trx_id: 可见（自己改的）
elif trx_id < min_trx_id: 可见（改完已提交）
elif trx_id >= max_trx_id: 不可见（ReadView 之后才启动）
elif trx_id in m_ids: 不可见（还没提交）
else: 可见
```

若不可见，沿 undo log 版本链往下找，直到找到可见版本或到链尾。

**RC vs RR**：
- **RC**：每次 `SELECT` 都生成新 ReadView。
- **RR**：事务内第一次 `SELECT` 生成，之后复用。

---

### Q9: RR 隔离级别下幻读问题真的解决了吗？

- **快照读**（普通 select）：通过 MVCC ReadView 解决，读到的是事务开启时的快照。
- **当前读**（`select ... for update`、`lock in share mode`、增删改）：通过 **Next-Key Lock**（Record Lock + Gap Lock）解决，锁住间隙防止插入。

**未完全解决的场景（经典反例）**：
```sql
-- 事务 A
begin;
select * from t where id=10;  -- 快照读，假设为空

-- 事务 B insert id=10 并提交

-- 事务 A 继续
select * from t where id=10;  -- 仍为空（快照读）
update t set name='x' where id=10;  -- 当前读，此时能改到！
select * from t where id=10;  -- 又能读到了 → 幻读出现
```

---

## 三、锁（高频）

### Q10: InnoDB 有哪些锁？

- **按粒度**：全局锁（FTWRL）、表锁（MDL、意向锁）、行锁。
- **按模式**：共享锁 S、排他锁 X。
- **行锁类型**：
  - Record Lock：单行
  - Gap Lock：间隙
  - Next-Key Lock：Record + Gap（RR 默认）
  - Insert Intention Lock：插入意向锁

---

### Q11: 什么情况下行锁会升级为表锁？

- 查询条件没有使用索引。
- 索引列使用函数/类型转换导致失效。
- 批量更新数据量超过阈值时（某些版本）。

---

### Q12: 如何排查死锁？

```sql
SHOW ENGINE INNODB STATUS;   -- 查看最近一次死锁
SELECT * FROM information_schema.INNODB_TRX;       -- 正在运行事务
SELECT * FROM performance_schema.data_locks;        -- 当前锁
SELECT * FROM performance_schema.data_lock_waits;   -- 锁等待
```

**避免死锁**：
1. 保持相同加锁顺序。
2. 事务尽量小。
3. 合理索引避免锁升级。
4. 可改用乐观锁（版本号、CAS）。
5. 超时重试。

---

### Q13: 一条 `UPDATE` 语句会加什么锁？

以 `update t set name='x' where id=10` 为例（id 为主键）：
- 在 id=10 的记录上加 **X 锁（Record Lock）**。
- 若无匹配行，可能加间隙锁防止幻读（RR 下）。

若 where 条件是普通索引：
- 走二级索引 → 回表 → 二级索引与主键索引上都加锁。

若 where 无索引：
- **锁全表所有行** → 相当于表锁。

---

## 四、日志与崩溃恢复

### Q14: redo log 和 binlog 区别？

| 维度 | redo log | binlog |
|------|----------|--------|
| 所在层 | 引擎层（InnoDB 独有） | Server 层 |
| 类型 | 物理日志（哪个数据页改了什么） | 逻辑日志（SQL 或行变更） |
| 写法 | 循环写，固定大小 | 追加写 |
| 作用 | 崩溃恢复 | 主从复制、数据恢复 |

---

### Q15: 为什么需要两阶段提交？

两阶段提交保证 **redo log 和 binlog 一致**：

```
1. 写 redo log (prepare)
2. 写 binlog
3. 写 redo log (commit)
```

**反证**：
- 若先 redo 再 binlog：redo 写完崩溃 → 主库能恢复数据，但 binlog 没写 → 从库数据丢失。
- 若先 binlog 再 redo：binlog 写完崩溃 → 从库能同步，主库没有 → 主从不一致。

**崩溃恢复**：
- redo 有 commit → 提交。
- redo 有 prepare + binlog 完整 → 提交。
- redo 有 prepare + binlog 不完整 → 回滚。

---

### Q16: `sync_binlog` 和 `innodb_flush_log_at_trx_commit` 如何配置？

**双 1 配置**（最安全）：
- `sync_binlog=1`：每次事务提交都 fsync binlog。
- `innodb_flush_log_at_trx_commit=1`：每次提交都 fsync redo log。

**性能 vs 安全折中**：
- `sync_binlog=1000`、`flush=2`：高性能，但主库崩溃可能丢几秒数据。
- 金融交易系统必须双 1。

---

## 五、SQL 优化（高频）

### Q17: 一条慢 SQL 如何排查与优化？

**流程**：
1. **确认是否真的慢**：慢查询日志、APM（SkyWalking、Pinpoint）、`SHOW PROCESSLIST`。
2. **EXPLAIN 执行计划**：关注 `type`、`key`、`rows`、`Extra`。
3. **分析瓶颈**：
   - 全表扫描？加索引。
   - 大量回表？改用覆盖索引。
   - Using filesort / temporary？调整排序字段或加索引。
4. **改写 SQL**：
   - 拒绝 `select *`
   - 深分页 → 延迟关联 / 游标
   - 子查询 → join
5. **表结构优化**：字段类型、拆表、冗余字段。
6. **架构优化**：缓存、读写分离、分库分表。

---

### Q18: 深度分页 `LIMIT 1000000, 10` 为什么慢？怎么优化？

**原因**：MySQL 要扫描前 1000010 行再丢弃前 100 万行。

**优化方案**：
1. **延迟关联**（推荐）：
   ```sql
   SELECT * FROM orders o 
   INNER JOIN (SELECT id FROM orders ORDER BY id LIMIT 1000000, 10) x 
   ON o.id = x.id;
   ```
2. **使用游标/书签**：
   ```sql
   SELECT * FROM orders WHERE id > #{lastMaxId} ORDER BY id LIMIT 10;
   ```
3. **禁止跳页**：产品层面只允许上/下一页。
4. **ES 聚合**：大数据量场景改由 ES 分页。

---

### Q19: count(*) / count(1) / count(列) 有什么区别？哪个更快？

- `count(*)`：统计所有行，**不忽略 NULL**；MySQL 做了优化，不会取行数据。
- `count(1)`：统计所有行，等价于 `count(*)`，性能相同。
- `count(列名)`：**忽略该列为 NULL 的行**，语义不同。
- `count(主键)`：不忽略 NULL（主键非 NULL）。

**InnoDB vs MyISAM**：
- MyISAM 维护了行数，`count(*)` 是 O(1)。
- InnoDB 没有维护，需要遍历；通常选最小的二级索引扫描（减少 IO）。

---

### Q20: 为什么订单表 / 用户表主键要用自增 ID 而不是 UUID？

**自增 ID 优势**：
1. B+Tree 顺序插入，页分裂少，写入性能高。
2. 空间小（bigint 8 字节 vs UUID 16 字节以上）。
3. 二级索引存储主键，主键越小索引越小。

**UUID 劣势**：
1. 无序导致页分裂频繁。
2. 占用空间大。

**分布式场景**：使用 **Snowflake / Leaf / TinyID** 等趋势递增 ID。

---

## 六、主从复制

### Q21: 主从复制原理？延迟原因？

**原理**：
```
主库事务 → 写 binlog → dump thread 发送
从库 IO thread → 写 relay log → SQL thread 重放
```

**延迟原因**：
1. 主库写入 QPS 过高，从库单线程 SQL thread 跟不上。
2. 大事务（长 binlog 一次性同步）。
3. 网络延迟。
4. 从库机器配置低。
5. 从库有其他负载（被业务查询）。

**优化**：
1. **并行复制**：5.7+ 按组提交并行，8.0 WRITESET 算法并行度更高。
2. 拆分大事务。
3. 提升从库硬件。
4. 读写分离时关键业务走主库。
5. 业务兜底（强一致读走主库）。

---

### Q22: 如何解决主从延迟的读一致性问题？

1. **写后读走主库**（Session 黏滞）。
2. **半同步复制**：保证至少一个从库收到 binlog。
3. **缓存兜底**：写入时双写 Redis，读时先查缓存。
4. **等待位点**：获取主库位点后等从库追上（`MASTER_POS_WAIT`）。
5. **业务降级**：读列表可延迟，详情页走主库。

---

## 七、分库分表（中高级必考）

### Q23: 什么时候需要分库分表？

- **数据量**：单表 > 2000 万行或 > 20GB。
- **QPS**：单库写入 > 5000，读 > 10000。
- **存储瓶颈**：磁盘接近上限。
- **业务隔离**：核心业务独立部署。

---

### Q24: 分片策略有哪些？各有什么优缺点？

| 策略 | 优点 | 缺点 | 适用 |
|------|------|------|------|
| 范围分片 | 扩容简单 | 热点集中 | 时间类数据 |
| Hash 分片 | 数据均匀 | 扩容难（需 rehash） | 通用 |
| 一致性哈希 | 扩容迁移少 | 实现复杂 | 缓存 |
| 路由表 | 灵活 | 路由表单点 | 租户/地理 |

---

### Q25: 分库分表后如何生成全局唯一 ID？

- **UUID**：无序、字符串、占用大，不推荐做主键。
- **Snowflake**：64 bit = 1 符号 + 41 时间戳 + 10 机器 + 12 序列号，趋势递增。
  - 问题：时钟回拨、workerId 分配。
- **Leaf（美团）**：号段模式 + Snowflake 双方案。
- **TinyID（滴滴）**：号段 + 双 Buffer。
- **数据库自增 + 步长**：N 个库步长 N，简单但扩容难。

---

### Q26: 分库分表后如何处理跨库 Join / 分页 / 聚合？

- **Join**：
  - 小表广播（全局表）
  - 业务层多次查询聚合
  - 保证同 sharding key 的表在同一库（ER 分片）
  - 建 ES / ClickHouse 宽表
- **分页**：
  - 禁止深分页
  - 每个分片各取前 N，内存归并
  - 二次查询法（先各分片取 N，排序后获取全局偏移，再查）
- **聚合**：走离线数仓（Hive/Clickhouse）或实时引擎（Flink → ES）。

---

### Q27: 分布式事务如何实现？

| 方案 | 原理 | 适用 |
|------|------|------|
| 2PC (XA) | prepare + commit | 强一致，性能差 |
| TCC | Try-Confirm-Cancel | 业务侵入，金融 |
| Saga | 长事务编排，正反向补偿 | 跨服务长流程 |
| 本地消息表 | 业务与消息同事务 + MQ | 最终一致 |
| 最大努力通知 | 异步通知 + 重试 | 支付回调 |
| Seata | AT/TCC/Saga/XA 封装 | 微服务 |

---

## 八、其他高频问题

### Q28: char 和 varchar 区别？

- `char(N)`：定长，空间固定；检索快；适合长度稳定场景（MD5、手机号）。
- `varchar(N)`：变长，1-2 字节存长度；省空间；更新可能导致行迁移。

### Q29: DATETIME 和 TIMESTAMP 区别？

| | DATETIME | TIMESTAMP |
|---|---|---|
| 字节 | 8 | 4 |
| 范围 | 1000~9999 | 1970~2038 |
| 时区 | 无时区 | 有时区转换 |
| NULL | 允许 | 4字节整型 |

### Q30: MySQL 8.0 有哪些新特性？

1. **默认字符集 utf8mb4**。
2. **默认认证插件改为 caching_sha2_password**。
3. **原子 DDL**（引入数据字典）。
4. **窗口函数**（ROW_NUMBER、RANK、LAG、LEAD）。
5. **CTE（Common Table Expression）**：`WITH RECURSIVE`。
6. **降序索引**（真正支持）。
7. **不可见索引**、**函数索引**。
8. **JSON 功能增强**。
9. **性能改进**：Hash Join、并行查询（部分）。
10. **取消 Query Cache**。

### Q31: 你们线上数据库是怎么部署的？

**通用答法**（结合自身项目）：
- 一主多从 + 半同步复制
- MHA / MGR / 云 RDS 保障高可用
- 读写分离使用 ShardingSphere / MyCat / ProxySQL
- 主库仅处理写和强一致读
- 敏感表不允许 DDL 高峰操作，使用 Online DDL (pt-online-schema-change / gh-ost)
- 监控：Prometheus + Grafana + 慢查询报警
- 备份：物理备份 XtraBackup 每日全量 + binlog 增量

### Q32: 如果有一张千万级的表，需要加一个字段，怎么做？

**方案对比**：
1. **直接 ALTER TABLE**：MySQL 8.0 支持 **instant add column**，秒级完成。但部分类型/位置不支持，会退化为 inplace 或 copy。
2. **pt-online-schema-change**：创建新表 + 触发器同步增量 + 拷贝旧数据 + 原子切换。
3. **gh-ost**（GitHub 开源）：基于 binlog 解析，无触发器，更安全。
4. **主从切换**：先在从库改，切主。

**注意**：
- 避开业务高峰。
- 评估锁表时间。
- 预留足够磁盘空间（临时表）。
- 分批处理、限速避免主从延迟。

---

## 九、场景题 & 手写 SQL

### Q33: 查询每个班级分数前 3 的学生（MySQL 8.0）

```sql
SELECT class, name, score
FROM (
  SELECT class, name, score,
         ROW_NUMBER() OVER (PARTITION BY class ORDER BY score DESC) AS rn
  FROM student
) t
WHERE rn <= 3;
```

MySQL 5.7 不支持窗口函数，用自连接/变量法。

---

### Q34: 设计一个短链接服务的表

```sql
CREATE TABLE short_url (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  short_code VARCHAR(10) NOT NULL,
  long_url VARCHAR(2048) NOT NULL,
  create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
  expire_time DATETIME,
  UNIQUE KEY uk_short_code (short_code),
  KEY idx_create_time (create_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

考察点：主键选择、短码生成（哈希 / 自增转 62 进制）、缓存策略、过期处理。

---

### Q35: 高并发下的扣减库存怎么做？

**方案演进**：
1. **悲观锁**：`SELECT ... FOR UPDATE` → 性能差。
2. **乐观锁**：
   ```sql
   UPDATE stock SET count = count - 1, version = version + 1
   WHERE id = ? AND version = ? AND count > 0;
   ```
3. **redis 预扣减**：Lua 脚本保证原子，异步持久化到 DB。
4. **库存分桶**：拆分热点 key。
5. **消息队列削峰**：请求入队，异步扣减。

---

## 附录：面试答题技巧

1. **分层回答**：是什么 → 为什么 → 怎么做 → 实际遇到的坑。
2. **给数据**：结合 QPS、数据量、延迟指标。
3. **对比**：说 A 时主动对比 B，体现深度。
4. **源码/版本细节**：合适时机抛出 5.6 ICP / 5.7 并行复制 / 8.0 instant DDL 等细节，展现专业度。
5. **项目结合**：把知识点与简历项目结合，避免纯背书。
6. **承认边界**：不会的坦诚不会，但要说清楚思路。

---

**复习建议**：
- 《MySQL 实战 45 讲》（丁奇）× 2 遍
- 官方文档：https://dev.mysql.com/doc/refman/8.0/en/
- 面经：牛客、力扣、GitHub awesome-interview
- 动手：搭建一主两从，模拟延迟、死锁、分库分表
