# Controller パターン

## 標準 CRUD エンドポイント

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/xxx/list` | 検索・一覧取得 |
| GET | `/api/xxx/{id}` | 詳細取得 |
| POST | `/api/xxx/add` | 新規登録 |
| PUT | `/api/xxx/update` | 更新 |
| DELETE | `/api/xxx/{id}` | 削除（論理削除推奨） |

## 論理削除パターン

```java
@PutMapping("/delete")
public ResponseEntity<Void> delete(@RequestBody Xxx entity) {
    entity.setDeleteFlag("1");
    entity.setUpdateDate(LocalDateTime.now());
    service.update(entity);
    return ResponseEntity.ok().build();
}
```

## 検索共通パラメータ

全一覧APIで以下の共通パラメータをサポートすること:
- `deleteFlag`: "0"=有効のみ（デフォルト）, "1"=削除済み, 空=全部
