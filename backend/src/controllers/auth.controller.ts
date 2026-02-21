import { type Request, type Response } from "express";

export function login(req: Request, res: Response) {
  const {username, password} = req.body
  if (!username || !password) {
    return res.status(401).json({error: "Both username and password is required"})
  }

  if (username !== process.env.APP_USERNAME || password !== process.env.APP_PASSWORD) {
    return res.status(401).json({error: "Wrong username or password"})
  }

  // TODO: create socket connection 
  return res.status(200).json({success: true})
}