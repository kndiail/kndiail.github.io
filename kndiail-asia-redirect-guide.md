# 将 kndiail.asia 接入博客（GitHub 用户页 + 自定义域名）

> 目标效果：访问 `https://kndiail.asia` 时，浏览器地址栏**始终显示 `kndiail.asia`**，网页内容来自你的 GitHub Pages 博客（`https://kndiail.github.io/`），无跳转、无地址栏变化。
>
> 本文采用**方案 C：迁移到 GitHub 用户页（kndiail.github.io）**，这是最干净、官方原生支持自定义域名的路线。其他方案（Worker 代理、Cloudflare Pages）见文末附录对比。

---

## 一、为什么必须是"用户页"

GitHub Pages 有两种形态：

| 形态 | 仓库名 | 访问地址 | 是否支持自定义域名 |
|---|---|---|---|
| **用户页（User Page）** | `kndiail.github.io` | `https://kndiail.github.io/`（无子路径） | ✅ 原生支持 |
| 项目页（Project Page） | 任意名字（如 `kndiail`） | `https://kndiail.github.io/kndiail/`（带子路径） | ❌ 不支持自定义域 |

**GitHub 只允许用户页绑定自定义域名**。所以要让 `kndiail.asia` 直接指向你的博客且地址栏不变，前提就是**仓库名必须是 `kndiail.github.io`**——这就是方案 C 的核心。

> 你已确认 GitHub 上已有 `kndiail.github.io` 仓库，接下来的操作就是把博客内容迁移过去并完成域名接入。

---

## 二、本地配置改动（已完成）

以下改动我已帮你做好，直接随仓库推送到 `kndiail.github.io` 即可：

### 1. `_config.yml`（站点 URL 配置）

```yaml
# 改前
url: https://kndiail.github.io/kndiail
root: /kndiail/

# 改后
url: https://kndiail.asia
root: /
```

- `url` 改为 `https://kndiail.asia` —— canonical / SEO / og 链接都指向你的域名
- `root` 改为 `/` —— 去掉 `/kndiail/` 子路径，所有资源路径从 `/kndiail/xxx` 变为 `/xxx`

> 已验证：改后生成的 HTML 中 CSS/JS/图片路径均为根路径（`/css/main.css` 等），无 `/kndiail/` 残留，canonical 为 `https://kndiail.asia/index.html`。

### 2. 部署脚本（无需改动）

`.github/workflows/pages.yml` 用的是 `actions/upload-pages-artifact` + `actions/deploy-pages`，部署的是 `public/` 到仓库根路径，迁移到用户页后**天然兼容，无需修改**。

### 3. 无硬编码路径

主题和注入脚本中都没有写死 `/kndiail/` 路径，`url_for()` 会基于 `root: /` 自动生成正确路径。

---

## 三、迁移步骤（推送内容到新仓库）

### 步骤 1：把本地内容推送到 `kndiail.github.io`

你当前的本地仓库 remote 是 `kndiail/kndiail.git`。迁移有两种方式：

**方式 A（推荐）：改 remote 直接推送**
```bash
git remote set-url origin https://github.com/kndiail/kndiail.github.io.git
git push -u origin main
```
这样保留全部提交历史，`kndiail.github.io` 仓库就有完整的博客内容了。

**方式 B：如果新仓库已有内容**
先在新仓库初始化，再推送：
```bash
git remote add origin https://github.com/kndiail/kndiail.github.io.git
git push -u origin main
```
（若新仓库有 README/license 导致冲突，先 `git pull origin main --rebase` 再 push）

### 步骤 2：在 GitHub 开启 Pages

1. 打开 `github.com/kndiail/kndiail.github.io` → **Settings → Pages**
2. **Build and deployment** → Source 选 **GitHub Actions**（你的 `pages.yml` 会接管构建）
3. 等待 Actions 跑完，`https://kndiail.github.io/` 应能访问

### 步骤 3：绑定自定义域名 `kndiail.asia`

在同一个 **Settings → Pages** 页面：

1. 找到 **Custom domain** 输入框
2. 输入 `kndiail.asia`，点 **Save**
3. GitHub 会弹窗提示你**添加 DNS 记录**——按它的提示，到 Cloudflare 添加 CNAME 记录（见下步）
4. GitHub 自动在仓库里创建 `CNAME` 文件（内容 `kndiail.asia`），提交后随部署生效

> ⚠️ 绑定成功后，访问 `https://kndiail.github.io/` 会**自动跳转到 `https://kndiail.asia/`**，这是 GitHub 官方行为，正是我们想要的。

---

## 四、Cloudflare 配置（纯 DNS，无需 Worker）

### 步骤 1：确认 Cloudflare 已接管域名

`kndiail.asia` 已在 Cloudflare（NS 已切换完成）。

### 步骤 2：添加 DNS 记录

在 Cloudflare **DNS → Records** 添加：

| 字段 | 值 |
|---|---|
| Type | **CNAME** |
| Name | `@` |
| Target | `kndiail.github.io` |
| Proxy status | **DNS only（灰云）** ⚠️ |

> ⚠️ 与方案 A（Worker）不同，用户页自定义域名场景下 GitHub **要求 CNAME 走 DNS only（灰云）**。如果开 Proxied（橙云），GitHub 可能拒绝签发证书或报 "custom domain is not properly configured"。

### 步骤 3：SSL/TLS 设置

Cloudflare **SSL/TLS → Overview** 设为 **Full**（GitHub Pages 是 HTTPS，两端都加密）。

### 步骤 4：等待生效并测试

- DNS 解析生效需几分钟到几小时
- 访问 `https://kndiail.asia`：
  - 地址栏显示 `kndiail.asia` ✓
  - 页面内容正常、样式图片播放器正常 ✓
  - 无痕窗口测试排除缓存

---

## 五、验证清单

- [ ] `kndiail.github.io` 仓库存在，内容已推送
- [ ] GitHub Actions 构建成功，`https://kndiail.github.io/` 可访问
- [ ] Settings → Pages 绑定 `kndiail.asia`，仓库根出现 `CNAME` 文件
- [ ] Cloudflare CNAME：`@` → `kndiail.github.io`（**灰云**）
- [ ] Cloudflare SSL 为 Full
- [ ] 访问 `https://kndiail.asia`，地址栏不变、资源正常
- [ ] 访问 `https://kndiail.github.io/` 自动跳到 `kndiail.asia`

---

## 六、常见问题

| 现象 | 原因与解决 |
|---|---|
| `kndiail.asia` 打不开 | DNS 未生效（等）、CNAME 未加（去 Cloudflare 加）、Proxy 开了橙云（改灰云） |
| GitHub 提示 "custom domain is not properly configured" | CNAME 用了 Proxied，改 DNS only（灰云） |
| 页面能开但样式图片全挂 | 仓库内容还是旧配置（`root: /kndiail/`），重新推送改后的 `_config.yml` |
| 访问 `kndiail.github.io` 不跳转 | 域名绑定未完成，或 CNAME 文件没提交进仓库 |
| 证书报错 | Cloudflare SSL 设为 Full，且等 GitHub 证书签发（首次绑定需几分钟） |

---

## 附录：其他方案对比

| 方案 | 地址栏保持 | 改动量 | 依赖 | 适用 |
|---|---|---|---|---|
| **C. GitHub 用户页**（本教程） | ✅ | 中（迁移仓库+改配置） | GitHub + Cloudflare DNS | ✅ 当前采用 |
| A. Cloudflare Worker 代理 | ✅ | 小（不改部署） | Cloudflare Worker 每日额度 | 不想迁移仓库时 |
| B. Cloudflare Pages 托管 | ✅ | 中（改部署目标） | Cloudflare Pages | 想彻底脱离 GitHub Pages 时 |

**方案 A（Worker 代理）**：把 GitHub Pages 内容通过 Worker 抓取+改写 URL 转发，不迁移仓库，但每次访问都过一层代理、依赖 Worker 免费额度，且 GitHub 项目页 + 自定义域不兼容的坑依然存在。

**方案 B（Cloudflare Pages）**：把 Hexo 构建产物部署到 Cloudflare Pages（可连仓库自动构建），原生支持自定义域名，速度比 GitHub Pages 快。需要改部署脚本（把 `actions/upload-pages-artifact` 换成 Cloudflare Pages 的部署方式或直接用 Wrangler 推送）。

> 你已经选择了方案 C 且本地配置已改好，按上文"三、迁移步骤"操作即可。如果迁移后想进一步优化（例如切到方案 B 提速），随时可以再调整。
