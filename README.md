<p align="center">
  <a href="https://victoriawu-77.github.io/blob-atelier/"><img src="assets/grid.png" alt="Eight Blob Atelier mascots in jelly, velvet, glass, clay, soft and matte" width="100%"></a>
</p>

<h1 align="center">Blob Atelier</h1>

<p align="center"><b>Design a cute animated mascot for your AI agent. One HTML file.</b><br>
A free, open-source avatar maker and drop-in <code>&lt;agent-mascot&gt;</code> web component for chatbots, AI assistants and coding agents.</p>

<p align="center">
  <a href="https://victoriawu-77.github.io/blob-atelier/"><b>Try it →</b></a> &nbsp;·&nbsp;
  <a href="assets/promo.mp4">Watch the 30s video</a> &nbsp;·&nbsp;
  <a href="agent-mascot.js">agent-mascot.js</a> &nbsp;·&nbsp;
  <a href="https://happycapy.ai/share/files/cb21f14b-54a4-4d44-887f-efd64913d895"><b>Remix on Happycapy</b></a>
</p>

<p align="center">
  <a href="https://victoriawu-77.github.io/blob-atelier/"><img src="assets/demo.gif" alt="A pink jelly kitty mascot that gets poked, squishes, and switches between listening, thinking, talking, working, happy, done and error states, then morphs through all eight shapes" width="100%"></a>
</p>

---

Pick a shape, a finish and a color, and you get a mouthless little blob that breathes, blinks, follows your cursor and squishes when you poke it. Then drop it into your agent's UI with one tag. It's vanilla JS and inline SVG, with no build step and no dependencies.

## Use it for

- A face for your **AI chat assistant or chatbot**, with states that follow the conversation (listening, thinking, talking)
- A status indicator for **coding agents and background tasks** (working, done, error)
- **Voice agents**, where `talking` pulses in a syllable rhythm without needing a mouth
- Onboarding screens, empty states, loading screens and app icons (export SVG or PNG)
- Stickers and social posts (export GIF or WebM)

## Features

- **8 shapes**, all morphing smoothly into each other: mochi, bean, pebble, squircle, pill, drop, kitty, cloud
- **6 finishes**: matte, soft, jelly, frosted glass, clay, velvet
- **11 colors**, dot or capsule eyes, and optional blush
- **Motion**: spring physics, idle breathing, random blinks, cursor-following eyes with a pseudo-3D turn, and squash-and-stretch when you click or drag
- **8 agent states** you can switch from code (see below)
- **Randomize with taste**: only pairs finishes and colors that work together
- **Export** to SVG, PNG (transparent), GIF, WebM, or an embeddable web component
- Your design is saved in the URL hash, so every mascot is a shareable link

## Embed

```html
<script src="https://victoriawu-77.github.io/blob-atelier/agent-mascot.js"></script>

<agent-mascot shape="mochi" color="peach" material="jelly" eyes="dot" state="idle"
              style="width:240px;height:240px"></agent-mascot>
```

```js
const mascot = document.querySelector('agent-mascot');

mascot.setState('thinking');          // switch state
mascot.setConfig({ shape: 'cloud', color: '#9CCBFF', material: 'glass' });
mascot.poke();                        // a little squish
mascot.lookAt(0.5, -0.3);             // hold the gaze (x, y in -1..1); lookAt(null) to release
mascot.toSVGString(512);              // still frame as an SVG string
mascot.addEventListener('poke', () => mascot.setState('happy'));   // fired on click or poke()
mascot.addEventListener('change', e => console.log(e.detail));
```

| Attribute  | Values |
|------------|--------|
| `shape`    | `mochi` `bean` `pebble` `squircle` `pill` `drop` `kitty` `cloud` (`bun` still works as an alias) |
| `material` | `matte` `soft` `jelly` `glass` `clay` `velvet` |
| `color`    | `milk` `peach` `butter` `matcha` `mint` `sky` `lilac` `bubblegum` `tangerine` `cocoa` `ink`, or any hex |
| `eyes`     | `dot` `capsule` |
| `cheeks`   | `true` `false` |
| `state`    | see below |

In the app, **Embed as web component** opens a dialog with your current design: **Single snippet** copies a fully self-contained `<script>` with the component inlined, **Script file** gives the `<script src>` version, and you can download `agent-mascot.js` directly.

## States

| State       | What it does |
|-------------|--------------|
| `idle`      | Breathes, blinks, looks around |
| `listening` | Soft rings pull inward, eyes grow, head tilts and nods |
| `thinking`  | Looks up and to the side, squints, thought dots float up |
| `talking`   | Pulses in a syllable rhythm (no mouth needed) |
| `working`   | Scanning eyes, a busy bob, and a little orbiting dot |
| `happy`     | Hops with squash and stretch, happy eyes, sparkles |
| `done`      | Green check badge and a sparkle burst |
| `error`     | Red "!" badge, `< >` eyes, a small shake and a droop |

## Remix it, no code needed

Don't write code? Open the [Happycapy remix link](https://happycapy.ai/share/files/cb21f14b-54a4-4d44-887f-efd64913d895) and you get your own copy of Blob Atelier. Describe the change you want in plain words, like "add a sleepy state", "make the kitty's ears bigger" or "translate the panel into Japanese", and Happycapy edits the project for you. You can preview your version live and share it.

## Develop

`index.html` and `agent-mascot.js` are built from `src/`:

```sh
node src/build.js
```

There's nothing to install. Open `index.html` in a browser. The GIF encoder ([gifenc](https://github.com/mattdesl/gifenc)) loads from a CDN only when you export a GIF.

---

<p align="center">
  Vibe-coded with <a href="https://happycapy.ai">Happycapy</a><br>
  by <a href="https://x.com/victoriawu77">Victoria Wu (@victoriawu77)</a>
</p>

## Contributors

- [Victoria Wu](https://github.com/victoriawu-77) ([@victoriawu77](https://x.com/victoriawu77)): idea, design and direction
- [Happycapy](https://github.com/happycapy-ai) ([happycapy.ai](https://happycapy.ai)): the original app, motion, states and exports, built with Victoria; also hosts the no-code remix
- [Cursor Agent](https://cursor.com): repository setup, v1 import and later polish

Contributions are welcome. Open an issue or a pull request, or [remix it on Happycapy](https://happycapy.ai/share/files/cb21f14b-54a4-4d44-887f-efd64913d895) if you'd rather describe your idea than code it.

## License

[MIT](LICENSE) © 2026 Victoria Wu
