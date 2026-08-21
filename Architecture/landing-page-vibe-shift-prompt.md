# Prompt: Landing Page Refactor – Shifting from Consultancy to Personal Brand

## Context
You are an expert copywriter and frontend developer working on a personal portfolio website built with Astro and Tailwind CSS. 

The website currently belongs to an independent Cloud Architect (Bene Scheckenbach). Right now, the landing page (`src/pages/index.astro`) leans too heavily into a "B2B corporate consultancy" vibe. It reads like a marketing page for an agency seeking new clients, rather than a personal space for a thought leader to share their expertise, experiences, and writings.

## Goal
Your task is to rewrite and subtly restructure the content in `src/pages/index.astro` to shift the tone from a "consultancy sales pitch" to an authentic "personal brand and thought leadership" portfolio.

## Key Directives & Vibe Check
*   **Stop Selling Services:** The goal is no longer to sell "engagements" or "services". The goal is to establish authority, showcase deep expertise, and provide a platform for his writing/thoughts.
*   **Focus on the Individual:** Use language that highlights his personal approach, philosophy, and what he finds interesting in his field.
*   **Tone:** Professional, insightful, approachable, and authoritative—but completely detached from the "agency sales" pipeline.

## Specific Implementation Instructions

Please update `src/pages/index.astro` with the following changes:

### 1. Hero Section Adjustments
*   **Subtitle:** Change "Consultant Workplace & Collaboration" to something that reflects his personal professional identity better, such as "Microsoft Cloud Architect & Strategist" or simply "Cloud Architect". 
*   **Retain:** Keep the personal tags (like "Fine Dining", "Travel Dispatches") and the main description, as they already contribute well to a personal brand.

### 2. Reframing the "Services" Section
*   **Current State:** Titled "Consulting Services" / "Capabilities" with a list of "Typical Engagements". This screams "hire my agency".
*   **New State:** Rename this section to focus on **Expertise**, **Core Focus**, or **What I Do**.
*   **Action:** Rewrite the `services` array in the frontmatter. Change the structure so it's less about deliverables ("Typical Engagements") and more about the areas he specializes in and his philosophical approach to those areas. 

### 3. Reframing the "Projects / Case Studies" Section
*   **Current State:** Titled "Case Studies" / "Featured Projects" with a rigid B2B structure (The Challenge, The Impact, Architecture & Solution).
*   **New State:** Rename this to **Experience**, **In the Field**, or **Notable Challenges**.
*   **Action:** Rewrite the `projects` array in the frontmatter. Soften the corporate structure. Instead of a sterile "Impact" bullet point, frame it as a narrative about what he built, what was uniquely difficult about the problem, or his architectural philosophy in solving it. You can keep the `technologies` tags.

### 4. Softening the Contact / CTA Section
*   **Current State:** "Whether you are planning an M365 tenant migration... feel free to reach out." (Sounds like a sales funnel).
*   **New State:** A friendly invitation to connect with a peer.
*   **Action:** Change the copy to invite conversations about technology, cloud architecture, or even his personal interests. Example vibe: "I'm always open to discussing complex cloud architecture, sharing insights, or exploring interesting challenges. Whether you want to talk tech or share travel recommendations, feel free to reach out."

## Constraints
*   **Do not break the Astro component structure.** You are primarily updating the text arrays in the frontmatter (`services`, `projects`) and the HTML text nodes within the template.
*   **Maintain Tailwind styling.** The visual design of the page is good; we are only changing the copy and the structural implications of that copy.

## Definition of Done
The `index.astro` file is updated, and reading it from top to bottom feels like reading about an experienced, interesting professional sharing their work, rather than a brochure for a consulting firm.
