export class CropAndResizeImageDto {
    file: Buffer;
    left: number;
    top: number;
    width: number;
    height: number;
    targetWidth: number;
    targetHeight: number;
}

export class Dimensions {
    width: number;
    height: number;
}

export class VideoMetadata extends Dimensions {
    duration: number;
    hasAudio: boolean;
}