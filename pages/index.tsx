import Head from "next/head";
import Link from "next/link";
import Container from "../components/container";
import Layout from "../components/layout";
import Post from "../interfaces/post";
import { getAllPosts } from "../lib/api";
import { CMS_NAME } from "../lib/constants";

type Props = {
  allPosts: Post[];
};

export default function Index({ allPosts: allDocs }: Props) {
  return (
    <>
      <Layout>
        <Head>
          <title>{CMS_NAME}</title>
        </Head>
        <Container>
          <ul>
            {allDocs.map((doc) => {
              return (
                <li key={doc.slug}>
                  <Link href={`github/${doc.slug}`}>{doc.slug}</Link>
                </li>
              );
            })}
          </ul>
        </Container>
      </Layout>
    </>
  );
}

export const getStaticProps = async () => {
  const allPosts = getAllPosts("github", ["title", "date", "slug"]);

  return {
    props: { allPosts },
  };
};
