import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { PutCommand, DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import bcrypt from "bcrypt";
import { v4 as uuidv4 } from "uuid";

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

export const handler = async (event) => {
    const { username, password, isAdmin } = event;
    
    //console.log('Received event:', JSON.stringify(event, null, 2));
    console.log('username =', username);
    console.log('password =', password);
    console.log('isAdmin =', isAdmin);

    var salt = await bcrypt.genSalt();
    var hashedPassword = await bcrypt.hash(password, salt);

  const command = new PutCommand({
    TableName: "ElizasJigsaws_Users",
    Item: {
      Id: uuidv4(),
      Username: username,
      Password: hashedPassword,
      IsAdmin: isAdmin,
    },
  });

  const response = await docClient.send(command);
  
  return {
    statusCode: 200,
    body: JSON.stringify("User created successfully!"),
  }
};