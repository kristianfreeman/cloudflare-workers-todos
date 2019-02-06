addEventListener("fetch", event => {
  event.respondWith(handleRequest(event.request));
});

const constructResponse = (response, body) =>
  new Response(body, {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers
  });

const defaultData = { todos: [] };

const populateTodos = (text, todos) => {
  const replaced = text.replace("var todos;", `var todos = ${todos};`);
  return replaced;
};

const setCache = (key, data) => KRISTIAN_TODOS.put(key, data);
const getCache = key => KRISTIAN_TODOS.get(key);

async function handleRequest(request) {
  const ip = request.headers.get("CF-Connecting-IP");
  const cacheKey = `data-${ip}`;
  const response = await fetch(request);
  const text = await response.text();
  let data;
  const cache = await getCache(cacheKey);
  if (!cache) {
    await setCache(cacheKey, JSON.stringify(defaultData));
    data = defaultData;
    console.log("Setting default cache state: ", data);
  } else {
    data = JSON.parse(cache);
  }
  const updated = populateTodos(text, JSON.stringify(data.todos || []));
  return constructResponse(response, updated);
}
