import { Storage } from '@google-cloud/storage';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Interval } from '@nestjs/schedule';
import { GoogleAuth } from 'google-auth-library';
import axios from 'axios';
import * as crypto from 'crypto';
import * as UrlSafeBase64 from 'url-safe-base64';

@Injectable()
export class StorageService {
    private storage: Storage
    private bucketName: string
    private auth: GoogleAuth
    private accessToken: string
    private urlMap: string
    private projectId: string
    private cdnUrl: string
    private cdnKeyName: string
    private cdnKey: Buffer

    constructor(
        private readonly configService: ConfigService
    ) {
        this.storage = new Storage({
            keyFilename: this.configService.get<string>("GOOGLE_KEY_FILE_PATH")
        })
        
        this.bucketName = this.configService.get<string>("BUCKET_NAME")
        this.projectId = this.configService.get<string>("GOOGLE_PROJECT_ID")
        this.urlMap = this.configService.get<string>("GOOGLE_URL_MAP_NAME")
        this.cdnUrl = this.configService.get<string>("GOOGLE_CDN_URL")
        this.cdnKeyName = this.configService.get<string>("GOOGLE_CDN_SIGNING_KEY_NAME")
        this.cdnKey = Buffer.from(this.configService.get<string>("GOOGLE_CDN_SIGNING_KEY"), "base64")

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

    signCdnUrl(path: string) {
        const expiration = Math.round(new Date().getTime()/1000) + 3600;

        const urlToSign = `${this.cdnUrl}${path}?Expires=${expiration}&KeyName=${this.cdnKeyName}`
        const hmac = crypto.createHmac('sha1', this.cdnKey)
        const signature = hmac.update(urlToSign).digest()
        const encodedSignature = UrlSafeBase64.encode(signature.toString("base64"))
        
        return `${urlToSign}&Signature=${encodedSignature}`
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
