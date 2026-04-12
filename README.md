# AI Tools Collection

A collection of AI Agent Skills, MCP servers, and related tools.

## Structure

```
├── skills/
│   ├── java-interview-agent/   # Java 后端面试模拟器
│   └── blog-image-gen/         # 博客封面图生成器
├── mcp-servers/                # MCP Server implementations (coming soon)
└── tools/                      # Other AI-related tools (coming soon)
```

## Skills

### java-interview-agent

专业的 Java 后端开发面试模拟器。基于候选人简历（PDF）进行针对性技术面试，覆盖：

- Java 基础 / JVM / Spring 框架
- 中间件（RocketMQ、Kafka）/ 数据库（MySQL、Redis、ES）
- 项目经验深入追问
- 系统设计
- AI / Agent / MCP 相关

**特性：**
- 一问一答模式，由浅入深
- 70% 问题与简历项目相关
- 面试结束自动生成总结报告（含完整参考答案）
- 历史记录追踪，避免重复提问，定向抽查薄弱项

### blog-image-gen

博客文章封面图生成器。读取 Hexo 博客文章内容，自动提取核心概念和层级关系，生成手绘风格的流程图/架构图作为封面。

**特性：**
- 手绘/素描风格，绿色系配色，统一视觉风格
- 自动分析文章结构，选择最佳图表布局（流程图/架构图/分组图）
- 生成后自动保存到 Hexo 博客 `source/img/covers/` 目录
- 自动更新文章 front-matter 中的 `cover` 字段
- 支持中文标注，专有术语保留英文

## License

MIT
