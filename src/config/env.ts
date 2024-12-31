import * as dotenv from "dotenv";
dotenv.config({ path: "./.env.local" });

export const config = {
  POSTS_FILE: process.env.POSTS_FILE || "output/posts.json",
  VIDEOS_FILE: process.env.VIDEOS_FILE || "output/videos.json",
  KLIPS_FILE: process.env.KLIPS_FILE || "output/klips.json",
  BASE_URL: process.env.BASE_URL || "https://kynhood.com/home",
  NUM_POSTS: process.env.NUM_POSTS || "50",
  NUM_VIDEOS: process.env.NUM_VIDEOS || "50",
  NUM_KLIPS: process.env.NUM_KLIPS || "50",
};
