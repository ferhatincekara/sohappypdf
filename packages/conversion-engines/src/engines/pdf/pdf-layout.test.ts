import { describe, expect, test } from "bun:test";
import {
  blockText,
  countLayoutWords,
  decodeXmlEntities,
  parsePdfLayout,
} from "./pdf-layout.js";

const SAMPLE_LAYOUT = `<doc>
  <page width="612" height="792">
    <flow>
      <block xMin="214" yMin="158" xMax="401" yMax="189">
        <line xMin="214" yMin="158" xMax="401" yMax="189">
          <word xMin="214" yMin="158" xMax="353" yMax="189">Recovery</word>
          <word xMin="363" yMin="158" xMax="401" yMax="189">Kit</word>
        </line>
      </block>
      <block xMin="86" yMin="214" xMax="437" yMax="248">
        <line xMin="86" yMin="214" xMax="399" yMax="228">
          <word xMin="86" yMin="214" xMax="94" yMax="228">If</word>
          <word xMin="98" yMin="214" xMax="122" yMax="228">you</word>
        </line>
        <line xMin="86" yMin="234" xMax="437" yMax="248">
          <word xMin="86" yMin="234" xMax="110" yMax="248">can</word>
          <word xMin="114" yMin="234" xMax="160" yMax="248">continue</word>
        </line>
      </block>
    </flow>
  </page>
</doc>`;

describe("pdf layout", () => {
  test("parses poppler bbox-layout pages and blocks", () => {
    const pages = parsePdfLayout(SAMPLE_LAYOUT);

    expect(pages).toHaveLength(1);
    expect(pages[0]?.width).toBe(612);
    expect(pages[0]?.blocks).toHaveLength(2);
    const title = pages[0]?.blocks[0];
    expect(title === undefined ? "" : blockText(title)).toBe("Recovery Kit");
    expect(countLayoutWords(pages)).toBe(6);
  });

  test("decodes XML entities without executing markup", () => {
    expect(decodeXmlEntities("A &amp; B &lt;script&gt;")).toBe(
      "A & B <script>",
    );
  });
});
