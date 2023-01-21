import Head from "next/head";
import Link from "next/link";
import Container from "../components/container";
import Header from "../components/header";
import Layout from "../components/layout";
import Doc from "../interfaces/doc";
import { getAllDocs } from "../lib/api";
import { CMS_NAME } from "../lib/constants";

import indexCss from "./index.module.scss";

type Props = {
  allDocs: Record<string, Doc[]>;
};

export default function Index({ allDocs }: Props) {
  return (
    <>
      <Layout>
        <Head>
          <title>{CMS_NAME}</title>
        </Head>
        <Header />
        <Container>
          <ul>
            {Object.entries(allDocs).map(([dir, docs]) => {
              return (
                <li className={indexCss.group} key={dir}>
                  <h2 className={indexCss.groupTitle}>{dir}</h2>
                  <ul>
                    {docs.map((doc) => {
                      const href = `${dir}/${doc.slug}`;

                      return (
                        <li className={indexCss.docItem} key={href}>
                          <Link className={indexCss.link} href={href}>
                            {doc.title}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
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
  const allDocs = getAllDocs(["title", "date", "slug"]);

  return {
    props: {
      allDocs,
    },
  };
};
