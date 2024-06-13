import { Injectable } from '@nestjs/common';
import * as sharp from 'sharp';
import { CropAndResizeImageDto, ImageDimensions } from 'src/dto/image.dto';

@Injectable()
export class ImageService {
    constructor() {
    }

    cropAndResizeImage(request: CropAndResizeImageDto): Promise<Buffer> {
        return sharp(request.file)
            .png()
            .extract({ left: request.left, top: request.top, width: request.width, height: request.height })
            .resize(request.targetWidth, request.targetHeight)
            .toBuffer()
    }

    async getImageDimensions(img: Buffer): Promise<ImageDimensions> {
        const { width, height } = await sharp(img).metadata()
        return { width, height }
    }
}
