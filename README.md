# 我家的共享桌面

在同一个 Wi‑Fi 下，让电脑、手机和平板互传文字、图片和文件：不用登录、不经过云端，打开网页就能用。

## 适合什么场景

- 手机拍了一张图，想马上发到电脑
- 电脑上的一段文字或文件，想快速传到手机
- 家里多台设备之间临时共享内容，不想注册账号或上传云盘

## 运行

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

## macOS 快捷安装

只配置登录后自动启动，在项目目录中运行：

```bash
yarn autostart
```

取消自动启动：

```bash
yarn autostart:cancel
```

单独安装 Alfred 工作流：

```bash
yarn alfred
```

然后唤起 Alfred，输入 `My Home Desktop` 回车即可打开；移除 Alfred 工作流使用 `yarn alfred:cancel`。

这些命令会根据当前项目位置生成用户级配置，不需要手动编辑路径或 plist。

## 能做什么

- 发送文字，点击文字即可复制
- 上传或拖入图片、文件
- 图片预览，文件下载
- 最多保留最近 80 条内容，单个文件最大 12 MB
- 内容只存在当前 Node 进程内存中，重启后清空

## 接口

接口很小，完整说明见 [`docs/API.md`](docs/API.md)。

```text
GET    /api/items       获取内容
POST   /api/items       新增文字、图片或文件
DELETE /api/items       删除指定内容；不带 id 时清空全部
```

## 隐私边界

服务默认监听 `0.0.0.0:3000`，因此同一局域网内能访问该端口的设备都可以使用它。项目不登录、不上传第三方服务，也不把共享内容写入磁盘。

如果不希望局域网访问，将服务监听地址改为 `127.0.0.1`。
