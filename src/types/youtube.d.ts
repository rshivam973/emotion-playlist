interface Window {
  onYouTubeIframeAPIReady: () => void;
}

declare namespace YT {
  class Player {
    constructor(element: HTMLElement, options: PlayerOptions);
    destroy(): void;
    getIframe(): HTMLIFrameElement;
  }

  enum PlayerState {
    UNSTARTED = -1,
    ENDED = 0,
    PLAYING = 1,
    PAUSED = 2,
    BUFFERING = 3,
    CUED = 5
  }

  interface PlayerOptions {
    videoId: string;
    playerVars?: PlayerVars;
    events?: Events;
  }

  interface PlayerVars {
    autoplay?: 0 | 1;
    controls?: 0 | 1;
    modestbranding?: 0 | 1;
    rel?: 0 | 1;
    showinfo?: 0 | 1;
    fs?: 0 | 1;
    playsinline?: 0 | 1;
    enablejsapi?: 0 | 1;
    origin?: string;
  }

  interface Events {
    onReady?: (event: { target: Player }) => void;
    onStateChange?: (event: { data: PlayerState }) => void;
  }
} 