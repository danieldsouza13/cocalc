/*
 *  This file is part of CoCalc: Copyright © 2020 Sagemath, Inc.
 *  License: AGPLv3 s.t. "Commons Clause" – see LICENSE.md for details
 */

/*
Express HTTP API server

This is meant to be used from within the project via localhost, both
to get info from the project, and to cause the project to do things.

Requests must be authenticated using the secret token.
*/

const MAX_REQUESTS_PER_MINUTE = 50;

import express from "express";
import { writeFile } from "fs";
import { callback } from "awaiting";
import { once } from "@cocalc/util/async-utils";
import { split, meta_file } from "@cocalc/util/misc";
import { json, urlencoded } from "body-parser";

const { client_db } = require("@cocalc/util/db-schema");
const RateLimit = require("express-rate-limit");
import { apiServerPortFile } from "@cocalc/project/data";
const theClient = require("@cocalc/project/client");
import { secretToken } from "@cocalc/project/servers/secret-token";

export default async function init(): Promise<void> {
  const client = theClient.client;
  if (client == null) throw Error("client must be defined");
  const dbg: Function = client.dbg("api_server");
  const app: express.Application = express();

  dbg("configuring server...");
  configure(client, app, dbg);

  const server = app.listen(0, "localhost");
  await once(server, "listening");
  const address = server.address();
  if (address == null || typeof address == "string") {
    throw Error("failed to assign a port");
  }
  const { port } = address;
  dbg(`writing port to file "${apiServerPortFile}"`);
  await callback(writeFile, apiServerPortFile, `${port}`);

  dbg(`express server successfully listening at http://localhost:${port}`);
}

function configure(client, server: express.Application, dbg: Function): void {
  server.use(json({ limit: "3mb" }));
  server.use(urlencoded({ extended: true, limit: "3mb" }));

  rateLimit(server);

  server.get("/", handleGet);

  server.post("/api/v1/*", async (req, res) => {
    dbg(`POST to ${req.path}`);
    try {
      handleAuth(req);
      await handlePost(req, res, client);
    } catch (err) {
      dbg(`failed handling POST ${err}`);
      res.status(400).send({ error: `${err}` });
    }
  });
}

function rateLimit(server: express.Application): void {
  // (suggested by LGTM):
  // set up rate limiter -- maximum of 50 requests per minute
  const limiter = new RateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: MAX_REQUESTS_PER_MINUTE,
  });
  // apply rate limiter to all requests
  server.use(limiter);
}

function handleGet(_req, res): void {
  // Don't do anything useful, since user is not authenticated!
  res.send({ status: "ok", mesg: "use a POST request" });
}

function handleAuth(req): void {
  const h = req.header("Authorization");
  if (h == null) {
    throw Error("you MUST authenticate all requests");
  }

  let providedToken: string;
  const [type, user] = split(h);
  switch (type) {
    case "Bearer":
      providedToken = user;
      break;
    case "Basic":
      const x = Buffer.from(user, "base64");
      providedToken = x.toString().split(":")[0];
      break;
    default:
      throw Error(`unknown authorization type '${type}'`);
  }
  // now check auth
  if (secretToken != providedToken) {
    throw Error(`incorrect secret token "${secretToken}", "${providedToken}"`);
  }
}

async function handlePost(req, res, client): Promise<void> {
  const endpoint: string = req.path.slice(req.path.lastIndexOf("/") + 1);
  try {
    switch (endpoint) {
      case "get-syncdoc-history":
        res.send(await getSyncdocHistory(req.body, client));
        return;
      default:
        throw Error("unknown endpoint");
    }
  } catch (err) {
    throw Error(`handling api endpoint ${endpoint} -- ${err}`);
  }
}

async function getSyncdocHistory(body, client): Promise<any> {
  const dbg = client.dbg("get-syncdoc-history");
  let path = body.path;
  dbg(`path="${path}"`);
  if (typeof path != "string") {
    throw Error("provide the path as a string");
  }

  // transform jupyter path -- TODO: this should
  // be more centralized... since this is brittle.
  if (path.endsWith(".ipynb")) {
    path = meta_file(path, "jupyter2");
  }

  // compute the string_id
  const string_id = client_db.sha1(client.project_id, path);
  return await client.get_syncdoc_history(string_id, !!body.patches);
}
