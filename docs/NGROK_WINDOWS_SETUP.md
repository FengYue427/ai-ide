# Windows 安装 ngrok（方案 B · 长期本地支付联调）

用于支付宝/微信沙箱：`PAYMENT_NOTIFY_URL` 必须指向 **HTTPS 公网**，并转发到本机 API **3001**。

---

## 1. 注册 ngrok 账号

1. 打开 https://dashboard.ngrok.com/signup  
2. 注册并登录（免费即可）  
3. 进入 **Your Authtoken**：https://dashboard.ngrok.com/get-started/your-authtoken  
4. 复制 token（形如 `2abc...`，只显示一次，请保存）

---

## 2. 下载并解压

1. 打开 https://ngrok.com/download  
2. 选 **Windows (AMD64)**，下载 zip  
3. 解压到固定目录，例如：

   ```text
   C:\Tools\ngrok\ngrok.exe
   ```

不要放在每次会更新的临时目录里。

---

## 3. 加入 PATH（推荐）

**PowerShell（当前用户）**：

```powershell
$ngrokDir = "C:\Tools\ngrok"
[Environment]::SetEnvironmentVariable("Path", $env:Path + ";$ngrokDir", "User")
```

**关闭并重新打开** PowerShell，验证：

```powershell
ngrok version
```

若仍提示找不到命令，可本窗口临时：

```powershell
$env:Path += ";C:\Tools\ngrok"
ngrok version
```

或图形界面：**设置 → 系统 → 关于 → 高级系统设置 → 环境变量 → 用户 Path → 新建** → `C:\Tools\ngrok`。

---

## 4. 绑定 Authtoken（只需一次）

```powershell
ngrok config add-authtoken 粘贴你的token
```

成功后会写入 `%USERPROFILE%\.ngrok2\ngrok.yml` 或 `%LocalAppData%\ngrok\ngrok.yml`。

---

## 5. 日常联调流程（两个终端）

### 终端 A — 隧道（保持运行）

先确保 API 端口与项目一致（默认 **3001**）：

```powershell
cd c:\Users\18663\IDE\ai-ide
ngrok http 3001
```

窗口里会出现类似：

```text
Forwarding   https://a1b2c3d4.ngrok-free.app -> http://localhost:3001
```

复制 **https** 那一行的主机名（不要末尾 `/`），例如 `https://a1b2c3d4.ngrok-free.app`。

### 终端 B — 项目

`.env.local`：

```env
APP_URL=http://localhost:3000
PAYMENT_NOTIFY_URL=https://a1b2c3d4.ngrok-free.app
```

然后：

```powershell
cd c:\Users\18663\IDE\ai-ide
npm run billing:preflight
npm run billing:alipay-probe
npm run dev:stack
```

`billing:alipay-probe` 应出现 **「网关未直接返回 error」**。

浏览器：`http://localhost:3000` → 订阅 → 支付宝。

---

## 6. 免费版注意

| 项 | 说明 |
|----|------|
| 域名会变 | 每次重启 `ngrok http 3001`，免费子域可能变 → **改 `.env.local` 并重启 `dev:stack`** |
| 固定子域 | 需 ngrok 付费计划；长期固定可再考虑 |
| 浏览器警告页 | 免费域首次用浏览器访问可能有一键确认页；**支付宝服务器 POST notify 一般不受影响** |
| 只转发 API | 必须 `ngrok http 3001`，不是 3000（3000 是 Vite 前端） |

---

## 7. 可选：固定配置文件

创建 `%USERPROFILE%\.ngrok2\ngrok.yml`（若 `ngrok config add-authtoken` 已生成，在其上追加）：

```yaml
version: "2"
authtoken: 你的token
tunnels:
  ai-ide-api:
    addr: 3001
    proto: http
```

启动：

```powershell
ngrok start ai-ide-api
```

---

## 8. 与 ai-ide 检查命令对照

| 命令 | 作用 |
|------|------|
| `npm run billing:preflight` | 检查 `PAYMENT_NOTIFY_URL`、支付宝密钥 |
| `npm run billing:alipay-probe` | 请求沙箱网关，确认不是 `/error` |
| `npm run dev:stack` | 前端 3000 + API 3001 |

Notify 实际地址：`{PAYMENT_NOTIFY_URL}/api/payment/alipay/notify`

---

## 9. 故障排查

| 现象 | 处理 |
|------|------|
| `ngrok` 不是内部或外部命令 | PATH 未生效 → 重开终端或检查 `C:\Tools\ngrok` |
| `authentication failed` | 重新 `ngrok config add-authtoken` |
| 仍跳转 `/error` | `PAYMENT_NOTIFY_URL` 仍是 localhost → 改为 ngrok https |
| 付完未升级 Pro | ngrok 终端是否收到 POST；API 日志 `[Alipay notify]` |

更多沙箱说明：[ALIPAY_SANDBOX_QUICKSTART.md](./ALIPAY_SANDBOX_QUICKSTART.md)
