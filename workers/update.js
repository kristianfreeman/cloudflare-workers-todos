addEventListener("fetch", event => {
  event.respondWith(handleRequest(event.request));
});

const putInCache = (cacheKey, body) => {
  const accountId = "$accountId";
  const namespaceId = "$namespaceId";
  return fetch(
    `https://api.cloudflare.com/client/v4/accounts/${accountId}/storage/kv/namespaces/${namespaceId}/values/${cacheKey}`,
    {
      method: "PUT",
      body,
      headers: {
        "X-Auth-Email": "$cloudflareEmail",
        "X-Auth-Key": "$cloudflareApiKey"
      }
    }
  );
};

async function handleRequest(request) {
  if (request.method === "PUT") {
    const body = await request.text();
    const ip = request.headers.get("CF-Connecting-IP");
    const cacheKey = `data-${ip}`;
    try {
      JSON.parse(body);
      await putInCache(cacheKey, body);
      return new Response(body, { status: 200 });
    } catch (err) {
      return new Response(err, { status: 500 });
    }
  } else {
    return new Response("Error", { status: 404 });
  }
}
