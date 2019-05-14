const constructResponse = (response, body) =>
  new Response(body, {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers,
  })

const defaultData = { todos: [] }

const populateTodos = (text, todos) => {
  const replaced = text.replace('var todos;', `var todos = ${todos};`)
  return replaced
}

const setCache = async (key, data) => {
  const setPromise = KRISTIAN_TODOS.put(key, data)
  return setPromise
}

const getCache = async key => {
  const getPromise = await KRISTIAN_TODOS.get(key)
  return getPromise
}

/**
 * Fetch and log a request
 * @param {Request} request
 */
async function getTodos(request) {
  const ip = request.headers.get('CF-Connecting-IP')
  const cacheKey = `data-${ip}`
  const response = await fetch(request)
  const text = await response.text()
  let data
  const cache = await getCache(cacheKey)
  if (!cache) {
    await setCache(cacheKey, JSON.stringify(defaultData))
    data = defaultData
  } else {
    data = JSON.parse(cache)
  }
  const updated = populateTodos(text, JSON.stringify(data.todos || []))
  return constructResponse(response, updated)
}

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

const putInCache = (cacheKey, body) => {
  const accountId = '$accountId'
  const namespaceId = '$namespaceId'
  return fetch(
    `https://api.cloudflare.com/client/v4/accounts/${accountId}/storage/kv/namespaces/${namespaceId}/values/${cacheKey}`,
    {
      method: 'PUT',
      body,
      headers: {
        'X-Auth-Email': '$cloudflareEmail',
        'X-Auth-Key': '$cloudflareApiKey',
      },
    },
  )
}

async function updateTodos(request) {
  const body = await request.text()
  const ip = request.headers.get('CF-Connecting-IP')
  const cacheKey = `data-${ip}`
  try {
    JSON.parse(body)
    await putInCache(cacheKey, body)
    return new Response(body, { status: 200 })
  } catch (err) {
    return new Response(err, { status: 500 })
  }
}

async function handleRequest(request) {
  if (request.method === 'PUT') {
    return updateTodos(request)
  } else {
    return getTodos(request)
  }
}
