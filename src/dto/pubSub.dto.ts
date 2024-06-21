class StorageFileUploadedDto {
    kind: string;
    id: string;
    selfLink: string;
    name: string;
    bucket: string;
    generation: string;
    metageneration: string;
    contentType: string;
    timeCreated: string;
    updated: string;
    storageClass: string;
    timeStorageClassUpdated: string;
    size: string;
    md5Hash: string;
    mediaLink: string;
    crc32c: string;
    etag: string;
}

class VideoTranscodedDto {
    job: {
        name: string;
        state: "SUCCEEDED" | "FAILED";
    }
}