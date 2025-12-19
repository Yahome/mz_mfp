# 字典导入说明（任务 5）

## 目标
将 `2、中医门（急）诊诊疗信息页数据项采集接口标准.xlsx` 中的字典数据导入到业务库的 `dict_set/dict_item` 表，用于后端校验与前端远程搜索。

## 已提供的脚本

### 1) 直接导入（推荐）
- 脚本：`backend/scripts/import_dicts_direct.py`
- 特点：
  - 逐个 `set_code` 覆盖导入（会先 `DELETE dict_item WHERE set_code=...`）
  - 针对同一 `set_code` 内部重复 `code` 做去重（保留首次出现）
  - 支持大字典（ICD10/ICD9CM3 等）分批写入

运行示例（在 `backend` 目录下执行）：
```bash
python scripts/import_dicts_direct.py --xlsx ../2、中医门（急）诊诊疗信息页数据项采集接口标准.xlsx --batch-size 8000
```

### 2) 生成 SQL 分批文件（备用）
- 脚本：`backend/scripts/generate_dict_import_sql.py`
- 输出：默认 `backend/tmp/dict_sql_*/` 下的 SQL 分批文件（可用于外部数据库工具执行）。

## 导入后的使用
- 字典检索接口：`GET /api/dicts/{set_code}/search?q=...&page=...&page_size=...`
- 校验会读取 `dict_item` 做值域合法性判断（见 `docs/validation_todo.md`）。

