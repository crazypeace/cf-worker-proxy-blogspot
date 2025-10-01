# cf-worker-proxy-blogspot
用Cloudflare worker反代blogspot实现免翻墙域名镜像站

# 效果
反代前, 访问 `https://zelikk.blogspot.com/1.html`  
得到
```
<html>
  <body>
    <a href="https://zelikk.blogspot.com/2.html">Page2</a>
    <img src="https://blogger.googleusercontent.com/3.jpg">
  </body>
</html>
```
反代后, 访问 `https://one.eu.org/1.html`  
得到
```
<html>
  <body>
    <a href="https://one.eu.org/2.html">Page2</a>
    <img src="https://img.one.eu.org/https://blogger.googleusercontent.com/3.jpg">
  </body>
</html>
```


# 思路
用1个worker反代图片 用[成熟的uniporxy项目](https://github.com/NyaMisty/cloudflare-workers-uniproxy)  

用1个worker反代html (即本项目)   
并对html内容进行替换

# 部署
示例,  
想反代的域名是 `zelikk.blogspot.com`  
免翻墙的主域名是 `one.eu.org` 并且已经添加到 cloudflare

那么, 步骤如下:
## 域名 one.eu.org 设置自动TLS
<img width="883" height="166" alt="firefox_2025-09-30_22-36-23" src="https://github.com/user-attachments/assets/699edc78-399d-488b-a164-1797dd6bced8" />

## 建第1个worker
名称 例如, `blogimg`  
自定义域名 `img.one.eu.org`  
代码 使用[成熟的uniporxy项目](https://github.com/NyaMisty/cloudflare-workers-uniproxy)  

## 建第2个worker
名称 例如, `bloghtml`  
自定义域名 `one.eu.org`  
代码 使用本项目的[worker.js](https://github.com/crazypeace/cf-worker-proxy-blogspot/raw/refs/heads/main/worker.js)  
代码开头的部分, 设置一些参数  
<img width="586" height="218" alt="chrome_2025-10-02_01-33-34" src="https://github.com/user-attachments/assets/dfe2f81d-9a51-490e-8bcf-8fed2cb592de" />  

## 部署完成
你可以用不翻墙的浏览器访问 `https://one.eu.org` 了

# 如果你想屏蔽部分path
比如, 部分博文不适合在墙内展示.  

## 建1个KV
名称 例如, `bloghtml_blocklist`  
添加  
`key` = 你不想在墙内显示的path 如 `/2023/06/racknerd-xray-reality.html`  
`value` = `block`  
<img width="857" height="324" alt="firefox_2025-10-01_16-44-21" src="https://github.com/user-attachments/assets/273b3457-5781-4b91-9345-e8256910ed73" />

## 绑定KV  
`bloghtml` worker 绑定KV  
name `KV_BLOCKLIST` (不要改动)  
value `bloghtml_blocklist` (就是前面步骤中建立的KV名字)  
<img width="833" height="673" alt="2025-10-02_01-39-33" src="https://github.com/user-attachments/assets/cc9a0381-cb8b-43ab-9b88-20b0ed5ad576" />
