# 🎯 Project Vision: Rework `becloud.sh`
You are an expert Frontend Architect specializing in Astro 7 and Tailwind CSS.

Your goal is to transform this repository from a heavy, locally-hosted Markdown blog into a sleek, fast professional portfolio and landing page for an IT Consultant specializing in Microsoft 365 Cloud Architecture and Security. 

The user wants to completely eliminate the friction of writing markdown on mobile devices. Therefore, the internal blogging engine must be replaced with a build-time RSS feed integration from Medium. 

# 🧠 The Autonomy Directive
Do not wait for step-by-step micro-instructions. You are expected to:
1. Analyze the current `src/` directory and `astro.config.ts`.
2. Identify all CMS-related dependencies, UI components, and configurations that are no longer needed.
3. Design and implement the most elegant architectural path to achieve the "Definition of Done" below.
4. Resolve your own Vite/React/Astro package dependency conflicts if they arise during the cleanup.

# 🎨 Aesthetic & Brand Constraints
You must strictly adhere to the established brand identity. Do not invent new colors.
Light Theme

Background: #f2f5ec (Off-white/light greenish gray)
Foreground (Text): #353538 (Dark charcoal)
Accent: #1158d1 (Strong blue)
Muted: #bbc789 (Muted olive green)
Border: #7cadff (Light blue)
Dark Theme

Background: #212737 (Dark slate blue)
Foreground (Text): #eaedf3 (Light grayish blue)
Accent: #617bff (Bright soft blue)
Muted: #343f60 (Muted dark navy)
Border: #303f8a (Deep blue)

- **Typography:** Ensure high readability and contrast. Use sans-serif for body text and monospaced fonts for technical or terminal-inspired headers.

# ⚖️ Compliance & Architecture Boundaries
**CRITICAL:** This site targets a German audience and must maintain strict DSGVO / DDG compliance.
- **No Client-Side Tracking:** Do not add third-party tracking scripts or cookies.
- **No Iframes:** Do NOT embed external content via `<iframe>` (this leaks IPs to US servers). 
- **Server-Side Fetching:** The Medium RSS feed must be fetched and parsed at *build time* (or server-side), rendering as native HTML in Astro.
- **Imprint / Privacy Policy:** Standard pages like the Imprint must remain functional and accessible. (Note: standard `.md` pages in Astro Paper require relative image paths, not `@/` aliases).

# ✅ Definition of Done (Acceptance Criteria)
You have successfully completed this rework when:
1. **CMS Cruft is Gone:** Local CMS tools (Keystatic, Front Matter CMS, Markdoc, etc.) are entirely removed from the codebase and `package.json`.
2. **Portfolio First:** The `index.astro` landing page highlights professional consulting services, projects, and architecture expertise rather than just a feed of markdown files.
3. **Medium Integration:** A new UI component cleanly parses `https://becloudsh.medium.com/feed` and displays the 3 most recent articles natively using the site's dark carbon/electric blue UI components.
4. **Clean Build:** Running `npm run build` succeeds without throwing `moduleType` Vite errors or path-resolution failures.