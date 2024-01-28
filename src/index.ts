import express, { Express, Request, Response } from "express";
import dotenv from "dotenv";

import { getPostsByHastag, getPostById } from "./controllers/instagramController";

dotenv.config();

const app: Express = express();
const port = process.env.PORT || 3000;

if (process.env.NODE_ENV === "dev") {
  app.use(function (req, res, next) {
    res.set("Access-Control-Allow-Origin", "*");
    next();
  });
}

app.get("/", (req: Request, res: Response) => {
  res.send("Use the /instagram/posts or /instagram/posts/:hashtag routes");
});

app.get("/instagram/posts/:hashtag", getPostsByHastag);
app.get("/instagram/post/:postId", getPostById);

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
