// 同一时间只播一个：新的开始播，上一个暂停。视频、音频都走这里。

let current: HTMLMediaElement | null = null;

export const exclusivePlayback = {
  /** 在 onPlay 里调 */
  start(el: HTMLMediaElement) {
    if (current && current !== el) current.pause();
    current = el;
  },
  /** 在 onPause 里调 */
  stop(el: HTMLMediaElement) {
    if (current === el) current = null;
  },
};
