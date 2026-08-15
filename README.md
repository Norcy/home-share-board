# 我家的共享桌面

在同一个 Wi‑Fi 下，让电脑、手机和平板互传文字、图片和文件：不用登录、不经过云端，打开网页就能用。

## 它解决什么问题

常见的传递方式都有前提：

- 微信：需要在各台设备安装并登录微信，不适合临时使用或不想登录账号的场景
- AirDrop：主要适用于 Apple 设备之间，不能覆盖 Android 或 Windows 设备，也不适合传一段可持续共享的文字
- Apple 接力剪贴板：通常要求设备登录同一个 Apple 账号，并处于满足条件的 Apple 生态中
- 云盘或网盘：需要登录账号，临时传一小段文字或文件显得太重

因此，它特别适合：

- Android 与 iPhone / iPad 混用
- Windows 电脑与 iPhone / iPad 混用
- 设备没有安装微信，或不想为了传文件登录微信
- Apple 设备没有使用同一个 iCloud / Apple 账号
- 家里多台设备临时共享文字、图片和文件

如果 AirDrop 已经能满足你的需求，或者 Apple 设备之间的同账号接力剪贴板已经够用，就不需要额外使用这个工具。

## 使用

要求：Node.js 20.19+、Yarn。

第一次使用，直接复制下面四行：

```bash
git clone https://github.com/Norcy/my-home-desktop.git
cd my-home-desktop
yarn
yarn dev
```

以后再次使用，只需要：

```bash
cd my-home-desktop
yarn dev
```

浏览器打开 `http://localhost:3000`。同一 Wi‑Fi 下的其他设备打开这台电脑的局域网 IP 加端口，例如 `http://<局域网IP>:3000`。

## 进阶使用

### 开机启动

在项目目录中运行：

```bash
yarn autostart
```

### 取消开机启动

```bash
yarn autostart:cancel
```

### 停止手动启动的服务

如果之前用 `./bin/my-home-desktop start` 手动启动过服务，请在项目目录执行：

```bash
./bin/my-home-desktop stop
```

### 安装 Alfred 快捷打开

```bash
yarn alfred
```

### 用 Alfred 打开

唤起 Alfred，输入 `My Home Desktop` 并回车。

### 移除 Alfred 快捷打开

```bash
yarn alfred:cancel
```

## 使用技巧：添加到主屏幕

在手机或平板浏览器打开共享桌面后，可以把它保存到主屏幕，下次像打开 App 一样使用：

- iPhone / iPad：Safari 点“分享” → “添加到主屏幕”
- Android：Chrome 点右上角菜单 → “添加到主屏幕”或“安装应用”

项目已内置 Web App manifest 和主屏幕图标。

## 能做什么

- 发送文字，点击文字即可复制
- 上传或拖入图片、文件
- 图片预览，文件下载
- 最多保留最近 80 条内容，单个文件最大 12 MB
- 内容只存在当前 Node 进程内存中，重启后清空
