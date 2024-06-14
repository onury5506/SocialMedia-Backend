import { Storage } from '@google-cloud/storage';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Interval } from '@nestjs/schedule';
import { GoogleAuth } from 'google-auth-library';
import axios from 'axios';

@Injectable()
export class StorageService {
    private storage: Storage
    private bucketName: string
    private auth: GoogleAuth
    private accessToken: string
    private urlMap: string
    private projectId: string
    constructor(
        private readonly configService: ConfigService
    ) {
        this.storage = new Storage({
            keyFilename: this.configService.get<string>("GOOGLE_KEY_FILE_PATH")
        })
        
        this.bucketName = this.configService.get<string>("BUCKET_NAME")
        this.projectId = this.configService.get<string>("GOOGLE_PROJECT_ID")
        this.urlMap = this.configService.get<string>("GOOGLE_URL_MAP_NAME")

        this.auth = new GoogleAuth({
            keyFile: this.configService.get<string>("GOOGLE_KEY_FILE_PATH"),
            scopes: ['https://www.googleapis.com/auth/cloud-platform']
        })

        this.getClientAccessToken()
    }

    @Interval(20 * 60 * 1000)
    private async getClientAccessToken() {
        const client = await this.auth.getClient()
        const res = await client.getAccessToken()
        this.accessToken = res.token
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

    async invalidateCache(path: string): Promise<void> {
        const url = `https://compute.googleapis.com/compute/v1/projects/${this.projectId}/global/urlMaps/${this.urlMap}/invalidateCache`

        let res = await axios.post(url, {
            path
        }, {
            headers: {
                Authorization: `Bearer ${this.accessToken}`
            }
        })
    }
}
