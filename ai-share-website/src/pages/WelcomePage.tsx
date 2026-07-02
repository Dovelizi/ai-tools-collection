import { Typewriter, Button, Tag } from 'animal-island-ui';

interface WelcomePageProps {
  onStart: () => void;
}

export default function WelcomePage({ onStart }: WelcomePageProps) {
  return (
    <div className="welcome-page">
      <div className="welcome-hero">
        <div className="welcome-hero-text">
          <Typewriter speed={70}>
            <h1 className="welcome-title">
              AI 工程化探索
            </h1>
            <p className="welcome-subtitle">
              从 Prompt 到 Harness 到 Loop
            </p>
          </Typewriter>

          <Typewriter speed={50} trigger={1}>
            <p className="welcome-desc">
              大模型是概率性的，生产环境是确定性的。<br />
              模型越来越强，但靠"更好的 prompt"已无法解决系统性问题。
            </p>
          </Typewriter>

          <div className="welcome-tags">
            <Tag color="app-teal" size="medium">Prompt</Tag>
            <Tag color="app-blue" size="medium">Context</Tag>
            <Tag color="purple" size="medium">Harness</Tag>
            <Tag color="app-pink" size="medium">Loop</Tag>
          </div>

          <Button type="primary" size="large" onClick={onStart}>
            立即开始 →
          </Button>
        </div>

        <div className="welcome-hero-graphic">
          <div className="hero-card hero-card-1" />
          <div className="hero-card hero-card-2" />
          <div className="hero-card hero-card-3" />
          <div className="hero-card hero-card-4" />
        </div>
      </div>

      <div className="welcome-scroll-hint">
        <span>向下滑动</span>
        <div className="scroll-arrow" />
      </div>
    </div>
  );
}
