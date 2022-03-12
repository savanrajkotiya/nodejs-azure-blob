import express from "express";
import fileUpload from "express-fileupload";
import azureStorage from "azure-storage";
import { BlobServiceClient } from "@azure/storage-blob";
import intoStream from "into-stream";
import dotenv from "dotenv";

const port = process.env.PORT || 4001;
// Defining app of express
const app = new express();

// define container name which is available to upload (from azure storage)
const containerName = "imagecontainer";

app.use(
  fileUpload({
    createParentPath: true,
  })
);

// env configuration to read keys from the .env file 
dotenv.config();

// connecting the BLOB Service using the Connection String - for Method 2
const blobService = BlobServiceClient.fromConnectionString(
  process.env.AZURE_STORAGE_CONNECTION_STRING
);

// connecting the BLOB Service using the Connection String  For Method 1 - uncomment below lines
// const blobService = azureStorage.createBlobService(
//   process.env.AZURE_STORAGE_CONNECTION_STRING
// );


// post request for accepting file from the client and uploading it on Blob storage 
app.post("/blobupload", async (request, response) => {
  console.log(request);

  if (!request.files) {
    return response.status(400).send("No files are received.");
  }
  // read the file name
  const blobName = request.files.files.name;
  console.log(`Blob Name ${blobName}`);
  // convert the file into stream
  const stream = intoStream(request.files.files.data);
  console.log(`stream ${stream}`);
  // length of the file
  const streamLength = request.files.files.data.length;
  console.log(`Length ${streamLength}`);

  // Upload the file to the Blob - Two methods way possible.
  // Method 1 : ----------------> block blob

  // Get a block blob client
  const containerClient = blobService.getContainerClient(containerName);
  const blockBlobClient = containerClient.getBlockBlobClient(blobName);
  // file upload using block blob method
  const uploadBlobResponse = await blockBlobClient.uploadStream(stream);
  if(!uploadBlobResponse){
    response.status(500);
    response.send({ message: "Error Occured" });
  }
  response.status(200).send({data : uploadBlobResponse.requestId , message:'File uploaded successfully.' });


  //Method 2 : -----> block blob from stream
  // blobService.createBlockBlobFromStream(
  //   containerName,
  //   blobName,
  //   stream,
  //   streamLength,
  //   (err) => {
  //     if (err) {
  //       response.status(500);
  //       response.send({ message: "Error Occured" + `${err}` });
  //       return;
  //     }
  //     response.status(200).send({message: 'File Uploaded Successfully'});
  //   }
  // )
});

// test
app.get('/test', (req,res) => {
  res.send({message:'Success'})
});

// Start listening the server on the port
app.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});
