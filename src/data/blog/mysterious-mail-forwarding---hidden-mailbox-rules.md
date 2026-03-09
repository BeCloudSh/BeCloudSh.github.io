---
title: Mysterious Mail Forwarding - Hidden Mailbox Rules
pubDate: 2026-02-10T14:16:56.830Z
author: BeCloudSh
pubDatetime: 2026-02-10T14:17:06.280Z
description: Finding, Fixing and Understanding hidden Mailbox Rules. No more mysterious mail(box) behaviour.
tags:
    - Exchange Online
    - M365
    - Troubleshooting
    - Failed Research
slug: mysterious-mail-forwarding-hidden-mailbox-rules
draft: true
---

[source](https://www.reddit.com/r/Office365/comments/ujidr5/am_i_going_crazy_how_to_track_down_wherehow_an/?utm_source=embedv2&utm_medium=post_embed&embed_host_url=https://www.mpca.solutions/wp/knowledgebase/topic/outlook-mailbox-forwarding-rule-hidden-powershell-automatic-replies/)

X-MS-Exchange-Inbox-Rules-Loop = Mailbox of user sending email
X-MS-Exchange-Organization-MessageDirectionality = Originating
Auto-Submitted = auto-generated
X-MS-Exchange-Generated-Message-Source = Mailbox Rules Agent

![Message Trace with Forwarding](../../assets/images/blog/mysterious-mail-forwarding-hidden-mailbox-rules/10-02-2026_15-18-41.png)

![OWA showing no Rule](../../assets/images/blog/mysterious-mail-forwarding-hidden-mailbox-rules/10-02-2026_15-19-33.png)

![Get-inboxrule no result](../../assets/images/blog/mysterious-mail-forwarding-hidden-mailbox-rules/10-02-2026_15-19-59.png)

![get-mailbox forward no result](../../assets/images/blog/mysterious-mail-forwarding-hidden-mailbox-rules/10-02-2026_15-20-38.png)

![get-mailbox forward no result](../../assets/images/blog/mysterious-mail-forwarding-hidden-mailbox-rules/10-02-2026_15-20-38.png)

![MHA showing Mailbox Rules Agent](../../assets/images/blog/mysterious-mail-forwarding-hidden-mailbox-rules/10-02-2026_15-21-37.png)

![Get-inboxrule include hidden](../../assets/images/blog/mysterious-mail-forwarding-hidden-mailbox-rules/10-02-2026_15-22-12.png)

![inboxrule hidden description](../../assets/images/blog/mysterious-mail-forwarding-hidden-mailbox-rules/10-02-2026_15-24-20.png)

![inboxrule hidden description](../../assets/images/blog/mysterious-mail-forwarding-hidden-mailbox-rules/10-02-2026_15-24-20.png)

![remove inboxrule](../../assets/images/blog/mysterious-mail-forwarding-hidden-mailbox-rules/10-02-2026_16-34-48.png)