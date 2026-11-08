# Academic Homepage

An English-only academic homepage preview with a near-white reading surface, dark gray body text, a near-white sidebar, and restrained blue-violet headings and navigation markers. The content structure references https://unoc-727.github.io/ without using the author's personal details or publications.

Visible sections include About, Education, and Toys. Xiuyu Wu's biography, education, advisor links, email, Google Scholar and GitHub profiles use user-provided information. WeChat opens the supplied `imgs/wechat.jpeg` in a keyboard-accessible dialog; close it with the close button, Escape, or a click outside. The portrait is a transparent PNG cutout of the supplied illustration, and CV is omitted. News, Experience, Publications, Preprints, Academic Services, and Honors & Awards, together with their sidebar links, are preserved in HTML comments for future updates. Toys links to Daily Paper, DailyDisk, and Eyes Caller, with short English descriptions based on their project pages. GitHub Pages deployment is configured for this repository.

## Navigation

The left sidebar opens with section labels on desktop and collapses to an icon rail. Use the button at the top to switch states. The sidebar width eases over 300 ms while labels fade; the text column remains fixed. Initial loading and reduced-motion preferences skip the animation. On narrow screens, it starts collapsed and expands over the page; selecting a section, clicking outside, or pressing Escape closes it.

## Appearance

Click the sun in the upper-right corner to switch to dark mode; it becomes a full moon with subtle craters. Click again to return to light mode. The choice persists locally when storage is available. Blue-violet accents remain, with lighter text shades for contrast at night. Both appearances include the sidebar, publication placeholders, and planet terrain. The control supports keyboard activation and an accessible action label. On toggle, page colors ease over 350 ms while the sun and moon crossfade with a subtle 3% scale change. Initial loading and reduced-motion preferences use an immediate switch.

## Minimal space illustrations

A blue-violet sun remains in the upper-right corner on desktop. On narrower screens it becomes a small illustration above the profile and scrolls with the document. At the bottom of the page, a full-width landscape extends behind the sidebar to the right edge, independently of the text column. A small helmeted astronaut inhabits a curved planet with a few craters and rocks. The landscape evolves through a daily story, derived directly from Beijing time (UTC+8) using the visitor’s device clock. Its rounded craters share the moon’s shaded inner walls and recessed floors, with subdued colors in both themes. The illustrations are lightweight inline SVGs with no external assets or libraries.

The astronaut stays about 70 px tall on large screens rather than scaling up with the full-width landscape, and keeps its smaller size on mobile. The astronaut has a side-facing helmet and suit, jointed knees, forward-facing boots, alternating arm swings, and a subtle body bob. Purposeful routes alternate walking with surveying, building, carrying supplies, watering, waving, and resting. Live character positions, directions and remaining work/rest time are computed from a deterministic Beijing-time motion schedule. Refreshing or returning to the page seeks the current moment instead of restarting at the first task. Explicit preview seeks establish the pose at the selected time, then both the displayed preview clock and activity continue at normal speed; the 60-second overview keeps its separate, speed-limited movement. Characters accelerate and brake within speed limits, finish walking before working, and move continuously across chapter changes. Reduced-motion visits hold a still pose within each chapter. The dog walks slightly faster and occasionally trots. Walking pauses off screen or in a hidden tab. Reduced-motion preferences show a still astronaut. The previous particle and neural-network effects have been removed.

## Local preview

```sh
python3 -m http.server 4173 --bind 127.0.0.1
```

Open http://127.0.0.1:4173 in a browser. This is a static HTML/CSS/JavaScript site with no installation or build step.

## Files

- `index.html`: English content and academic section structure.
- `style.css`: Colors, typography, and desktop/mobile layouts.
- `script.js`: Theme switching, collapsible sidebar, active-section highlighting, and the WeChat dialog.
- `favicon.svg`: Site icon.

## GitHub Pages

The website is published at https://nu1sance.github.io/Personal-Homepage/ using `.github/workflows/deploy-pages.yml`. Each push to `main` runs the planet checks, packages only the website files, and deploys through GitHub Actions. Tests, documentation, and development files are excluded from the Pages artifact. Deployment status is available under the repository's Actions tab; Pages settings use **GitHub Actions** as the publishing source.

All asset paths are relative and work under the `/Personal-Homepage/` subdirectory. The `github.io` hostname is determined by the GitHub account or organization name, not the project name. A user site at `xiuyuwu.github.io` requires control of the `xiuyuwu` account or organization and its `xiuyuwu.github.io` repository. A separately owned custom domain can also be configured later.

### Visitor analytics

No visitor analytics script is installed. GitHub's repository Traffic view measures repository visits, not visits to this website. To add a website dashboard, create a site in Cloudflare Web Analytics for `nu1sance.github.io` and add its generated public JavaScript snippet before `</body>` in `index.html`. The site can stay on GitHub Pages; transferring DNS to Cloudflare is unnecessary for manual script installation. Keep account credentials and API tokens out of the repository. Analytics begins collecting after installation and does not recover earlier visits.


### The planet's daily cycle

- 00:00–06:00: barren ground, exploration, surveying and supplies.
- 06:00–12:00: a solar panel, antenna, workbench and planting bed assemble from separate parts. Each next component waits beside the structure, then moves or rotates into place at full opacity. Supplies, the computer workbench, antenna, and irrigation equipment form one compact camp; the solar panel and rocket occupy separate power and landing areas.
- 12:00–12:00:20: a small rocket descends, lands, opens its hatch, and releases a helmeted dog. Later visitors see the completed arrival rather than a replay.
- 12:00–18:00: the astronaut and dog work, explore and prepare the garden; irrigation appears.
- 18:00–23:50: purple grasses and flowers emerge progressively. The dog alternates following, running, sniffing, carrying a tool and resting.
- 23:50–00:00: a quiet ending, followed by a two-second fade of the day's additions. Midnight starts barren again.

`planet-time.mjs` contains the deterministic clock and chapter model; `planet-day.js` renders SVG scenery and coordinates character behavior. The page does not need a backend or stored progress. Returning to a hidden tab synchronizes to the current time. Reduced-motion preferences show still poses and update the world without a frame loop. Mobile layouts reduce plant density and keep actors inside the visible portion of the surface. Plants spread from the original garden across the wider terrain and foreground, leaving bare gaps. `planet-layout.mjs` excludes the entire silhouette of each plant from the crater rims, walls and floors; plants do not float over the depressions.

For review only, open `/?planetPreview=1#toys`. The English preview panel provides a time slider, chapter presets, a 60-second day preview (with extra time for the landing), and a return to live Beijing time. `&time=22` starts a preview at 22:00 and its displayed clock then advances at 1× speed. Reloading this preview URL deliberately returns to its specified start time; the normal URL always resumes current Beijing time. The normal URL has no playback panel or pause button. Theme switching remains independent of the daily cycle.

Run the clock and timeline checks with `node --test tests/*.test.mjs`. All assets use relative URLs and can be hosted in either a GitHub Pages user site or a project subdirectory.


## Profile asset

`imgs/xiuyu-wu-avatar.png` is an RGBA background extraction of the supplied illustration, generated with the built-in image editing tool. The original local image remains untouched. The full editing prompt is recorded in `docs/avatar-edit.txt`. The subject retains its colors and texture, with transparent surroundings and partially transparent edge pixels.
