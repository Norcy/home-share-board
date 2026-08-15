# 我家的共享桌面

在同一个 Wi‑Fi 下，让电脑、手机和平板互传文字、图片和文件。无需登录，不经过云端，打开网页就能用。

## 适用场景

它适合这些情况：

- Android 与 iPhone / iPad 混用
- Windows 电脑与 iPhone / iPad 混用
- 没有安装微信，或不想为了传文件登录微信
- Apple 设备没有使用同一个 iCloud / Apple 账号
- 只想临时传一段文字、图片或文件

微信需要在各台设备安装并登录；AirDrop 主要适用于 Apple 设备；Apple 接力剪贴板通常要求设备使用同一个 Apple 账号。如果现有方式已经够用，就不需要使用这个工具。

## 能做什么

- 发送文字，点击文字即可复制
- 上传或拖入图片、文件
- 图片预览，文件下载
- 最多保留最近 80 条内容，单个文件最大 12 MB
- 内容只存在当前 Node 进程内存中，重启后清空

## 基础使用

要求：Node.js 20.19+、Yarn。

### 第一次使用

下载项目并安装依赖：

```bash
git clone https://github.com/Norcy/my-home-desktop.git
cd my-home-desktop
yarn
```

### 启动

在项目目录运行：

```bash
yarn start
```

浏览器打开 `http://localhost:3000`。同一 Wi‑Fi 下的其他设备打开这台电脑的局域网 IP 加端口，例如：

```text
http://<局域网IP>:3000
```

### 停止

```bash
yarn stop
```

## 进阶使用

### 开机启动

登录 macOS 后自动启动服务：

```bash
yarn autostart
```

### 取消开机启动

```bash
yarn autostart:cancel
```

### Alfred 工作流

安装 Alfred 工作流：

```bash
yarn alfred
```

安装后，唤起 Alfred，输入 `My Home Desktop` 并回车即可打开服务。

移除 Alfred 工作流：

```bash
yarn alfred:cancel
```

### 添加到主屏幕

在手机或平板浏览器打开共享桌面后，可以把它保存到主屏幕，下次像打开 App 一样使用：

- iPhone / iPad：Safari 点“分享” → “添加到主屏幕”
- Android：Chrome 点右上角菜单 → “添加到主屏幕”或“安装应用”
