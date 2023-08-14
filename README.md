# cas

统一用户授权中心

## 票据

1. TGT：Ticket Grangting Ticket
   TGT 是 CAS 为用户签发的登录票据，拥有了 TGT，用户就可以证明自己在 CAS 成功登录过，根据用户信息签发的。
   TGT 封装了 Cookie 值对应的用户信息。
   当 HTTP 请求到来时，CAS 以此 Cookie 值（TGC）为 key 查询缓存中有无 TGT ，如果有的话，则相信用户已登录过。

2. TGC：Ticket Granting Cookie
   CAS Server 生成 TGT 放入自己的 Session 中，而 TGC 就是这个 Session 的唯一标识（SessionId），以 Cookie 形式放到浏览器端，是 CAS Server 用来明确用户身份的凭证。
   存在 redis 中，形式为 `TGC:{TGC}: {TGT}`

3. ST：Service Ticket
   ST 是 CAS 为用户签发的访问某一 service 的票据。
   用户访问 service 时，service 发现用户没有 ST，则要求用户去 CAS 获取 ST。
   用户向 CAS 发出获取 ST 的请求，CAS 发现用户有 TGT，则签发一个 ST，返回给用户。
   用户拿着 ST 去访问 service，service 拿 ST 去 CAS 验证，验证通过后，允许用户访问资源。
   存在 redis 中，形式为 `ST:{ST}: {TGT}`

在 CAS（Central Authentication Service）系统中，存在几种不同类型的票据，用于支持单点登录和安全身份验证。

以下是一些常见的 CAS 系统中的票据类型及其生成方式：

1. **Ticket Granting Ticket (TGT)**：

   - TGT 是 CAS 中的关键票据，用于用户登录后获取其他票据。它表示用户的身份验证会话。
   - TGT 生成过程：
     - 用户成功登录后，CAS 服务器生成 TGT。
     - TGT 存储在 CAS 服务器端，通常使用会话存储或持久化存储。

2. **Service Ticket (ST)**：

   - ST 是用于访问特定服务的票据，用于向服务证明用户已通过身份验证。
   - ST 生成过程：
     - 用户通过 CAS 登录并成功获得 TGT。
     - 用户请求访问某个受保护的服务。
     - CAS 服务器生成一个 ST，将 TGT 的一部分信息添加进去，并将 ST 返回给用户。

3. **Proxy Ticket (PT)**：

   - PT 允许一个服务代理访问另一个服务，用于 CAS 系统中的代理认证。
   - PT 生成过程：
     - 用户登录并获得 TGT。
     - 用户请求代理访问某个受保护的服务。
     - CAS 服务器生成 PT，将 TGT 的一部分信息添加进去，并将 PT 返回给用户。

4. **Proxy Granting Ticket (PGT)**：

   - PGT 用于代理认证，允许代理服务器代表用户访问其他服务。
   - PGT 生成过程：
     - 用户登录并获得 TGT。
     - 用户请求代理访问某个服务。
     - CAS 服务器生成 PGT，并将其与特定服务的 PT 关联。

5. **Proxy Proxy Ticket (PPT)**：
   - PPT 用于级联代理认证，允许一个代理服务器代理另一个代理服务器访问服务。
   - PPT 生成过程类似于生成 PT，只是与特定的代理关联。

这些票据的生成和管理过程通常都是在 CAS 服务器端进行的。生成票据时，CAS 服务器会根据一定的算法和随机数生成规则创建唯一的票据，以确保其安全性。票据的生成和使用方式在 CAS 协议规范中有详细说明，这些规范有助于保障整个单点登录系统的安全性和稳定性。

## 步骤

1. 用户访问产品 a，域名是 www.a.cn。
2. 由于用户没有携带在 a 服务器上登录的 a cookie，所以 a 服务器返回 http 重定向，重定向的 url 是 SSO 服务器的地址，同时 url 的 query 中通过参数指明登录成功后，回跳到 a 页面。重定向的 url 形如 sso.dxy.cn/login?service=https%3A%2F%2Fwww.a.cn。
3. 由于用户没有携带在 SSO 服务器上登录的 TGC（看上面，票据之一），所以 SSO 服务器判断用户未登录，给用户显示统一登录界面。用户在 SSO 的页面上进行登录操作。
4. 登录成功后，SSO 服务器构建用户在 SSO 登录的 TGT（又一个票据），同时返回一个 http 重定向。
   这里注意：重定向地址为之前写在 query 里的 a 页面。重定向地址的 query 中包含 sso 服务器派发的  ST。
   重定向的 http response 中包含写 cookie 的 header。
   这个 cookie 代表用户在 SSO 中的登录状态，它的值就是 TGC。
5. 浏览器重定向到产品 a。此时重定向的 url 中携带着 SSO 服务器生成的 ST。
6. 根据 ST，a 服务器向 SSO 服务器发送请求，SSO 服务器验证票据的有效性。
   验证成功后，a 服务器知道用户已经在 sso 登录了，于是 a 服务器构建用户登录 session，记为 a session。
   并将 cookie 写入浏览器。
   注意，此处的 cookie 和 session 保存的是用户在 a 服务器的登录状态，和 CAS 无关。
7. 之后用户访问产品 b，域名是 www.b.cn。
8. 由于用户没有携带在 b 服务器上登录的 b cookie，所以 b 服务器返回 http 重定向，重定向的 url 是 SSO 服务器的地址，去询问用户在 SSO 中的登录状态。
9. 浏览器重定向到 SSO。注意，第 4 步中已经向浏览器写入了携带 TGC 的 cookie，所以此时 SSO 服务器可以拿到，根据 TGC 去查找 TGT，如果找到，就判断用户已经在 sso 登录过了。
10. SSO 服务器返回一个重定向，重定向携带 ST。
    注意，这里的 ST 和第 4 步中的 ST 是不一样的，事实上，每次生成的 ST 都是不一样的。
11. 浏览器带 ST 重定向到 b 服务器，和第 5 步一样。
12. b 服务器根据票据向 SSO 服务器发送请求，票据验证通过后，b 服务器知道用户已经在 sso 登录了，于是生成 b session，向浏览器写入 b cookie。

## 接口

1. user
   登录 login
   注册 register
   登出 logout
   校验 ST checkST
   用户信息 profile

2. application

###
