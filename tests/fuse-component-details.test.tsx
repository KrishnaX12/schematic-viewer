import { expect, test } from "bun:test"
import { JSDOM } from "jsdom"
import { renderToStaticMarkup } from "react-dom/server"
import { SchematicComponentDetailsTooltip } from "../lib/components/SchematicComponentDetailsTooltip"
import { renderToCircuitJson } from "../lib/dev/render-to-circuit-json"
import { getSourceComponentInfoEntries } from "../lib/utils/component-details"

const circuitJson = renderToCircuitJson(
  <board>
    <fuse name="F1" currentRating="500mA" voltageRating="24V" />
  </board>,
)
const fuse = circuitJson.find(
  (element) =>
    element.type === "source_component" && element.ftype === "simple_fuse",
)
if (!fuse) throw new Error("Expected fuse F1")

test("fuse details show each rating once with units", () => {
  const html = renderToStaticMarkup(
    <SchematicComponentDetailsTooltip
      sourceComponent={fuse}
      left={0}
      top={0}
      width={400}
      maxHeight={400}
    />,
  )
  const { document } = new JSDOM(html).window

  expect(
    Array.from(document.querySelectorAll("dt"), (row) => row.textContent),
  ).toEqual(["name", "current_rating_amps", "voltage_rating_volts"])
  expect(
    Array.from(document.querySelectorAll("dd"), (row) => row.textContent),
  ).toEqual(["F1", '"500mA"', '"24V"'])
})

test.each([undefined, "", " "])(
  "fuse ratings fall back to numeric values for display text %j",
  (displayRating) => {
    const numericFuse = {
      ...fuse,
      current_rating_amps: 0,
      voltage_rating_volts: 0,
      display_current_rating: displayRating,
      display_voltage_rating: displayRating,
    }
    const entries = getSourceComponentInfoEntries(numericFuse)

    expect(entries).toEqual([
      { key: "name", label: "name", value: "F1" },
      { key: "current_rating_amps", label: "current_rating_amps", value: "0" },
      {
        key: "voltage_rating_volts",
        label: "voltage_rating_volts",
        value: "0",
      },
    ])
  },
)
