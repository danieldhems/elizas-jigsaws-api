// import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
// import { PutCommand, DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3"; 
import * as fileType from "file-type";
import { v4 as uuid } from "uuid";

// const client = new DynamoDBClient({});
// const docClient = DynamoDBDocumentClient.from(client);

export const handler = async (event) => {
    const { userId, image } = event;
    
    console.log('Received event:', event);
    console.log('user id =', userId);
    console.log('image =', image);

    let imageData = image;
    if(image.substring(0, 7) === "base64,") {
        imageData = image.substring(7, image.length);    
    }

    const buffer = Buffer.from(imageData, "base64");
    const fileInfo = await fileType.fromBuffer(buffer);

    const fileName = uuid();
    const key = `${fileName}.${fileInfo.ext}`;
    
    const client = new S3Client();
    const PutCommand = new PutObjectCommand({
        Bucket: "elizas-jigsaws--user-library-images-744585747743-eu-west-2-an",
        Key: key,
        Body: buffer,
    });

    const result = await client.send(PutCommand);

console.log("S3 PutCommand result", result)

    return {
        statusCode: 200,
        headers:  {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "POST",
        },
        body: JSON.stringify({
            message: "Image uploaded successfully",
            userId: userId,
            image: image,
        }),
    }
};