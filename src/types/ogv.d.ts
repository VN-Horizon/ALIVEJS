declare module "ogv" {
  export class OGVPlayer extends HTMLElement {
    src: string;
    loop: boolean;
    volume: number;

    play(): Promise<void>;

    pause(): void;
  }

  export const OGVLoader: {
    base: string;
  };

  const ogv: {
    OGVPlayer: typeof OGVPlayer;
    OGVLoader: typeof OGVLoader;
  };

  export default ogv;
}
