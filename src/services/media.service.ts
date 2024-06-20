import { TranscoderServiceClient } from '@google-cloud/video-transcoder/build/src/v1/transcoder_service_client';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as sharp from 'sharp';
import { CropAndResizeImageDto, Dimensions, VideoMetadata } from 'src/dto/media.dto';
import { StorageService } from './storage.service';
import * as ffmpeg from 'fluent-ffmpeg'
import { google } from '@google-cloud/video-transcoder/build/protos/protos';
import { PubSub } from '@google-cloud/pubsub';

@Injectable()
export class MediaService {
    private transcoderServiceClient: TranscoderServiceClient
    private bucketName: string
    private location: string
    private projectId: string
    constructor(
        private readonly configService: ConfigService,
        private readonly storageService: StorageService
    ) {
        this.transcoderServiceClient = new TranscoderServiceClient({
            keyFilename: this.configService.get<string>("GOOGLE_KEY_FILE_PATH")
        });

        this.bucketName = this.configService.get<string>("BUCKET_NAME")
        this.location = this.configService.get<string>("GOOGLE_TRANSCODER_LOCATION")
        this.projectId = this.configService.get<string>("GOOGLE_PROJECT_ID")
    }

    cropAndResizeImage(request: CropAndResizeImageDto): Promise<Buffer> {
        return sharp(request.file)
            .png()
            .extract({ left: request.left, top: request.top, width: request.width, height: request.height })
            .resize(request.targetWidth, request.targetHeight)
            .toBuffer()
    }

    async getImageDimensions(img: Buffer): Promise<Dimensions> {
        const { width, height } = await sharp(img).metadata()
        return { width, height }
    }

    async getVideoMetadata(videoUri: string): Promise<VideoMetadata> {
        return new Promise((resolve, reject) => {
            ffmpeg.ffprobe(videoUri, (err, metadata) => {
                if (err) {
                    reject(err)
                } else {
                    const { width, height } = metadata.streams[0]
                    const duration = metadata.format.duration
                    const hasAudio = metadata.streams.some((stream: any) => stream.codec_type === "audio")
                    resolve({ width, height, duration, hasAudio })
                }
            })
        })
    }

    async transcodeVideo(inputUri: string, outputUri: string, maxVideoDuration = 90) {
        const url = await this.storageService.signUrl(inputUri)
        const videoMetadata = await this.getVideoMetadata(url)

        let ratio = videoMetadata.width / videoMetadata.height
        let width = 1280
        let height = Math.round(width / ratio)
        
        if(videoMetadata.height > videoMetadata.width) {
            height = 1280
            width = Math.round(height * ratio)
        }

        if(width % 2 !== 0) width--
        if(height % 2 !== 0) height--

        const elementaryStreams: google.cloud.video.transcoder.v1.IElementaryStream[] = [
            {
                key: "video-stream",
                videoStream: {
                    h264: {
                        frameRate: 30,
                        widthPixels: width,
                        heightPixels: height,
                        allowOpenGop: true,
                        bitrateBps: 2000000
                    }
                }
            }
        ]

        if(videoMetadata.hasAudio) {
            elementaryStreams.push({
                key: "audio-stream",
                audioStream: {
                    codec: "aac",
                    bitrateBps: 64000,
                    channelCount: 2,
                    sampleRateHertz: 44100
                }
            })
        }

        let editList: google.cloud.video.transcoder.v1.IEditAtom[] | undefined = undefined

        if(videoMetadata.duration > maxVideoDuration) {
            editList = [
                {
                    key: "video",
                    inputs: [
                        "input0",
                    ],
                    endTimeOffset: {
                        seconds: maxVideoDuration
                    },
                    startTimeOffset: {
                        seconds: 0
                    }
                }
            ]
        }

        return this.transcoderServiceClient.createJob({
            parent: this.transcoderServiceClient.locationPath(this.projectId, this.location),
            job: {
                inputUri: `gs://${this.bucketName}/${inputUri}`,
                outputUri: `gs://${this.bucketName}/${outputUri}`,
                config: {
                    elementaryStreams,
                    muxStreams: [
                        {
                            key: "video",
                            container: "mp4",
                            elementaryStreams: videoMetadata.hasAudio ? ["video-stream", "audio-stream"] : ["video-stream"]
                        }
                    ],
                    editList,
                    pubsubDestination: {
                        "topic":process.env.GOOGLE_TRANSCODER_PUBSUB_TOPIC_NAME
                    }
                }
            }
        })
    }
}
