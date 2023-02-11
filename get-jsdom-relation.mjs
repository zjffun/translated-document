/* eslint-disable import/no-unresolved */
import fs from "node:fs";
import { RelationServer } from "relation2-core";

async function main() {
  const relationServer = new RelationServer();
  const rawRelations = relationServer.filter((rawRelation) => {
    return rawRelation.fromPath === "files/en-us/github/jsdom.md";
  });
  const str = JSON.stringify(rawRelations, null, 2);
  fs.writeFileSync("jsdom-relation.json", str);
}

main();
