import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { PutCommand, DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3"; 
import { fileTypeFromBuffer } from "file-type";
import { v4 as uuid } from "uuid";
import Sharp from "sharp";
import { jsonCorsResponse } from 'utils';

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

export const lambdaHandler = async (event) => {
    const payload = typeof event.body === "string"
        ? JSON.parse(event.body) || "{}"
        : event.body || {};

    const { userId, imageBase64 } = payload;
    console.log("userId", userId);
    console.log("imageBase64", imageBase64);

    try {
        const buffer = Buffer.from(imageBase64, "base64");
        const sharpInstance = new Sharp(buffer);

        const resized = await sharpInstance.resize(200).png().toBuffer();

        const fileInfo = await fileTypeFromBuffer(buffer);
        const fileName = uuid();
        const fileNameWithExt = `${fileName}.${fileInfo.ext}`;
    
        const bucketName = "elizas-jigsaws--user-library-images-744585747743-eu-west-2-an";
        
        const client = new S3Client();

        const S3OrigFileKey = `orig_${fileNameWithExt};`
        let S3PutCommand = new PutObjectCommand({
            Bucket: bucketName,
            Key: S3OrigFileKey,
            Body: buffer,
        });
    
        await client.send(S3PutCommand);
        
        const S3GalleryFileKey = `gallery_${fileNameWithExt}`;
        S3PutCommand = new PutObjectCommand({
            Bucket: bucketName,
            Key: S3GalleryFileKey,
            Body: resized,
        });
        
        await client.send(S3PutCommand);
    
        const s3OrigUrl = `https://${bucketName}.s3.eu-west-2.amazonaws.com/${S3OrigFileKey}`;
        const s3GalleryUrl = `https://${bucketName}.s3.eu-west-2.amazonaws.com/${S3GalleryFileKey}`;
        
        const dynamoPutCommand = new PutCommand({
            TableName: "ElizasJigsaws_UserLibraryImages",
            Item: {
                Id: uuid(),
                UserId: userId,
                ImageName: fileNameWithExt,
                S3OriginalImageUrl: s3OrigUrl,
                S3GalleryImageUrl: s3GalleryUrl,
                DateCreated: new Date().toUTCString()
            },
        });
        
        await docClient.send(dynamoPutCommand);
    
        const responseData = {
            message: "Image uploaded successfully",
            origImageUrl: s3OrigUrl,
            galleryImageUrl: s3GalleryUrl, 
        };

        return jsonCorsResponse(200, responseData);
    } catch(e) {
        console.error(e)
        return {
            statusCode: 501,
            headers:  {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "POST",
            },
            body: JSON.stringify({
                message: "The handler threw an error",
            }),
        } 
    }

};