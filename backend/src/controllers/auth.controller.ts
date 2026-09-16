import { Response } from "express";
import asyncHandler from "express-async-handler";
import { User } from "../models/User";
import { generateToken } from "../utils/generateToken";
import { ApiError } from "../middleware/errorHandler";
import { AuthRequest } from "../middleware/auth";

// @route  POST /api/auth/register
// @access Public
export const register = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    throw new ApiError(400, "Name, email and password are required.");
  }

  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    throw new ApiError(409, "An account with this email already exists.");
  }

  const user = await User.create({ name, email, password });
  const token = generateToken({ id: user.id, email: user.email, role: user.role });

  res.status(201).json({
    success: true,
    data: {
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
      token,
    },
  });
});

// @route  POST /api/auth/login
// @access Public
export const login = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new ApiError(400, "Email and password are required.");
  }

  const user = await User.findOne({ email: email.toLowerCase() }).select("+password");
  if (!user) {
    throw new ApiError(401, "Invalid email or password.");
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw new ApiError(401, "Invalid email or password.");
  }

  const token = generateToken({ id: user.id, email: user.email, role: user.role });

  res.status(200).json({
    success: true,
    data: {
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
      token,
    },
  });
});

// @route  GET /api/auth/me
// @access Private
export const getMe = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = await User.findById(req.user?.id);
  if (!user) {
    throw new ApiError(404, "User not found.");
  }
  res.status(200).json({
    success: true,
    data: { id: user.id, name: user.name, email: user.email, role: user.role },
  });
});
