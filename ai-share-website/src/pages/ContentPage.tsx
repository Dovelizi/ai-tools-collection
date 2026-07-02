import { useState } from 'react';
import {
  Card,
  Title,
  Tag,
  Divider,
  Footer,
  Collapse,
  Button,
} from 'animal-island-ui';
import type { CardColor, TagColor } from 'animal-island-ui';

interface ChapterOutline {
  key: string;
  number: string;
  title: string;
  description: string;
  tags: Array<{ label: string; color: TagColor }>;
  color: CardColor;
  content: React.ReactNode;
}

const chapters: ChapterOutline[] = [
  {
    key: 'preface',
    number: '引',
    title: '前言：AI 编程的真实痛点',
    description: '幻觉、目标漂移、决策黑盒——AI 编程的五大不可控痛点及核心矛盾分析。',
    tags: [
      { label: '痛点分析', color: 'app-red' },
      { label: '不可控', color: 'app-orange' },
    ],
    color: 'app-red',
    content: (
      <div className="article-content">
        <div className="article-table-wrapper">
          <table className="article-table">
            <thead>
              <tr><th>痛点</th><th>表现</th></tr>
            </thead>
            <tbody>
              <tr><td><strong>不可控</strong></td><td>幻觉、目标漂移、死循环不收敛</td></tr>
              <tr><td><strong>不可见</strong></td><td>决策黑盒、Token 消耗不可预测、质量波动</td></tr>
              <tr><td><strong>不可靠</strong></td><td>昨天能用今天不行、换模型行为大变</td></tr>
              <tr><td><strong>不可复用</strong></td><td>每次都从头教 AI、团队经验无法沉淀</td></tr>
              <tr><td><strong>不可度量</strong></td><td>没有 ROI 数据、改进方向不明确</td></tr>
            </tbody>
          </table>
        </div>
        <blockquote>核心矛盾：大模型是概率性的，生产环境是确定性的。模型越来越强，但靠"更好的 prompt"已无法解决系统性问题。</blockquote>
      </div>
    ),
  },
  {
    key: 'evolution',
    number: '一',
    title: 'AI 工程范式演进',
    description: '从 Prompt Engineering 到 Loop Engineering 的四阶段演进，层层包裹。',
    tags: [
      { label: '范式演进', color: 'app-blue' },
      { label: '四阶段', color: 'purple' },
    ],
    color: 'app-blue',
    content: (
      <div className="article-content">
        <p>AI 工程化经历了清晰的三阶段演进（Prompt → Context → Harness），2026 年进一步延伸至 Loop Engineering：</p>
        <div className="article-table-wrapper">
          <table className="article-table">
            <thead>
              <tr><th>年份</th><th>范式</th><th>核心</th><th>标志</th></tr>
            </thead>
            <tbody>
              <tr><td>2023</td><td>Prompt Engineering</td><td>写好提示词让模型输出正确</td><td>单次问答优化</td></tr>
              <tr><td>2024</td><td>Context Engineering</td><td>管理有限的上下文窗口</td><td>RAG + 动态组装</td></tr>
              <tr><td>2025</td><td>Harness Engineering</td><td>构建工程外壳包裹大模型</td><td>Mitchell Hashimoto 首次提出</td></tr>
              <tr><td>2026</td><td>Loop Engineering</td><td>设计自主运行的 Agent 循环</td><td>Anthropic & LangChain 主推</td></tr>
            </tbody>
          </table>
        </div>
        <p><strong>每层关系</strong>：下层负责"说清楚"，上层负责"管得住"—— Prompt ⊂ Context ⊂ Harness ⊂ Loop，层层包裹。</p>
      </div>
    ),
  },
  {
    key: 'framework',
    number: '二',
    title: '核心技术框架',
    description: 'Harness 的约束/告知/验证/纠正四动作，Loop 的十要素运行合同。',
    tags: [
      { label: 'Harness', color: 'purple' },
      { label: 'Loop', color: 'app-pink' },
      { label: '核心技术', color: 'app-teal' },
    ],
    color: 'purple',
    content: (
      <div className="article-content">
        <h3>2.1 Harness Engineering：驾驭 AI 的工程外壳</h3>
        <blockquote>Agent = 大模型 + Harness</blockquote>
        <p>Harness 原意是马的缰绳——没有缰绳，再好的马也无法驾驭。Harness 通过四个核心动作让 AI 从"能回答"变成"能完成"：</p>
        <div className="article-table-wrapper">
          <table className="article-table">
            <thead>
              <tr><th>动作</th><th>含义</th><th>工程实现</th></tr>
            </thead>
            <tbody>
              <tr><td><strong>Constrain（约束）</strong></td><td>设定边界，防止越界</td><td>权限控制、沙箱、禁止清单</td></tr>
              <tr><td><strong>Inform（告知）</strong></td><td>提供上下文</td><td>CLAUDE.md、AGENTS.md、RAG</td></tr>
              <tr><td><strong>Verify（验证）</strong></td><td>自动检查输出</td><td>Linter、单元测试、E2E 测试</td></tr>
              <tr><td><strong>Correct（纠正）</strong></td><td>基于反馈迭代</td><td>错误回传 → 自动修复 → 再验证</td></tr>
            </tbody>
          </table>
        </div>
        <p><strong>Harness 四层架构</strong>：编排层 → 反馈层 → 记忆层 → 执行层</p>
        <h3>2.2 Loop Engineering：让 AI 自主持续运行</h3>
        <p>Loop 解决的是 Harness 之外的问题——让 Agent 从"单次可控"走向"持续自主运行"。</p>
        <p><strong>核心逻辑</strong>：每个 Loop 本质上是一份"自主运行合同"：目标 → 触发器 → 工作区 → 上下文 → 委派 → 验证 → 状态 → 预算 → 升级 → 退出</p>
        <ul>
          <li><strong>确定性检查把关</strong>：用测试/类型/lint 判定完成，不让 Agent 自评</li>
          <li><strong>硬预算上限</strong>：迭代次数、Token、时间三者至少设其一</li>
          <li><strong>熔断机制</strong>：连续无进展 → 自动终止通知人工</li>
          <li><strong>先 Harness 再 Loop</strong>：单次不可靠的系统，循环只会放大问题</li>
        </ul>
      </div>
    ),
  },
  {
    key: 'practice',
    number: '三',
    title: '个人 AI 实践',
    description: '从对话驱动到 Skill 工程化的认知演进、DDD 全栈 Skills、CoinFlow 项目落地。',
    tags: [
      { label: '个人实践', color: 'app-green' },
      { label: 'Skill 工程化', color: 'app-teal' },
      { label: 'CoinFlow', color: 'app-yellow' },
    ],
    color: 'app-green',
    content: (
      <div className="article-content">
        <h3>3.1 从对话到工程体系的认知演进</h3>
        <p><strong>智能日志分析 Prompt</strong>：基于标准化 Prompt + MCP 工具链的智能分析流程。</p>
        <p><strong>日志采集分析平台</strong>：完整经历 AI 工程化认知三阶段：</p>
        <div className="article-table-wrapper">
          <table className="article-table">
            <thead>
              <tr><th>阶段</th><th>认知水平</th><th>做法</th><th>结果</th></tr>
            </thead>
            <tbody>
              <tr><td>初期</td><td>对话驱动</td><td>只定义功能需求</td><td>技术选型混乱、反复对话修改</td></tr>
              <tr><td>中期</td><td>Prompt + Context</td><td>定义标准化约束，明确架构</td><td>Python→Java 无缝迁移重构</td></tr>
              <tr><td>后期</td><td>Skill 工程化</td><td>整理架构索引，遵循统一规范</td><td>AI 稳定迭代，效率大幅提升</td></tr>
            </tbody>
          </table>
        </div>
        <h3>3.2 Skills 实践：DDD 全栈开发工作流工程化</h3>
        <p>三个 Skill 覆盖完整链路：ddd-web-fullstack-dev（单 Agent 8 步）、ddd-web-fullstack-agent-dev（多 Agent 接力）、ddd-design-review（设计评审）。</p>
        <p>核心原则：<strong>先建模再编码，测试不全绿不报完成。</strong></p>
        <h3>3.3 CoinFlow — Harness 工程化落地</h3>
        <p>CoinFlow 是个人 iOS 记账应用（SwiftUI + MVVM），将 Harness 思想落地为项目专属的 AI 研发基础设施。</p>
        <p><strong>核心理念</strong>：先定标准（UI 原型）→ 再定架构 → 再规范 AI 执行流程。</p>
      </div>
    ),
  },
  {
    key: 'team',
    number: '四',
    title: '团队落地实践：DAP 应用 AI 工程化路线',
    description: '知识图谱 → 统一规范 → RAG 索引 → 多 Agent 协作 → 全流程追溯 → Loop Engineering。',
    tags: [
      { label: '团队实践', color: 'app-orange' },
      { label: 'DAP', color: 'app-yellow' },
      { label: '六步路线', color: 'app-blue' },
    ],
    color: 'app-orange',
    content: (
      <div className="article-content">
        <p>以团队核心项目 Dap 应用为落地载体，分阶段推进 AI 工程化：</p>
        <div className="article-table-wrapper">
          <table className="article-table">
            <thead>
              <tr><th>阶段</th><th>目标</th><th>状态</th></tr>
            </thead>
            <tbody>
              <tr><td>4.1 知识图谱</td><td>让 AI 看懂项目</td><td><Tag color="app-green" size="small">已完成/进行中</Tag></td></tr>
              <tr><td>4.2 统一规范</td><td>让 AI 规范编码</td><td><Tag color="app-yellow" size="small">近期</Tag></td></tr>
              <tr><td>4.3 RAG 索引</td><td>让 AI 高效检索</td><td><Tag color="app-yellow" size="small">近期</Tag></td></tr>
              <tr><td>4.4 多 Agent</td><td>让 AI 自主协作</td><td><Tag color="purple" size="small">远期</Tag></td></tr>
              <tr><td>4.5 全流程追溯</td><td>让 AI 可追溯</td><td><Tag color="purple" size="small">远期</Tag></td></tr>
              <tr><td>4.6 Loop</td><td>让 AI 自动运行</td><td><Tag color="purple" size="small">远期</Tag></td></tr>
            </tbody>
          </table>
        </div>
        <blockquote>核心思路：先让 AI 看懂项目，再让 AI 规范编码，然后逐步赋予检索、协作、追溯、自动运行的能力。每一步都建立在前一步的基础上，不跳步、不冒进。</blockquote>
      </div>
    ),
  },
  {
    key: 'summary',
    number: '结',
    title: '总结',
    description: '模型决定上限，工程决定落地。约束是为了加速，数据驱动迭代。',
    tags: [
      { label: '总结', color: 'app-teal' },
      { label: '未来趋势', color: 'app-pink' },
    ],
    color: 'app-teal',
    content: (
      <div className="article-content">
        <ul>
          <li><strong>模型决定上限，工程决定落地</strong>：Harness 不是新框架，而是一种工程思维方式</li>
          <li><strong>约束是为了加速</strong>：越想让 AI 自主，越需要清晰边界——就像高速公路有护栏才能开到 120 码</li>
          <li><strong>数据驱动迭代</strong>：有了可观测性才知道改进方向</li>
        </ul>
        <div className="article-table-wrapper">
          <table className="article-table">
            <thead>
              <tr><th>时间</th><th>趋势</th></tr>
            </thead>
            <tbody>
              <tr><td>2026 H2</td><td>AGENTS.md 成为行业标准，Fortune 500 规模化采用</td></tr>
              <tr><td>2027</td><td>后台 Agent 成为主流，新角色：Agent Trainer / Harness Architect</td></tr>
              <tr><td>2028+</td><td>领域内自主 Agent 团队，工程师角色转向架构与业务</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    ),
  },
];

const chapterColors: CardColor[] = [
  'app-red', 'app-blue', 'purple', 'app-green', 'app-orange', 'app-teal',
];

export default function ContentPage() {
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set());

  const toggleExpand = (key: string) => {
    setExpandedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) { next.delete(key); } else { next.add(key); }
      return next;
    });
  };

  return (
    <div className="content-page">
      {/* Header */}
      <div className="content-header">
        <Title size="large" color="app-teal">AI 工程化探索</Title>
        <p style={{ marginTop: '16px' }}>从 Prompt 到 Harness 到 Loop · 团队分享文档 · 2026 年 7 月</p>
      </div>

      {/* Tags */}
      <div className="tags-bar">
        <Tag color="app-teal" size="medium">Prompt Engineering</Tag>
        <Tag color="app-blue" size="medium">Context Engineering</Tag>
        <Tag color="purple" size="medium">Harness Engineering</Tag>
        <Tag color="app-pink" size="medium">Loop Engineering</Tag>
        <Tag color="app-green" size="medium">DDD 全栈</Tag>
        <Tag color="app-orange" size="medium">团队实践</Tag>
      </div>

      <Divider type="line-teal" />

      {/* Outline Section - Card Grid */}
      <div className="outline-section" style={{ marginTop: '32px' }}>
        <div className="outline-section-title">
          <Title size="middle" color="app-yellow">文章大纲</Title>
        </div>

        <div className="outline-grid">
          {chapters.map((chapter, index) => (
            <div key={chapter.key} className="outline-card">
              <Card color={chapterColors[index]} type="default">
                <div onClick={() => toggleExpand(chapter.key)}>
                  <div className="outline-card-header">
                    <span className="outline-card-number">{chapter.number}</span>
                    <span className="outline-card-title">{chapter.title}</span>
                  </div>
                  <p className="outline-card-desc">{chapter.description}</p>
                  <div className="outline-card-tags">
                    {chapter.tags.map((tag) => (
                      <Tag key={tag.label} color={tag.color} size="small" variant="outlined">
                        {tag.label}
                      </Tag>
                    ))}
                  </div>
                </div>
              </Card>
            </div>
          ))}
        </div>
      </div>

      {/* Detail Section - Collapse */}
      <div className="detail-section">
        <div className="outline-section-title">
          <Title size="middle" color="app-blue">详细内容</Title>
        </div>
        {chapters.map((chapter, index) => (
          <div key={chapter.key} style={{ marginBottom: '12px' }}>
            <Collapse
              question={
                <span style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{
                    fontFamily: 'Nunito, "Noto Sans SC", sans-serif',
                    fontWeight: 900,
                    fontSize: '18px',
                    color: '#19c8b9',
                  }}>
                    {chapter.number}
                  </span>
                  <span>{chapter.title}</span>
                  <Tag color={chapterColors[index]} size="small" variant="outlined">
                    {chapter.tags[0].label}
                  </Tag>
                </span>
              }
              answer={chapter.content}
              defaultExpanded={expandedKeys.has(chapter.key)}
            />
          </div>
        ))}
      </div>

      <Divider type="wave-yellow" />

      {/* CTA */}
      <div className="cta-section">
        <Title size="small" color="app-pink">感谢阅读</Title>
        <p style={{ marginTop: '12px', color: '#8a7b66', fontSize: '14px' }}>
          AI 工程化是一段旅程，从 Prompt 到 Harness 到 Loop，每一步都是对不可控性的逐步收敛。
        </p>
      </div>

      <div className="scroll-top">
        <Button type="default" size="small" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          回到顶部
        </Button>
      </div>

      {/* Footer */}
      <div className="content-footer">
        <Footer type="sea" />
      </div>
    </div>
  );
}
