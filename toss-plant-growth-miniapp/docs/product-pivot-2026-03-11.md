# Product Pivot Brief — Today's Plant Detail Diary

**Date:** 2026-03-11  
**Status:** Active source of truth for upcoming product and implementation decisions

## Summary

The app is pivoting away from a **plant-change / comparison-first** experience and toward a **photo library + diary** experience focused on the details of **today's plant**.

The core user promise is no longer “see how much your plant changed.”  
The new core promise is “take a good photo today and notice how your plant looks now.”

## Primary product bet

- Help the user capture a clearer, better-composed plant photo today
- Help the user notice current condition, texture, color, leaf shape, and small details
- Turn repeat use into a lightweight daily diary habit
- Keep everything local-first and Toss-miniapp-friendly

## Primary journey

1. Open app
2. Pick current plant
3. Take a good photo of today's plant
4. Save today's diary record
5. Revisit today's photo and recent photos through the diary/library

## Secondary / de-emphasized surfaces

These may remain temporarily in code and navigation, but they are **not** the primary product story now:

- compare-first report flow
- change score / growth score framing
- baseline-vs-latest positioning
- ad-to-report as the main value exchange

## Product language to prefer

- today's plant
- today's record
- diary
- detail
- current condition
- good photo
- photo library
- archive

## Product language to avoid as primary framing

- growth report
- change score
- comparison-first
- baseline comparison
- growth album
- first change report

## Working implications

- Camera work should optimize for **capture quality and confidence**, not mainly for comparison precision
- Home should lead users into **today's diary action**
- Timeline/history should be framed as a **library/archive**, not the core value proposition
- Monetization is a follow-up topic and should not drive current product framing

## Current constraints that remain true

- local-only storage
- no backend sync in this version
- Toss-compatible TDS/Granite UI
- one photo per day per plant behavior may remain until a follow-up product decision changes it
