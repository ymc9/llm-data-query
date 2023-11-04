# LLM-Based Data Query Demo

A demo project for leveraging LLM to query a database with natural languages, and render charts for the results. The implementation also takes care of access control and ensures users only see data they are allowed to see.

Find more information in [this blog post](https://zenstack.dev/blog/llm-acl).

## Stack

- [Remix.run](https://remix.run/) as full-stack framework
- [Langchain](https://js.langchain.com) for interfacing with OpenAI API
- [Prisma ORM](https://prisma.io) for data modeling database access
- [ZenStack](https://github.com/zenstackhq/zenstack) for access control
- [Charts.js](https://www.chartjs.org/) for creating diagrams

## Run the project

1. `npm install`
2. Prepare environment variables
   copy ".env.example" to ".env" and fill in [OPENAI_API_KEY](https://help.openai.com/en/articles/4936850-where-do-i-find-my-secret-api-key)
3. Run ZenStack code generation

   `npm run generate`

4. Deploy Prisma migrations

   `npx prisma migrate deploy`

5. Seed the database

   `npx prisma db seed`

6. Start dev server

   `npm run dev`

Login with one of the following users:

- Username: "tom@test.com", Password: "12345678". This user only sees orders from "Washington" region.
- Username: "jerry@test.com", Password: "12345678". This user only sees orders from "California" region.
