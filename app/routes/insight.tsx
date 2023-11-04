/* eslint-disable @typescript-eslint/no-explicit-any */
import { ActionFunctionArgs } from "@remix-run/node";
import { Form, Link, useFetcher } from "@remix-run/react";
import { Chart } from "chart.js/auto";

import { processQuery } from "~/lib/llm";
import { requireUserId } from "~/session.server";
import { useUser } from "~/utils";

interface QueryResult {
  query: any;
  chart: any;
}

export const action = async ({ request }: ActionFunctionArgs) => {
  const userId = await requireUserId(request);
  const formData = await request.formData();
  const query = formData.get("query");
  if (!query) {
    return new Response("No query", { status: 400 });
  }
  return await processQuery(userId, query.toString());
};

let chart: Chart | undefined;

export default function ExplorePage() {
  const user = useUser();
  const fetcher = useFetcher<QueryResult>();

  if (fetcher.state === "submitting") {
    if (chart) {
      chart.destroy();
      chart = undefined;
    }
  } else if (fetcher.data) {
    console.log(fetcher.data);
    if (chart) {
      chart.destroy();
    }
    const ctx = (document.getElementById("myChart") as any).getContext("2d");
    chart = new Chart(ctx, fetcher.data.chart);
  }

  return (
    <div className="flex h-full min-h-screen flex-col">
      <header className="flex items-center justify-between bg-slate-800 p-4 text-white">
        <h1 className="text-3xl font-bold">
          <Link to=".">Sales Insight</Link>
        </h1>
        <p>{user.email}</p>
        <Form action="/logout" method="post">
          <button
            type="submit"
            className="rounded bg-slate-600 px-4 py-2 text-blue-100 hover:bg-blue-500 active:bg-blue-600"
          >
            Logout
          </button>
        </Form>
      </header>
      <div className="p-16 w-full flex">
        <div className="container flex flex-col">
          <h1 className="text-2xl font-semibold">
            Let&apos;s ask questions about your data
          </h1>
          <fetcher.Form method="post" className="w-full">
            <input
              type="text"
              name="query"
              className="border rounded text-lg p-2 mt-8 mr-4 w-full max-w-xl"
              // eslint-disable-next-line jsx-a11y/no-autofocus
              autoFocus={true}
              defaultValue="total sales by product category"
            />
            <button
              type="submit"
              className="btn btn-primary"
              disabled={fetcher.state === "submitting"}
            >
              {fetcher.state === "submitting" ? "Thinking..." : "Go"}
            </button>
          </fetcher.Form>

          <div className="max-w-2xl mt-4">
            <canvas id="myChart" />
          </div>
        </div>
      </div>
    </div>
  );
}
