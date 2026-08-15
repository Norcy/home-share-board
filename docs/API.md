# API

服务默认运行在 `http://localhost:3000`，所有接口返回 JSON。

## 获取内容

```http
GET /api/items
```

返回最近内容数组，按最新创建时间在前排列。

## 新增内容

```http
POST /api/items
Content-Type: application/json
```

文字：

```json
{"kind":"text","text":"从手机发来的内容"}
```

图片或文件：

```json
{
  "kind": "image",
  "name": "photo.png",
  "mime": "image/png",
  "size": 12345,
  "data": "data:image/png;base64,..."
}
```

成功返回 `201` 和新内容；缺少 `kind`、`text` 或 `data` 时返回 `400`。

## 删除内容

删除一条：

```http
DELETE /api/items?id=<id>
```

清空全部：

```http
DELETE /api/items
```

成功返回：

```json
{"ok":true}
```
