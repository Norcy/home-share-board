# 我家的共享桌面

## 你是不是也遇到过

在家里同一个 Wi‑Fi 下，你可能只是想把电脑上的一行文字发到手机，或把手机拍的图片传到 Windows 电脑，却发现：

- 微信：如果有一台设备没有安装或登录微信，临时传一行文字也要先折腾账号
- 云盘：如果只是传一小段文字或一个小文件，打开网盘显得太重
- AirDrop：如果家里还有 Android 手机或 Windows 电脑，设备之间就无法直接用它互传
- 接力剪贴板：如果 Apple 设备登录的不是同一个账号，复制的内容就无法自动同步

## 给家里的设备一张共享桌面

My Home Desktop 就像给家里的电子设备放了一张共享桌面：电脑、手机和平板都可以把文字、图片和文件放上去，也可以随时拿下来。不需要微信，不需要云盘，不需要登录账号，也不要求家里的设备全是 Apple。

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

### 快速打开

- 电脑：把共享桌面地址保存为浏览器书签
- 手机或平板：在浏览器中选择“添加到主屏幕”或“安装应用”

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

安装后，唤起 Alfred，输入 `myhomedesktop` 并回车即可打开服务。

移除 Alfred 工作流：

```bash
yarn alfred:cancel
```
