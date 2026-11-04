---
title: "Wit.ai intents vs LLM tool calling: what carried over"
date: 2026-11-04
description: "What a 2017 Wit.ai chatbot with intents, entities and a Speech API taught, and how each piece maps to LLM tool calling with JSON Schema in 2026."
tags:
  - dev
  - ai
  - wit-ai
  - tool-calling
---

> [!tldr]
> A 2017 Wit.ai bot turned a sentence into an intent plus entities and handed them to a function. LLM tool calling keeps that contract, a tool name plus typed arguments, and swaps the labelled training set for a description and a JSON Schema. **The boundary survives: the model proposes a call, and your code validates and executes it.** The confidence score does not survive, so the sentences you once used for training become the test set that tells you whether the router still works.

## The shape of a 2017 Wit.ai bot

In April and May 2017 I built a small chatbot on Wit.ai and wrote it up in Polish as a four-part series. The first part, [Chatbot, Wit.ai - z czym to się je](https://dawidrylko.com/chatbot-wit-ai-z-czym-to-sie-je/) (in Polish), explains why I picked it: it was free, it understood Polish and it came with an HTTP API and SDKs.

The core of the second part, [Chatbot, Wit.ai - środowisko graficzne](https://dawidrylko.com/chatbot-wit-ai-srodowisko-graficzne/) (in Polish), is the training console. You type a sentence a user might say, `Kim jest Johnny Depp?` in my case, assign it the intent `find-person` and mark the name as the entity `fullName`. Entities have a search strategy: `keywords` for a closed list such as countries or currencies, `free-text` for a span you want extracted as it is, and `trait` for a value that does not come from a keyword or a span of the sentence, such as its general context or the user's intention. Built-in entities cover time expressions, numbers, locations and temperatures. I advised varying the word order and adding typos to the training sentences, which is the whole "training" story of a classic NLU service: **labelled examples, in volume**.

The third part, [Chatbot, Wit.ai - tworzenie chatbota - Wit Node.js SDK](https://dawidrylko.com/chatbot-wit-ai-tworzenie-chatbota-wit-node-js-sdk/) (in Polish), moves to code. The `node-wit` client sends the sentence, Wit returns the intent and entities, and an action named `findPerson` receives them and opens the person's Wikipedia article. The fourth, [Chatbot, Wit.ai - tworzenie chatbota - Speech API](https://dawidrylko.com/chatbot-wit-ai-tworzenie-chatbota-speech-api/) (in Polish), swaps typed text for a microphone in the browser: audio goes to the Speech API over WebRTC and WebSockets through the `wit-ai/microphone` library, and the answer is the same JSON with intent and entities.

Everything in that design reduces to one pipeline. A sentence becomes a name (the intent) and a set of named values (the entities), and a function you wrote consumes both.

## What Wit changed after those posts

Three months after my console post, on 27 July 2017, the Wit team announced that it was sunsetting Bot Engine, deprecating the Stories UI for new apps and ending the `/converse` endpoint on 1 February 2018. Stories were the part of my second post where the bot "executes" `findPerson()`. The announcement gave the reason: most apps using Stories were one-turn, FAQ-like apps that a single `/message` call covers, against four `/converse` calls on average, and the recommended migration was to **use `/message` and manage the conversation in your own code**.

That is already the division of labour in tool calling: the service analyses the sentence, and your code runs the conversation and the functions. Wit has since added Composer, a dialogue flow that it runs for you against a context map: `node-wit` v6.5.0 added it on 1 October 2022, and v6.6.0 from February 2023 is the latest npm release. The service itself is alive (the 2026 documentation footer reads Meta, and sign-in goes through a Meta account), and its HTTP API is versioned by date (`v=20240304` in the reference's examples).

A `GET /message` call returns the text, the intents sorted by confidence and the entities keyed as `name:role`. This is the documented example, trimmed:

```json
{
  "text": "how many people between Tuesday and Friday",
  "intents": [{ "name": "inquiry", "confidence": 0.8849 }],
  "entities": {
    "metric:metric": [{ "body": "people", "value": "metric_visitor", "confidence": 0.9231 }],
    "wit$datetime:datetime": [{ "body": "between Tuesday and Friday", "type": "interval", "confidence": 0.9541 }]
  }
}
```

Two limits in the reference shape how you use it. `q` takes between 0 and 280 characters, and `POST /speech` accepts at most 20 seconds of audio (`POST /dictation`, which only transcribes, takes up to 5 minutes). The reference itself calls both endpoints "meant for short inputs".

## Where each Wit concept lands

Each piece of the 2017 pipeline has a counterpart:

| Wit.ai | In my 2017 bot | Tool calling in 2026 |
| --- | --- | --- |
| Intent | `find-person` | A tool, named `find_person_article`. If the model calls none, the sentence is out of scope. |
| Entity | `fullName` | A property in the tool's `input_schema`, with a type and a description. |
| `keywords` search strategy | A closed list of values | An `enum` in the schema. |
| `free-text` search strategy | The name as typed | A `string` property. |
| Built-in entity, such as `wit/datetime` | Dates and numbers resolved for me | Not built in. You pass today's date and the user's timezone in the prompt and ask for ISO 8601 values. |
| Training sentences | Typed into the console, validated one by one | The tool `description`, optional `input_examples`, and a test set you keep. |
| Confidence | A number from 0 to 1 per intent | None on a tool call. |
| Story and actions | `findPerson()` called by a story | Your loop: handle the `tool_use` block, run the function, return a `tool_result`. |
| Speech API | `/speech` returns transcript and understanding | Transcribe first, then send the text to the model. |

Wit's reference says that "today" resolves differently depending on the user's timezone and offers `reference_time`, `timezone` and `locale` in a context object for that reason. A model has no clock of its own either. That context moves into your prompt, and the resolved value comes back as text you must parse and validate.

The confidence row is the real change. Wit's quickstart is explicit that it always returns any recognized intent and that you decide what a reasonable threshold is for your scenario, whereas **a tool call carries no such number**. Claude decides on each turn whether to call a tool. The documentation ties that choice to the request and to the tool's description, which is why it calls descriptions "by far the most important factor" in tool performance and asks for at least three or four sentences per tool.

## The same bot as a tool

This is the `find-person` intent as a tool definition. The call itself follows the Messages API examples in Anthropic's documentation, with `strict: true`, which constrains sampling so that the tool input matches the schema.

```ts
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

const tools: Anthropic.Tool[] = [
  {
    name: "find_person_article",
    description:
      "Finds the Wikipedia article about a named person and returns its URL. " +
      "Use it when the user asks who a specific person is or wants information about them. " +
      "It does not return the article text. Do not use it for companies, places or general questions.",
    strict: true,
    input_schema: {
      type: "object",
      properties: {
        full_name: {
          type: "string",
          description: "First and last name as the user wrote them, for example Adam Małysz",
        },
        language: {
          type: "string",
          enum: ["pl", "en"],
          description: "Wikipedia edition, matching the language of the question",
        },
      },
      required: ["full_name"],
      additionalProperties: false,
    },
  },
];

export async function understand(utterance: string) {
  const response = await client.messages.create({
    model: "claude-sonnet-5-5",
    max_tokens: 1024,
    tools,
    messages: [{ role: "user", content: utterance }],
  });
  return response.content;
}
```

What comes back is a list of content blocks. A `tool_use` block carries the tool name and an `input` object, and the router below decides what to do with it. Its three outcomes are an answer, a question back to the user and a way out for sentences that are not about people, and **it validates every argument before acting on it**, even though the schema is strict.

```ts
type ToolUse = { type: "tool_use"; id: string; name: string; input: unknown };
type Block = { type: string } | ToolUse;

export type Outcome =
  | { kind: "answer"; fullName: string; url: string }
  | { kind: "clarify"; missing: string }
  | { kind: "out_of_scope" };

export function route(content: Block[]): Outcome {
  const call = content.find((b): b is ToolUse => b.type === "tool_use");
  if (!call || call.name !== "find_person_article") {
    return { kind: "out_of_scope" };
  }

  const input = (call.input ?? {}) as { full_name?: unknown; language?: unknown };
  const fullName = typeof input.full_name === "string" ? input.full_name.trim() : "";
  if (fullName === "") {
    return { kind: "clarify", missing: "full_name" };
  }

  const language = input.language === "en" ? "en" : "pl";
  const slug = encodeURIComponent(fullName.replaceAll(" ", "_"));
  return { kind: "answer", fullName, url: `https://${language}.wikipedia.org/wiki/${slug}` };
}
```

The router has tests that use canned blocks, so they run without a network or an API key:

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { route } from "./route.ts";

const call = (input: unknown, name = "find_person_article") => [
  { type: "text", text: "Looking that up." },
  { type: "tool_use", id: "toolu_1", name, input },
];

test("a tool call becomes an article URL", () => {
  assert.deepEqual(route(call({ full_name: "Adam Małysz", language: "pl" })), {
    kind: "answer",
    fullName: "Adam Małysz",
    url: "https://pl.wikipedia.org/wiki/Adam_Ma%C5%82ysz",
  });
});

test("an empty name asks for clarification instead of building a URL", () => {
  assert.deepEqual(route(call({ full_name: "  " })), { kind: "clarify", missing: "full_name" });
  assert.deepEqual(route(call({})), { kind: "clarify", missing: "full_name" });
});

test("no tool call is the out-of-scope path", () => {
  assert.deepEqual(route([{ type: "text", text: "I can only look up people." }]), { kind: "out_of_scope" });
});

test("a tool the router does not know is out of scope", () => {
  assert.deepEqual(route(call({ full_name: "x" }, "delete_everything")), { kind: "out_of_scope" });
});

test("an unknown language falls back to pl", () => {
  const out = route(call({ full_name: "Ada Lovelace", language: "xx" }));
  assert.equal(out.kind === "answer" && out.url.startsWith("https://pl."), true);
});
```

```text
$ node --test route.test.ts
ℹ tests 5
ℹ pass 5
ℹ fail 0
```

## What does not carry over

Wit's `/message` was stateless, one sentence in and one analysis out. A model sees the whole conversation, so "and when was he born?" can resolve against the previous turn, which `/message` could not do on its own. The price is that you now own a message history and its growth.

A missing value used to be an absent entity. With a model it can be a guess: Anthropic's documentation says that when a required parameter is missing from the prompt, Claude Opus is much more likely to ask for it, while Sonnet might ask or might infer a reasonable value. A schema stops a wrong type, but **nothing stops a plausible wrong name**, so values that matter get checked against your own data.

Forcing a tool changed too. The classic answer to "I want an intent every time" is `tool_choice` with `any` or `tool`. The documentation lists Claude Opus 5.5, Sonnet 5.5, Fable 5.1 and Mythos 5.1 as models where those settings return a 400 error, and recommends `auto` with strict tool use instead. A router for these models therefore needs the out-of-scope path above, because the model is free to answer in text.

Voice input also split into two steps. Wit's own reference separates `/dictation`, which only transcribes, from `/speech`, which transcribes and extracts intents and entities. Capturing audio in the browser needs no special library anymore, since `MediaRecorder` has been available across browsers since April 2021, and the `wit-ai/microphone` library I used in 2017 is archived, with its last push in June 2020. One rule from the Wit reference carries over unchanged: browser code gets a client token, and the server token, which can change the app, stays behind your own server. A model API key follows the same rule, so the call to the model belongs on a server as well.

## Keep the utterances

The console had one habit worth copying. Every sentence that hit the API and was not yet labelled appeared in the Understanding screen, prefilled with the intent Wit had guessed, waiting to be validated. In 2017 that was a training queue. In 2026 it is how you build a measurement of a model-based router: log the real sentences, label the expected outcome once, and **replay them whenever the description, the schema or the model changes**.

The runner is small, and it takes the classifier as a function, so it works with any provider:

```ts
import { route, type Outcome } from "./route.ts";

type Case = { utterance: string; expect: Outcome["kind"]; fullName?: string };
type Classify = (utterance: string) => Promise<{ type: string }[]>;

export async function evaluate(cases: Case[], classify: Classify) {
  const failures: string[] = [];
  for (const c of cases) {
    const out = route(await classify(c.utterance));
    const nameOk = c.fullName === undefined || (out.kind === "answer" && out.fullName === c.fullName);
    if (out.kind !== c.expect || !nameOk) {
      failures.push(`${c.utterance} -> ${JSON.stringify(out)}`);
    }
  }
  return { total: cases.length, failed: failures.length, failures };
}
```

These four cases are enough to show the shape: a name, another name, a sentence with no name and a sentence about the weather.

```ts
const cases = [
  { utterance: "Kim jest Johnny Depp?", expect: "answer", fullName: "Johnny Depp" },
  { utterance: "Kim jest Adam Małysz?", expect: "answer", fullName: "Adam Małysz" },
  { utterance: "Kim jest?", expect: "clarify" },
  { utterance: "Jaka jutro będzie pogoda?", expect: "out_of_scope" },
];
```

Against a classifier that behaves, `evaluate` reports `{ total: 4, failed: 0, failures: [] }`, and against one that never calls a tool it reports three failures, because the weather sentence correctly lands in `out_of_scope`. The cases in a real project come from the log of what users actually typed.

## Sources

1. Wit.ai, [HTTP API Reference, version 20240304](https://wit.ai/docs/http/20240304/): `GET /message` response, limits of 280 characters and 20 seconds, `POST /dictation`, context fields, client and server tokens.
2. Wit.ai, [Build Your First Wit App](https://wit.ai/docs/quickstart): utterances, intents, entities, confidence and threshold, unseen utterances in the Understanding screen.
3. The Wit.ai Team, ["Launching Built-in NLP for Messenger and Sunsetting Bot Engine (beta)"](https://medium.com/wit-ai/launching-built-in-nlp-for-messenger-and-sunsetting-bot-engine-beta-46e9038869a5), 27 July 2017: Bot Engine, Stories and `/converse` sunset, migration to `/message`.
4. wit-ai, [node-wit releases](https://github.com/wit-ai/node-wit/releases): Composer in v6.5.0 (1 October 2022), v6.6.0 (15 February 2023).
5. wit-ai, [microphone repository](https://github.com/wit-ai/microphone): archived, last push June 2020.
6. Anthropic, [Tool use with Claude](https://platform.claude.com/docs/en/agents-and-tools/tool-use/overview): `tool_use` and `tool_result` blocks, missing required parameters.
7. Anthropic, [Define tools](https://platform.claude.com/docs/en/agents-and-tools/tool-use/define-tools): description guidance, `tool_choice` options and the models that reject forced tool use.
8. Anthropic, [Strict tool use](https://platform.claude.com/docs/en/agents-and-tools/tool-use/strict-tool-use): `strict: true` and its schema guarantee.
9. MDN Web Docs, [MediaRecorder](https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder): Baseline widely available since April 2021.
