/// <reference types="vite/client" />

interface Window {
  heap?: {
    push: (args: unknown[]) => void;
    appid?: string;
    config?: Record<string, unknown>;
    track: (name: string, props?: Record<string, unknown>) => void;
    addEventProperties: (props: Record<string, unknown>) => void;
    [key: string]: unknown;
  };
  DD_RUM?: {
    q: unknown[];
    onReady: (callback: () => void) => void;
    init: (options: Record<string, unknown>) => void;
  };
}

declare const heap: NonNullable<Window["heap"]>;
declare const DD_RUM: NonNullable<Window["DD_RUM"]>;
