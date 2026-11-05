import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { PutCommand, DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3"; 
import { fileTypeFromBuffer } from "file-type";
import { v4 as uuid } from "uuid";

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

export const handler = async (event) => {
    const { userId, image } = event;
    
    let imageData = image;
    if(image.substring(0, 7) === "base64,") {
        imageData = image.substring(7, image.length);    
    }

    const buffer = Buffer.from(imageData, "base64");
    const fileInfo = await fileTypeFromBuffer(buffer);

    const fileName = uuid();
    const key = `${fileName}.${fileInfo.ext}`;

    const bucketName = "elizas-jigsaws--user-library-images-744585747743-eu-west-2-an";
    
    const client = new S3Client();
    const S3PutCommand = new PutObjectCommand({
        Bucket: bucketName,
        Key: key,
        Body: buffer,
    });

    await client.send(S3PutCommand);

    const s3Url = `https://${bucketName}.s3.eu-west-2.amazonaws.com/${fileName}`;
    
    const dynamoPutCommand = new PutCommand({
        TableName: "ElizasJigsaws_UserLibraryImages",
        Item: {
            Id: uuid(),
            UserId: userId,
            ImageName: key,
            S3Url: s3Url,
        },
    });

    await docClient.send(dynamoPutCommand);

    return {
        statusCode: 200,
        headers:  {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "POST",
        },
        body: JSON.stringify({
            message: "Image uploaded successfully",
            imageUrl: s3Url,
        }),
    }
};