export class CropAndResizeImageDto {
    file: Buffer;
    left: number;
    top: number;
    width: number;
    height: number;
    targetWidth: number;
    targetHeight: number;
}

export class ImageDimensions {
    width: number;
    height: number;
}