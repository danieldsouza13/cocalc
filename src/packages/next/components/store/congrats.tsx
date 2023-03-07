/*
Page that you show user after they successfully complete a purchase.

It queries the backend for "the most recent stuff you bought", thanks
you for your purchase, has useful links, etc.

NOTE: the current implementation is just a really simple one that assumes
you are purchasing a license for projects, since that's all we sell
right now.  This will have to be a bit more sophisticated when there's
more products.
*/

import { Icon } from "@cocalc/frontend/components/icon";
import { plural } from "@cocalc/util/misc";
import { Alert, Card } from "antd";
import Image from "components/landing/image";
import License from "components/licenses/license";
import A from "components/misc/A";
import Loading from "components/share/loading";
import SiteName from "components/share/site-name";
import useAPI from "lib/hooks/api";
import bella from "public/shopping/bella.png";
import TimeAgo from "timeago-react";

export default function Congrats() {
  const purchases = useAPI("/shopping/cart/recent-purchases", {
    recent: "2 day",
  });
  const vouchers = useAPI("/vouchers/recent-vouchers", {
    recent: "2 day",
  });

  if (purchases.error) {
    return <Alert type="error" message={purchases.error} />;
  }
  if (vouchers.error) {
    return <Alert type="error" message={vouchers.error} />;
  }
  if (!purchases.result || !vouchers.result) {
    return <Loading large center />;
  }

  const billingInfo = (
    <Alert
      showIcon
      style={{ margin: "15px 0" }}
      type="info"
      message={
        <>
          Browse your <A href="/billing/receipts">invoices, receipts</A> and{" "}
          <A href="/billing/subscriptions">subscriptions</A> on the{" "}
          <A href="/billing">billing page</A>, or visit the{" "}
          <A href="/vouchers">voucher center</A>.
        </>
      }
    />
  );

  if (purchases.result.length == 0 && vouchers.result.length == 0) {
    return <div>You have no recent purchases or vouchers. {billingInfo}</div>;
  }

  function renderNextSteps(): JSX.Element {
    return (
      <>
        <h2>Here are your next steps</h2>
        <ul>
          {purchases.result.length > 0 && (
            <li style={{ marginBottom: "15px" }}>
              You are a manager for each of the licenses you purchased.{" "}
              <A href="/licenses/managed">You can see your managed licenses</A>,
              add other people as managers, edit the title and description of
              each license, and see how a license is being used.
            </li>
          )}
          {purchases.result.length > 0 && (
            <li style={{ marginBottom: "15px" }}>
              You can{" "}
              <A href="https://doc.cocalc.com/project-settings.html#project-add-license">
                apply a license to projects
              </A>
              ,{" "}
              <A href="https://doc.cocalc.com/teaching-upgrade-course.html#install-course-license">
                courses
              </A>
              , or directly share the license code, as{" "}
              <A href="https://doc.cocalc.com/licenses.html">explained here</A>.
              It's time to make your <SiteName /> projects much, much better.
            </li>
          )}
          {vouchers.result.length > 0 && (
            <li style={{ marginBottom: "15px" }}>
              You can{" "}
              <A href="/vouchers/created">
                browse all the vouchers you have created
              </A>
              , and everything else involving vouchers at the{" "}
              <A href="/vouchers">vouchers center</A>.
            </li>
          )}
          <li style={{ marginBottom: "15px" }}>
            You can <A href="/billing/receipts">download your receipt</A> and{" "}
            <A href="/billing/subscriptions">
              check on the status of subscriptions.
            </A>
          </li>
          <li style={{ marginBottom: "15px" }}>
            If you're interested in <A href="/store/vouchers">purchasing</A>,{" "}
            <A href="/redeem">redeeming</A>, or checking on the{" "}
            <A href="/vouchers/created">status of your vouchers</A>, visit the{" "}
            <A href="/vouchers">Voucher Center</A>.
          </li>
          <li>
            If you have questions,{" "}
            <A href="/support/new">create a support ticket</A>. Your request
            will be more highly prioritized.
          </li>
        </ul>
        {billingInfo}
      </>
    );
  }

  function renderAutomaticallyApplied(): JSX.Element {
    const appliedProjects = purchases.result.filter(
      (x) => x.project_id != null
    );
    const numApplied = appliedProjects.length;
    if (numApplied == 0) return <></>;
    return (
      <>
        <br />
        <Alert
          type="info"
          message={
            <>
              <p>
                The following {plural(numApplied, "project")} automatically got
                a license applied:
              </p>
              <ul>
                {appliedProjects.map((x) => (
                  <li key={x.project_id}>
                    Project{" "}
                    <A href={`/projects/${x.project_id}`} external={true}>
                      {x.project_id}
                    </A>{" "}
                    got license <License license_id={x.purchased?.license_id} />
                    .
                  </li>
                ))}
              </ul>
            </>
          }
        ></Alert>
      </>
    );
  }

  return (
    <>
      <div style={{ float: "right" }}>
        <Image src={bella} width={100} height={141} alt="Picture of Bella!" />
      </div>
      <div style={{ fontSize: "12pt" }}>
        <h1 style={{ fontSize: "24pt" }}>
          <Icon
            name="check-circle"
            style={{ color: "darkgreen", marginRight: "10px" }}
          />{" "}
          Order Complete!
        </h1>
        {purchases.result.length > 0 && (
          <Card
            style={{ margin: "15px auto", maxWidth: "700px" }}
            title={
              <>
                <Icon name="key" style={{ marginRight: "15px" }} />
                Congrats! You recently ordered{" "}
                {purchases.result.length >= 2 ? "these" : "this"}{" "}
                {purchases.result.length} <SiteName />{" "}
                {plural(purchases.result.length, "license")}
              </>
            }
          >
            <ul>
              {purchases.result.map((item) => (
                <li key={item.purchased.license_id}>
                  <License
                    key={item.purchased.license_id}
                    license_id={item.purchased.license_id}
                  />
                  , purchased <TimeAgo datetime={item.purchased.time} />
                </li>
              ))}
            </ul>
            {renderAutomaticallyApplied()}
          </Card>
        )}
        {vouchers.result.length > 0 && (
          <Card
            title={
              <>
                <Icon name="gift2" style={{ marginRight: "15px" }} />
                Congrats! You recently created {vouchers.result.length}{" "}
                {plural(vouchers.result.length, "voucher")}.
              </>
            }
            style={{ margin: "15px auto", maxWidth: "700px" }}
          >
            You can download the corresponding voucher codes via the{" "}
            {plural(vouchers.result.length, "link")} below.
            <br />
            <br />
            <ul>
              {vouchers.result.map((item) => (
                <Voucher {...item} />
              ))}
            </ul>
          </Card>
        )}
        <br />
        {renderNextSteps()}
      </div>
    </>
  );
}

function Voucher({ id, title, count, created }) {
  return (
    <li key={id}>
      <A href={`/vouchers/${id}`}>
        {title}: {count} voucher codes
      </A>
      , created <TimeAgo datetime={created} />
    </li>
  );
}
