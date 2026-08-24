import { describe, expect, test } from "bun:test";
import {
  checkboxStoredValue,
  classifyFormWidget,
  isCheckboxChecked,
} from "./pdf-form-fields";

describe("pdf form fields", () => {
  test("classifies widget annotations the engine can fill", () => {
    expect(classifyFormWidget({ fieldType: "Tx" })).toBe("text");
    expect(
      classifyFormWidget({ fieldType: "Tx", textContentType: "date" }),
    ).toBe("date");
    expect(classifyFormWidget({ fieldType: "Btn", checkBox: true })).toBe(
      "checkbox",
    );
    expect(classifyFormWidget({ fieldType: "Ch" })).toBe("dropdown");
    expect(classifyFormWidget({ type: "combobox" })).toBe("dropdown");
  });

  test("does not treat radio or signature widgets as fillable", () => {
    expect(classifyFormWidget({ fieldType: "Btn", radioButton: true })).toBe(
      "radio",
    );
    expect(classifyFormWidget({ fieldType: "Sig" })).toBe("signature");
    expect(classifyFormWidget({ type: "radiobutton" })).toBe("radio");
  });

  test("stores checkbox values the forms engine accepts", () => {
    expect(checkboxStoredValue(true)).toBe("true");
    expect(checkboxStoredValue(false)).toBe("false");
    expect(isCheckboxChecked("yes")).toBe(true);
    expect(isCheckboxChecked("Off")).toBe(false);
  });
});
