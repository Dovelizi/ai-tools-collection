import React from 'react';
import {
  Card,
  Title,
  Tag,
  Divider,
  Footer,
  Button,
} from 'animal-island-ui';
import type { CardColor, TagColor } from 'animal-island-ui';

const tagColors: TagColor[] = ['app-teal', 'app-blue', 'purple', 'app-pink', 'app-green', 'app-orange'];
const cardColors: CardColor[] = ['app-teal', 'app-blue', 'purple', 'app-green', 'app-orange', 'app-red'];

export default function HomePage() {
  const handleStart = () => {
    document.getElementById('outline')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="home-page">
      {/* ═══════════ HERO SECTION ═══════════ */}
      <section className="hero-section">
        <div className="hero-bg-leaves">
          <div className="leaf leaf-1" />
          <div className="leaf leaf-2" />
          <div className="leaf leaf-3" />
          <div className="leaf leaf-4" />
          <div className="leaf leaf-5" />
          <div className="leaf leaf-6" />
        </div>
        <div className="hero-content">
          <h1 className="hero-title">AI 工程化探索</h1>
          <p className="hero-subtitle">从 Prompt 到 Context 到 Harness 到 Loop</p>
          <p className="hero-desc">
            大模型是概率性的，生产环境是确定性的。<br />
            模型越来越强，但靠"更好的 prompt"已无法解决系统性问题。
          </p>
          <div className="hero-tags">
            <Tag color="app-teal" size="medium">Prompt</Tag>
            <Tag color="app-blue" size="medium">Context</Tag>
            <Tag color="purple" size="medium">Harness</Tag>
            <Tag color="app-pink" size="medium">Loop</Tag>
          </div>
          <Button type="primary" size="large" onClick={handleStart}>
            立即开始 →
          </Button>
        </div>
        <div className="hero-scroll-hint">
          <span>向下滑动探索</span>
          <div className="scroll-arrow" />
        </div>
      </section>

      {/* ═══════════ OUTLINE SECTION ═══════════ */}
      <section id="outline" className="section">
        <div className="section-title">
          <Title size="large" color="app-teal">文章大纲</Title>
          <p className="section-subtitle">团队分享文档 · 2026 年 7 月</p>
        </div>
        <div className="tags-bar">
          <Tag color="app-teal">Prompt Engineering</Tag>
          <Tag color="app-blue">Context Engineering</Tag>
          <Tag color="purple">Harness Engineering</Tag>
          <Tag color="app-pink">Loop Engineering</Tag>
          <Tag color="app-green">DDD 全栈</Tag>
          <Tag color="app-orange">团队实践</Tag>
        </div>

        <Divider type="line-teal" />

        <div className="outline-grid">
          {[
            { num: '引', title: '前言：AI 编程的真实痛点', desc: '五大不可控痛点与核心矛盾', tags: ['痛点分析', '不可控'], color: cardColors[5] },
            { num: '一', title: 'AI 工程范式演进', desc: 'Prompt → Context → Harness → Loop 四阶段', tags: ['范式演进', '四阶段'], color: cardColors[1] },
            { num: '二', title: '核心技术框架', desc: 'Harness 四动作 + Loop 十要素运行合同', tags: ['Harness', 'Loop'], color: cardColors[2] },
            { num: '三', title: '个人 AI 实践', desc: '日志分析、DDD Skills、CoinFlow 落地', tags: ['个人实践', 'Skill'], color: cardColors[3] },
            { num: '四', title: '团队落地实践', desc: 'DAP 应用六步 AI 工程化路线', tags: ['团队实践', 'DAP'], color: cardColors[4] },
            { num: '结', title: '总结', desc: '模型决定上限，工程决定落地', tags: ['总结', '趋势'], color: cardColors[0] },
          ].map((item, i) => (
            <Card key={item.num} color={cardColors[i]} type="default">
              <div style={{ cursor: 'pointer' }} onClick={() => document.getElementById(`sec-${item.num}`)?.scrollIntoView({ behavior: 'smooth' })}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                  <span style={{ fontFamily: 'Nunito, "Noto Sans SC", sans-serif', fontWeight: 900, fontSize: '22px', color: '#19c8b9' }}>{item.num}</span>
                  <span style={{ fontFamily: 'Nunito, "Noto Sans SC", sans-serif', fontWeight: 700, fontSize: '16px', color: '#794f27' }}>{item.title}</span>
                </div>
                <p style={{ fontSize: '13px', color: '#8a7b66', marginLeft: '38px' }}>{item.desc}</p>
                <div style={{ display: 'flex', gap: '6px', marginTop: '8px', marginLeft: '38px' }}>
                  {item.tags.map((t, j) => (
                    <Tag key={t} color={tagColors[(i * 2 + j) % tagColors.length]} size="small" variant="outlined">{t}</Tag>
                  ))}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </section>

      <Divider type="wave-yellow" />

      {/* ═══════════ SECTION 前言 + 一：AI 工程范式演进 ═══════════ */}
      <section id="sec-引" className="section section-preface">
        <div className="section-title">
          <Title size="large" color="app-red">前言：AI 编程的真实痛点</Title>
        </div>
        <Card type="default">
          <table className="article-table">
            <thead><tr><th>痛点</th><th>表现</th></tr></thead>
            <tbody>
              <tr><td><strong>不可控</strong></td><td>幻觉、目标漂移、死循环不收敛</td></tr>
              <tr><td><strong>不可见</strong></td><td>决策黑盒、Token 消耗不可预测、质量波动</td></tr>
              <tr><td><strong>不可靠</strong></td><td>昨天能用今天不行、换模型行为大变</td></tr>
              <tr><td><strong>不可复用</strong></td><td>每次都从头教 AI、团队经验无法沉淀</td></tr>
              <tr><td><strong>不可度量</strong></td><td>没有 ROI 数据、改进方向不明确</td></tr>
            </tbody>
          </table>
          <blockquote className="article-blockquote">
            核心矛盾：大模型是概率性的，生产环境是确定性的。模型越来越强，但靠"更好的 prompt"已无法解决系统性问题。
          </blockquote>
        </Card>
      </section>

      <Divider type="line-teal" />

      <section id="sec-一" className="section section-evolution">
        <div className="section-title">
          <Title size="large" color="app-blue">一、AI 工程范式演进</Title>
        </div>
        <Card type="default">
          <p className="article-text">AI 工程化经历了清晰的三阶段演进（Prompt → Context → Harness），2026 年进一步延伸至 Loop Engineering：</p>
          <div className="timeline-row">
            {[
              { year: '2023', title: 'Prompt Engineering', desc: '写好提示词让模型输出正确', tag: '单次问答优化', color: 'app-teal' as CardColor },
              { year: '2024', title: 'Context Engineering', desc: '管理有限的上下文窗口', tag: 'RAG + 动态组装', color: 'app-blue' as CardColor },
              { year: '2025', title: 'Harness Engineering', desc: '构建工程外壳包裹大模型', tag: 'Mitchell Hashimoto 首次提出', color: 'purple' as CardColor },
              { year: '2026', title: 'Loop Engineering', desc: '设计自主运行的 Agent 循环', tag: 'Anthropic & LangChain 主推', color: 'app-pink' as CardColor },
            ].map((item) => (
              <div key={item.year} className="timeline-item">
                <div className="timeline-dot" />
                <div className="timeline-year">{item.year}</div>
                <Card type="default" color={item.color}>
                  <div style={{ textAlign: 'center' }}>
                    <strong style={{ fontSize: '15px', color: '#794f27' }}>{item.title}</strong>
                    <p style={{ fontSize: '12px', color: '#8a7b66', marginTop: '4px' }}>{item.desc}</p>
                    <Tag color={item.color} size="small" variant="outlined" key={item.tag}>{item.tag}</Tag>
                  </div>
                </Card>
              </div>
            ))}
          </div>
          <table className="article-table" style={{ marginTop: '24px' }}>
            <thead><tr><th>年份</th><th>范式</th><th>核心</th><th>标志</th></tr></thead>
            <tbody>
              <tr><td>2023</td><td>Prompt Engineering</td><td>写好提示词让模型输出正确</td><td>单次问答优化</td></tr>
              <tr><td>2024</td><td>Context Engineering</td><td>管理有限的上下文窗口</td><td>RAG + 动态组装</td></tr>
              <tr><td>2025</td><td>Harness Engineering</td><td>构建工程外壳包裹大模型</td><td>Mitchell Hashimoto 首次提出</td></tr>
              <tr><td>2026</td><td>Loop Engineering</td><td>设计自主运行的 Agent 循环</td><td>Anthropic & LangChain 主推</td></tr>
            </tbody>
          </table>
          <blockquote className="article-blockquote">
            <strong>每层关系</strong>：下层负责"说清楚"，上层负责"管得住"—— Prompt ⊂ Context ⊂ Harness ⊂ Loop，层层包裹。
          </blockquote>
        </Card>
      </section>

      <Divider type="wave-yellow" />

      {/* ═══════════ SECTION 二：核心技术框架 ═══════════ */}
      <section id="sec-二" className="section section-framework">
        <div className="section-title">
          <Title size="large" color="purple">二、核心技术框架</Title>
        </div>

        {/* 2.1 Prompt Engineering */}
        <div className="subsection">
          <Title size="middle" color="app-teal">2.1 Prompt Engineering：从对话到指令工程</Title>
          <p className="article-text">AI 编程的起点是<strong>单次对话</strong>——开发者输入问题，模型返回答案。这种方式的问题显而易见：每次都是全新开始，模型缺乏上下文，输出质量完全依赖提问者的表达能力。</p>
          <p className="article-text">Prompt Engineering 将"随便问"升级为<strong>结构化的指令设计</strong>，让模型输出从"随机发挥"向"可预期"收敛：</p>
          <table className="article-table">
            <thead><tr><th>阶段</th><th>技术手段</th><th>核心思路</th></tr></thead>
            <tbody>
              <tr><td><strong>零样本（Zero-shot）</strong></td><td>直接提问，不给示例</td><td>"把这段代码重构一下"</td></tr>
              <tr><td><strong>少样本（Few-shot）</strong></td><td>提供 2-3 个输入输出范例</td><td>用示例定义期望的输出格式和风格</td></tr>
              <tr><td><strong>思维链（Chain-of-Thought）</strong></td><td>要求模型展示推理步骤</td><td>"一步一步分析，先理解问题，再给出方案"</td></tr>
              <tr><td><strong>角色设定（System Prompt）</strong></td><td>定义模型的角色和行为边界</td><td>"你是一个资深 iOS 开发工程师，精通 SwiftUI 和 MVVM"</td></tr>
              <tr><td><strong>模板化（Prompt Template）</strong></td><td>将高频场景固化为可复用模板</td><td>标准化日志分析 Prompt、代码审查 Prompt、需求澄清 Prompt</td></tr>
            </tbody>
          </table>
          <p className="article-text"><strong>核心贡献</strong>：首次将"跟 AI 对话"从玄学变成可传授、可复用的技能。一套好的 Prompt 模板可以让不同的人获得相近质量的输出。</p>
          <blockquote className="article-blockquote"><strong>明确局限</strong>：稳定性差（改动一个词输出可能完全不同）、缺乏记忆（每次对话独立，无法跨会话积累知识）、幻觉不收敛（Prompt 写得好可以降低幻觉概率，但无法根除——这是概率模型的本质特征）、无法规模化（每个新场景都需要手工调优 Prompt，人力成本线性增长）。这些局限指向一个更根本的问题：<strong>只靠优化"输入指令"无法解决系统性问题，需要从"输入"延伸到"环境"</strong> —— Context Engineering 由此诞生。</blockquote>
        </div>

        {/* 2.2 Context Engineering */}
        <div className="subsection">
          <Title size="middle" color="app-blue">2.2 Context Engineering：为 AI 构建操作系统</Title>
          <p className="article-text">如果说 Prompt Engineering 是"教 AI 怎么说话"，Context Engineering 就是<strong>设计 AI 思考和行动的完整环境</strong>。</p>
          <blockquote className="article-blockquote"><strong>核心类比（Andrej Karpathy）</strong>："LLM 就像 CPU，上下文窗口就是 RAM。就像操作系统管理什么数据进入内存，Context Engineering 管理什么信息进入 AI 的上下文窗口。" — 这个类比揭示了为什么 Context Engineering 是 Prompt Engineering 的质变——Prompt 只是优化输入指令，Context 是在设计 AI 的"操作系统"。</blockquote>
          <p className="article-text"><strong>五项核心技术</strong>（源自 Anthropic 2025 年工程实践总结）：</p>
          <table className="article-table">
            <thead><tr><th>技术</th><th>说明</th><th>典型场景</th></tr></thead>
            <tbody>
              <tr><td><strong>渐进式披露（Progressive Disclosure）</strong></td><td>上下文只放索引（文件路径、表名、模块名），AI 按需通过工具加载完整内容</td><td>大型代码库导航：CLAUDE.md 放架构索引，具体文件由 AI 自行读取</td></tr>
              <tr><td><strong>压缩（Compaction）</strong></td><td>将长对话历史压缩为结构化摘要，释放上下文窗口给当前任务</td><td>长时间对话接近上下文上限时自动触发，保留关键决策和产物路径</td></tr>
              <tr><td><strong>即时加载（Just-in-Time Loading）</strong></td><td>工具定义、规范文件不预加载到上下文，而是 AI 在需要时主动获取</td><td>代码审查 Agent：先看 diff，发现安全相关变更时才加载安全规范</td></tr>
              <tr><td><strong>结构化笔记（Structured Note-Taking）</strong></td><td>Agent 将进度、决策、待办写入外部文件，后续读取恢复状态</td><td>跨多轮对话的长时间任务：每完成一步写 checkpoint，崩溃后可恢复</td></tr>
              <tr><td><strong>子 Agent 隔离（Sub-Agent Isolation）</strong></td><td>为子任务启动独立 Agent（干净上下文），只返回 1-2k token 的结构化摘要</td><td>并行调研多个技术方案，各自深入分析后汇总到主 Agent</td></tr>
            </tbody>
          </table>
          <p className="article-text"><strong>CLAUDE.md / AGENTS.md 是 Context Engineering 的工程化落地</strong>：放在项目根目录，每次会话自动加载；包含技术栈、编码规范、架构约定、常见陷阱；本质是"上下文预加载"——让 AI 在进入项目时无需反复询问基础信息；2026 年已逐步成为行业标准，GitHub、Vercel、LangChain 等公司均已采用。</p>
          <blockquote className="article-blockquote"><strong>核心洞察（Anthropic）</strong>："找到最小的高信号 Token 集合，在有限的上下文窗口中最大化期望结果的概率。" 换句话说：<strong>不是塞越多越好，而是精准注入最有价值的上下文</strong>。研究表明，结构精良的 16K token RAG 注入效果好于 128K 的全量上下文堆砌——因为后者稀释了注意力预算。</blockquote>
          <blockquote className="article-blockquote"><strong>仍有局限</strong>：上下文窗口有限（LLM 注意力机制存在"迷失在中间"问题，中部信息理解准确率显著低于开头和结尾）、信息检索精度瓶颈（RAG 召回率和排序质量直接影响输出）、被动性（Context 决定了 AI 能看到什么，但<strong>不控制 AI 会做什么</strong>）、无验证闭环（缺少"验证"环节——AI 输出是否正确、是否合规，需要额外的工程机制来保障）。这正是 Context Engineering 的边界：<strong>告知 AI 该做什么 ≠ 确保 AI 真的做到了</strong>。要解决"确保做到"的问题，需要一个能约束、验证、纠正 AI 行为的工程外壳——即 Harness Engineering。</blockquote>
        </div>

        {/* 2.3 Harness Engineering */}
        <div className="subsection">
          <Title size="middle" color="purple">2.3 Harness Engineering：驾驭 AI 的工程外壳</Title>
          <blockquote className="article-blockquote">"Agent = Model + Harness" —— Mitchell Hashimoto（HashiCorp 创始人、Ghostty 作者）</blockquote>
          <p className="article-text">Context Engineering 解决了"告知 AI"的问题，但<strong>告知 ≠ 执行</strong>。Harness Engineering 进一步解决"约束 AI 的行为"——如果 Context 是 AI 的操作系统，Harness 就是 AI 的<strong>工程护栏</strong>。Mitchell Hashimoto 在 2025-2026 年间系统阐述了 Harness 思想，核心理念是：</p>
          <blockquote className="article-blockquote">"每次发现 Agent 犯了一个错误，不要只是修正它——而是设计一个工程机制，让它永远不会再犯这类错误。" 这意味着：当 AI 写出不规范的代码，不是让它重写，而是把规则写入 CLAUDE.md；当 AI 使用了错误的技术栈，不是手动修改，而是配置 Linter 自动拦截。<strong>每条规则背后都是一次失败——Harness 的本质是用工程手段将失败教训固化为系统约束。</strong></blockquote>
          <p className="article-text">LangChain 团队通过纯粹的 Harness 改进（不改模型），将编码 Agent 准确率从 <strong>52.8% 提升到 66.5%</strong>；Vercel 将 v0 的工具从 15 个精简到 2 个最有用的，准确率从 <strong>80% 提升到 100%</strong>。这些数据说明：<strong>在模型能力确定的情况下，Harness 质量决定了 Agent 的上限。</strong></p>
          <p className="article-text">Harness 原意是马的缰绳——没有缰绳，再好的马也无法驾驭。Harness 通过四个核心动作让 AI 从"能回答"变成"能完成"：</p>
          <table className="article-table">
            <thead><tr><th>动作</th><th>含义</th><th>工程实现</th></tr></thead>
            <tbody>
              <tr><td><strong>Constrain（约束）</strong></td><td>设定边界，防止越界</td><td>权限控制、沙箱、禁止清单</td></tr>
              <tr><td><strong>Inform（告知）</strong></td><td>提供上下文</td><td>CLAUDE.md、AGENTS.md、RAG</td></tr>
              <tr><td><strong>Verify（验证）</strong></td><td>自动检查输出</td><td>Linter、单元测试、E2E 测试</td></tr>
              <tr><td><strong>Correct（纠正）</strong></td><td>基于反馈迭代</td><td>错误回传 → 自动修复 → 再验证</td></tr>
            </tbody>
          </table>
          <div className="flowchart-v">
            {[
              { layer: '编排层', en: 'Orchestration', items: ['任务拆解与调度', '终止判断'], color: 'purple' as CardColor, tc: 'purple' as TagColor },
              { layer: '反馈层', en: 'Feedback', items: ['自动 Lint / 测试', '错误回传 + 驱动修复'], color: 'app-pink' as CardColor, tc: 'app-pink' as TagColor },
              { layer: '记忆层', en: 'Memory', items: ['AGENTS.md / CLAUDE.md', '渐进式披露：索引 → 按需加载'], color: 'app-blue' as CardColor, tc: 'app-blue' as TagColor },
              { layer: '执行层', en: 'Execution', items: ['Bash 沙箱 + 文件读写', 'MCP 工具集 + 浏览器'], color: 'app-teal' as CardColor, tc: 'app-teal' as TagColor },
            ].map((l, i) => (
              <div key={l.layer} className="flowchart-v-item">
                <Card type="default" color={l.color} style={{ width: '100%' }}>
                  <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                    paddingBottom: '14px', marginBottom: '14px',
                    borderBottom: '1px dashed #e8dcc8',
                  }}>
                    <span style={{ fontFamily: 'Nunito, "Noto Sans SC", sans-serif', fontWeight: 900, fontSize: '17px', color: '#794f27' }}>{l.layer}</span>
                    <Tag color={l.tc} size="small" variant="solid">{l.en}</Tag>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {l.items.map((item) => (
                      <div key={item} style={{
                        background: 'rgb(247, 243, 223)',
                        border: '2px solid #c4b89e',
                        borderRadius: '14px',
                        padding: '8px 18px',
                        textAlign: 'center',
                        fontFamily: 'Nunito, "Noto Sans SC", sans-serif',
                        fontWeight: 700,
                        fontSize: '13px',
                        color: '#794f27',
                      }}>{item}</div>
                    ))}
                  </div>
                </Card>
                {i < 3 && <div className="flow-connector flow-connector-v" />}
              </div>
            ))}
          </div>
          <blockquote className="article-blockquote">大模型越强，外壳可以做得越薄，但这层外壳永远不会消失。</blockquote>
        </div>

        <div className="subsection">
          <Title size="middle" color="app-pink">2.4 Loop Engineering：让 AI 自主持续运行</Title>
          <p className="article-text">Loop 解决的是 Harness 之外的问题——让 Agent 从"单次可控"走向"持续自主运行"。</p>
          <div className="flowchart-h">
            {[
              { label: '目标', nodeColor: 'flow-node-blue' },
              { label: '触发器', nodeColor: 'flow-node-teal' },
              { label: '工作区', nodeColor: 'flow-node-teal' },
              { label: '上下文', nodeColor: 'flow-node-teal' },
              { label: '委派', nodeColor: 'flow-node-teal' },
              { label: '验证', nodeColor: 'flow-node-green' },
              { label: '状态', nodeColor: 'flow-node-teal' },
              { label: '预算', nodeColor: 'flow-node-red' },
              { label: '升级', nodeColor: 'flow-node-teal' },
              { label: '退出', nodeColor: 'flow-node-teal' },
            ].map((s, i) => (
              <React.Fragment key={s.label}>
                {i > 0 && <div className="flow-connector flow-connector-h" />}
                <span className={`flow-node ${s.nodeColor}`}>{s.label}</span>
              </React.Fragment>
            ))}
          </div>
          <div className="principles-grid">
            {[
              { title: '确定性检查把关', desc: '用测试/类型/lint 判定完成，不让 Agent 自评' },
              { title: '硬预算上限', desc: '迭代次数、Token、时间三者至少设其一' },
              { title: '熔断机制', desc: '连续无进展 → 自动终止通知人工' },
              { title: '先 Harness 再 Loop', desc: '单次不可靠的系统，循环只会放大问题' },
            ].map((p) => (
              <Card key={p.title} color="app-teal" type="default">
                <div style={{ textAlign: 'center' }}>
                  <strong style={{ color: '#794f27' }}>{p.title}</strong>
                  <p style={{ fontSize: '13px', color: '#8a7b66', marginTop: '4px' }}>{p.desc}</p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <Divider type="wave-yellow" />

      {/* ═══════════ SECTION 三：个人AI实践 ═══════════ */}
      <section id="sec-三" className="section section-practice">
        <div className="section-title">
          <Title size="large" color="app-green">三、个人 AI 实践</Title>
        </div>

        {/* 3.1 */}
        <div className="subsection">
          <Title size="middle" color="app-teal">3.1 从对话到工程体系的认知演进</Title>

          <h3 className="sub-heading">3.1.1 智能日志分析 Prompt</h3>
          <p className="article-text">针对团队项目日志定位效率低的问题，构建了一套基于标准化 Prompt + MCP 工具链的智能分析流程：</p>
          <div className="flowchart-h">
            <span className="flow-node flow-node-red">智研告警日志</span>
            <div className="flow-connector flow-connector-h" />
            <span className="flow-node flow-node-blue">标准化 Prompt 解析日志类型</span>
            <div className="flow-connector flow-connector-h" />
            <Tag color="app-yellow" size="medium" variant="solid">告警类型分流</Tag>
          </div>
          <div className="flowchart-branch">
            <div className="flowchart-branch-col">
              <Card type="default" color="app-teal">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  <Tag color="app-red" size="small" variant="solid">错误类</Tag>
                  <strong style={{ fontSize: '13px', color: '#794f27' }}>腾讯云 CLI 查询服务日志</strong>
                </div>
              </Card>
              <div className="flow-connector flow-connector-v" />
              <Card type="default" color="app-teal">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <strong style={{ fontSize: '13px', color: '#794f27' }}>工蜂 MCP 拉取代码分析</strong>
                </div>
              </Card>
            </div>
            <div className="flowchart-branch-merge" />
            <div className="flowchart-branch-col">
              <Card type="default" color="app-teal">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  <Tag color="app-orange" size="small" variant="solid">流量/性能类</Tag>
                  <strong style={{ fontSize: '13px', color: '#794f27' }}>腾讯云 CLI 查询服务日志</strong>
                </div>
              </Card>
              <div className="flow-connector flow-connector-v" />
              <Card type="default" color="app-teal">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <strong style={{ fontSize: '13px', color: '#794f27' }}>七彩石 MCP 检查配置变更</strong>
                </div>
              </Card>
            </div>
          </div>
          <div className="flowchart-h" style={{ justifyContent: 'center' }}>
            <span className="flow-node flow-node-blue">代码 + 日志 综合分析</span>
            <div className="flow-connector flow-connector-h" />
            <span className="flow-node flow-node-green">标准化输出：服务名/错误原因/代码逻辑</span>
          </div>
          <div className="flow-points">
            {[
              { label: '错误类告警', text: '调用腾讯云 CLI 按时间范围和关键字检索对应服务日志 → 工蜂 MCP 拉取报错服务代码 → 结合代码与日志分析根因' },
              { label: '流量/性能类告警', text: '额外查询七彩石 MCP 判断是否存在配置变更，综合同比/环比数据分析' },
              { label: '输出标准化', text: '统一格式输出服务名称、错误原因、代码逻辑、修复建议' },
            ].map((fp) => (
              <Card key={fp.label} type="default">
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                  <Tag color="app-teal" size="small" variant="solid">{fp.label}</Tag>
                  <p style={{ fontSize: '14px', color: '#725d42', lineHeight: 1.6, flex: 1 }}>{fp.text}</p>
                </div>
              </Card>
            ))}
          </div>

          <h3 className="sub-heading">3.1.2 日志采集分析平台</h3>
          <p className="article-text">主导搭建了一套日志采集分析平台，具备自动采集、错误聚合、可视化统计、大模型智能分析日报等功能。整个开发过程完整经历了 AI 工程化认知的三个阶段：</p>
          <table className="article-table">
            <thead><tr><th>阶段</th><th>认知水平</th><th>做法</th><th>结果</th></tr></thead>
            <tbody>
              <tr><td><strong>初期</strong></td><td>对话驱动</td><td>只定义功能需求，直接让 AI 自由开发</td><td>技术选型混乱（Python + SQLite）、前后端高度耦合、UI 风格不统一</td></tr>
              <tr><td><strong>中期</strong></td><td>Prompt + Context 工程</td><td>先定义标准化约束，再明确整体架构后让 AI 执行</td><td>将项目从 Python 无缝迁移重构为 Java 技术栈</td></tr>
              <tr><td><strong>后期</strong></td><td>Skill 工程化</td><td>整理项目架构索引，后续迭代严格遵循统一规范</td><td>AI 稳定按架构要求完成迭代，开发效率与交付质量大幅提升</td></tr>
            </tbody>
          </table>
          <blockquote className="article-blockquote">
            <strong>核心认知</strong>：从单纯的"跟 AI 对话" → 定义标准化 Prompt → 建立结构化 Context（技术栈、架构索引、编码规范）→ 沉淀为可复用的 Skill 工程体系。每一步都是对 AI 不可控性的逐步收敛。
          </blockquote>
        </div>

        {/* 3.2 */}
        <div className="subsection">
          <Title size="middle" color="app-blue">3.2 Skills 实践：DDD 全栈开发工作流工程化</Title>
          <p className="article-text">将 DDD 全栈开发的完整工作流固化为可复用的 Skill 文件，形成三个 Skill 覆盖完整链路：</p>
          <table className="article-table">
            <thead><tr><th>Skill</th><th>类型</th><th>职责</th></tr></thead>
            <tbody>
              <tr><td><strong>ddd-web-fullstack-dev</strong></td><td>单 Agent</td><td>一个 Agent 承载全部 8 步：战略 DDD → 战术 DDD → 架构文档 → 编码 → 单测 → E2E → 验收</td></tr>
              <tr><td><strong>ddd-web-fullstack-agent-dev</strong></td><td>多 Agent 接力</td><td>Planner（设计）→ Dev（编码）→ QA（测试）三阶段接力，每阶段只加载本阶段规范</td></tr>
              <tr><td><strong>ddd-design-review</strong></td><td>单 Agent</td><td>对设计方案进行规范合规评审，输出内容解析 + 优缺点 + 改进意见</td></tr>
            </tbody>
          </table>
          <blockquote className="article-blockquote">核心原则：<strong>先建模再编码，测试不全绿不报完成。</strong></blockquote>

          <h3 className="sub-heading">单 Agent vs 多 Agent 对比</h3>
          <table className="article-table">
            <thead><tr><th>维度</th><th>单 Agent</th><th>多 Agent 接力</th></tr></thead>
            <tbody>
              <tr><td><strong>上下文管理</strong></td><td>全量 Skill 文件一次性加载，大项目容易超限</td><td>每阶段只加载当前需要的规范文件，上下文精简</td></tr>
              <tr><td><strong>质量保障</strong></td><td>自查自纠，缺少独立验证视角</td><td>三道独立关卡：方案审批 → mvn test 全绿 → Playwright 全绿</td></tr>
              <tr><td><strong>协作复杂度</strong></td><td>低，无需产物交接</td><td>需精确传递产物路径（ARCHITECTURE.md、DEV_PLAN.md）</td></tr>
              <tr><td><strong>分阶段审批</strong></td><td>仅编码前一次用户审批</td><td>Planner 产出后审批 + Dev 完成后 QA 独立验收</td></tr>
              <tr><td><strong>适用场景</strong></td><td>小型项目、快速原型</td><td>中大型项目、需要独立 QA 验证的场景</td></tr>
            </tbody>
          </table>
          <p className="article-text"><strong>多 Agent 的必要性</strong>：上下文隔离（DDD 全栈项目单 Agent 必然超出上下文窗口）、独立验证（设计/编码/测试由不同 Agent 执行）、质量门禁（每阶段有明确通过条件，问题在阶段边界被拦截）。</p>
        </div>

        {/* 3.3 */}
        <div className="subsection">
          <Title size="middle" color="app-orange">3.3 个人项目实战：CoinFlow</Title>
          <h3 className="sub-heading">3.3.1 项目背景</h3>
          <p className="article-text">CoinFlow 是个人 iOS 记账应用（SwiftUI + MVVM），基于前面积累的 AI 工程化经验，将 Harness 思想落地为项目专属的 AI 研发基础设施。</p>

          <h3 className="sub-heading">3.3.2 先定标准、再定架构、再规范流程</h3>
          <p className="article-text">CoinFlow 的启动方式与传统 AI 开发截然不同——<strong>没有先急于敲定技术架构，而是以需求为核心，让 AI 直接基于真实业务场景，设计出一套可在 iOS 真机运行、Swift 实现的完整 UI 交互原型</strong>。这套真机 UI 成为后续所有开发的走查标准：</p>
          <div className="flowchart-h">
            {[
              { label: '业务方需求', nodeColor: 'flow-node-teal' },
              { label: '需求澄清', nodeColor: 'flow-node-teal' },
              { label: 'UI 原型（真机可运行）', nodeColor: 'flow-node-yellow' },
              { label: '技术方案评审', nodeColor: 'flow-node-teal' },
              { label: '开发实现', nodeColor: 'flow-node-teal' },
              { label: '测试验证', nodeColor: 'flow-node-teal' },
              { label: '验收上线', nodeColor: 'flow-node-green' },
            ].map((s, i) => (
              <React.Fragment key={s.label}>
                {i > 0 && <div className="flow-connector flow-connector-h" />}
                <span className={`flow-node ${s.nodeColor}`}>{s.label}</span>
              </React.Fragment>
            ))}
          </div>
          <p className="article-text"><strong>核心理念</strong>：先定标准（UI 原型）→ 再定架构 → 再规范 AI 执行流程，让 AI 不再自由发挥，而是完全按照真实项目流程、固定规范交付。</p>

          <h3 className="sub-heading">3.3.3 coinflow-workflow：Harness 四层落地的 Skill 设计</h3>
          <p className="article-text">将上述流程固化为四个命令 + 三角色协作的 Skill 体系：</p>
          <table className="article-table">
            <thead><tr><th>Harness 动作</th><th>Skill 实现</th></tr></thead>
            <tbody>
              <tr><td><strong>Constrain（约束）</strong></td><td>tech-boundaries.md 定义硬约束（iOS 26+、禁止 SwiftData、金额用 Decimal、SQL 参数化、KISS/DRY/YAGNI）</td></tr>
              <tr><td><strong>Inform（告知）</strong></td><td>coinflow-patterns 提供架构模式（MVVM+Repository、主题系统、导航模式）、PROJECT_PLAN.md 追踪进度</td></tr>
              <tr><td><strong>Verify（验证）</strong></td><td>四命令三角色协作，QA 角色独立在 iOS 26.x 真机验证，/polish 含三主题全量截图对比</td></tr>
              <tr><td><strong>Correct（纠正）</strong></td><td>QA 发现问题 → 提回 DEV → 修复 → 重新验证，循环至全绿</td></tr>
            </tbody>
          </table>

          <h3 className="sub-heading">四命令体系</h3>
          <table className="article-table">
            <thead><tr><th>命令</th><th>角色链</th><th>产出</th></tr></thead>
            <tbody>
              <tr><td><strong>/plan</strong></td><td>用户 + AI</td><td>需求方向讨论，更新 PROJECT_PLAN.md</td></tr>
              <tr><td><strong>/feature</strong></td><td>BA → DEV → QA</td><td>requirements.md + tech-design.md + test-report.md</td></tr>
              <tr><td><strong>/bugfix</strong></td><td>DEV → QA</td><td>root-cause.md + verification-report.md</td></tr>
              <tr><td><strong>/polish</strong></td><td>UI → DEV → QA</td><td>design-spec.md + visual-diff.md + test-report.md</td></tr>
            </tbody>
          </table>

          <h3 className="sub-heading">3.3.4 技术演进总结</h3>
          <p className="article-text">从 3.1 的「对话 → Prompt → Context → Skill」认知演进，到 3.2 的 Skill 方法论，再到 CoinFlow 将这一切落地为真实可运行的项目：AI 从不可控的对话工具 → 被 Harness 约束为按规范执行的工程伙伴。先定 UI 标准、再定技术架构、再固化 AI 执行流程——每一步都在收敛 AI 的不可控性。</p>
        </div>

        {/* 3.4 */}
        <div className="subsection">
          <Title size="middle" color="app-pink">3.4 AI 在其他方向的应用</Title>
          <table className="article-table">
            <thead><tr><th>方向</th><th>说明</th></tr></thead>
            <tbody>
              <tr><td><strong>AI 辅助模拟面试</strong></td><td>使用 AI 搭建面试 Skills，基于真实面经记录持续进化，覆盖技术问答、系统设计、行为面试等场景</td></tr>
              <tr><td><strong>AI 整理技术内容发布博客</strong></td><td>使用 AI 整理优质文章和技术视频的核心要点，转化为结构化博客内容</td></tr>
              <tr><td><strong>AI VibeCoding 趣味项目</strong></td><td>使用 AI 快速探索各类有趣小项目，低成本验证想法、学习新技术</td></tr>
            </tbody>
          </table>
        </div>

        {/* 3.5 */}
        <div className="subsection">
          <Title size="middle" color="purple">3.5 实用性 Skills 推荐</Title>
          <p className="article-text"><strong>首推：andrej-karpathy 编码原则</strong> — KISS/DRY/YAGNI、不可变数据、小文件小函数、不写注释除非 WHY——目前最成熟的 AI 编码行为规范。</p>
          <p className="article-text"><strong>编程第一性原则</strong>（基于 karpathy 原则扩展）— 14 章完整治理体系：行为铁律、预编码反思、自适应思考深度、外科手术式修改、简洁优先、工程基线、假设与验证、文档同步等。核心思想：<strong>第一性原理思维</strong>——每个决策追溯至系统约束或原子业务需求，而非遵循先例。</p>
          <p className="article-text"><strong>Superpowers（Skills 集合）</strong> — 一套完整的 AI 工程化 Skills 集合，涵盖从需求到交付的全流程。其中 <strong>brainstorming</strong> 是最核心的流程起点。</p>
          <h3 className="sub-heading">ECC 高频实用 Skills</h3>
          <table className="article-table">
            <thead><tr><th>Skill</th><th>用途</th><th>适用场景</th></tr></thead>
            <tbody>
              <tr><td><strong>ecc:frontend-design-direction</strong></td><td>UI/UX 设计方向指导</td><td>前端页面设计、组件美化</td></tr>
              <tr><td><strong>ecc:code-reviewer</strong></td><td>代码审查</td><td>每次写完代码后</td></tr>
              <tr><td><strong>ecc:security-reviewer</strong></td><td>安全漏洞检测</td><td>涉及认证、鉴权、用户输入</td></tr>
              <tr><td><strong>ecc:tdd-guide</strong></td><td>测试驱动开发</td><td>新功能开发、Bug 修复</td></tr>
              <tr><td><strong>ecc:build-error-resolver</strong></td><td>构建错误修复</td><td>编译/构建失败时</td></tr>
              <tr><td><strong>ecc:planner</strong></td><td>实现规划</td><td>复杂功能、重构前</td></tr>
              <tr><td><strong>ecc:architect</strong></td><td>系统架构设计</td><td>技术选型、架构决策</td></tr>
            </tbody>
          </table>
        </div>
      </section>

      <Divider type="wave-yellow" />

      {/* ═══════════ SECTION 四：团队落地实践 ═══════════ */}
      <section id="sec-四" className="section section-team">
        <div className="section-title">
          <Title size="large" color="app-orange">四、团队落地实践：DAP 应用 AI 工程化路线</Title>
        </div>
        <blockquote className="article-blockquote">以团队核心项目 Dap 应用为落地载体，分阶段推进 AI 工程化，每一步都有明确的产出和验收标准。</blockquote>

        <div className="team-steps">
          {[
            {
              step: '4.1', title: '让 AI 看懂项目：架构梳理与知识图谱',
              status: '已完成/进行中', statusColor: 'app-green' as TagColor,
              body: <>
                <p className="article-text"><strong>已完成：全项目技术架构梳理</strong> — 前期借助 AI 完成了 DAP 应用的全项目技术架构梳理，产出包括：技术架构全景图（路由层 → Controller → Service → Model → 数据层）、数据表全景文档（ER 关系图及表关联逻辑）、完整业务链路文档（典型业务场景全流程细节）。</p>
                <p className="article-text"><strong>进行中：知识图谱构建</strong> — 将架构文档、数据表关系、业务链路三类信息统一建模为结构化知识节点，实现项目信息可检索。</p>
                <div className="flowchart-v">
                  <div className="flowchart-h" style={{ justifyContent: 'center' }}>
                    <Card type="default" color="app-teal">
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <strong style={{ fontSize: '13px', color: '#794f27' }}>源码</strong>
                      </div>
                    </Card>
                    <span style={{ fontSize: '18px', color: '#c4b89e', fontWeight: 900, margin: '0 6px', userSelect: 'none' }}>+</span>
                    <Card type="default" color="app-teal">
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <strong style={{ fontSize: '13px', color: '#794f27' }}>数据库</strong>
                      </div>
                    </Card>
                  </div>
                  <div className="flow-connector flow-connector-v" />
                  <Card type="default" color="app-blue">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <strong style={{ fontSize: '14px', color: '#794f27' }}>AI 架构分析</strong>
                    </div>
                  </Card>
                  <div className="flow-connector flow-connector-v" />
                  <div className="flowchart-h" style={{ justifyContent: 'center' }}>
                    {['技术架构文档', '数据表 ER 关系图', '业务链路文档'].map((doc) => (
                      <Card key={doc} type="default" color="app-teal">
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <strong style={{ fontSize: '12px', color: '#794f27' }}>{doc}</strong>
                        </div>
                      </Card>
                    ))}
                  </div>
                  <div className="flow-connector flow-connector-v" />
                  <Card type="default" color="app-yellow">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <strong style={{ fontSize: '14px', color: '#794f27' }}>知识图谱</strong>
                    </div>
                  </Card>
                  <div className="flow-connector flow-connector-v" />
                  <div className="flowchart-h" style={{ justifyContent: 'center' }}>
                    {['结构化检索', '上下文按需加载'].map((out) => (
                      <Card key={out} type="default" color="app-green">
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <strong style={{ fontSize: '12px', color: '#794f27' }}>{out}</strong>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              </>,
            },
            {
              step: '4.2', title: '让 AI 规范编码：统一开发规范',
              status: '近期', statusColor: 'app-yellow' as TagColor,
              body: <>
                <p className="article-text">结合项目现有技术栈，统一制定开发规范，配合知识图谱让 AI 能准确理解项目架构与业务逻辑。</p>
                <table className="article-table">
                  <thead><tr><th>规范类别</th><th>具体内容</th></tr></thead>
                  <tbody>
                    <tr><td><strong>技术版本固定</strong></td><td>明确技术栈版本（Ruby 2.3.3、Rails x.x、MySQL x.x 等），消除版本不确定性</td></tr>
                    <tr><td><strong>数据表设计规范</strong></td><td>统一命名规范、字段类型选型标准、必备字段（created_at/updated_at）、索引设计原则</td></tr>
                    <tr><td><strong>代码编写规范</strong></td><td>文件组织规则、命名规范、模块划分原则、错误处理模式</td></tr>
                    <tr><td><strong>注释规范</strong></td><td>类注释说明职责、方法注释说明入参/出参/副作用、关键逻辑注释说明 WHY</td></tr>
                  </tbody>
                </table>
                <p className="article-text"><strong>设计考量</strong>：团队对 Ruby 语法熟悉度不足，强制注释规范有两个目的：① 降低团队成员阅读代码的门槛；② 为 AI 提供更丰富的上下文，提升后续 AI 辅助编码的准确率。</p>
                <div className="flowchart-v">
                  <Card type="default" color="app-blue">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <strong style={{ fontSize: '14px', color: '#794f27' }}>统一开发规范</strong>
                    </div>
                  </Card>
                  <div className="flow-connector flow-connector-v" />
                  <div className="flowchart-h" style={{ justifyContent: 'center' }}>
                    <Card type="default" color="app-teal">
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <strong style={{ fontSize: '12px', color: '#794f27' }}>代码风格一致</strong>
                      </div>
                    </Card>
                    <Card type="default" color="app-teal">
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <strong style={{ fontSize: '12px', color: '#794f27' }}>注释完整</strong>
                      </div>
                    </Card>
                  </div>
                  <div className="flow-connector flow-connector-v" />
                  <Card type="default" color="app-yellow">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <strong style={{ fontSize: '14px', color: '#794f27' }}>AI 更准确理解代码意图</strong>
                    </div>
                  </Card>
                  <div className="flow-connector flow-connector-v" />
                  <Card type="default" color="app-teal">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <strong style={{ fontSize: '14px', color: '#794f27' }}>AI 辅助编码效率提升</strong>
                    </div>
                  </Card>
                  <div className="flow-connector flow-connector-v" />
                  <Card type="default" color="app-green">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <strong style={{ fontSize: '14px', color: '#794f27' }}>团队开发迭代加速</strong>
                    </div>
                  </Card>
                </div>
              </>,
            },
            {
              step: '4.3', title: '让 AI 高效检索：RAG 代码索引',
              status: '近期', statusColor: 'app-yellow' as TagColor,
              body: <>
                <p className="article-text">基于知识图谱与规范体系，构建 RAG（检索增强生成）代码层面的索引：将源码、架构文档、业务链路文档向量化存储；支持自然语言检索（如"订单状态流转涉及哪些表"、"推广者分佣计算逻辑在哪"）；开发新功能时 AI 自动检索相关代码上下文。技术选型考量：向量数据库（Milvus/Chroma）+ Embedding 模型 + 检索策略（关键词+语义混合检索）。</p>
              </>,
            },
            {
              step: '4.4', title: '让 AI 自主协作：多 Agent 分工',
              status: '远期规划', statusColor: 'purple' as TagColor,
              body: <>
                <p className="article-text">在知识图谱 + RAG 基础设施就绪后，引入多 Agent 协作模式：按职责划分 Agent 角色（需求分析 Agent、架构设计 Agent、编码 Agent、测试 Agent、代码审查 Agent）；明确每个 Agent 的工作范围边界（输入/输出/不做什么）；定义 Agent 间的协作协议（产物格式、交接标准、冲突处理机制）。目标：团队成员只需描述需求，多个 Agent 自动分工协作完成端到端交付。</p>
              </>,
            },
            {
              step: '4.5', title: '让 AI 可追溯：全流程报告',
              status: '远期规划', statusColor: 'purple' as TagColor,
              body: <>
                <p className="article-text">建立全流程可追溯的输出体系，每个节点都有完整文档记录：</p>
                <table className="article-table">
                  <thead><tr><th>节点</th><th>产出文档</th></tr></thead>
                  <tbody>
                    <tr><td><strong>需求分析</strong></td><td>BA 文档（业务需求说明、用例描述、验收条件）</td></tr>
                    <tr><td><strong>技术设计</strong></td><td>技术文档（架构设计、接口定义、数据库变更）</td></tr>
                    <tr><td><strong>开发实现</strong></td><td>代码 + 单测报告</td></tr>
                    <tr><td><strong>质量验证</strong></td><td>QA 文档（测试用例、测试结果、覆盖率报告）</td></tr>
                    <tr><td><strong>验收上线</strong></td><td>验收报告（验收清单、已知问题、回滚方案）</td></tr>
                  </tbody>
                </table>
                <p className="article-text">所有文档通过 AI 自动生成初稿，人工审核确认，确保每个节点的决策和产出可回溯。</p>
              </>,
            },
            {
              step: '4.6', title: '让 AI 自动运行：探索 Loop Engineering',
              status: '远期规划', statusColor: 'purple' as TagColor,
              body: <>
                <p className="article-text">在前五步基础设施成熟后，探索 Loop Engineering 的团队实践：选取适合自动化的场景（如每日代码质量巡检、依赖升级检查、文档自动更新）；设计 Loop 运行合同（目标、触发器、工作区、上下文、验证标准、预算上限、退出条件）；从低频低风险场景起步，验证稳定后逐步扩展自动化范围。目标：实现部分重复性工作的自主运行，释放团队精力到更有价值的决策和创造上。</p>
              </>,
            },
          ].map((item) => (
            <Card key={item.step} type="default">
              <div style={{
                display: 'flex', alignItems: 'center', gap: '12px',
                paddingBottom: '14px', marginBottom: '16px',
                borderBottom: '1px dashed #e8dcc8',
              }}>
                <span style={{
                  fontFamily: 'Nunito, "Noto Sans SC", sans-serif',
                  fontWeight: 900, fontSize: '20px', color: '#19c8b9', minWidth: '42px',
                }}>{item.step}</span>
                <span style={{
                  fontFamily: 'Nunito, "Noto Sans SC", sans-serif',
                  fontWeight: 700, fontSize: '15px', color: '#794f27', flex: 1,
                }}>{item.title}</span>
                <Tag color={item.statusColor} size="small">{item.status}</Tag>
              </div>
              <div>{item.body}</div>
            </Card>
          ))}
        </div>

        <div className="subsection" style={{ marginTop: '32px' }}>
          <Title size="middle" color="purple">路线总览</Title>
          <div className="flowchart-h" style={{ alignItems: 'stretch' }}>
            {[
              { phase: '已完成', items: ['技术架构梳理', '数据表ER关系图', '业务链路文档'], color: 'app-green' as CardColor, tc: 'app-green' as TagColor },
              { phase: '进行中', items: ['知识图谱构建'], color: 'app-yellow' as CardColor, tc: 'app-yellow' as TagColor },
              { phase: '近期', items: ['统一开发规范', 'RAG 代码索引'], color: 'app-blue' as CardColor, tc: 'app-blue' as TagColor },
              { phase: '远期规划', items: ['多Agent协作', '全流程可追溯', 'Loop Engineering'], color: 'purple' as CardColor, tc: 'purple' as TagColor },
            ].map((p, i) => (
              <React.Fragment key={p.phase}>
                {i > 0 && <div className="flow-connector flow-connector-h" style={{ alignSelf: 'center' }} />}
                <Card type="default" color={p.color} style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    paddingBottom: '12px', marginBottom: '12px',
                    borderBottom: '1px dashed #e8dcc8',
                  }}>
                    <Tag color={p.tc} size="small" variant="solid">{p.phase}</Tag>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {p.items.map((item) => (
                      <div key={item} style={{
                        background: 'rgb(247, 243, 223)',
                        border: '2px solid #c4b89e',
                        borderRadius: '14px',
                        padding: '6px 14px',
                        textAlign: 'center',
                        fontFamily: 'Nunito, "Noto Sans SC", sans-serif',
                        fontWeight: 700,
                        fontSize: '12px',
                        color: '#794f27',
                      }}>{item}</div>
                    ))}
                  </div>
                </Card>
              </React.Fragment>
            ))}
          </div>
          <blockquote className="article-blockquote">
            <strong>核心思路</strong>：先让 AI 看懂项目（知识图谱），再让 AI 规范编码（统一规范），然后逐步赋予 AI 检索、协作、追溯、自动运行的能力。每一步都建立在前一步的基础上，不跳步、不冒进。
          </blockquote>
        </div>
      </section>

      <Divider type="wave-yellow" />

      {/* ═══════════ SECTION 总结 ═══════════ */}
      <section id="sec-结" className="section section-summary">
        <div className="section-title">
          <Title size="large" color="app-teal">总结</Title>
        </div>
        <div className="summary-grid">
          {[
            { title: '模型决定上限，工程决定落地', desc: 'Harness 不是新框架，而是一种工程思维方式' },
            { title: '约束是为了加速', desc: '越想让 AI 自主，越需要清晰边界——就像高速公路有护栏才能开到 120 码' },
            { title: '数据驱动迭代', desc: '有了可观测性才知道改进方向' },
          ].map((s) => (
            <Card key={s.title} color="app-teal" type="default">
              <div style={{ textAlign: 'center' }}>
                <strong style={{ color: '#794f27', fontSize: '16px' }}>{s.title}</strong>
                <p style={{ fontSize: '13px', color: '#8a7b66', marginTop: '6px' }}>{s.desc}</p>
              </div>
            </Card>
          ))}
        </div>
        <div style={{ marginTop: '24px' }}>
          <div className="timeline-row">
            {[
              { year: '2026 H2', title: 'AGENTS.md 成为行业标准', desc: 'Fortune 500 规模化采用', color: 'app-teal' as CardColor },
              { year: '2027', title: '后台 Agent 成为主流', desc: '新角色：Agent Trainer / Harness Architect', color: 'app-blue' as CardColor },
              { year: '2028+', title: '领域内自主 Agent 团队', desc: '工程师角色转向架构与业务', color: 'purple' as CardColor },
            ].map((item) => (
              <div key={item.year} className="timeline-item">
                <div className="timeline-dot" />
                <div className="timeline-year">{item.year}</div>
                <Card type="default" color={item.color}>
                  <div style={{ textAlign: 'center' }}>
                    <strong style={{ fontSize: '14px', color: '#794f27' }}>{item.title}</strong>
                    <p style={{ fontSize: '12px', color: '#8a7b66', marginTop: '4px' }}>{item.desc}</p>
                  </div>
                </Card>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Divider type="wave-yellow" />

      {/* ═══════════ THANK YOU ═══════════ */}
      <section className="section section-thanks">
        <Title size="large" color="app-pink">感谢阅读</Title>
        <p style={{ marginTop: '16px', color: '#8a7b66', fontSize: '15px', textAlign: 'center' }}>
          AI 工程化是一段旅程，从 Prompt 到 Context 到 Harness 到 Loop，每一步都是对不可控性的逐步收敛。
        </p>
        <div style={{ textAlign: 'center', marginTop: '24px' }}>
          <Button type="default" size="small" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            回到顶部
          </Button>
        </div>
      </section>

      <Footer type="sea" />
    </div>
  );
}
