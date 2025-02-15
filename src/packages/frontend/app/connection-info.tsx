/*
 *  This file is part of CoCalc: Copyright © 2020 Sagemath, Inc.
 *  License: MS-RSL – see LICENSE.md for details
 */

import { Modal } from "antd";

import { Button, Col, Row } from "@cocalc/frontend/antd-bootstrap";
import {
  React,
  useActions,
  useTypedRedux,
} from "@cocalc/frontend/app-framework";
import { Icon } from "@cocalc/frontend/components";
import { webapp_client } from "@cocalc/frontend/webapp-client";
import { plural } from "@cocalc/util/misc";

export const ConnectionInfo: React.FC = React.memo(() => {
  const ping = useTypedRedux("page", "ping");
  const avgping = useTypedRedux("page", "avgping");
  const status = useTypedRedux("page", "connection_status");
  const hub = useTypedRedux("account", "hub");
  const page_actions = useActions("page");

  function close() {
    page_actions.show_connection(false);
  }

  return (
    <Modal
      width={900}
      open
      onCancel={close}
      onOk={close}
      title={
        <>
          <Icon name="wifi" style={{ marginRight: "1em" }} /> Connection
        </>
      }
    >
      <div>
        {ping ? (
          <Row>
            <Col sm={3}>
              <h4>Ping time</h4>
            </Col>
            <Col sm={6}>
              <pre>
                {avgping}ms (latest: {ping}ms)
              </pre>
            </Col>
          </Row>
        ) : undefined}
        <Row>
          <Col sm={3}>
            <h4>Hub server</h4>
          </Col>
          <Col sm={6}>
            <pre>{hub != null ? hub : "Not signed in"}</pre>
          </Col>
          <Col sm={2}>
            <Button onClick={webapp_client.hub_client.fix_connection}>
              <Icon name="repeat" spin={status === "connecting"} /> Reconnect
            </Button>
          </Col>
        </Row>
        <Row>
          <Col sm={3}>
            <h4>Messages</h4>
          </Col>
          <Col sm={6}>
            <MessageInfo />
          </Col>
        </Row>
      </div>
    </Modal>
  );
});

function bytes_to_str(bytes: number): string {
  const x = Math.round(bytes / 1000);
  if (x < 1000) {
    return x + "K";
  }
  return x / 1000 + "M";
}

const MessageInfo: React.FC = React.memo(() => {
  const info = useTypedRedux("account", "mesg_info");

  if (info == null) {
    return <span></span>;
  }
  return (
    <div>
      <pre>
        {info.get("sent")} messages sent (
        {bytes_to_str(info.get("sent_length"))})
        <br />
        {info.get("recv")} messages received (
        {bytes_to_str(info.get("recv_length"))})
        <br />
        <span
          style={
            info.get("count") > 0
              ? { color: "#08e", fontWeight: "bold" }
              : undefined
          }
        >
          {info.get("count")} {plural(info.get("count"), "message")} in flight
        </span>
        <br />
        {info.get("enqueued")} {plural(info.get("enqueued"), "message")} queued
        to send
      </pre>
      <div style={{ color: "#666" }}>
        Connection icon color changes as the number of messages in flight to a
        hub increases. Usually, no action is needed, but the counts are helpful
        for diagnostic purposes. The maximum number of messages that can be sent
        at the same time is {info.get("max_concurrent")}.
      </div>
    </div>
  );
});
