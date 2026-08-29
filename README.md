<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# MYIMUN platform

Next.js platform for MYIMUN registrations, committees, payments, delegate support, and administration.

## Run locally

**Prerequisites:**  Node.js

1. Install dependencies:
   `npm install`
2. Copy `.env.example` to `.env` and configure the local database and authentication secrets.
3. To enable AI reply drafting in **Admin → Messages**, set `OPENAI_API_KEY` in `.env`. The optional `OPENAI_MODEL` defaults to `gpt-5.4-mini`.
4. Run the app:
   `npm run dev`

The OpenAI key is read only by the server-side draft endpoint. Admins must review and explicitly send every generated reply; AI drafts are never sent automatically.
