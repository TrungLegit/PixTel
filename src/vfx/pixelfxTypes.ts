export interface PixelfxFrame {
  w: number;
  h: number;
  ox: number;
  oy: number;
  color: Uint32Array;
  light: Uint32Array;
}

export interface PixelfxMeta {
  name?: string;
  desc?: string;
  tags?: string[];
  size?: number[];
  origin?: number[];
  duration?: number;
  loop?: boolean;
  fps?: number;
  bg?: string;
  actor?: number;
  options?: Record<string, unknown>;
}

export interface PixelfxModule {
  meta?: PixelfxMeta;
  create?: (opts: any) => {
    update?: (dt: number, opts?: any) => void;
    draw: (p: any, t?: any, opts?: any) => void;
    drawBack?: (p: any, t?: any, opts?: any) => void;
  };
  draw?: (p: any, t: any, opts?: any) => void;
  drawBack?: (p: any, t?: any, opts?: any) => void;
}

export interface PixelfxInstance {
  meta: PixelfxMeta;
  options: Record<string, unknown>;
  readonly t: number;
  update(dt: number): void;
  draw(frame: PixelfxFrame, layer?: "back" | "front" | null): void;
  stop(): void;
  done(): boolean;
}

export interface PixelfxActor {
  mask: { w: number; h: number; data: Uint8Array };
  pixels: Uint32Array;
  x: number;
  y: number;
  w: number;
  h: number;
  head?: [number, number];
  chest?: [number, number];
}
