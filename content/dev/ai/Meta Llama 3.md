---
date: 2024-04-23
tags:
  - dev
  - ai
---

> [!tldr]
> Meta Llama 3 is a large-scale language model that can be used for a variety of tasks, such as coding, problem solving, and more. It is integrated into Meta AI, an intelligent assistant that expands the ways people can get things done, create, and connect with Meta AI. Llama 3 is available in both 8B and 70B versions, offering the capabilities and flexibility needed to develop AI-powered applications.

> [!cite]
> We’ve integrated Llama 3 into #Meta AI, our intelligent assistant, that expands the ways people can get things done, create and connect with Meta AI. You can see first-hand the performance of Llama 3 by using Meta AI for coding tasks and problem solving.
>
> Whether you're developing agents, or other AI-powered applications, #Llama 3 in both 8B and 70B will offer the capabilities and flexibility you need to develop your ideas.

## 🔗 Quick Links

- [Meta Llama 3 GitHub site](https://github.com/meta-llama/llama3)
- [Meta Llama 3 website](https://llama.meta.com/llama3/)
- [Meta Llama recipes](https://github.com/meta-llama/llama-recipes)
- [Meta Llama 3 blog post](https://ai.meta.com/blog/meta-llama-3/)

## 🌐 Overview

### 💳 Model Card

You can find details about this model in the [model card](https://github.com/meta-llama/llama3/blob/main/MODEL_CARD.md).

### 🪙 Special Tokens used with Meta Llama 3

- **<|begin_of_text|>**: This is equivalent to the BOS token
- **<|eot_id|>**: This signifies the end of the message in a turn.
- **<|start_header_id|>{role}<|end_header_id|>**: These tokens enclose the role for a particular message. The possible roles can be: system, user, assistant.
- **<|end_of_text|>**: This is equivalent to the EOS token. On generating this token, Llama 3 will cease to generate more tokens.

A prompt should contain a single system message, can contain multiple alternating user and assistant messages, and always ends with the last user message followed by the assistant header.

### 🐥 Meta Llama 3 base

Code to produce this prompt format can be found [here](https://github.com/meta-llama/llama3/blob/main/llama/generation.py#L223).

> [!note]
> Newlines (0x0A) are part of the prompt format, for clarity in the example, they have been represented as actual new lines.

> [!example]
>
> <|begin_of_text|>{{ user_message }}

### 💬 Meta Llama 3 chat

Code to generate this prompt format can be found [here](https://github.com/meta-llama/llama3/blob/main/llama/tokenizer.py#L203).

> [!note]
>
> - Newlines (0x0A) are part of the prompt format, for clarity in the examples, they have been represented as actual new lines.
> - The model expects the assistant header at the end of the prompt to start completing it.

Single message example

> [!example]
>
> <|begin_of_text|>[^1]<|start_header_id|>user<|end_header_id|>[^2]
>
> {{ user_message }}[^3]<|eot_id|>[^4]<|start_header_id|>assistant<|end_header_id|>[^5]

1. Specifies the start of the prompt
2. Specifies the role for the following message i.e. “user”
3. The input message (from “user”)
4. Specifies the end of the input message
5. Specifies the role for the following message i.e. “assistant”

Following this prompt, Llama 3 will complete it by adding the `{{assistant_message}}` It will cease generation on generating the `<|eot_id|>`.

System prompt message added to a single user message

> [!example]
>
> <|begin_of_text|><|start_header_id|>system<|end_header_id|>
>
> {{ system_prompt }}<|eot_id|><|start_header_id|>user<|end_header_id|>
>
> {{ user_message }}<|eot_id|><|start_header_id|>assistant<|end_header_id|>

System prompt and multiple turn conversation between the user and assistant

> [!example]
>
> <|begin_of_text|><|start_header_id|>system<|end_header_id|>
>
> {{ system_prompt }}<|eot_id|><|start_header_id|>user<|end_header_id|>
>
> {{ user_message_1 }}<|eot_id|><|start_header_id|>assistant<|end_header_id|>
>
> {{ model_answer_1 }}<|eot_id|><|start_header_id|>user<|end_header_id|>
>
> {{ user_message_2 }}<|eot_id|><|start_header_id|>assistant<|end_header_id|>
