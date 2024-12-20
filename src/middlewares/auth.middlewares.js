import jwt from "jsonwebtoken";
import { User } from "../models/user.models.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const verifyJWT = asyncHandler(async (req, _, next) => {
  console.log("verify JWT");
  const token =
    req.cookies.accessToken ||
    req.header("Authorization")?.replace("Bearer ", "");

  console.log("Token: " + token);

  if (!token) {
    console.log("Token not found");
    throw new ApiError(401, "Unauthorized");
  }
  try {
    console.log("Token verification");

    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    console.log("Token verified: " + decodedToken);
    const user = await User.findById(decodedToken?.id).select(
      "-password -refreshToken"
    );

    if (!user) {
      console.log("Error raise");
      throw new ApiError(401, "Unauthorized");
    }

    req.user = user;

    next();
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid access Token");
  }
});
