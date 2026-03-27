/*
  For generating the robots.txt file for SEO optimization
  Refer to https://nextjs.org/docs/app/api-reference/file-conventions/metadata/robots for more info
*/
import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  let baseUrl = ""; // Update with your actual domain if needed

  return {
    rules: {
      userAgent: "*",
      disallow: "/", // Block all crawling
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
