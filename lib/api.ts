import fs from "fs";
import matter from "gray-matter";
import { join } from "path";
import Doc from "../interfaces/doc";
import markdownToHtml from "./markdownToHtml";

interface getDocProps {
  dir: string;
  slug: string;
}

interface getPathsProps {
  dir: string;
}

type Items = {
  [key: string]: string;
};

const postsDirectory = join(process.cwd(), "files", "zh-cn");

export async function getDoc({ dir, slug }: getDocProps) {
  const doc = getDocBySlug(dir, slug, [
    "title",
    "date",
    "slug",
    "author",
    "content",
    "ogImage",
    "coverImage",
  ]);
  const content = await markdownToHtml(doc.content || "");

  return {
    ...doc,
    content,
  };
}

export function getPaths({ dir }: getPathsProps) {
  const docs = getAllDocs(["slug"]);

  const paths = docs[dir].map((doc) => {
    return {
      params: {
        slug: doc.slug,
      },
    };
  });

  return paths;
}

export function getDocSlugs(dir: string) {
  return fs.readdirSync(join(postsDirectory, dir));
}

export function getDocBySlug(dir: string, slug: string, fields: string[] = []) {
  const realSlug = slug.replace(/\.md$/, "");
  const fullPath = join(postsDirectory, dir, `${realSlug}.md`);
  const fileContents = fs.readFileSync(fullPath, "utf8");
  const { data, content } = matter(fileContents);

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

export function getAllDocs(fields: string[] = []) {
  const dirs = fs.readdirSync(postsDirectory);

  const dirPosts: Record<string, Doc[]> = {};

  for (const dir of dirs) {
    const slugs = getDocSlugs(dir);
    const posts = slugs
      .map((slug) => getDocBySlug(dir, slug, fields))
      // sort posts by date in descending order
      .sort((post1, post2) => (post1.date > post2.date ? -1 : 1));

    dirPosts[dir] = posts as any;
  }

  return dirPosts;
}
