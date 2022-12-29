// TODO: the antd Descriptions component is perhaps better for this?
//   https://ant.design/components/descriptions

import { CSSProperties, ReactNode, useMemo, useState } from "react";
import { Card, Divider, Modal } from "antd";
import { VirtuosoGrid } from "react-virtuoso";
import { ViewOnly } from "../fields/context";
import { Icon } from "@cocalc/frontend/components";
import Json from "./json";
import type { ColumnsType } from "../fields";

interface Props {
  rowKey: string;
  data: object[];
  columns: ColumnsType[];
  allColumns: ColumnsType[];
  title: ReactNode;
  cardStyle?;
  height?;
  recordHeight?: number;
}

function ItemContainer({ children }: { children?: ReactNode }) {
  return <div style={{ display: "inline-block" }}>{children}</div>;
}

export default function Gallery({
  rowKey,
  data,
  columns,
  allColumns,
  title,
  cardStyle = {
    width: "300px",
    height: "300px",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  height,
  recordHeight,
}: Props) {
  const style = useMemo(() => {
    return { ...cardStyle, height: recordHeight };
  }, [cardStyle, recordHeight]);
  return (
    <Card title={title}>
      <VirtuosoGrid
        overscan={500}
        style={{ height: height ?? "600px", background: "#ececec" }}
        totalCount={data.length}
        components={{
          Item: ItemContainer,
        }}
        itemContent={(index) => (
          <OneCard
            key={data[index][rowKey]}
            elt={data[index]}
            rowKey={rowKey}
            columns={columns}
            allColumns={allColumns}
            style={style}
          />
        )}
      />
    </Card>
  );
}

export function OneCard({
  elt,
  rowKey,
  columns,
  allColumns,
  style,
  DragHandle,
}: {
  elt;
  rowKey: string;
  columns: object[];
  allColumns: object[];
  style?: CSSProperties;
  DragHandle?;
}) {
  const [open, setOpen] = useState<boolean>(false);
  const title = <Data noTitle elt={elt} columns={[columns[0]]} />;
  const data = <Data elt={elt} columns={columns.slice(1)} />;
  const card = (
    <Card
      onClick={() => setOpen(true)}
      hoverable
      key={elt[rowKey]}
      title={
        <span style={{ fontSize: "10pt", display: "flex" }}>
          {DragHandle != null ? <DragHandle>{title}</DragHandle> : title}
        </span>
      }
      style={{
        display: "inline-block",
        margin: "10px",
        verticalAlign: "top",
        ...style,
      }}
    >
      {data}
    </Card>
  );
  return (
    <div>
      <Modal
        transitionName=""
        maskTransitionName=""
        style={{
          maxHeight: "90vh",
          maxWidth: "90vw",
          minWidth: "800px",
          overflow: "auto",
          padding: "10px 0",
        }}
        open={open}
        title={
          <>
            <Icon name="pencil" style={{ marginRight: "15px" }} /> Edit
          </>
        }
        onOk={() => setOpen(false)}
        onCancel={() => setOpen(false)}
      >
        <Data elt={elt} columns={allColumns} />
        <Divider>Raw Data</Divider>
        <Json obj={elt} />
      </Modal>
      <ViewOnly>{card}</ViewOnly>
    </div>
  );
}

export function Data({
  elt,
  columns,
  noTitle,
}: {
  elt: object;
  columns;
  noTitle?;
}) {
  const v: ReactNode[] = [];
  for (const column of columns) {
    if (column == null) continue;
    const text = elt[column.dataIndex];
    const content = column.render != null ? column.render(text, elt) : text;
    v.push(
      <div key={column.key} style={{ maxWidth: "800px" }}>
        {!noTitle && <span style={{ color: "#888" }}>{column.title}: </span>}
        {content}
      </div>
    );
  }
  return <>{v}</>;
}
