import fs from "fs";
import { join } from "path";
import matter from "gray-matter";

const postsDirectory = join(process.cwd(), "files", "zh-cn");

export function getPostSlugs(dir: string) {
  return fs.readdirSync(join(postsDirectory, dir));
}

export function getPostBySlug(
  dir: string,
  slug: string,
  fields: string[] = []
) {
  const realSlug = slug.replace(/\.md$/, "");
  const fullPath = join(postsDirectory, dir, `${realSlug}.md`);
  const fileContents = fs.readFileSync(fullPath, "utf8");
  const { data, content } = matter(fileContents);

  type Items = {
    [key: string]: string;
  };

  const items: Items = {};

  // Ensure only the minimal needed data is exposed
  fields.forEach((field) => {
    if (field === "slug") {
      items[field] = realSlug;
    }
    if (field === "content") {
      items[field] = content;
    }

    if (typeof data[field] !== "undefined") {
      items[field] = data[field];
    }
  });

  return items;
}

export function getAllPosts(dir: string, fields: string[] = []) {
  const slugs = getPostSlugs(dir);
  const posts = slugs
    .map((slug) => getPostBySlug(dir, slug, fields))
    // sort posts by date in descending order
    .sort((post1, post2) => (post1.date > post2.date ? -1 : 1));
  return posts;
}
