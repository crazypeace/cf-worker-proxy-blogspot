const YOUR_HOST = 'zelikk.blogspot.com'    // 注意前面没有 https://  后面没有 /
const PAGE_404_URL = 'https://zelikk.blogspot.com/p/icdyct.html'   // 被屏蔽的path要显示什么结果
const IMG_BASE_URL = 'https://blogger.googleusercontent.com'    // 页面中图片的base url
const IMG_PROXY = 'https://img.one.eu.org/'   // 注意末尾有斜杠 /
// KV_BLOCKLIST 中保存被屏蔽的path

// 要屏蔽的path关键字列表
const BLOCK_KEYWORDS = ['v2ray', 'xray', 'vmess', 'vless'];

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
  
  // 检测是否有 KV 支持
  const hasKV = env && env.KV_BLOCKLIST;
  
  // 1. 检查关键字拦截（如果命中，直接使用 PAGE_404_URL，跳过 KV 查询）
  const lowerPath = url.pathname.toLowerCase();
  if (BLOCK_KEYWORDS.some(keyword => lowerPath.includes(keyword))) {
    newUrl = PAGE_404_URL;
  } else {
    // 2. 没命中关键字 → 查询 KV
    // 如果有 KV 支持，查询 KV；否则跳过
    if (hasKV) {
      try {
        const value = await env.KV_BLOCKLIST.get(url.pathname);
        if (value === 'block') {
          newUrl = PAGE_404_URL;
        } else {
          newUrl = 'https://' + YOUR_HOST + url.pathname + url.search;
        }
      } catch (err) {
        // KV 查询失败，回退到正常 URL
        console.error('KV query failed:', err);
        newUrl = 'https://' + YOUR_HOST + url.pathname + url.search;
      }
    } else {
      // Snippet 环境：没有 KV，直接使用正常 URL
      newUrl = 'https://' + YOUR_HOST + url.pathname + url.search;
    }
  }
  
  // 创建一个新的请求，并设置相同的请求方法和头信息
  const newRequest = new Request(newUrl, {    
    // redirect: 'manual', // 避免中间的重定向
    method: request.method,
    headers: request.headers,
    body: request.body
  });

  // 获取原始响应
  let response = await fetch(newRequest);
  
  // 检查响应类型，只处理 HTML 内容
  const contentType = response.headers.get('Content-Type');
  // if (contentType && contentType.includes('text/html')) {
  // 同时处理 HTML 和 XML
  if (contentType && (contentType.includes('text/html') || 
                            contentType.includes('xml') || 
                            contentType.includes('rss'))) {
    // 获取响应体内容
    let body = await response.text();
    
    // 替换所有 YOUR_HOST 为当前页面的 host
    body = body.replaceAll(YOUR_HOST, url.host);

    // 替换 图片链接，加上前缀
    body = body.replaceAll(
      IMG_BASE_URL,
      IMG_PROXY + IMG_BASE_URL
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
