<!-- Do not edit this file. It is automatically generated by API Documenter. -->

[Home](./index.md) &gt; [@remirror/core-extensions](./core-extensions.md) &gt; [ListItemExtension](./core-extensions.listitemextension.md) &gt; [keys](./core-extensions.listitemextension.keys.md)

## ListItemExtension.keys() method

<b>Signature:</b>

```typescript
keys({ type }: ExtensionManagerNodeTypeParams): {
        Enter: (state: import("prosemirror-state").EditorState<import("prosemirror-model").Schema<string, string>>, dispatch?: ((tr: import("prosemirror-state").Transaction<import("prosemirror-model").Schema<string, string>>) => void) | undefined) => boolean;
        Tab: (state: import("prosemirror-state").EditorState<import("prosemirror-model").Schema<string, string>>, dispatch?: ((tr: import("prosemirror-state").Transaction<import("prosemirror-model").Schema<string, string>>) => void) | undefined) => boolean;
        'Shift-Tab': (state: import("prosemirror-state").EditorState<import("prosemirror-model").Schema<string, string>>, dispatch?: ((tr: import("prosemirror-state").Transaction<import("prosemirror-model").Schema<string, string>>) => void) | undefined) => boolean;
    };
```

## Parameters

|  Parameter | Type | Description |
|  --- | --- | --- |
|  { type } | <code>ExtensionManagerNodeTypeParams</code> |  |

<b>Returns:</b>

`{
        Enter: (state: import("prosemirror-state").EditorState<import("prosemirror-model").Schema<string, string>>, dispatch?: ((tr: import("prosemirror-state").Transaction<import("prosemirror-model").Schema<string, string>>) => void) | undefined) => boolean;
        Tab: (state: import("prosemirror-state").EditorState<import("prosemirror-model").Schema<string, string>>, dispatch?: ((tr: import("prosemirror-state").Transaction<import("prosemirror-model").Schema<string, string>>) => void) | undefined) => boolean;
        'Shift-Tab': (state: import("prosemirror-state").EditorState<import("prosemirror-model").Schema<string, string>>, dispatch?: ((tr: import("prosemirror-state").Transaction<import("prosemirror-model").Schema<string, string>>) => void) | undefined) => boolean;
    }`

