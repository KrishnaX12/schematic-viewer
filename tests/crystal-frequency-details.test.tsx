import { expect, test } from "bun:test"
import { renderToStaticMarkup } from "react-dom/server"
import { renderToCircuitJson } from "../lib/dev/render-to-circuit-json"
import { SchematicComponentDetailsTooltip } from "../lib/components/SchematicComponentDetailsTooltip"
import { getSourceComponentInfoEntries } from "../lib/utils/component-details"

const crystalFrequencyUnitsCircuit = (
  <board width="20mm" height="10mm">
    <inductor name="L1" inductance="7.5nH" schX={-4} />
    <capacitor name="C1" capacitance="3pF" schX={0} />
    <crystal name="Y1" frequency="16MHz" loadCapacitance="9pF" schX={4} />
  </board>
)

test("crystal frequency displays units like inductance and capacitance", () => {
  const circuitJson = renderToCircuitJson(crystalFrequencyUnitsCircuit)
  const sourceComponents = circuitJson.filter(
    (element) => element.type === "source_component",
  )
  expect(sourceComponents).toHaveLength(3)
  expect(
    sourceComponents.map((component) =>
      getSourceComponentInfoEntries(component),
    ),
  ).toMatchInlineSnapshot(`
    [
      [
        {
          "key": "name",
          "label": "name",
          "value": "L1",
        },
        {
          "key": "inductance",
          "label": "inductance",
          "value": ""7.5nH"",
        },
      ],
      [
        {
          "key": "name",
          "label": "name",
          "value": "C1",
        },
        {
          "key": "capacitance",
          "label": "capacitance",
          "value": ""3pF"",
        },
      ],
      [
        {
          "key": "name",
          "label": "name",
          "value": "Y1",
        },
        {
          "key": "frequency",
          "label": "frequency",
          "value": ""16MHz"",
        },
        {
          "key": "load_capacitance",
          "label": "load_capacitance",
          "value": ""9pF"",
        },
        {
          "key": "pin_variant",
          "label": "pin_variant",
          "value": ""two_pin"",
        },
      ],
    ]
  `)

  const crystal = sourceComponents.find(
    (component) => component.ftype === "simple_crystal",
  )
  if (!crystal || crystal.ftype !== "simple_crystal")
    throw new Error("Missing crystal")

  expect(crystal.frequency).toBe(16_000_000)
  expect(getSourceComponentInfoEntries(crystal)).toContainEqual({
    key: "frequency",
    label: "frequency",
    value: '"16MHz"',
  })
  const markup = renderToStaticMarkup(
    <SchematicComponentDetailsTooltip
      sourceComponent={crystal}
      left={0}
      top={0}
      width={300}
      maxHeight={400}
    />,
  )
  expect(markup).toContain(">&quot;16MHz&quot;</dd>")
  expect(markup).toContain(">&quot;9pF&quot;</dd>")
  expect(crystal.load_capacitance).toBe(9e-12)
  expect(crystal.frequency).toBe(16_000_000)
})

test.each([
  { frequency: "16MHz", frequencyHz: 16_000_000, displayFrequency: '"16MHz"' },
  {
    frequency: "32.768kHz",
    frequencyHz: 32_768,
    displayFrequency: '"32.768kHz"',
  },
  { frequency: "100Hz", frequencyHz: 100, displayFrequency: '"100Hz"' },
  { frequency: 1100.1, frequencyHz: 1100.1, displayFrequency: '"1.1001kHz"' },
  {
    frequency: 12345678.9,
    frequencyHz: 12345678.9,
    displayFrequency: '"12.3456789MHz"',
  },
  {
    frequency: "1500MHz",
    frequencyHz: 1_500_000_000,
    displayFrequency: '"1.5GHz"',
  },
])(
  "crystal details display $frequency with its frequency unit",
  ({ frequency, frequencyHz, displayFrequency }) => {
    const circuitJson = renderToCircuitJson(
      <board width="10mm" height="10mm">
        <crystal name="Y1" frequency={frequency} loadCapacitance="12pF" />
      </board>,
    )
    const crystal = circuitJson.find(
      (element) =>
        element.type === "source_component" &&
        element.ftype === "simple_crystal",
    )
    if (!crystal || crystal.ftype !== "simple_crystal")
      throw new Error("Missing crystal")

    expect(crystal.frequency).toBe(frequencyHz)
    expect(getSourceComponentInfoEntries(crystal)).toContainEqual({
      key: "frequency",
      label: "frequency",
      value: displayFrequency,
    })
    expect(crystal.frequency).toBe(frequencyHz)
    const crystalWithDisplayFrequency = {
      ...crystal,
      display_frequency: `${frequencyHz}Hz`,
    }
    expect(
      getSourceComponentInfoEntries(crystalWithDisplayFrequency),
    ).toContainEqual({
      key: "frequency",
      label: "frequency",
      value: JSON.stringify(`${frequencyHz}Hz`),
    })
  },
)

test.each([
  { loadCapacitance: "9pF", capacitanceFarads: 9e-12 },
  { loadCapacitance: "12.5pF", capacitanceFarads: 12.5e-12 },
  { loadCapacitance: "3.3pF", capacitanceFarads: 3.3e-12 },
  { loadCapacitance: "22pF", capacitanceFarads: 22e-12 },
])(
  "crystal load capacitance displays $loadCapacitance",
  ({ loadCapacitance, capacitanceFarads }) => {
    const circuitJson = renderToCircuitJson(
      <board width="10mm" height="10mm">
        <crystal
          name="Y1"
          frequency="16MHz"
          loadCapacitance={loadCapacitance}
        />
      </board>,
    )
    const crystal = circuitJson.find(
      (element) =>
        element.type === "source_component" &&
        element.ftype === "simple_crystal",
    )
    if (!crystal || crystal.ftype !== "simple_crystal")
      throw new Error("Missing crystal")
    expect(getSourceComponentInfoEntries(crystal)).toContainEqual({
      key: "load_capacitance",
      label: "load_capacitance",
      value: JSON.stringify(loadCapacitance),
    })
    expect(crystal.load_capacitance).toBe(capacitanceFarads)
    const crystalWithDisplayCapacitance = {
      ...crystal,
      display_load_capacitance: "Custom capacitance",
    }
    expect(
      getSourceComponentInfoEntries(crystalWithDisplayCapacitance),
    ).toContainEqual({
      key: "load_capacitance",
      label: "load_capacitance",
      value: '"Custom capacitance"',
    })
  },
)
