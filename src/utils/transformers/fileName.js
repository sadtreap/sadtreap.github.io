/**
 * Shiki transformer that shows a file name above a code block.
 *
 * A fence written as ```cpp file="dispatch.cpp" is wrapped in
 * <figure class="code-file"><figcaption>dispatch.cpp</figcaption><pre>…</pre></figure>.
 */
export const transformerFileName = () => ({
  root(root) {
    const file = this.options.meta?.__raw?.match(/file=["'`]?([^\s"'`]+)/)?.[1];
    if (!file) return;

    root.children = [
      {
        type: "element",
        tagName: "figure",
        properties: { class: "code-file" },
        children: [
          {
            type: "element",
            tagName: "figcaption",
            properties: {},
            children: [{ type: "text", value: file }],
          },
          ...root.children,
        ],
      },
    ];
  },
});
