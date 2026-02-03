export type AnchorType = "top-left" | "top-right" | "bottom-left" | "bottom-right";

export interface Transform {
    x: number;
    y: number;
    z: number;
    width: number;
    height: number;
    rotation: number;
}

export interface SceneElementData {
    animated?: boolean;
    name?: string;
    transform?: Partial<Transform>;
    left?: number;
    top?: number;
    zIndex?: number;
    width?: number;
    height?: number;
    rotation?: number;
    anchor?: AnchorType;
    path?: string;
    visible?: boolean;
    opacity?: number;
    blendMode?: string;
    children?: SceneElementData[];
}
