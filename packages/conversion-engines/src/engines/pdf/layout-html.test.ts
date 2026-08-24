import { describe, expect, test } from "bun:test";
import {
  layoutPagesToHtml,
  layoutPagesToSections,
  layoutPagesToSpreadsheetHtml,
} from "./layout-html.js";
import { parsePdfLayout } from "./pdf-layout.js";

const SAMPLE_LAYOUT = `<doc>
  <page width="612" height="792">
    <block xMin="214" yMin="158" xMax="401" yMax="189">
      <line xMin="214" yMin="158" xMax="401" yMax="189">
        <word xMin="214" yMin="158" xMax="353" yMax="189">Recovery</word>
        <word xMin="363" yMin="158" xMax="401" yMax="189">Kit</word>
      </line>
    </block>
    <block xMin="86" yMin="214" xMax="437" yMax="248">
      <line xMin="86" yMin="214" xMax="399" yMax="228">
        <word xMin="86" yMin="214" xMax="196" yMax="228">If you need access</word>
      </line>
    </block>
    <block xMin="110" yMin="276" xMax="114" yMax="282">
      <line xMin="110" yMin="276" xMax="114" yMax="282">
        <word xMin="110" yMin="276" xMax="114" yMax="282">1</word>
      </line>
    </block>
    <block xMin="132" yMin="273" xMax="342" yMax="287">
      <line xMin="132" yMin="273" xMax="342" yMax="287">
        <word xMin="132" yMin="273" xMax="342" yMax="287">Launch the app</word>
      </line>
    </block>
    <block xMin="110" yMin="304" xMax="114" yMax="310">
      <line xMin="110" yMin="304" xMax="114" yMax="310">
        <word xMin="110" yMin="304" xMax="114" yMax="310">2</word>
      </line>
    </block>
    <block xMin="132" yMin="301" xMax="232" yMax="315">
      <line xMin="132" yMin="301" xMax="232" yMax="315">
        <word xMin="132" yMin="301" xMax="232" yMax="315">Open Settings</word>
      </line>
    </block>
    <block xMin="263" yMin="301" xMax="298" yMax="315">
      <line xMin="263" yMin="301" xMax="298" yMax="315">
        <word xMin="263" yMin="301" xMax="298" yMax="315">Sync</word>
      </line>
    </block>
    <block xMin="110" yMin="450" xMax="153" yMax="460">
      <line xMin="110" yMin="450" xMax="153" yMax="460">
        <word xMin="110" yMin="450" xMax="153" yMax="460">alpha</word>
      </line>
    </block>
    <block xMin="210" yMin="450" xMax="268" yMax="460">
      <line xMin="210" yMin="450" xMax="268" yMax="460">
        <word xMin="210" yMin="450" xMax="268" yMax="460">bravo</word>
      </line>
    </block>
    <block xMin="311" yMin="450" xMax="347" yMax="460">
      <line xMin="311" yMin="450" xMax="347" yMax="460">
        <word xMin="311" yMin="450" xMax="347" yMax="460">charlie</word>
      </line>
    </block>
    <block xMin="412" yMin="450" xMax="455" yMax="460">
      <line xMin="412" yMin="450" xMax="455" yMax="460">
        <word xMin="412" yMin="450" xMax="455" yMax="460">delta</word>
      </line>
    </block>
    <block xMin="110" yMin="482" xMax="146" yMax="492">
      <line xMin="110" yMin="482" xMax="146" yMax="492">
        <word xMin="110" yMin="482" xMax="146" yMax="492">echo</word>
      </line>
    </block>
    <block xMin="210" yMin="482" xMax="261" yMax="492">
      <line xMin="210" yMin="482" xMax="261" yMax="492">
        <word xMin="210" yMin="482" xMax="261" yMax="492">foxtrot</word>
      </line>
    </block>
    <block xMin="311" yMin="482" xMax="347" yMax="492">
      <line xMin="311" yMin="482" xMax="347" yMax="492">
        <word xMin="311" yMin="482" xMax="347" yMax="492">golf</word>
      </line>
    </block>
    <block xMin="412" yMin="482" xMax="455" yMax="492">
      <line xMin="412" yMin="482" xMax="455" yMax="492">
        <word xMin="412" yMin="482" xMax="455" yMax="492">hotel</word>
      </line>
    </block>
  </page>
</doc>`;

describe("layout html", () => {
  test("rebuilds headings, lists, and aligned word grids", () => {
    const sections = layoutPagesToSections(parsePdfLayout(SAMPLE_LAYOUT));

    expect(sections).toEqual([
      { kind: "heading", text: "Recovery Kit" },
      { kind: "paragraph", text: "If you need access" },
      {
        kind: "list",
        items: ["Launch the app", "Open Settings — Sync"],
      },
      {
        kind: "table",
        rows: [
          ["alpha", "bravo", "charlie", "delta"],
          ["echo", "foxtrot", "golf", "hotel"],
        ],
      },
    ]);
  });

  test("escapes HTML from PDF text", () => {
    const html = layoutPagesToHtml(
      parsePdfLayout(`<doc><page width="612" height="792">
        <block xMin="100" yMin="100" xMax="200" yMax="120">
          <line xMin="100" yMin="100" xMax="200" yMax="120">
            <word xMin="100" yMin="100" xMax="200" yMax="120">A &lt;b&gt;B</word>
          </line>
        </block>
      </page></doc>`),
    );

    expect(html).toContain("A &lt;b&gt;B");
    expect(html).not.toContain("<b>B");
  });

  test("flattens reconstructed sections into a Calc HTML table", () => {
    const html = layoutPagesToSpreadsheetHtml(parsePdfLayout(SAMPLE_LAYOUT));

    expect(html).toContain("<td>Recovery Kit</td>");
    expect(html).toContain("<td>alpha</td>");
    expect(html).toContain("<td>bravo</td>");
    expect(html).toContain("<td>hotel</td>");
    expect(html).not.toContain("<h1>");
  });
});
