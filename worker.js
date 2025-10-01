const YOURHOST = 'zelikk.blogspot.com'    // 注意前面没有 https://  后面没有 /
const PAGE404URL = 'https://zelikk.blogspot.com/p/icdyct.html'    // 被屏蔽的path要显示什么结果
const IMGPROXY = 'https://img.crazypeace.eu.org/'   // 注意末尾有斜杠 /

export default {
  async fetch(request, env, ctx) {
    try {
      return await handleRequest(request, env, ctx);
    } catch (e) {
      return new Response(e.message || "Internal Error", { status: 500 });
    }
  },
};

async function handleRequest(request, env, ctx) {
  const url = new URL(request.url);
  let newUrl = '';
  
  // 根据 URL 的 pathname 作为 key 去查询 KV 存储
  const value = await env.KV_BLOCKLIST.get(url.pathname);
  
  // 如果查到 value 是 "block"，则返回一个固定页面
  if (value === 'block') {
    newUrl = PAGE404URL
  }
  else {
    // 如果查不到记录, 或者查到的记录不是"block", 则正常重定向到指定目标
    newUrl = 'https://' + YOURHOST + url.pathname + url.search;
  }
  
  // 创建一个新的请求，并设置相同的请求方法和头信息
  const newRequest = new Request(newUrl, {
    method: request.method,
    headers: request.headers,
    body: request.body,
    redirect: 'manual' // 避免中间的重定向
  });

  // 获取原始响应
  let response = await fetch(newRequest);
  
  // 检查响应类型，只处理 HTML 内容
  const contentType = response.headers.get('Content-Type');
  if (contentType && contentType.includes('text/html')) {
    // 获取响应体内容
    let body = await response.text();
    
    // 替换所有 YOURHOST 为当前页面的 host
    body = body.replaceAll(YOURHOST, url.host);

    // 替换 图片链接，加上前缀
    body = body.replaceAll(
      'https://blogger.googleusercontent.com',
      IMGPROXY + 'https://blogger.googleusercontent.com'
    );

    // 创建新的响应，并继承原始响应的头信息
    response = new Response(body, {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers
    });
  }
  
  return response;
}
