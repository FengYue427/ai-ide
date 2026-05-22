# 插件作者国际化（manifest.i18n）

第三方插件可在 **manifest** 中声明可选字段 `i18n`，在 `activate(context)` 里用 **`context.t(key, params?)`** 取文案，无需手写 `context.locale === 'en-US'` 分支。

## 支持的语言

与 IDE 一致，仅：

- `zh-CN`
- `en-US`

未提供当前语言时，回退顺序：**当前 UI 语言 → zh-CN → 返回 key 本身**。

## manifest 示例

```json
{
  "manifest": {
    "id": "my-plugin",
    "name": "My Plugin",
    "version": "1.0.0",
    "description": "…",
    "entry": "main.js",
    "permissions": ["ui"],
    "i18n": {
      "zh-CN": {
        "toolbar.label": "我的按钮",
        "notify.done": "操作完成"
      },
      "en-US": {
        "toolbar.label": "My button",
        "notify.done": "Done"
      }
    }
  },
  "source": "function activate(context) { … }"
}
```

## activate 中使用

```javascript
function activate(context) {
  context.ui.addToolbarButton({
    icon: 'sparkles',
    label: context.t('toolbar.label'),
    onClick: function () {
      context.ui.showNotification(context.t('notify.done'), 'success')
    },
  })
}
```

### 占位符

词条值可含 `{name}`，与 IDE 一致：

```json
"modal.body": "当前共有 {count} 个文件。"
```

```javascript
context.t('modal.body', { count: context.files.getAll().length })
```

## 键名规则

- 小写字母开头，仅 `a-z`、`0-9`、`.`、`_`、`-`
- 每语言最多 **64** 个键
- 单条最多 **512** 字符
- 全部语言合计最多 **8192** 字符

## 与 `context.locale` 的关系

- `context.locale`：当前 IDE UI 语言，仍可用于逻辑分支。
- `context.t()`：推荐用于**展示给用户的固定文案**（按钮、通知、弹窗标题等）。

官方示例：`examples/hello.plugin.json`、`examples/plugins/workspace-hints.plugin.json`。

## 校验

安装/注册插件时会校验 `manifest.i18n` 形状；错误信息随 IDE 语言显示（`plugin.i18n.*` 词条）。
