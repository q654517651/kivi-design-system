import { CodeBlock, Prose } from '@kivi';

// 正文排版页的整段示例。参数表在 prose.mdx

export function ProseSample() {
  return (
    <figure className="shell-demo">
      <div className="shell-demo-preview" data-stage="base" style={{ alignItems: 'flex-start', padding: 32 }}>
        <Prose style={{ width: 560 }}>
          <h1>一级标题：春日花园的生成方案</h1>
          <p>
            下面是我为这张图想的<strong>三个方向</strong>，你可以按<em>喜好</em>选一个。更多说明见<a href="#/components/prose">设计文档</a>，行内代码比如 <code>aspect_ratio: "16:9"</code> 也会出现。
          </p>
          <h2>二级标题：构图建议</h2>
          <ol>
            <li>近景放一束带露水的花，前景虚化。</li>
            <li>
              中景是一条石板小路，路的尽头有一扇木门。
              <ul>
                <li>门上挂着一盏旧灯</li>
                <li>灯光偏暖，约 3200K</li>
              </ul>
            </li>
            <li>远景留白，给文字排版留出位置。</li>
          </ol>
          <h3>三级标题：参数</h3>
          <ul>
            <li>比例：16:9</li>
            <li>分辨率：2K</li>
            <li>数量：4 张</li>
          </ul>
          <blockquote>
            <p>小提示：想要电影感，可以在提示词里加上「胶片颗粒、浅景深」。</p>
          </blockquote>
          <CodeBlock>一束带露水的花，前景虚化，石板小路通向一扇木门，门上挂着一盏旧灯，暖色光，胶片颗粒，浅景深，16:9</CodeBlock>
          <table>
            <thead>
              <tr><th>模型</th><th>速度</th><th>消耗</th></tr>
            </thead>
            <tbody>
              <tr><td>快速版</td><td>约 10 秒</td><td>2 个猕猴桃</td></tr>
              <tr><td>标准版</td><td>约 30 秒</td><td>4 个猕猴桃</td></tr>
            </tbody>
          </table>
          <hr />
          <p>生成完成后可以在「我的资产」里查看。</p>
        </Prose>
      </div>
    </figure>
  );
}
