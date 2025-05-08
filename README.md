# reqscript

A JavaScript library that simplifies making HTTP requests with Wretch, featuring cURL generation, verbose output, and colorful JSON formatting for easier debugging.

## Installation

```bash
pnpm add jsr:@yym/reqscript
```

or

```bash
npx jsr add @yym/reqscript
```

## Usage

Create a file named `example.ts`:

```typescript
// example.ts
import { createRequest } from "@yym/reqscript";

createRequest((w) => w.get("https://nekos.best/api/v2/neko"));
```

Run the script:

```bash
node ./example.ts
```

### Verbose Mode

To get detailed information, including the cURL command and response details, use the `--verbose` flag:

```bash
node ./example.ts --verbose
```

## License

MIT
