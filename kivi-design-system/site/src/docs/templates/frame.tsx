import { useEffect, useState, type ReactNode } from 'react';
import { Button } from '@kivi';
import { useScrollLock } from '../../kivi/hooks';
import './templates.css';

/**
 * 页面模板的外框：16:9，里面自己滚，网页不跟着滚。右上能全屏看，Esc 退出。
 * 模板只能看：不生成、不调接口，生成中的一直停在生成中。
 */
export function TemplateFrame({ children }: { children: ReactNode }) {
  const [full, setFull] = useState(false);
  useScrollLock(full);
  useEffect(() => {
    if (!full) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setFull(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [full]);

  return (
    <figure className="tpl" data-full={full ? '' : undefined}>
      <div className="tpl-bar">
        <span>只能看：不生成、不调接口</span>
        <Button size={28} variant="light" leftIcon={full ? 'Fold' : 'FullScreen'} onClick={() => setFull(!full)}>
          {full ? '退出全屏' : '全屏看'}
        </Button>
      </div>
      <div className="tpl-frame">{children}</div>
    </figure>
  );
}
