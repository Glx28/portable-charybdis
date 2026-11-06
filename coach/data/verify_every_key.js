// ZMK Studio verify script for usage-ranked-20261106 layout
window.CHARYBDIS_VERSION = "usage-ranked-20261106";

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const qa = (selector, root = document) => Array.from(root.querySelectorAll(selector));

function clean(value) {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function visible(el) {
  return Boolean(el && el.offsetParent !== null);
}

function findLayerButton(layer) {
  const layerList = document.querySelector('[aria-label="Keymap Layer"]');
  return layerList?.querySelector(`[role="option"][data-key="${layer}"]`)
    || qa('[role="option"]', layerList || document).find((el) => clean(el.textContent) === String(layer));
}

function selectedLayer() {
  const selected = document.querySelector('[aria-label="Keymap Layer"] [role="option"][aria-selected="true"]');
  return clean(selected?.textContent || "");
}

async function selectLayer(layer) {
  if (selectedLayer() === String(layer)) return true;
  const el = findLayerButton(layer);
  if (!el) return false;
  el.scrollIntoView({ block: "center", inline: "center" });
  el.click();
  await sleep(650);
  return selectedLayer() === String(layer);
}

function findKeyElement(x, y) {
  const holder = document.querySelector(`[x="${x}"][y="${y}"]`);
  return holder?.querySelector("button") || holder;
}

async function selectKey(x, y) {
  const el = findKeyElement(x, y);
  if (!el) return false;
  const button = el.closest("button") || el;
  button.scrollIntoView({ block: "center", inline: "center" });
  button.click();
  await sleep(250);
  return true;
}

function visibleSelects() {
  return qa("select").filter(visible);
}

function visibleInputs() {
  return qa("input").filter(visible);
}

function isBehaviorSelect(select) {
  return [...select.options].some((o) => clean(o.textContent) === "Key Press")
    && [...select.options].some((o) => clean(o.textContent) === "Transparent");
}

function isZoomSelect(select) {
  return [...select.options].some((o) => clean(o.textContent) === "Auto")
    && [...select.options].some((o) => clean(o.textContent) === "100%");
}

function isDefaultTransformSelect(select) {
  return [...select.options].some((o) => clean(o.textContent) === "default_transform")
    && select.options.length <= 3;
}

function readCurrent() {
  const selects = visibleSelects();
  const behaviorSelect = selects.find(isBehaviorSelect);
  const behavior = behaviorSelect ? clean(behaviorSelect.options[behaviorSelect.selectedIndex]?.textContent) : "";

  const textValues = visibleInputs()
    .filter((input) => input.type === "text" || input.getAttribute("role") === "combobox")
    .map((input) => clean(input.value))
    .filter(Boolean);

  const selectValues = selects
    .filter((select) => select !== behaviorSelect && !isBehaviorSelect(select) && !isZoomSelect(select) && !isDefaultTransformSelect(select))
    .map((select) => clean(select.options[select.selectedIndex]?.textContent))
    .filter(Boolean);

  let parameter = textValues[0] || selectValues[0] || "";
  if (behavior === "Bluetooth" && (parameter === "Select Profile" || parameter === "Disconnect Profile")) {
    const number = visibleInputs().find((input) => input.type === "number");
    if (number && clean(number.value)) parameter = `BT_SEL ${clean(number.value)}`;
  }

  const modifiers = visibleInputs()
    .filter((input) => input.type === "checkbox" && input.checked)
    .map((input) => clean(input.closest("label")?.textContent || input.parentElement?.textContent || ""))
    .filter(Boolean);

  return { behavior, parameter, modifiers };
}

function normalizeParameter(value) {
  let text = clean(value);
  if (!text) return "";
  text = text.replace(/^Keyboard\s+/i, "");
  text = text.replace(/^Layer::/i, "");
  text = text.replace(/^Layer\s+/i, "");
  text = text.replace(/^Keypad\s+/i, "Keypad ");
  text = text.replace(/\bPage Up\b/i, "PageUp");
  text = text.replace(/\bPage Down\b/i, "PageDown");
  text = text.replace(/\bPageDn\b/i, "PageDown");
  text = text.replace(/\bReturn Enter\b/i, "ReturnEnter");
  if (/^Shift$/i.test(text)) text = "LeftShift";
  text = text.replace(/\bLeftControl\b/i, "LeftCtrl");
  text = text.replace(/\bLeftShift\b/i, "LeftShift");
  text = text.replace(/\bLeftAlt\b/i, "LeftAlt");
  text = text.replace(/\bLeft GUI\b/i, "LeftGUI");
  return text.toUpperCase().replace(/[^A-Z0-9]+/g, "");
}

function normalizeModifier(value) {
  const compact = clean(value).toUpperCase().replace(/[^A-Z0-9]+/g, "");
  const aliases = {
    LCTRL: "LCTRL", LEFTCTRL: "LCTRL", LEFTCONTROL: "LCTRL",
    LSHIFT: "LSHIFT", LEFTSHIFT: "LSHIFT",
    LALT: "LALT", LEFTALT: "LALT",
    LGUI: "LGUI", LEFTGUI: "LGUI", WIN: "LGUI", WINDOWS: "LGUI",
    RCTRL: "RCTRL", RIGHTCTRL: "RCTRL", RIGHTCONTROL: "RCTRL",
    RSHIFT: "RSHIFT", RIGHTSHIFT: "RSHIFT",
    RALT: "RALT", RIGHTALT: "RALT",
    RGUI: "RGUI", RIGHTGUI: "RGUI"
  };
  return aliases[compact] || compact;
}

function normalizeModifiers(value) {
  if (Array.isArray(value)) return value.map(normalizeModifier).filter(Boolean).sort().join("+");
  return clean(value).split("+").map(normalizeModifier).filter(Boolean).sort().join("+");
}

const EXPECTED_CSV = `"layer","x","y","label","behavior","parameter","modifiers"
"0","0","0","Esc","Key Press","Keyboard Escape",""
"0","1","0","1","Key Press","Keyboard 1 and Bang",""
"0","2","0","2","Key Press","Keyboard 2 and At",""
"0","3","0","3","Key Press","Keyboard 3 and Hash",""
"0","4","0","4","Key Press","Keyboard 4 and Dollar",""
"0","5","0","5","Key Press","Keyboard 5 and Percent",""
"0","7","0","6","Key Press","Keyboard 6 and Caret",""
"0","8","0","7","Key Press","Keyboard 7 and Ampersand",""
"0","9","0","8","Key Press","Keyboard 8 and Star",""
"0","10","0","9","Key Press","Keyboard 9 and Left Bracket",""
"0","11","0","0","Key Press","Keyboard 0 and Right Bracket",""
"0","12","0","BkSp","Key Press","Keyboard Delete",""
"0","0","1","Tab","Key Press","Keyboard Tab",""
"0","1","1","Q","Key Press","Keyboard Q",""
"0","2","1","W","Key Press","Keyboard W",""
"0","3","1","E","Key Press","Keyboard E",""
"0","4","1","R","Key Press","Keyboard R",""
"0","5","1","T","Key Press","Keyboard T",""
"0","7","1","Y","Key Press","Keyboard Y",""
"0","8","1","U","Key Press","Keyboard U",""
"0","9","1","I","Key Press","Keyboard I",""
"0","10","1","O","Key Press","Keyboard O",""
"0","11","1","P","Key Press","Keyboard P",""
"0","12","1","å","Key Press","Keyboard Left Brace",""
"0","0","2","Shft","Key Press","Keyboard LeftShift",""
"0","1","2","A","Key Press","Keyboard A",""
"0","2","2","S","Key Press","Keyboard S",""
"0","3","2","D","Key Press","Keyboard D",""
"0","4","2","F","Key Press","Keyboard F",""
"0","5","2","G","Key Press","Keyboard G",""
"0","7","2","H","Key Press","Keyboard H",""
"0","8","2","J","Key Press","Keyboard J",""
"0","9","2","K","Key Press","Keyboard K",""
"0","10","2","L","Key Press","Keyboard L",""
"0","11","2","ø","Key Press","Keyboard SemiColon and Colon",""
"0","12","2","æ","Key Press","Keyboard Left Apos and Double",""
"0","0","3","Ctrl","Key Press","Keyboard LeftControl",""
"0","1","3","Z","Key Press","Keyboard Z",""
"0","2","3","X","Key Press","Keyboard X",""
"0","3","3","C","Key Press","Keyboard C",""
"0","4","3","V","Key Press","Keyboard V",""
"0","5","3","B","Key Press","Keyboard B",""
"0","7","3","N","Key Press","Keyboard N",""
"0","8","3","M","Key Press","Keyboard M",""
"0","9","3",",","Key Press","Keyboard Comma and LessThan",""
"0","10","3",".","Key Press","Keyboard Period and GreaterThan",""
"0","11","3","/","Key Press","Keyboard ForwardSlash and QuestionMark",""
"0","12","3","\\","Key Press","Keyboard Backslash and Pipe",""
"0","3","4","L1","coach_l1_hold","",""
"0","4","4","␣","Key Press","Keyboard Spacebar",""
"0","5","4","L2","coach_l2_hold","",""
"0","7","4","L7","coach_l7_hold","",""
"0","8","4","L3","coach_l3_hold","",""
"0","4","5","LeftAlt","Key Press","Keyboard LeftAlt",""
"0","5","5","L4","coach_l4_hold","",""
"0","7","5","Ret","Key Press","Keyboard Return Enter",""
"1","0","0","F7","Key Press","Keyboard F7",""
"1","1","0","Ctrl+S","Key Press","Keyboard S","L Ctrl"
"1","2","0","Ctrl+Alt+Up","Key Press","Keyboard UpArrow","L Ctrl+L Alt"
"1","3","0","Ctrl+Alt+Down","Key Press","Keyboard DownArrow","L Ctrl+L Alt"
"1","4","0","F4","Key Press","Keyboard F4",""
"1","5","0","Ctrl+Space","Key Press","Keyboard Spacebar","L Ctrl"
"1","7","0","Ctrl+Shift+Tab","Key Press","Keyboard Tab","L Ctrl+L Shift"
"1","8","0","Ctrl+Tab","Key Press","Keyboard Tab","L Ctrl"
"1","10","0","L1","coach_l1_lock","",""
"1","11","0","Win+Shift+C","Key Press","Keyboard C","L GUI+L Shift"
"1","12","0","Win+Shift+R","Key Press","Keyboard R","L GUI+L Shift"
"1","0","1","Ctrl+B","Key Press","Keyboard B","L Ctrl"
"1","1","1","Win+Shift+S","Key Press","Keyboard S","L GUI+L Shift"
"1","2","1","Win+Tab","Key Press","Keyboard Tab","L GUI"
"1","3","1","Win+Alt+Space","Key Press","Keyboard Spacebar","L GUI+L Alt"
"1","4","1","Ctrl+Alt+Win+F11","Key Press","Keyboard F11","L Ctrl+L Alt+L GUI"
"1","5","1","Win+Up","Key Press","Keyboard UpArrow","L GUI"
"1","7","1","Ctrl+F","Key Press","Keyboard F","L Ctrl"
"1","8","1","Ctrl+-","Key Press","Keyboard ForwardSlash and QuestionMark","L Ctrl"
"1","9","1","Ctrl++","Key Press","Keyboard Dash and Underscore","L Ctrl"
"1","10","1","Alt+Left","Key Press","Keyboard LeftArrow","L Alt"
"1","11","1","Alt+Right","Key Press","Keyboard RightArrow","L Alt"
"1","12","1","Ctrl+Shift+F","Key Press","Keyboard F","L Ctrl+L Shift"
"1","0","2","Win+T","Key Press","Keyboard T","L GUI"
"1","1","2","Win+Left","Key Press","Keyboard LeftArrow","L GUI"
"1","2","2","Win+Right","Key Press","Keyboard RightArrow","L GUI"
"1","3","2","Win+Shift+Left","Key Press","Keyboard LeftArrow","L GUI+L Shift"
"1","4","2","Win+Shift+Right","Key Press","Keyboard RightArrow","L GUI+L Shift"
"1","5","2","Win+Down","Key Press","Keyboard DownArrow","L GUI"
"1","7","2","Win+V","Key Press","Keyboard V","L GUI"
"1","8","2","MB1","Mouse Key Press","MB1",""
"1","9","2","MB2","Mouse Key Press","MB2",""
"1","10","2","Scroll_L1","coach_current_scroll_hold","",""
"1","11","2","Win+Shift+T","Key Press","Keyboard T","L GUI+L Shift"
"1","12","2","Win+E","Key Press","Keyboard E","L GUI"
"1","0","3","Shift+Click","coach_shift_click","",""
"1","1","3","Ctrl+X","Key Press","Keyboard X","L Ctrl"
"1","2","3","Ctrl+C","Key Press","Keyboard C","L Ctrl"
"1","3","3","Ctrl+V","Key Press","Keyboard V","L Ctrl"
"1","4","3","Win+H","Key Press","Keyboard H","L GUI"
"1","5","3","Win+C","Key Press","Keyboard C","L GUI"
"1","7","3","Ctrl+O","Key Press","Keyboard O","L Ctrl"
"1","8","3","Win+PgUp","Key Press","Keyboard PageUp","L GUI"
"1","9","3","Win+PgDn","Key Press","Keyboard PageDown","L GUI"
"1","10","3","MB4","Mouse Key Press","MB4",""
"1","11","3","MB5","Mouse Key Press","MB5",""
"1","12","3","MB3","Mouse Key Press","MB3",""
"1","7","4","L6","coach_l6_hold","",""
"1","8","4","L10","coach_l10_hold","",""
"1","5","5","L0","coach_base","",""
"1","7","5","L2","coach_l2_hold","",""
"6","0","0","Ctrl+J","Key Press","Keyboard J","L Ctrl"
"6","1","0","L6","coach_l6_lock","",""
"6","2","0","Win+.","Key Press","Keyboard Period and GreaterThan","L GUI"
"6","3","0","Ctrl+Shift+L","Key Press","Keyboard L","L Ctrl+L Shift"
"6","4","0","Ctrl+Shift+Z","Key Press","Keyboard Z","L Ctrl+L Shift"
"6","5","0","Ctrl+O","Key Press","Keyboard O","L Ctrl"
"6","7","0","Ctrl+Left","Key Press","Keyboard LeftArrow","L Ctrl"
"6","8","0","Ctrl+Right","Key Press","Keyboard RightArrow","L Ctrl"
"6","9","0","LeftArrow","Key Press","Keyboard LeftArrow",""
"6","10","0","Ctrl+Shift+M","Key Press","Keyboard M","L Ctrl+L Shift"
"6","1","1","Win+Tab","Key Press","Keyboard Tab","L GUI"
"6","2","1","Shift+Click","coach_shift_click","",""
"6","4","1","Alt+Shift","Key Press","Keyboard LeftShift","L Alt"
"6","5","1","Shift+Space","Key Press","Keyboard Spacebar","L Shift"
"6","7","1","Alt+Home","Key Press","Keyboard Home","L Alt"
"6","8","1","Ctrl+Shift+Del","Key Press","Keyboard Delete","L Ctrl+L Shift"
"6","9","1","Ctrl+Shift+Enter","Key Press","Keyboard Return Enter","L Ctrl+L Shift"
"6","10","1","Shift+F3","Key Press","Keyboard F3","L Shift"
"6","11","1","Ctrl+G","Key Press","Keyboard G","L Ctrl"
"6","2","2","Ctrl+B","Key Press","Keyboard B","L Ctrl"
"6","3","2","Win+Shift+S","Key Press","Keyboard S","L GUI+L Shift"
"6","4","2","Win+Space","Key Press","Keyboard Spacebar","L GUI"
"6","5","2","Ctrl+/","Key Press","Keyboard ForwardSlash and QuestionMark","L Ctrl"
"6","8","2","MB3","Mouse Key Press","MB3",""
"6","9","2","F11","Key Press","Keyboard F11",""
"6","10","2","Shift+Delete","Key Press","Keyboard Delete","L Shift"
"6","11","2","Ctrl+Shift+R","Key Press","Keyboard R","L Ctrl+L Shift"
"6","12","2","Alt+Click","coach_alt_click","",""
"6","1","3","AltGr+2","Key Press","Keyboard 2 and At","R Alt"
"6","2","3","Win+Shift+N","Key Press","Keyboard N","L GUI+L Shift"
"6","4","3","Win+;","Key Press","Keyboard SemiColon and Colon","L GUI"
"6","5","3","Alt+Shift+D","Key Press","Keyboard D","L Alt+L Shift"
"6","7","3","L4","coach_l4_toggle","",""
"6","8","3","Scroll_L6","coach_current_scroll_hold","",""
"6","9","3","Ctrl+End","Key Press","Keyboard End","L Ctrl"
"6","10","3","Ctrl+.","Key Press","Keyboard Period and GreaterThan","L Ctrl"
"6","11","3","F7","Key Press","Keyboard F7",""
"6","5","5","L0","coach_base","",""
"5","0","0","Ctrl+V","Key Press","Keyboard V","L Ctrl"
"5","1","0","Ctrl+.","Key Press","Keyboard Period and GreaterThan","L Ctrl"
"5","2","0","Win+Shift+D","Key Press","Keyboard D","L GUI+L Shift"
"5","3","0","Shift+Tab","Key Press","Keyboard Tab","L Shift"
"5","4","0","Shift+Click","coach_shift_click","",""
"5","5","0","Ctrl+W","Key Press","Keyboard W","L Ctrl"
"5","7","0","Ctrl+Left","Key Press","Keyboard LeftArrow","L Ctrl"
"5","8","0","Shift+Alt+Up","Key Press","Keyboard UpArrow","L Shift+L Alt"
"5","9","0","Alt+Shift+D","Key Press","Keyboard D","L Alt+L Shift"
"5","11","0","F2","Key Press","Keyboard F2",""
"5","12","0","Ctrl+Right","Key Press","Keyboard RightArrow","L Ctrl"
"5","1","1","F7","Key Press","Keyboard F7",""
"5","2","1","Win+Shift+O","Key Press","Keyboard O","L GUI+L Shift"
"5","3","1","Win+L","Key Press","Keyboard L","L GUI"
"5","4","1","Win+Ctrl+D","Key Press","Keyboard D","L GUI+L Ctrl"
"5","5","1","Ctrl+Shift+>","Key Press","Keyboard Non-US Backslash and Pipe","L Ctrl+L Shift"
"5","7","1","Ctrl+/","Key Press","Keyboard ForwardSlash and QuestionMark","L Ctrl"
"5","8","1","Shift+Alt+Down","Key Press","Keyboard DownArrow","L Shift+L Alt"
"5","9","1","Shift+F8","Key Press","Keyboard F8","L Shift"
"5","10","1","F8","Key Press","Keyboard F8",""
"5","11","1","F4","Key Press","Keyboard F4",""
"5","1","2","Alt+Click","coach_alt_click","",""
"5","2","2","Win+Shift+M","Key Press","Keyboard M","L GUI+L Shift"
"5","3","2","Win+Ctrl+F4","Key Press","Keyboard F4","L GUI+L Ctrl"
"5","4","2","Win+D","Key Press","Keyboard D","L GUI"
"5","5","2","Ctrl+Shift+<","Key Press","Keyboard Non-US Backslash and Pipe","L Ctrl+L Shift"
"5","7","2","L6","coach_l6_toggle","",""
"5","8","2","DownArrow","Key Press","Keyboard DownArrow",""
"5","9","2","Ctrl+Shift+1","Key Press","Keyboard 1 and Bang","L Ctrl+L Shift"
"5","10","2","Ctrl+Shift+2","Key Press","Keyboard 2 and At","L Ctrl+L Shift"
"5","11","2","Ctrl+Shift+F6","Key Press","Keyboard F6","L Ctrl+L Shift"
"5","12","2","Ctrl+O","Key Press","Keyboard O","L Ctrl"
"5","0","3","L10","coach_l10_toggle","",""
"5","2","3","Ctrl+B","Key Press","Keyboard B","L Ctrl"
"5","4","3","Win+Shift+N","Key Press","Keyboard N","L GUI+L Shift"
"5","5","3","Shift+Delete","Key Press","Keyboard Delete","L Shift"
"5","7","3","Alt+Left","Key Press","Keyboard LeftArrow","L Alt"
"5","8","3","Alt+Right","Key Press","Keyboard RightArrow","L Alt"
"5","9","3","Alt+Shift+-","Key Press","Keyboard Dash and Underscore","L Alt+L Shift"
"5","10","3","Alt+Shift++","Key Press","Keyboard Equals and Plus","L Alt+L Shift"
"5","12","3","Ctrl+\`","Key Press","Keyboard Grave Accent and Tilde","L Ctrl"
"5","7","4","L8","coach_l8_hold","",""
"5","8","4","L9","coach_l9_hold","",""
"5","4","5","L0","coach_base","",""
"5","7","5","L2","coach_l2_hold","",""
"10","0","0","Ctrl+7","Key Press","Keyboard 7 and Ampersand","L Ctrl"
"10","2","0","Win+K","Key Press","Keyboard K","L GUI"
"10","5","0","Ctrl+5","Key Press","Keyboard 5 and Percent","L Ctrl"
"10","7","0","Ctrl+F5","Key Press","Keyboard F5","L Ctrl"
"10","8","0","Ctrl+Shift+S","Key Press","Keyboard S","L Ctrl+L Shift"
"10","9","0","Ctrl+9","Key Press","Keyboard 9 and Left Bracket","L Ctrl"
"10","10","0","Shift+F11","Key Press","Keyboard F11","L Shift"
"10","1","1","Ctrl+8","Key Press","Keyboard 8 and Star","L Ctrl"
"10","2","1","Win+\`","Key Press","Keyboard Grave Accent and Tilde","L GUI"
"10","3","1","Win+Ctrl+\`","Key Press","Keyboard Grave Accent and Tilde","L GUI+L Ctrl"
"10","5","1","Shift+Space","Key Press","Keyboard Spacebar","L Shift"
"10","7","1","F5","Key Press","Keyboard F5",""
"10","8","1","Ctrl+R","Key Press","Keyboard R","L Ctrl"
"10","9","1","Ctrl+Click","coach_ctrl_click","",""
"10","10","1","F10","Key Press","Keyboard F10",""
"10","12","1","Alt+=","Key Press","Keyboard Equals and Plus","L Alt"
"10","0","2","Ctrl+3","Key Press","Keyboard 3 and Hash","L Ctrl"
"10","2","2","Alt+Click","coach_alt_click","",""
"10","3","2","Shift+Click","coach_shift_click","",""
"10","4","2","Ctrl+O","Key Press","Keyboard O","L Ctrl"
"10","5","2","F7","Key Press","Keyboard F7",""
"10","8","2","Ctrl+.","Key Press","Keyboard Period and GreaterThan","L Ctrl"
"10","9","2","Ctrl+/","Key Press","Keyboard ForwardSlash and QuestionMark","L Ctrl"
"10","10","2","Ctrl+4","Key Press","Keyboard 4 and Dollar","L Ctrl"
"10","11","2","Ctrl+Space","Key Press","Keyboard Spacebar","L Ctrl"
"10","12","2","F9","Key Press","Keyboard F9",""
"10","1","3","Ctrl+Shift+L","Key Press","Keyboard L","L Ctrl+L Shift"
"10","2","3","Win+Shift+N","Key Press","Keyboard N","L GUI+L Shift"
"10","3","3","Shift+Delete","Key Press","Keyboard Delete","L Shift"
"10","7","3","L5","coach_l5_toggle","",""
"10","8","3","Scroll_L10","coach_current_scroll_hold","",""
"10","9","3","Ctrl+Shift++","Key Press","Keyboard Equals and Plus","L Ctrl+L Shift"
"10","10","3","Alt+Shift+D","Key Press","Keyboard D","L Alt+L Shift"
"10","11","3","Ctrl+B","Key Press","Keyboard B","L Ctrl"
"10","12","3","Ctrl+;","Key Press","Keyboard SemiColon and Colon","L Ctrl"
"10","7","5","L0","coach_base","",""
"2","0","0","Ctrl+B","Key Press","Keyboard B","L Ctrl"
"2","1","0","Alt+F","Key Press","Keyboard F","L Alt"
"2","2","0","Win+Home","Key Press","Keyboard Home","L GUI"
"2","3","0","Alt+F4","Key Press","Keyboard F4","L Alt"
"2","4","0","Ctrl+Shift+F5","Key Press","Keyboard F5","L Ctrl+L Shift"
"2","5","0","Ctrl+T","Key Press","Keyboard T","L Ctrl"
"2","7","0","Ctrl+W","Key Press","Keyboard W","L Ctrl"
"2","9","0","Alt+Up","Key Press","Keyboard UpArrow","L Alt"
"2","10","0","Shift+Alt+Left","Key Press","Keyboard LeftArrow","L Shift+L Alt"
"2","11","0","Shift+Alt+Right","Key Press","Keyboard RightArrow","L Shift+L Alt"
"2","12","0","Ctrl+Right","Key Press","Keyboard RightArrow","L Ctrl"
"2","0","1","Shift+Delete","Key Press","Keyboard Delete","L Shift"
"2","1","1","Ctrl+,","Key Press","Keyboard Comma and LessThan","L Ctrl"
"2","2","1","Win+I","Key Press","Keyboard I","L GUI"
"2","3","1","Win+A","Key Press","Keyboard A","L GUI"
"2","4","1","Win+M","Key Press","Keyboard M","L GUI"
"2","5","1","Ctrl+Shift+T","Key Press","Keyboard T","L Ctrl+L Shift"
"2","7","1","Ctrl+.","Key Press","Keyboard Period and GreaterThan","L Ctrl"
"2","8","1","Ctrl+Shift+9","Key Press","Keyboard 9 and Left Bracket","L Ctrl+L Shift"
"2","9","1","Alt+Down","Key Press","Keyboard DownArrow","L Alt"
"2","10","1","Ctrl+Shift+Home","Key Press","Keyboard Home","L Ctrl+L Shift"
"2","11","1","Ctrl+Shift+End","Key Press","Keyboard End","L Ctrl+L Shift"
"2","12","1","Win+Shift+N","Key Press","Keyboard N","L GUI+L Shift"
"2","1","2","<","Key Press","Keyboard Non-US Backslash and Pipe",""
"2","2","2","@","Key Press","Keyboard 2 and At","R Alt"
"2","3","2","=","Key Press","Keyboard 0 and Right Bracket","R Alt"
"2","4","2","+","Key Press","Keyboard Dash and Underscore",""
"2","5","2","?","Key Press","Keyboard Dash and Underscore","L Shift"
"2","7","2","F1","Key Press","Keyboard F1",""
"2","8","2","Alt+Shift+D","Key Press","Keyboard D","L Alt+L Shift"
"2","9","2","Page Up","Key Press","Keyboard PageUp",""
"2","10","2","Shift+Click","coach_shift_click","",""
"2","11","2","Ctrl+Shift+;","Key Press","Keyboard SemiColon and Colon","L Ctrl+L Shift"
"2","12","2","Ctrl+O","Key Press","Keyboard O","L Ctrl"
"2","1","3","Ctrl+Shift+L","Key Press","Keyboard L","L Ctrl+L Shift"
"2","2","3","Win+Pause","Key Press","Keyboard Pause","L GUI"
"2","3","3","Win+B","Key Press","Keyboard B","L GUI"
"2","4","3","F7","Key Press","Keyboard F7",""
"2","7","3","L9","coach_l9_hold","",""
"2","8","3","L1","coach_l1_toggle","",""
"2","9","3","Page Down","Key Press","Keyboard PageDown",""
"2","11","3","Ctrl+/","Key Press","Keyboard ForwardSlash and QuestionMark","L Ctrl"
"2","5","5","L0","coach_base","",""
"8","0","0","Ctrl+M","Key Press","Keyboard M","L Ctrl"
"8","1","0","Ctrl+Shift+B","Key Press","Keyboard B","L Ctrl+L Shift"
"8","2","0","Ctrl+D","Key Press","Keyboard D","L Ctrl"
"8","4","0","L8","coach_l8_lock","",""
"8","5","0","Ctrl+C","Key Press","Keyboard C","L Ctrl"
"8","7","0","Ctrl+U","Key Press","Keyboard U","L Ctrl"
"8","8","0","Ctrl+Shift+\\","Key Press","Keyboard Backslash and Pipe","L Ctrl+L Shift"
"8","9","0","Ctrl+\\","Key Press","Keyboard Backslash and Pipe","L Ctrl"
"8","10","0","Ctrl+Shift+\`","Key Press","Keyboard Grave Accent and Tilde","L Ctrl+L Shift"
"8","0","1","Ctrl+Shift+O","Key Press","Keyboard O","L Ctrl+L Shift"
"8","1","1","Shift+Delete","Key Press","Keyboard Delete","L Shift"
"8","2","1","Win+N","Key Press","Keyboard N","L GUI"
"8","3","1","Ctrl+O","Key Press","Keyboard O","L Ctrl"
"8","4","1","Ctrl+B","Key Press","Keyboard B","L Ctrl"
"8","7","1","Ctrl+Shift+L","Key Press","Keyboard L","L Ctrl+L Shift"
"8","8","1","Shift+Alt+A","Key Press","Keyboard A","L Shift+L Alt"
"8","9","1","Alt+F12","Key Press","Keyboard F12","L Alt"
"8","10","1","Ctrl+Shift+Left","Key Press","Keyboard LeftArrow","L Ctrl+L Shift"
"8","11","1","Ctrl+Shift+Right","Key Press","Keyboard RightArrow","L Ctrl+L Shift"
"8","12","1","Ctrl+Shift+$","Key Press","Keyboard 4 and Dollar","L Ctrl+L Shift"
"8","1","2","Ctrl+\`","Key Press","Keyboard Grave Accent and Tilde","L Ctrl"
"8","2","2","AltGr+2","Key Press","Keyboard 2 and At","R Alt"
"8","3","2","Ctrl+.","Key Press","Keyboard Period and GreaterThan","L Ctrl"
"8","4","2","Ctrl+Shift+9","Key Press","Keyboard 9 and Left Bracket","L Ctrl+L Shift"
"8","7","2","Ctrl+0","Key Press","Keyboard 0 and Right Bracket","L Ctrl"
"8","8","2","Ctrl+/","Key Press","Keyboard ForwardSlash and QuestionMark","L Ctrl"
"8","10","2","Shift+Space","Key Press","Keyboard Spacebar","L Shift"
"8","11","2","Ctrl+Shift+%","Key Press","Keyboard 5 and Percent","L Ctrl+L Shift"
"8","12","2","Ctrl+Shift+!","Key Press","Keyboard 1 and Bang","L Ctrl+L Shift"
"8","1","3","Alt+Shift+D","Key Press","Keyboard D","L Alt+L Shift"
"8","2","3","Shift+Click","coach_shift_click","",""
"8","3","3","Ctrl+Shift++","Key Press","Keyboard Equals and Plus","L Ctrl+L Shift"
"8","7","3","L10","coach_l10_toggle","",""
"8","8","3","Win+Shift+N","Key Press","Keyboard N","L GUI+L Shift"
"8","10","3","F7","Key Press","Keyboard F7",""
"8","12","3","Ctrl+Shift+~","Key Press","Keyboard Grave Accent and Tilde","L Ctrl+L Shift"
"8","5","5","L0","coach_base","",""
"7","0","0","BT 0","Bluetooth","BT_SEL 0",""
"7","1","0","BT 1","Bluetooth","BT_SEL 1",""
"7","2","0","BT 2","Bluetooth","BT_SEL 2",""
"7","3","0","BT 3","Bluetooth","BT_SEL 3",""
"7","4","0","BT 4","Bluetooth","BT_SEL 4",""
"7","5","0","BT 5","Bluetooth","BT_SEL 5",""
"7","7","0","BT Clear","Bluetooth","BT_CLEAR",""
"7","8","0","BT Prev","Bluetooth","BT_PREV",""
"7","9","0","BT Next","Bluetooth","BT_NEXT",""
"7","12","0","Bootloader","Bootloader","",""
"7","1","1","9 PU","Key Press","Keypad 9 and PageUp",""
"7","2","1","↑","Key Press","Keyboard UpArrow",""
"7","3","1","3 PD","Key Press","Keypad 3 and PageDn",""
"7","9","1","3 PD","Key Press","Keypad 3 and PageDn",""
"7","10","1","↑","Key Press","Keyboard UpArrow",""
"7","11","1","9 PU","Key Press","Keypad 9 and PageUp",""
"7","1","2","←","Key Press","Keyboard LeftArrow",""
"7","2","2","↓","Key Press","Keyboard DownArrow",""
"7","3","2","→","Key Press","Keyboard RightArrow",""
"7","4","2","Z","Key Press","Keyboard Z",""
"7","8","2","Z","Key Press","Keyboard Z",""
"7","9","2","←","Key Press","Keyboard LeftArrow",""
"7","10","2","↓","Key Press","Keyboard DownArrow",""
"7","11","2","→","Key Press","Keyboard RightArrow",""
"7","1","3","X","Key Press","Keyboard X",""
"7","2","3","C","Key Press","Keyboard C",""
"7","3","3","Shft","Key Press","Keyboard LeftShift",""
"7","4","3","Esc","Key Press","Keyboard Escape",""
"7","8","3","Esc","Key Press","Keyboard Escape",""
"7","9","3","Shft","Key Press","Keyboard LeftShift",""
"7","10","3","C","Key Press","Keyboard C",""
"7","11","3","X","Key Press","Keyboard X",""
"7","3","4","Exit Base","coach_base","",""
"7","4","4","␣","Key Press","Keyboard Spacebar",""
"7","5","4","Exit Base","coach_base","",""
"7","7","4","Exit Base","coach_base","",""
"7","8","4","Toggle L7","coach_l7_lock","",""
"7","4","5","Click","Mouse Key Press","MB1",""
"7","5","5","Right Click","Mouse Key Press","MB2",""
"7","7","5","Ret","Key Press","Keyboard Return Enter",""
"9","0","0","Ctrl+N","Key Press","Keyboard N","L Ctrl"
"9","1","0","Ctrl+Shift+N","Key Press","Keyboard N","L Ctrl+L Shift"
"9","2","0","Ctrl+/","Key Press","Keyboard ForwardSlash and QuestionMark","L Ctrl"
"9","5","0","Ctrl+O","Key Press","Keyboard O","L Ctrl"
"9","7","0","Ctrl+Shift+Tab","Key Press","Keyboard Tab","L Ctrl+L Shift"
"9","8","0","Ctrl+Tab","Key Press","Keyboard Tab","L Ctrl"
"9","9","0","Alt+Shift+Up","Key Press","Keyboard UpArrow","L Alt+L Shift"
"9","10","0","Ctrl+[","Key Press","Keyboard Left Brace","L Ctrl"
"9","11","0","Ctrl+]","Key Press","Keyboard Right Brace","L Ctrl"
"9","12","0","Ctrl+F","Key Press","Keyboard F","L Ctrl"
"9","0","1","Ctrl+Shift+P","Key Press","Keyboard P","L Ctrl+L Shift"
"9","1","1","Win+P","Key Press","Keyboard P","L GUI"
"9","2","1","Win+Ctrl+Left","Key Press","Keyboard LeftArrow","L GUI+L Ctrl"
"9","3","1","Win+Ctrl+Right","Key Press","Keyboard RightArrow","L GUI+L Ctrl"
"9","4","1","Win+Shift+Q","Key Press","Keyboard Q","L GUI+L Shift"
"9","7","1","Shift+Space","Key Press","Keyboard Spacebar","L Shift"
"9","8","1","UpArrow","Key Press","Keyboard UpArrow",""
"9","9","1","Alt+Shift+Down","Key Press","Keyboard DownArrow","L Alt+L Shift"
"9","10","1","Ctrl+Home","Key Press","Keyboard Home","L Ctrl"
"9","11","1","Ctrl+End","Key Press","Keyboard End","L Ctrl"
"9","12","1","Ctrl+;","Key Press","Keyboard SemiColon and Colon","L Ctrl"
"9","2","2","Win+Shift+N","Key Press","Keyboard N","L GUI+L Shift"
"9","3","2","Ctrl+Shift+K","Key Press","Keyboard K","L Ctrl+L Shift"
"9","4","2","Ctrl+Shift+D","Key Press","Keyboard D","L Ctrl+L Shift"
"9","5","2","F7","Key Press","Keyboard F7",""
"9","7","2","LeftArrow","Key Press","Keyboard LeftArrow",""
"9","8","2","RightArrow","Key Press","Keyboard RightArrow",""
"9","10","2","Alt+Shift+D","Key Press","Keyboard D","L Alt+L Shift"
"9","11","2","Ctrl+\`","Key Press","Keyboard Grave Accent and Tilde","L Ctrl"
"9","1","3","Alt+Click","coach_alt_click","",""
"9","3","3","Ctrl+Enter","Key Press","Keyboard Return Enter","L Ctrl"
"9","4","3","Ctrl+.","Key Press","Keyboard Period and GreaterThan","L Ctrl"
"9","7","3","L9","coach_l9_lock","",""
"9","8","3","L6","coach_l6_toggle","",""
"9","9","3","Ctrl+B","Key Press","Keyboard B","L Ctrl"
"9","10","3","Shift+Delete","Key Press","Keyboard Delete","L Shift"
"9","11","3","Shift+Click","coach_shift_click","",""
"9","7","5","L0","coach_base","",""
"4","0","0","Alt+Click","coach_alt_click","",""
"4","2","0","Ctrl+Shift+Esc","Key Press","Keyboard Escape","L Ctrl+L Shift"
"4","3","0","Win+X","Key Press","Keyboard X","L GUI"
"4","4","0","Ctrl+Shift+J","Key Press","Keyboard J","L Ctrl+L Shift"
"4","5","0","Ctrl+F","Key Press","Keyboard F","L Ctrl"
"4","7","0","F3","Key Press","Keyboard F3",""
"4","8","0","Ctrl+I","Key Press","Keyboard I","L Ctrl"
"4","9","0","\`","Key Press","Keyboard Grave Accent and Tilde",""
"4","12","0","Ctrl+J","Key Press","Keyboard J","L Ctrl"
"4","2","1","Win+R","Key Press","Keyboard R","L GUI"
"4","3","1","Win+S","launcher_win_search","",""
"4","4","1","Ctrl+Shift+C","Key Press","Keyboard C","L Ctrl+L Shift"
"4","7","1","F12","Key Press","Keyboard F12",""
"4","8","1","Ctrl+O","Key Press","Keyboard O","L Ctrl"
"4","9","1","]","Key Press","Keyboard Right Brace",""
"4","10","1","Alt+Shift+D","Key Press","Keyboard D","L Alt+L Shift"
"4","11","1","Ctrl+Shift++","Key Press","Keyboard Equals and Plus","L Ctrl+L Shift"
"4","0","2","Ctrl+/","Key Press","Keyboard ForwardSlash and QuestionMark","L Ctrl"
"4","1","2","Win+1","Key Press","Keyboard 1 and Bang","L GUI"
"4","2","2","Win+2","Key Press","Keyboard 2 and At","L GUI"
"4","3","2","Win+3","Key Press","Keyboard 3 and Hash","L GUI"
"4","4","2","Win+4","Key Press","Keyboard 4 and Dollar","L GUI"
"4","5","2","Win+5","Key Press","Keyboard 5 and Percent","L GUI"
"4","7","2","Ctrl+Shift+I","Key Press","Keyboard I","L Ctrl+L Shift"
"4","8","2","Ctrl+Shift+G","Key Press","Keyboard G","L Ctrl+L Shift"
"4","9","2","Shift+Click","coach_shift_click","",""
"4","10","2","Ctrl+.","Key Press","Keyboard Period and GreaterThan","L Ctrl"
"4","11","2","Ctrl+H","Key Press","Keyboard H","L Ctrl"
"4","12","2","Ctrl+Shift+E","Key Press","Keyboard E","L Ctrl+L Shift"
"4","0","3","Shift+Delete","Key Press","Keyboard Delete","L Shift"
"4","1","3","Ctrl+B","Key Press","Keyboard B","L Ctrl"
"4","2","3","Win+Shift+N","Key Press","Keyboard N","L GUI+L Shift"
"4","3","3","Ctrl+Shift+Q","Key Press","Keyboard Q","L Ctrl+L Shift"
"4","5","3","Ctrl+Shift+X","Key Press","Keyboard X","L Ctrl+L Shift"
"4","7","3","L7","coach_l7_toggle","",""
"4","8","3","L8","coach_l8_toggle","",""
"4","12","3","F7","Key Press","Keyboard F7",""
"4","7","4","L10","coach_l10_hold","",""
"4","8","4","L4","coach_l4_hold","",""
"4","4","5","L0","coach_base","",""
"4","7","5","L2","coach_l2_hold","",""
"3","0","0","Ctrl+1","Key Press","Keyboard 1 and Bang","L Ctrl"
"3","1","0","Ctrl+2","Key Press","Keyboard 2 and At","L Ctrl"
"3","2","0","Ctrl+3","Key Press","Keyboard 3 and Hash","L Ctrl"
"3","4","0","Alt+Tab","Key Press","Keyboard Tab","L Alt"
"3","5","0","Shift+Enter","Key Press","Keyboard Return Enter","L Shift"
"3","7","0","Ctrl+Z","Key Press","Keyboard Z","L Ctrl"
"3","8","0","Ctrl+Y","Key Press","Keyboard Y","L Ctrl"
"3","9","0","Ctrl+Shift+Z","Key Press","Keyboard Z","L Ctrl+L Shift"
"3","10","0","Alt+D","Key Press","Keyboard D","L Alt"
"3","12","0","Ctrl+A","Key Press","Keyboard A","L Ctrl"
"3","0","1","Ctrl+4","Key Press","Keyboard 4 and Dollar","L Ctrl"
"3","1","1","Ctrl+5","Key Press","Keyboard 5 and Percent","L Ctrl"
"3","2","1","Ctrl+6","Key Press","Keyboard 6 and Caret","L Ctrl"
"3","4","1","Win+Shift+V","Key Press","Keyboard V","L GUI+L Shift"
"3","7","1","Ctrl+F6","Key Press","Keyboard F6","L Ctrl"
"3","8","1","Ctrl+Shift+F6","Key Press","Keyboard F6","L Ctrl+L Shift"
"3","9","1","Alt+Click","coach_alt_click","",""
"3","10","1","Ctrl+Up","Key Press","Keyboard UpArrow","L Ctrl"
"3","11","1","Ctrl+Shift+Up","Key Press","Keyboard UpArrow","L Ctrl+L Shift"
"3","0","2","Ctrl+7","Key Press","Keyboard 7 and Ampersand","L Ctrl"
"3","1","2","Ctrl+8","Key Press","Keyboard 8 and Star","L Ctrl"
"3","2","2","Ctrl+9","Key Press","Keyboard 9 and Left Bracket","L Ctrl"
"3","3","2","Win+Shift+N","Key Press","Keyboard N","L GUI+L Shift"
"3","4","2","Ctrl+Shift+V","Key Press","Keyboard V","L Ctrl+L Shift"
"3","8","2","Ctrl+K","Key Press","Keyboard K","L Ctrl"
"3","9","2","Ctrl+L","Key Press","Keyboard L","L Ctrl"
"3","10","2","Ctrl+Down","Key Press","Keyboard DownArrow","L Ctrl"
"3","11","2","Ctrl+Shift+Down","Key Press","Keyboard DownArrow","L Ctrl+L Shift"
"3","12","2","Ctrl+Shift+6","Key Press","Keyboard 6 and Caret","L Ctrl+L Shift"
"3","2","3","F7","Key Press","Keyboard F7",""
"3","3","3","Ctrl+O","Key Press","Keyboard O","L Ctrl"
"3","4","3","Ctrl+Shift+A","Key Press","Keyboard A","L Ctrl+L Shift"
"3","5","3","Ctrl+B","Key Press","Keyboard B","L Ctrl"
"3","7","3","L3","coach_l3_lock","",""
"3","8","3","Alt+Enter","Key Press","Keyboard Return Enter","L Alt"
"3","9","3","Alt+Shift+D","Key Press","Keyboard D","L Alt+L Shift"
"3","10","3","Shift+Click","coach_shift_click","",""
"3","11","3","Shift+Delete","Key Press","Keyboard Delete","L Shift"
"3","12","3","Alt+P","Key Press","Keyboard P","L Alt"
"3","3","4","RightAlt","Key Press","Keyboard RightAlt",""
"3","4","4","L9","coach_l9_hold","",""
"3","5","4","L4","coach_l4_hold","",""
"3","7","4","L0","coach_base","",""
"3","4","5","L2","coach_l2_hold","",""
"3","5","5","L5","coach_l5_hold","",""`;

function parseExpected() {
  const lines = EXPECTED_CSV.trim().split('\n');
  function parseCsvLine(line) {
    const values = [];
    let value = "";
    let quoted = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      const next = line[i + 1];
      if (ch === '"') {
        if (quoted && next === '"') {
          value += '"';
          i++;
        } else {
          quoted = !quoted;
        }
      } else if (ch === "," && !quoted) {
        values.push(value.trim());
        value = "";
      } else {
        value += ch;
      }
    }
    values.push(value.trim());
    return values;
  }

  const headers = parseCsvLine(lines[0]).map(h => h.trim());
  const out = [];
  for (let i = 1; i < lines.length; i++) {
    const parts = parseCsvLine(lines[i]);
    const obj = {};
    for (let j = 0; j < headers.length; j++) obj[headers[j]] = parts[j] || '';
    out.push(obj);
  }
  return out;
}

// A scroll-hold position ("coach_lN_scroll_hold" expected) that's still just
// plain "Momentary Layer" / "Layer::11" is the old, pre-fix behavior: scroll
// mode alone, with no target layer combined in, so it silently falls through
// to whatever layer was already active instead of exposing layer N's
// bindings. That's a distinct, known regression - flag it separately from a
// generic mismatch so it reads as "still the bad old scroll" not just "wrong".
function isScrollHoldExpectation(behavior) {
  return /^coach_l\d+_scroll_hold$/i.test(clean(behavior));
}

function isOldPlainScrollBehavior(actual) {
  return clean(actual.behavior) === "Momentary Layer" && normalizeParameter(actual.parameter) === "11";
}

async function runVerify() {
  const expected = parseExpected().filter((exp) => Number(exp.layer) !== 7);
  let pass = 0, fail = 0, errors = [];
  let scrollHoldOk = 0, scrollHoldRegressed = 0, scrollHoldOtherFail = 0;
  let currentLayer = null;
  for (const exp of expected) {
    const layer = parseInt(exp.layer);
    const x = parseInt(exp.x);
    const y = parseInt(exp.y);

    if (currentLayer !== layer) {
      const switched = await selectLayer(layer);
      if (!switched) {
        fail++;
        errors.push({layer, x, y, expected: exp, error: `could not switch to layer ${layer}; selected=${selectedLayer()}`});
        continue;
      }
      currentLayer = layer;
      console.log(`Verifying layer ${layer}...`);
    }

    const found = await selectKey(x, y);
    if (!found) {
      fail++;
      errors.push({layer, x, y, expected: exp, error: 'key not found'});
      continue;
    }

    const actual = readCurrent();
    const bMatch = clean(actual.behavior).toLowerCase() === clean(exp.behavior).toLowerCase();
    const pMatch = normalizeParameter(actual.parameter) === normalizeParameter(exp.parameter);
    const mMatch = normalizeModifiers(actual.modifiers) === normalizeModifiers(exp.modifiers);
    const expectsScrollHold = isScrollHoldExpectation(exp.behavior);

    if (bMatch && pMatch && mMatch) {
      pass++;
      if (expectsScrollHold) scrollHoldOk++;
    } else {
      fail++;
      const issues = [];
      if (!bMatch) issues.push(`behavior expected "${exp.behavior}" got "${actual.behavior}"`);
      if (!pMatch) issues.push(`parameter expected "${exp.parameter}" got "${actual.parameter}"`);
      if (!mMatch) issues.push(`modifiers expected "${exp.modifiers}" got "${actual.modifiers.join('+')}"`);

      let scrollRegression = false;
      if (expectsScrollHold && !bMatch && isOldPlainScrollBehavior(actual)) {
        scrollRegression = true;
        scrollHoldRegressed++;
        issues.push(`OLD SCROLL (bad, pre-fix): still plain "Momentary Layer" / Layer::11 - scroll mode only, target layer not exposed. Needs reflashed firmware + reapply.`);
      } else if (expectsScrollHold) {
        scrollHoldOtherFail++;
      }

      errors.push({layer, x, y, expected: exp, actual, issues, scrollRegression});
      console.warn(`FAIL L${layer} x${x} y${y} ${exp.label || ""}${scrollRegression ? " [OLD SCROLL]" : ""}: ${issues.join("; ")}`);
    }
  }
  console.log('Verify result: ' + pass + ' pass, ' + fail + ' fail (' + (pass/(pass+fail)*100).toFixed(1) + '%)');
  const scrollHoldTotal = scrollHoldOk + scrollHoldRegressed + scrollHoldOtherFail;
  if (scrollHoldTotal) {
    console.log(
      `Scroll-hold keys: ${scrollHoldOk}/${scrollHoldTotal} real per-layer coach_lN_scroll_hold, `
      + `${scrollHoldRegressed} still old plain scroll-mode-only (Momentary Layer/L11), `
      + `${scrollHoldOtherFail} other mismatch.`
    );
    if (scrollHoldRegressed) {
      console.warn(`${scrollHoldRegressed} scroll-hold key(s) are still the OLD pre-fix behavior - flash the updated firmware (coach_lN_scroll_hold macros) and reapply before trusting scroll layer access.`);
    }
  }
  window._CHARYBDIS_VERIFY_RESULT = {pass, fail, errors, scrollHoldOk, scrollHoldRegressed, scrollHoldOtherFail};
  if (errors.length) {
    console.table(errors.slice(0, 50).map((err) => ({
      pos: `L${err.layer} x${err.x} y${err.y}`,
      label: err.expected?.label || "",
      issues: (err.scrollRegression ? "[OLD SCROLL] " : "") + (err.issues?.join("; ") || err.error || "")
    })));
    console.warn(`Stored full error list in window._CHARYBDIS_VERIFY_RESULT.errors (${errors.length} entries).`);
  }
}

runVerify();
