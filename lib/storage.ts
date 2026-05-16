import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";

const s3 = new S3Client({
  endpoint: process.env.MINIO_ENDPOINT,
  region: "us-east-1",
  credentials: {
    accessKeyId: process.env.MINIO_ACCESS_KEY!,
    secretAccessKey: process.env.MINIO_SECRET_KEY!,
  },
  forcePathStyle: true,
});

const BUCKET = process.env.MINIO_BUCKET!;

export async function uploadImage(path: string, file: Buffer, contentType: string) {
  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: path,
      Body: file,
      ContentType: contentType,
    })
  );
  return path;
}

export async function deleteImage(path: string) {
  await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: path }));
}
