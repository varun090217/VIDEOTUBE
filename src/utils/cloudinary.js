import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import dotenv from "dotenv";

dotenv.config();

//configure cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET, // Click 'View API Keys' above to copy your API secret
});

const uploadOnCloudinary = async (localFilePath) => {
  try {
    console.log("Reached to cloudinary");

    if (!localFilePath) return null;
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });
    console.log("File uploaded on cloudinary. File src: " + response.url);
    fs.unlinkSync(localFilePath);
    return response;
  } catch (error) {
    console.log("Error on cloudinary ", error);

    fs.unlinkSync(localFilePath);
    return null;
  }
};

const removeFromCloudinary = async (publicId) => {
  console.log("Reached to cloudinary");
  try {
    if (!publicId) return null;
    console.log("Reached to cloudinary to delete " + publicId);
    // Deleting the file from Cloudinary using its public ID
    const response = await cloudinary.uploader.destroy(publicId);
    console.log("response: " + JSON.stringify(response));
    if (response.result === "ok") {
      // Successfully deleted the file
      console.log("File deleted from Cloudinary");
      return response;
    } else {
      console.log("Failed to delete the file from Cloudinary");
      return null;
    }
  } catch (error) {
    console.error("Error deleting file from Cloudinary:", error);
    return null;
  }
};

export { uploadOnCloudinary, removeFromCloudinary };
