import classnames from "classnames";
import ErrorPage from "next/error";
import Head from "next/head";
import { useRouter } from "next/router";
import type Doc from "../interfaces/doc";
import { CMS_NAME } from "../lib/constants";
import Container from "./container";
import Header from "./header";
import Layout from "./layout";
import PostBody from "./post-body";
import PostTitle from "./post-title";

import "github-markdown-css/github-markdown-light.css";
import docPageCss from "./doc-page.module.scss";

export type docPageProps = {
  doc: Doc;
  preview?: boolean;
};

export default function DocPage({ doc, preview }: docPageProps) {
  const router = useRouter();
  if (!router.isFallback && !doc?.slug) {
    return <ErrorPage statusCode={404} />;
  }
  return (
    <Layout preview={preview}>
      <Header />
      <Container>
        {router.isFallback ? (
          <PostTitle>Loading…</PostTitle>
        ) : (
          <>
            <article
              className={classnames(
                "mb-32",
                "markdown-body",
                docPageCss["markdown-body"]
              )}
            >
              <Head>
                <title>{`${doc.title} | ${CMS_NAME}`}</title>
              </Head>
              {/* <PostHeader title={doc.title || doc.slug} date={doc.date} /> */}
              <div className={classnames(docPageCss["post-body"])}>
                <PostBody content={doc.content} />
              </div>
            </article>
          </>
        )}
      </Container>
    </Layout>
  );
}
