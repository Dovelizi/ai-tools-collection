---
name: blog-image-gen
description: 当用户需要为博客文章生成总结性封面图/配图时使用。读取文章内容，提取核心概念和层级关系，使用 image_gen 工具生成手绘风格的流程图/架构图作为博客封面。生成后自动保存到 hexo 博客的 source/img/covers/ 目录，并更新文章 front-matter 中的 cover 字段。
---

# 博客文章封面图生成

为 Hexo 博客文章生成总结性的封面/配图。封面图是手绘风格的流程图/架构图，用于概括文章核心内容。

## 触发条件

满足以下任一条件时触发：

- 用户请求为博客文章生成封面图、总结图、配图。
- 用户新建了一篇博客文章，需要配图。
- 用户提到"生成图片"且上下文与博客文章相关。

## 图片风格规范（必须严格遵守）

所有生成的封面图必须保持统一的视觉风格：

### 整体风格
- **手绘/素描风格**的流程图或架构图
- **白色/浅灰色背景**，带轻微纸张纹理质感
- 整体风格清新、简洁、专业

### 配色方案
- **主色调**：绿色系（#8FBC8F 草绿 / #98D8A0 浅绿 / #6B8E6B 墨绿）
- **节点填充**：浅绿色渐变（主要节点用亮绿，次要节点用橄榄绿/暗绿）
- **边框**：深绿色描边
- **箭头**：深绿色/墨绿色
- **文字**：深色（黑色或深灰），加粗，清晰可读
- **辅助注释文字**：右侧或旁边标注，字体稍小

### 图形元素
- **节点形状**：圆角矩形（主要概念）、椭圆形（子概念/模块）
- **连接线**：带箭头的曲线或直线，手绘风格
- **布局**：自上而下或中心辐射的层级结构
- **分组**：相关概念可用大圆角矩形框包裹

### 文字内容
- 使用**中文**标注核心概念
- 英文术语保留原文（如 CoT、RAG、MCP）
- 每个节点文字精简到 2-6 个字
- 右侧或旁边可添加简短注释说明

### 尺寸
- 使用 **1536x1024** 横向宽图（适合博客封面展示）

## 工作流程

### 步骤 1：读取文章内容

读取 hexo 博客的 markdown 源文件，路径通常为：
```
/Users/lemolli/tencent/hexo-blog/source/_posts/<article-name>.md
```

### 步骤 2：分析文章结构

从文章中提取：
1. **文章主题**（标题）
2. **核心概念**（h2/h3 标题下的关键术语）
3. **层级关系**（概念之间的包含、依赖、流程关系）
4. **关键词**（每个概念的 2-4 字精简描述）

### 步骤 3：设计图表结构

根据文章类型选择合适的图表布局：

- **教程/指南类**：自上而下的流程图，展示概念层级
- **对比/分类类**：并列分组，展示不同类别
- **原理/架构类**：中心辐射或组件连接图
- **操作/命令类**：流程图 + 分区块展示操作和模式

### 步骤 4：构造 Prompt 并生成图片

使用 `image_gen` 工具生成图片。Prompt 模板：

```
A hand-drawn style flowchart/architecture diagram on a white/light gray background with paper texture.

Theme: [文章主题]

Layout: [描述节点和连接关系，自上而下/中心辐射]

The diagram shows:
- Top node: [顶层概念] (rounded rectangle, light green fill)
- [描述各层级节点及其连接]
- Arrows connecting nodes with dark green color
- Chinese text labels on each node: [列出所有节点文字]
- Side annotations in Chinese: [列出注释文字]

Style requirements:
- Hand-drawn/sketch style lines and shapes
- Green color palette (light green #98D8A0 for main nodes, olive green for sub-nodes)
- Dark green borders and arrows
- Bold Chinese text, clear and readable
- Clean white/light gray background with subtle paper texture
- Professional and minimal design
```

参数设置：
- `size`: "1536x1024"
- `output_dir`: "/Users/lemolli/tencent/hexo-blog/source/img/covers"
- `quality`: "high"

### 步骤 5：重命名和关联

1. 生成后，将图片重命名为与文章 slug 一致的名称（如 `ai-design-patterns.png`）
2. 确认文章 front-matter 中的 `cover` 字段指向 `/img/covers/<filename>.png`
3. 如果 `cover` 字段不存在，自动添加

### 步骤 6：确认输出

向用户展示：
- 生成的图片（图片路径）
- 文章 front-matter 中 cover 字段的更新情况
- 如有需要，提醒用户重新部署博客

## 图片生成示例 Prompt 参考

### 示例 1：AI 设计模式文章

```
A hand-drawn style flowchart on a white background with subtle paper texture. The diagram illustrates AI Design Patterns with a top-down hierarchical layout.

Top: "用户" node (small rounded rectangle, light green)
Arrow down to: "Prompt模板" (rounded rectangle, bright green fill)
Two arrows branching down to: "CoT思维链" (ellipse, olive green) and "Few-Shot示例" (ellipse, olive green)
Both arrows merge down to: "Agent路由" (rounded rectangle, bright green)
Three arrows branching down to: "工具调用" (ellipse, olive green), "RAG检索" (ellipse, olive green), "多Agent" (ellipse, olive green)

Right side annotations in Chinese with ">>>" markers pointing to each level.

Style: hand-drawn sketch lines, green color palette, dark green arrows, bold Chinese text, clean minimal design.
```

### 示例 2：Java CompletableFuture 文章

```
A hand-drawn style architecture diagram on white background. Shows async programming flow.

Top: "主线程" (rounded rectangle, bright green)
Two arrows branching to: "任务A" (ellipse, olive green) and "任务B" (ellipse, olive green)
Both merge down to: "thenCombine合并" (rounded rectangle, bright green)
Arrow down to: "回调处理" (rounded rectangle, bright green)
A large green curved line wrapping the entire flow.
Left annotation: "非阻塞命中则直接返回"
Right annotation: "组合式异步编程"

Hand-drawn style, green palette, Chinese text labels.
```

## 博客项目路径

- Hexo 博客源码：`/Users/lemolli/tencent/hexo-blog/`
- 文章目录：`/Users/lemolli/tencent/hexo-blog/source/_posts/`
- 封面图目录：`/Users/lemolli/tencent/hexo-blog/source/img/covers/`
- 部署目标：`/Users/lemolli/tencent/Dovelizi.github.io/`

## 注意事项

- 图片必须保持与现有封面图风格一致（手绘绿色系流程图）
- 节点文字必须使用中文（专有名词可保留英文）
- 图表应该能让读者一眼看懂文章的核心结构
- 不要放太多节点，保持简洁（建议不超过 10 个核心节点）
- 生成后检查图片是否清晰可读
