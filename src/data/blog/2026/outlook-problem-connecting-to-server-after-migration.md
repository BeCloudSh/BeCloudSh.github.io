---
title: Outlook Problem Connecting to Server after Migration
author: BeCloudSh
pubDatetime: 2026-01-20T04:06:31Z
slug: outlook-problem-connecting-to-server-after-migration
featured: false
draft: true
tags:
  - Misc
description:
  Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor
  incididunt ut labore et dolore magna aliqua. Praesent elementum facilisis leo vel
  fringilla est
---

## Table of contents


## Error Details
![Error Details](../../../assets/images/blog/2026-01-outlook-problem-connecting-to-server.png)

## Solution

ExcludeLastKnownGoodUrl
Set the Following Registry Key:
HKEY_CURRENT_USER\Software\Microsoft\Office\16.0\Outlook\Autodiscover
DWORD: ExcludeLastKnownGoodUrl
Value: 1
Check that the Following is not set:
HKEY_CURRENT_USER\Software\Policies\Microsoft\Office\16.0\Outlook\Autodiscover
DWORD: ExcludeLastKnownGoodUrl
Value: 1
 
Clear all Identities
Remove everything under HKEY_CURRENT_USER\Software\Microsoft\Office\16.0\Common\Identity\Identities

Select Start, then Windows System, then open the Control Panel and select Credential Manager
Under Windows Credentials remove everything
Restart the PC