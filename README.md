# 我家的共享桌面

## 你是不是也遇到过

在家里同一个 Wi‑Fi 下，你可能只是想把电脑上的一行文字发到手机，或把手机拍的图片传到 Windows 电脑，却发现：

- 想把电脑上的一行文字发到手机，却发现两台设备还没有登录微信
- 想把手机里的图片传到 Windows 电脑，却发现 AirDrop 不能作为通用方式
- 想在 Android 手机和 iPhone / iPad 之间传文件，却找不到双方都方便使用的工具
- 想同步 Apple 设备之间的剪贴板，却发现它们登录的不是同一个 Apple 账号
- 只想传一段文字或一个文件，却觉得安装、登录网盘太麻烦

## 给家里的设备一张共享桌面

My Home Desktop 就像给家里的电子设备放了一张共享桌面：电脑、手机和平板都可以把文字、图片和文件放上去，也可以随时拿下来。不需要微信，不需要云盘，不需要登录账号，也不要求家里的设备全是 Apple。内容只保存在当前服务内存中，服务重启后自动清空。

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
