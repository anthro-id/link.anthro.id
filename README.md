# link.anthro.id
A link shortener (for internal use only), built with [µExpress](https://npm.im/ultimate-express) (Express.js with uWebsockets on-top) and Redis.

## Engines
We use the [latest version](https://nodejs.org/en/about/previous-releases#looking-for-the-latest-release-of-a-version-branch) (Active LTS) of [Node.js](https://nodejs.org). The code is built on [ECMAScript](https://nodejs.org/api/esm.html).

## Structures
We use [`base64url`](https://en.wikipedia.org/wiki/Base64#Alphabet:~:text=Note%20that-,Base64URL,-encoding%20replaces%20%27%2B%27%20with) encoding with 6 characters for each new URL, which gives us at least [68.7 billion](https://google.com/search?q=64+%5E+6) unique URLs, which is more than enough.

## Shorten the URL
Simply sending a `POST` request with a raw URL in the request body and set the `Content-Type` header to `text/plain`.
```js
const endpoint = "https://link.anthro.id"; // or your own endpoint
const body = "https://youtube.com/watch/QuvqzlxEO6g";
const authKey = "SMK62TXtlbE8E4IW2zxcXsRzdzVv6xwGUB3She07lp8=";
const request = await fetch(endpoint, {
  method: "POST", body,
  headers: {
    "Content-Type": "text/plain",
    "Authorization": `Bearer ${authKey}` // only if your server does have an authorization
  }
});

const response = await request.text();
console.log(response); // https://link.anthro.id/...
```

## Best Practices
- Treat `REQUEST_KEY` like a password. Generate a strong one.
  - You can use [`crypto.randomBytes`](https://nodejs.org/api/crypto.html#cryptorandombytessize-callback) to generate a random key.
  - 32 bytes or more is recommended. Use `base64` or `base64url` encoding type as an output.
- The link shortener has rate limiting.
  - Currently, the `POST` route rate limit is set to 2 submissions per 5 minutes, and the other `GET` routes are set to 5 requests per minute.
  - You can adjust this on your own.

## Instructions
- Fork or download the repository.
- Install the modules by using `pnpm install`.
  - We mainly use [pnpm](https://pnpm.io).
- Create your own or use any other existing Redis.
  - We rely on Redis from [Upstash infrastructure](https://upstash.com).
- Rename `.env.example` to `.env`.
- Copy and paste your Redis endpoint and token to `.env` file.
- Set `REQUEST_KEY` with your own customized API key.
  - You can remove this if you don't need an authorization.
- Start the server by using `pnpm start`.
  - Use `pnpm dev` for staging/development mode.

## Code License
[MIT](/LICENSE) License