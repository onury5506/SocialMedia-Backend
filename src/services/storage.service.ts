import { GetSignedUrlResponse, Storage } from '@google-cloud/storage';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class StorageService {
    private storage: Storage
    private bucketName: string
    constructor(
        private readonly configService: ConfigService
    ) {
        this.storage = new Storage({
            keyFilename: this.configService.get<string>("GOOGLE_KEY_FILE_PATH")
        })
        
        this.bucketName = this.configService.get<string>("BUCKET_NAME")
    }

    uploadFile(file: Express.Multer.File, path: string): Promise<string> {
        return new Promise((resolve, reject) => {
            const bucket = this.storage.bucket(this.bucketName)
            const blob = bucket.file(path)
            const blobStream = blob.createWriteStream({
                resumable: false
            })
            blobStream.on('error', (err) => {
                reject(err)
            })
            blobStream.on('finish', () => {
                resolve(path)
            })
            blobStream.end(file.buffer)
        })
    }

    async signUrl(path: string): Promise<string> {
        const expires = Date.now() + 60 * 60 * 1000

        const res = await this.storage.bucket(this.bucketName).file(path).getSignedUrl({
            action: 'read',
            expires
        })

        return res[0]
    }
}
