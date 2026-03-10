# STM32MP2 Interactive Tools

Hands-on visualizers and utilities for the STM32MP25x secure boot training course.

**Live:** [https://wolosewicz-com.github.io/stm32mp2_tools/](https://wolosewicz-com.github.io/stm32mp2_tools/)

## Tools

| Tool | Description | RM0457 Section |
|------|-------------|----------------|
| [bsec-lifecycle](./bsec-lifecycle/) | BSEC lifecycle state decoder — OR/AND nibble logic visualizer | §7.3.7 |

## Project structure

```
stm32mp2_tools/
├── index.html                      ← landing page
├── bsec-lifecycle/                 ← tool 1
│   ├── src/App.jsx
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
├── next-tool/                       ← tool 2 (add later)
│   └── ...
├── .github/workflows/deploy.yml     ← builds all tools, deploys to Pages
└── README.md
```

## Adding a new tool

1. Create a new directory with a Vite + React project:
   ```bash
   npm create vite@latest my-new-tool -- --template react
   ```

2. In `my-new-tool/vite.config.js`, set the base path:
   ```js
   base: '/stm32mp2_tools/my-new-tool/',
   ```

3. In `.github/workflows/deploy.yml`, add build and copy steps:
   ```yaml
   - name: Build my-new-tool
     working-directory: my-new-tool
     run: |
       npm ci
       npm run build

   - name: Copy my-new-tool to dist
     run: cp -r my-new-tool/dist dist/my-new-tool
   ```

4. Add a link in the root `index.html`.

5. Push to `main` — the workflow builds and deploys everything.

## Local development

Each tool can be developed independently:

```bash
cd bsec-lifecycle
npm install
npm run dev
```

## Reference

Based on RM0457 Rev 5 — STM32MP25x Reference Manual.
