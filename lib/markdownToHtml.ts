import rehypeToc from "@jsdevtools/rehype-toc";
import rehypeStarryNight from "@microflash/rehype-starry-night";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypeSlug from "rehype-slug";
import rehypeStringify from "rehype-stringify";
import remarkParse from "remark-parse";
import { Root } from "remark-parse/lib";
import remarkRehype from "remark-rehype";
import { unified } from "unified";
import { Node } from "unist";

export default async function markdownToHtml(markdown: string) {
  const result = await unified()
    .use(remarkParse)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeSlug)
    .use(rehypeAutolinkHeadings)
    .use(rehypeToc, {
      cssClasses: {
        toc: "Layout-sidebar",
      },
    })
    .use(function () {
      return (tree: Root) => {
        // TODO: less than 2 children
        let contentWrapper: any = {
          type: "element",
          tagName: "div",
          properties: {
            className: "Layout-main",
          },
          children: [] as Node[],
        };

        for (let i = 1; i < tree.children.length; i++) {
          contentWrapper.children.push(tree.children[i]);
        }

        tree.children = [contentWrapper, tree.children[0]];
      };
    })
    .use(rehypeStarryNight)
    .use(rehypeStringify, { allowDangerousHtml: true })
    .process(markdown);

  return result.toString();
}
