---
name: feedback_no_blockquote_drafts
description: Never wrap draft messages/emails in markdown blockquotes; output them as plain text
metadata:
  type: feedback
---

When drafting a message the user will copy and send (Slack reply, client email, PR text),
output it as plain text with no leading `>` markers and no surrounding quote block.

**Why:** the `>` characters get copied along with the text, and the user has to delete them
line by line before sending.

**How to apply:** put the draft directly in the response body, unquoted. A fenced code block
is acceptable when the draft needs to be visually separated from surrounding commentary,
but plain prose is the default. Same rule for [[feedback_shorter_precise_output]] style
draft replies.
