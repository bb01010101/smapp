import { NextApiRequest, NextApiResponse } from "next";
import { getCommunities } from "@/actions/bark.action";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "GET") {
    try {
      const communities = await getCommunities();
      res.status(200).json(communities);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch communities" });
    }
  } else {
    res.setHeader("Allow", ["GET"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
} 