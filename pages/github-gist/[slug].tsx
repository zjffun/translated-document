import DocPage, { docPageProps } from "../../components/doc-page";
import { getDoc, getPaths } from "../../lib/api";

const dir = __dirname.split("/").pop() || "";

export default function DocPageSlug(args: docPageProps) {
  return <DocPage {...args}></DocPage>;
}

type Params = {
  params: {
    slug: string;
  };
};

export async function getStaticProps({ params }: Params) {
  const doc = await getDoc({ dir, slug: params.slug });
  return {
    props: {
      doc,
    },
  };
}

export async function getStaticPaths() {
  return {
    paths: getPaths({ dir }),
    fallback: false,
  };
}
