/* eslint-disable @typescript-eslint/no-explicit-any */
import { enhance } from "@zenstackhq/runtime";
import { ChatOpenAI } from "langchain/chat_models/openai";
import { PromptTemplate } from "langchain/prompts";
import { HumanMessage, SystemMessage } from "langchain/schema";
import { z } from "zod";

import { prisma } from "~/db.server";

const chatModel = new ChatOpenAI({ modelName: "gpt-4" });

const prismaTemplate = PromptTemplate.fromTemplate(`
Given the following Prisma schema:

\`\`\`
model Product {{
    id         String      @id @default(cuid())
    name       String
    category   String
    price      Float
    orderItems OrderItem[]
}}
  
model Order {{
    id        String      @id @default(cuid())
    createdAt DateTime    @default(now())
    updatedAt DateTime    @updatedAt
    items     OrderItem[]
    region    String
}}
  
model OrderItem {{
    id        String @id @default(cuid())
    quantity  Int
    productId String
    orderId   String
  
    product Product @relation(fields: [productId], references: [id], onDelete: Cascade)
    order   Order   @relation(fields: [orderId], references: [id], onDelete: Cascade)
}}

view OrderItemDetail {{
  id        String   @id
  createdAt DateTime
  updatedAt DateTime
  product   String
  category  String
  region    String
  unitPrice Float
  quantity  Int
  subtotal  Float
}}
\`\`\`

The "OrderItemDetails" view contains order items with more fields joined from "Order" and "Product". You can use it for aggregations.

When you do aggregation, use "_sum", "_avg", "_min", "_max" to aggregate numeric fields, use "_count" to count the number of rows.
An aggregation can be written like:

\`\`\`
{{
  by: ['field'],
  _sum: {{
    metricField: true,
  }},
}}
\`\`\`

Using Prisma APIs including "findMany", "aggregate", and "groupBy", compute a Prisma query for the following question:
"{query}"

However, don't return the Prisma function call, instead, transform it into a JSON object like the following:

\`\`\`
{{
    "model": "Order",
    "api": "findMany",
    "arguments": {{ ... }}
}}
\`\`\`

The "model" field contains the name of the model to query, like "Order", "OrderItemDetails". 
The "api" field contains the Prisma API to use, like "groupBy", "aggregate".
The "arguments" field contains the arguments to pass to the Prisma API, like "{{ by: ['category'] }}".

Return only the JSON object. Don't provide any other text.
`);

const prismaQueryParser = z.object({
  model: z.string(),
  api: z.string(),
  arguments: z.any(),
});

const mock = false;

export async function processQuery(userId: string, query: string) {
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: { id: true, region: true },
  });
  const enhanced = enhance(prisma, { user });

  try {
    const prismaQuery = await getPrismaQuery(query, mock);

    const data = await (enhanced as any)[prismaQuery.model][prismaQuery.api](
      prismaQuery.arguments,
    );

    console.log("Query result:", JSON.stringify(data, null, 2));

    const chart = await getChart(data, mock);

    return {
      query: prismaQuery,
      data,
      chart: chart,
    };
  } catch (err: any) {
    console.error(err);
    return { error: err.toString() };
  }
}

async function getPrismaQuery(query: string, mock = false) {
  if (mock) {
    return {
      model: "OrderItemDetail",
      api: "groupBy",
      arguments: {
        by: ["category"],
        _sum: {
          subtotal: true,
        },
      },
    };
  } else {
    const messages = [
      new SystemMessage({
        content: "You are a senior developer who knows Prisma ORM very well.",
      }),
      new HumanMessage({
        content: await prismaTemplate.format({ query }),
      }),
    ];

    console.log("Calling OpenAI to get Prisma query");
    const result = await chatModel.predictMessages(messages);
    console.log("Raw result:", result.content);

    const extracted = extractCodeSnippet(result.content);
    console.log("Extracted JSON:", extracted);

    const json = JSON.parse(extracted);
    return prismaQueryParser.parse(json);
  }
}

const charsJSTemplate = PromptTemplate.fromTemplate(`
Generate a bar chart using Charts.js syntax for the following JSON data:

\`\`\`
{data}
\`\`\`

Use the chart configuration that you feel is most appropriate for the data.

Return only the Charts.js input object converted to JSON format.
Make sure keys and string values are double quoted.
Don't call Charts.js constructor. Don't output anything else.
`);

async function getChart(data: unknown, mock = false) {
  if (mock) {
    return {
      type: "bar",
      data: {
        labels: ["Electronics", "Furniture", "Outdoor"],
        datasets: [
          {
            label: "Subtotal",
            data: [2597, 4697, 307],
            backgroundColor: [
              "rgba(75, 192, 192, 0.2)",
              "rgba(153, 102, 255, 0.2)",
              "rgba(255, 159, 64, 0.2)",
            ],
            borderColor: [
              "rgba(75, 192, 192, 1)",
              "rgba(153, 102, 255, 1)",
              "rgba(255, 159, 64, 1)",
            ],
            borderWidth: 1,
          },
        ],
      },
      options: {
        scales: {
          yAxes: [
            {
              ticks: {
                beginAtZero: true,
              },
            },
          ],
        },
      },
    };
  }
  const messages = [
    new SystemMessage({
      content: "You are a senior developer who knows Charts.js very well.",
    }),
    new HumanMessage({
      content: await charsJSTemplate.format({
        data: JSON.stringify(data, null, 2),
      }),
    }),
  ];

  console.log("Calling OpenAI to get Charts.js config");
  const chartsJSResult = await chatModel.predictMessages(messages);

  console.log("Raw Charts.js result:", chartsJSResult.content);
  const chart = extractCodeSnippet(chartsJSResult.content);

  console.log("Extracted Charts.js config:", chart);

  return JSON.parse(chart);
}

function extractCodeSnippet(text: string) {
  const regex = /```([^\n]*)([^`]*?)```/s;
  const match = regex.exec(text);
  return match ? match[2] : text;
}
