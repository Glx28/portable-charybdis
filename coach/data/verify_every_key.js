// ZMK Studio verify script for evolved V2 layout
window.CHARYBDIS_VERSION = "evolved-v2";

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
"0","0","0","Esc","Key Press","Escape",""
"0","1","0","1","Key Press","1 and Bang",""
"0","2","0","2","Key Press","2 and At",""
"0","3","0","3","Key Press","3 and Hash",""
"0","4","0","4","Key Press","4 and Dollar",""
"0","5","0","5","Key Press","5 and Percent",""
"0","7","0","6","Key Press","6 and Caret",""
"0","8","0","7","Key Press","7 and Ampersand",""
"0","9","0","8","Key Press","8 and Star",""
"0","10","0","9","Key Press","9 and Left Bracket",""
"0","11","0","0","Key Press","0 and Right Bracket",""
"0","12","0","BkSp","Key Press","Delete",""
"0","0","1","Tab","Key Press","Tab",""
"0","1","1","Q","Key Press","Q",""
"0","2","1","W","Key Press","W",""
"0","3","1","E","Key Press","E",""
"0","4","1","R","Key Press","R",""
"0","5","1","T","Key Press","T",""
"0","7","1","Y","Key Press","Y",""
"0","8","1","U","Key Press","U",""
"0","9","1","I","Key Press","I",""
"0","10","1","O","Key Press","O",""
"0","11","1","P","Key Press","P",""
"0","12","1","å","Key Press","Left Brace",""
"0","0","2","Shft","Key Press","LeftShift",""
"0","1","2","A","Key Press","A",""
"0","2","2","S","Key Press","S",""
"0","3","2","D","Key Press","D",""
"0","4","2","F","Key Press","F",""
"0","5","2","G","Key Press","G",""
"0","7","2","H","Key Press","H",""
"0","8","2","J","Key Press","J",""
"0","9","2","K","Key Press","K",""
"0","10","2","L","Key Press","L",""
"0","11","2","ø","Key Press","SemiColon and Colon",""
"0","12","2","æ","Key Press","Left Apos and Double",""
"0","0","3","Ctrl","Key Press","LeftControl",""
"0","1","3","Z","Key Press","Z",""
"0","2","3","X","Key Press","X",""
"0","3","3","C","Key Press","C",""
"0","4","3","V","Key Press","V",""
"0","5","3","B","Key Press","B",""
"0","7","3","N","Key Press","N",""
"0","8","3","M","Key Press","M",""
"0","9","3",",","Key Press","Comma and LessThan",""
"0","10","3",".","Key Press","Period and GreaterThan",""
"0","11","3","/","Key Press","ForwardSlash and QuestionMark",""
"0","12","3","\\","Key Press","Backslash and Pipe",""
"0","3","4","L1","coach_l1_hold","",""
"0","4","4","␣","Key Press","Spacebar",""
"0","5","4","L9","coach_l9_hold","",""
"0","7","4","L7","coach_l7_hold","",""
"0","8","4","L10","coach_l10_hold","",""
"0","4","5","LeftAlt","Key Press","LeftAlt",""
"0","5","5","L3","coach_l3_hold","",""
"0","7","5","Ret","Key Press","Return Enter",""
"1","0","0","Win+R","Key Press","R","L GUI"
"1","1","0","Ctrl+Shift+N","Key Press","N","L Ctrl+L Shift"
"1","2","0","Win+S","launcher_win_search","",""
"1","3","0","Ctrl+Z","Key Press","Z","L Ctrl"
"1","4","0","Ctrl+Y","Key Press","Y","L Ctrl"
"1","5","0","Ctrl+Shift+Z","Key Press","Z","L Ctrl+L Shift"
"1","7","0","Ctrl+Shift+P","Key Press","P","L Ctrl+L Shift"
"1","8","0","MB4","Mouse Key Press","MB4",""
"1","9","0","MB5","Mouse Key Press","MB5",""
"1","10","0","Ctrl+K","Key Press","K","L Ctrl"
"1","11","0","Shift+Tab","Key Press","Tab","L Shift"
"1","12","0","Alt+Space","launcher_powertoys","",""
"1","0","1","Alt+Shift+D","Key Press","D","L Alt+L Shift"
"1","1","1","Win+Tab","Key Press","Tab","L GUI"
"1","2","1","Ctrl+-","Key Press","Dash and Underscore","L Ctrl"
"1","3","1","Ctrl++","Key Press","Equals and Plus","L Ctrl"
"1","4","1","Ctrl+F","Key Press","F","L Ctrl"
"1","5","1","L1","coach_l1_lock","",""
"1","7","1","Ctrl+.","Key Press","Period and GreaterThan","L Ctrl"
"1","8","1","Ctrl+Shift+F5","Key Press","F5","L Ctrl+L Shift"
"1","9","1","Ctrl+A","Key Press","A","L Ctrl"
"1","10","1","Win+Left","Key Press","LeftArrow","L GUI"
"1","11","1","Win+Right","Key Press","RightArrow","L GUI"
"1","12","1","Alt+D","Key Press","D","L Alt"
"1","0","2","Ctrl+Q","Key Press","Q","L Ctrl"
"1","1","2","Win+Shift+Left","Key Press","LeftArrow","L GUI+L Shift"
"1","2","2","Win+Shift+Right","Key Press","RightArrow","L GUI+L Shift"
"1","3","2","Win+Shift+S","Key Press","S","L GUI+L Shift"
"1","4","2","Ctrl+S","Key Press","S","L Ctrl"
"1","5","2","Ctrl+N","Key Press","N","L Ctrl"
"1","7","2","F2","Key Press","F2",""
"1","8","2","MB1","Mouse Key Press","MB1",""
"1","9","2","MB2","Mouse Key Press","MB2",""
"1","10","2","Scroll_L1","coach_current_scroll_hold","",""
"1","11","2","Win+Alt+Space","Key Press","Spacebar","L GUI+L Alt"
"1","12","2","Ctrl+Alt+Win+F11","Key Press","F11","L Ctrl+L Alt+L GUI"
"1","0","3","Shift+Click","coach_shift_click","",""
"1","1","3","Ctrl+X","Key Press","X","L Ctrl"
"1","2","3","Ctrl+C","Key Press","C","L Ctrl"
"1","3","3","Ctrl+V","Key Press","V","L Ctrl"
"1","4","3","Shift+Enter","Key Press","Return Enter","L Shift"
"1","5","3","Win+K","Key Press","K","L GUI"
"1","7","3","Shift+Alt+Left","Key Press","LeftArrow","L Shift+L Alt"
"1","8","3","Shift+Alt+Right","Key Press","RightArrow","L Shift+L Alt"
"1","9","3","Ctrl+Right","Key Press","RightArrow","L Ctrl"
"1","10","3","Ctrl+L","Key Press","L","L Ctrl"
"1","11","3","Ctrl+W","Key Press","W","L Ctrl"
"1","12","3","MB3","Mouse Key Press","MB3",""
"1","7","4","Ctrl+P","Key Press","P","L Ctrl"
"1","8","4","Alt+Tab","Key Press","Tab","L Alt"
"1","5","5","L0","coach_base","",""
"1","7","5","L7","coach_l7_hold","",""
"2","0","0","Alt+F","Key Press","F","L Alt"
"2","1","0","Ctrl+,","Key Press","Comma and LessThan","L Ctrl"
"2","2","0","Win+A","Key Press","A","L GUI"
"2","3","0","Ctrl+Shift+2","Key Press","2 and At","L Ctrl+L Shift"
"2","4","0","Ctrl+Shift+1","Key Press","1 and Bang","L Ctrl+L Shift"
"2","5","0","L1","coach_l1_toggle","",""
"2","11","0","L8","coach_l8_hold","",""
"2","12","0","Ctrl+/","Key Press","ForwardSlash and QuestionMark","L Ctrl"
"2","0","1","Win+I","Key Press","I","L GUI"
"2","2","1","L7","coach_l7_toggle","",""
"2","4","1","Ctrl+Shift+E","Key Press","E","L Ctrl+L Shift"
"2","7","1","L5","coach_l5_toggle","",""
"2","8","1","L8","coach_l8_toggle","",""
"2","9","1","Ctrl+Shift+U","Key Press","U","L Ctrl+L Shift"
"2","10","1","Ctrl+3","Key Press","3 and Hash","L Ctrl"
"2","11","1","L3","coach_l3_toggle","",""
"2","12","1","L6","coach_l6_toggle","",""
"2","0","2","L10","coach_l10_toggle","",""
"2","3","2","Ctrl+J","Key Press","J","L Ctrl"
"2","4","2","Ctrl+H","Key Press","H","L Ctrl"
"2","5","2","L5","coach_l5_hold","",""
"2","7","2","Ctrl+Shift+Enter","Key Press","Return Enter","L Ctrl+L Shift"
"2","8","2","Ctrl+4","Key Press","4 and Dollar","L Ctrl"
"2","9","2","Ctrl+5","Key Press","5 and Percent","L Ctrl"
"2","10","2","Scroll_L2","coach_current_scroll_hold","",""
"2","12","2","L4","coach_l4_hold","",""
"2","1","3","Ctrl+Shift+9","Key Press","9 and Left Bracket","L Ctrl+L Shift"
"2","2","3","L9","coach_l9_toggle","",""
"2","3","3","F1","Key Press","F1",""
"2","4","3","L2","coach_l2_lock","",""
"2","7","3","Shift+Delete","Key Press","Delete","L Shift"
"2","8","3","Ctrl+7","Key Press","7 and Ampersand","L Ctrl"
"2","9","3","Ctrl+8","Key Press","8 and Star","L Ctrl"
"2","10","3","Ctrl+9","Key Press","9 and Left Bracket","L Ctrl"
"2","11","3","L4","coach_l4_toggle","",""
"2","12","3","Win+K","Key Press","K","L GUI"
"2","3","4","L7","coach_l7_hold","",""
"2","4","4","L6","coach_l6_hold","",""
"2","5","4","L10","coach_l10_hold","",""
"2","4","5","L3","coach_l3_hold","",""
"2","5","5","L0","coach_base","",""
"3","0","0","Win+Shift+O","Key Press","O","L GUI+L Shift"
"3","1","0","Win+Shift+D","Key Press","D","L GUI+L Shift"
"3","2","0","F3","Key Press","F3",""
"3","3","0","Ctrl+Alt+Up","Key Press","UpArrow","L Ctrl+L Alt"
"3","4","0","Alt+Shift+D","Key Press","D","L Alt+L Shift"
"3","5","0","Win+Up","Key Press","UpArrow","L GUI"
"3","7","0","Ctrl+Shift+9","Key Press","9 and Left Bracket","L Ctrl+L Shift"
"3","8","0","L9","coach_l9_toggle","",""
"3","9","0","AltGr+2","Key Press","2 and At","R Alt"
"3","10","0","Win+Ctrl+D","Key Press","D","L GUI+L Ctrl"
"3","11","0","L6","coach_l6_toggle","",""
"3","12","0","Ctrl+Up","Key Press","UpArrow","L Ctrl"
"3","0","1","Win+Shift+M","Key Press","M","L GUI+L Shift"
"3","1","1","Ctrl+Shift+G","Key Press","G","L Ctrl+L Shift"
"3","2","1","Ctrl+F","Key Press","F","L Ctrl"
"3","3","1","Ctrl+Alt+Down","Key Press","DownArrow","L Ctrl+L Alt"
"3","4","1","Win+M","Key Press","M","L GUI"
"3","5","1","Win+Down","Key Press","DownArrow","L GUI"
"3","7","1","Shift+F3","Key Press","F3","L Shift"
"3","8","1","Ctrl+G","Key Press","G","L Ctrl"
"3","9","1","Win+Ctrl+F4","Key Press","F4","L GUI+L Ctrl"
"3","10","1","Win+D","Key Press","D","L GUI"
"3","11","1","Ctrl+U","Key Press","U","L Ctrl"
"3","12","1","Ctrl+Down","Key Press","DownArrow","L Ctrl"
"3","0","2","Alt+Enter","Key Press","Return Enter","L Alt"
"3","1","2","F9","Key Press","F9",""
"3","2","2","Ctrl+Shift+Z","Key Press","Z","L Ctrl+L Shift"
"3","3","2","Win+Home","Key Press","Home","L GUI"
"3","4","2","Alt+F4","Key Press","F4","L Alt"
"3","5","2","F7","Key Press","F7",""
"3","7","2","Ctrl+A","Key Press","A","L Ctrl"
"3","8","2","RightArrow","Key Press","RightArrow",""
"3","9","2","LeftArrow","Key Press","LeftArrow",""
"3","10","2","Ctrl+.","Key Press","Period and GreaterThan","L Ctrl"
"3","11","2","Shift+Delete","Key Press","Delete","L Shift"
"3","12","2","Win+B","Key Press","B","L GUI"
"3","0","3","L1","coach_l1_toggle","",""
"3","1","3","Shift+Tab","Key Press","Tab","L Shift"
"3","2","3","Win+V","Key Press","V","L GUI"
"3","3","3","Ctrl+Shift+F6","Key Press","F6","L Ctrl+L Shift"
"3","4","3","Ctrl+Shift+Home","Key Press","Home","L Ctrl+L Shift"
"3","5","3","Ctrl+Shift+End","Key Press","End","L Ctrl+L Shift"
"3","7","3","Alt+Left","Key Press","LeftArrow","L Alt"
"3","8","3","Alt+Right","Key Press","RightArrow","L Alt"
"3","9","3","Ctrl+Left","Key Press","LeftArrow","L Ctrl"
"3","10","3","Ctrl+Right","Key Press","RightArrow","L Ctrl"
"3","11","3","Shift+Space","Key Press","Spacebar","L Shift"
"3","12","3","Shift+Click","coach_shift_click","",""
"3","4","4","L0","coach_base","",""
"3","7","4","L2","coach_l2_hold","",""
"3","8","4","L4","coach_l4_hold","",""
"3","7","5","L7","coach_l7_hold","",""
"4","5","0","Ctrl+/","Key Press","ForwardSlash and QuestionMark","L Ctrl"
"4","7","0","Alt+P","Key Press","P","L Alt"
"4","8","0","L3","coach_l3_toggle","",""
"4","9","0","L2","coach_l2_toggle","",""
"4","10","0","F1","Key Press","F1",""
"4","11","0","L5","coach_l5_toggle","",""
"4","12","0","L8","coach_l8_hold","",""
"4","0","1","L1","coach_l1_toggle","",""
"4","1","1","F7","Key Press","F7",""
"4","2","1","L6","coach_l6_toggle","",""
"4","3","1","L9","coach_l9_toggle","",""
"4","4","1","Shift+Delete","Key Press","Delete","L Shift"
"4","7","1","L4","coach_l4_lock","",""
"4","8","1","Ctrl+Shift+Enter","Key Press","Return Enter","L Ctrl+L Shift"
"4","12","1","Alt+Home","Key Press","Home","L Alt"
"4","0","2","L10","coach_l10_toggle","",""
"4","1","2","Alt+Shift+-","Key Press","Dash and Underscore","L Alt+L Shift"
"4","2","2","Alt+Shift++","Key Press","Equals and Plus","L Alt+L Shift"
"4","5","2","L7","coach_l7_toggle","",""
"4","8","2","L5","coach_l5_hold","",""
"4","9","2","Win+K","Key Press","K","L GUI"
"4","10","2","Scroll_L4","coach_current_scroll_hold","",""
"4","11","2","L8","coach_l8_toggle","",""
"4","1","3","Ctrl+Shift+U","Key Press","U","L Ctrl+L Shift"
"4","3","3","Ctrl+Shift+;","Key Press","SemiColon and Colon","L Ctrl+L Shift"
"4","7","3","Ctrl+Shift+6","Key Press","6 and Caret","L Ctrl+L Shift"
"4","12","3","Ctrl+Shift+9","Key Press","9 and Left Bracket","L Ctrl+L Shift"
"4","3","4","L7","coach_l7_hold","",""
"4","4","4","L6","coach_l6_hold","",""
"4","5","4","L9","coach_l9_hold","",""
"4","4","5","L3","coach_l3_hold","",""
"4","5","5","L10","coach_l10_hold","",""
"4","7","5","L0","coach_base","",""
"5","0","0","Ctrl+D","Key Press","D","L Ctrl"
"5","1","0","Ctrl+Shift+B","Key Press","B","L Ctrl+L Shift"
"5","2","0","F1","Key Press","F1",""
"5","5","0","Ctrl+M","Key Press","M","L Ctrl"
"5","7","0","Ctrl+Shift+>","Key Press","Non-US Backslash and Pipe","L Ctrl+L Shift"
"5","8","0","L6","coach_l6_toggle","",""
"5","9","0","L7","coach_l7_toggle","",""
"5","10","0","Ctrl+Shift+F5","Key Press","F5","L Ctrl+L Shift"
"5","11","0","Win+K","Key Press","K","L GUI"
"5","12","0","Ctrl+Shift+U","Key Press","U","L Ctrl+L Shift"
"5","0","1","Ctrl+Shift+O","Key Press","O","L Ctrl+L Shift"
"5","1","1","F7","Key Press","F7",""
"5","2","1","Ctrl+/","Key Press","ForwardSlash and QuestionMark","L Ctrl"
"5","3","1","Ctrl+U","Key Press","U","L Ctrl"
"5","4","1","Ctrl+Enter","Key Press","Return Enter","L Ctrl"
"5","5","1","L3","coach_l3_toggle","",""
"5","7","1","Ctrl+Shift+<","Key Press","Non-US Backslash and Pipe","L Ctrl+L Shift"
"5","9","1","Ctrl+Shift+$","Key Press","4 and Dollar","L Ctrl+L Shift"
"5","10","1","L2","coach_l2_toggle","",""
"5","11","1","L7","coach_l7_hold","",""
"5","12","1","L10","coach_l10_toggle","",""
"5","0","2","Win+P","Key Press","P","L GUI"
"5","1","2","Shift+Delete","Key Press","Delete","L Shift"
"5","2","2","Ctrl+Shift+9","Key Press","9 and Left Bracket","L Ctrl+L Shift"
"5","7","2","Win+;","Key Press","SemiColon and Colon","L GUI"
"5","9","2","Ctrl+Shift+Enter","Key Press","Return Enter","L Ctrl+L Shift"
"5","11","2","Ctrl+Shift+;","Key Press","SemiColon and Colon","L Ctrl+L Shift"
"5","12","2","L1","coach_l1_toggle","",""
"5","0","3","L9","coach_l9_toggle","",""
"5","1","3","Ctrl+Shift+M","Key Press","M","L Ctrl+L Shift"
"5","3","3","F11","Key Press","F11",""
"5","4","3","Win+.","Key Press","Period and GreaterThan","L GUI"
"5","5","3","L5","coach_l5_lock","",""
"5","7","3","Ctrl+Shift+!","Key Press","1 and Bang","L Ctrl+L Shift"
"5","8","3","Ctrl+Shift+%","Key Press","5 and Percent","L Ctrl+L Shift"
"5","9","3","Ctrl+Shift+~","Key Press","Grave Accent and Tilde","L Ctrl+L Shift"
"5","10","3","L4","coach_l4_toggle","",""
"5","11","3","L4","coach_l4_hold","",""
"5","12","3","L5","coach_l5_hold","",""
"5","4","4","L6","coach_l6_hold","",""
"5","5","4","L9","coach_l9_hold","",""
"5","7","4","L2","coach_l2_hold","",""
"5","8","4","L8","coach_l8_hold","",""
"5","4","5","L8","coach_l8_toggle","",""
"5","5","5","L0","coach_base","",""
"6","1","0","L4","coach_l4_hold","",""
"6","2","0","L3","coach_l3_toggle","",""
"6","3","0","L10","coach_l10_hold","",""
"6","4","0","L5","coach_l5_hold","",""
"6","5","0","Ctrl+/","Key Press","ForwardSlash and QuestionMark","L Ctrl"
"6","7","0","Shift+Delete","Key Press","Delete","L Shift"
"6","8","0","Ctrl+Shift+U","Key Press","U","L Ctrl+L Shift"
"6","9","0","L10","coach_l10_toggle","",""
"6","10","0","F1","Key Press","F1",""
"6","0","1","L9","coach_l9_toggle","",""
"6","8","1","L4","coach_l4_toggle","",""
"6","10","1","Ctrl+I","Key Press","I","L Ctrl"
"6","11","1","Ctrl+Shift+X","Key Press","X","L Ctrl+L Shift"
"6","12","1","L6","coach_l6_lock","",""
"6","1","2","L2","coach_l2_hold","",""
"6","4","2","Win+K","Key Press","K","L GUI"
"6","7","2","L7","coach_l7_hold","",""
"6","8","2","L8","coach_l8_hold","",""
"6","4","3","L8","coach_l8_toggle","",""
"6","5","3","Ctrl+Shift+9","Key Press","9 and Left Bracket","L Ctrl+L Shift"
"6","7","3","L1","coach_l1_toggle","",""
"6","10","3","L7","coach_l7_toggle","",""
"6","5","4","L0","coach_base","",""
"6","7","4","L5","coach_l5_toggle","",""
"6","7","5","L2","coach_l2_toggle","",""
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
"7","1","1","9 PU","Key Press","9 and PageUp",""
"7","2","1","↑","Key Press","UpArrow",""
"7","3","1","3 PD","Key Press","3 and PageDn",""
"7","9","1","3 PD","Key Press","3 and PageDn",""
"7","10","1","↑","Key Press","UpArrow",""
"7","11","1","9 PU","Key Press","9 and PageUp",""
"7","1","2","←","Key Press","LeftArrow",""
"7","2","2","↓","Key Press","DownArrow",""
"7","3","2","→","Key Press","RightArrow",""
"7","4","2","Z","Key Press","Z",""
"7","8","2","Z","Key Press","Z",""
"7","9","2","←","Key Press","LeftArrow",""
"7","10","2","↓","Key Press","DownArrow",""
"7","11","2","→","Key Press","RightArrow",""
"7","1","3","X","Key Press","X",""
"7","2","3","C","Key Press","C",""
"7","3","3","Shft","Key Press","LeftShift",""
"7","4","3","Esc","Key Press","Escape",""
"7","8","3","Esc","Key Press","Escape",""
"7","9","3","Shft","Key Press","LeftShift",""
"7","10","3","C","Key Press","C",""
"7","11","3","X","Key Press","X",""
"7","3","4","Exit Base","coach_base","",""
"7","4","4","␣","Key Press","Spacebar",""
"7","5","4","Exit Base","coach_base","",""
"7","7","4","Exit Base","coach_base","",""
"7","8","4","Toggle L7","coach_l7_lock","",""
"7","4","5","Click","Mouse Key Press","MB1",""
"7","5","5","Right Click","Mouse Key Press","MB2",""
"7","7","5","Ret","Key Press","Return Enter",""
"8","0","0","Ctrl+1","Key Press","1 and Bang","L Ctrl"
"8","1","0","Ctrl+2","Key Press","2 and At","L Ctrl"
"8","2","0","Ctrl+3","Key Press","3 and Hash","L Ctrl"
"8","3","0","L4","coach_l4_hold","",""
"8","8","0","Shift+Delete","Key Press","Delete","L Shift"
"8","9","0","L6","coach_l6_toggle","",""
"8","10","0","L9","coach_l9_toggle","",""
"8","0","1","Ctrl+4","Key Press","4 and Dollar","L Ctrl"
"8","1","1","Ctrl+5","Key Press","5 and Percent","L Ctrl"
"8","2","1","Ctrl+6","Key Press","6 and Caret","L Ctrl"
"8","4","1","Win+Shift+Q","Key Press","Q","L GUI+L Shift"
"8","7","1","Ctrl+Shift+K","Key Press","K","L Ctrl+L Shift"
"8","12","1","L8","coach_l8_hold","",""
"8","0","2","Ctrl+7","Key Press","7 and Ampersand","L Ctrl"
"8","1","2","Ctrl+8","Key Press","8 and Star","L Ctrl"
"8","2","2","Ctrl+9","Key Press","9 and Left Bracket","L Ctrl"
"8","4","2","Ctrl+Shift+D","Key Press","D","L Ctrl+L Shift"
"8","5","2","L8","coach_l8_lock","",""
"8","9","2","Win+K","Key Press","K","L GUI"
"8","10","2","L5","coach_l5_hold","",""
"8","11","2","Ctrl+Shift+U","Key Press","U","L Ctrl+L Shift"
"8","2","3","L5","coach_l5_toggle","",""
"8","3","3","Ctrl+/","Key Press","ForwardSlash and QuestionMark","L Ctrl"
"8","4","3","L2","coach_l2_toggle","",""
"8","7","3","L10","coach_l10_toggle","",""
"8","8","3","F1","Key Press","F1",""
"8","9","3","L7","coach_l7_toggle","",""
"8","11","3","L3","coach_l3_toggle","",""
"8","3","4","L7","coach_l7_hold","",""
"8","4","4","L4","coach_l4_toggle","",""
"8","5","4","L9","coach_l9_hold","",""
"8","4","5","L10","coach_l10_hold","",""
"8","5","5","L6","coach_l6_hold","",""
"8","7","5","L0","coach_base","",""
"9","0","0","Win+Space","Key Press","Spacebar","L GUI"
"9","1","0","Alt+Shift","Key Press","Shift","L Alt"
"9","2","0","Ctrl+0","Key Press","0 and Right Bracket","L Ctrl"
"9","3","0","Win+E","Key Press","E","L GUI"
"9","4","0","Win+Shift+V","Key Press","V","L GUI+L Shift"
"9","5","0","Ctrl+Shift+J","Key Press","J","L Ctrl+L Shift"
"9","7","0","Ctrl+Shift+C","Key Press","C","L Ctrl+L Shift"
"9","8","0","F12","Key Press","F12",""
"9","9","0","Ctrl+A","Key Press","A","L Ctrl"
"9","10","0","Ctrl+F5","Key Press","F5","L Ctrl"
"9","11","0","Ctrl+.","Key Press","Period and GreaterThan","L Ctrl"
"9","12","0","Shift+Delete","Key Press","Delete","L Shift"
"9","0","1","Ctrl+Shift+I","Key Press","I","L Ctrl+L Shift"
"9","1","1","Win+1","Key Press","1 and Bang","L GUI"
"9","2","1","Win+2","Key Press","2 and At","L GUI"
"9","3","1","Win+3","Key Press","3 and Hash","L GUI"
"9","4","1","Win+4","Key Press","4 and Dollar","L GUI"
"9","5","1","Win+5","Key Press","5 and Percent","L GUI"
"9","7","1","Win+Shift+S","Key Press","S","L GUI+L Shift"
"9","8","1","Ctrl+V","Key Press","V","L Ctrl"
"9","9","1","Ctrl+R","Key Press","R","L Ctrl"
"9","10","1","F5","Key Press","F5",""
"9","11","1","Ctrl+C","Key Press","C","L Ctrl"
"9","12","1","Win+Shift+T","Key Press","T","L GUI+L Shift"
"9","0","2","Shift+Click","coach_shift_click","",""
"9","1","2","Ctrl+Shift+L","Key Press","L","L Ctrl+L Shift"
"9","2","2","Win+H","Key Press","H","L GUI"
"9","3","2","Win+V","Key Press","V","L GUI"
"9","4","2","Ctrl+Shift+V","Key Press","V","L Ctrl+L Shift"
"9","5","2","L4","coach_l4_toggle","",""
"9","7","2","Shift+Alt+Up","Key Press","UpArrow","L Shift+L Alt"
"9","8","2","Ctrl+Shift+;","Key Press","SemiColon and Colon","L Ctrl+L Shift"
"9","9","2","Ctrl+Shift+Tab","Key Press","Tab","L Ctrl+L Shift"
"9","10","2","Alt+Shift+D","Key Press","D","L Alt+L Shift"
"9","11","2","Win+Shift+R","Key Press","R","L GUI+L Shift"
"9","12","2","Win+Shift+C","Key Press","C","L GUI+L Shift"
"9","0","3","Ctrl+O","Key Press","O","L Ctrl"
"9","1","3","AltGr+2","Key Press","2 and At","R Alt"
"9","2","3","L9","coach_l9_lock","",""
"9","3","3","L5","coach_l5_toggle","",""
"9","4","3","Ctrl+Home","Key Press","Home","L Ctrl"
"9","5","3","Ctrl+End","Key Press","End","L Ctrl"
"9","7","3","Shift+Alt+Down","Key Press","DownArrow","L Shift+L Alt"
"9","8","3","Ctrl+Shift+Left","Key Press","LeftArrow","L Ctrl+L Shift"
"9","9","3","Ctrl+Shift+Right","Key Press","RightArrow","L Ctrl+L Shift"
"9","10","3","Alt+Enter","Key Press","Return Enter","L Alt"
"9","11","3","Ctrl+F6","Key Press","F6","L Ctrl"
"9","12","3","Ctrl+Shift+F6","Key Press","F6","L Ctrl+L Shift"
"9","3","4","L0","coach_base","",""
"9","7","4","L8","coach_l8_hold","",""
"9","8","4","L4","coach_l4_hold","",""
"9","7","5","L7","coach_l7_hold","",""
"10","0","0","Alt+Up","Key Press","UpArrow","L Alt"
"10","1","0","Alt+Shift+Up","Key Press","UpArrow","L Alt+L Shift"
"10","2","0","Win+C","Key Press","C","L GUI"
"10","4","0","Ctrl+\\","Key Press","Backslash and Pipe","L Ctrl"
"10","5","0","Ctrl+Shift+\\","Key Press","Backslash and Pipe","L Ctrl+L Shift"
"10","7","0","Ctrl+Space","Key Press","Spacebar","L Ctrl"
"10","8","0","\`","Key Press","Grave Accent and Tilde",""
"10","9","0","-","Key Press","Dash and Underscore",""
"10","10","0","=","Key Press","Equals and Plus",""
"10","11","0","RightAlt","Key Press","RightAlt",""
"10","12","0","Shift+Click","coach_shift_click","",""
"10","0","1","Alt+Down","Key Press","DownArrow","L Alt"
"10","1","1","Alt+Shift+Down","Key Press","DownArrow","L Alt+L Shift"
"10","2","1","Alt+Shift+D","Key Press","D","L Alt+L Shift"
"10","3","1","Alt+F12","Key Press","F12","L Alt"
"10","4","1","Ctrl+W","Key Press","W","L Ctrl"
"10","5","1","Win+Shift+N","Key Press","N","L GUI+L Shift"
"10","7","1","Shift+F11","Key Press","F11","L Shift"
"10","8","1","]","Key Press","Right Brace",""
"10","9","1","Win+L","Key Press","L","L GUI"
"10","10","1","Win+Ctrl+Left","Key Press","LeftArrow","L GUI+L Ctrl"
"10","11","1","Win+Ctrl+Right","Key Press","RightArrow","L GUI+L Ctrl"
"10","12","1","Ctrl+Shift+Up","Key Press","UpArrow","L Ctrl+L Shift"
"10","0","2","Win+Ctrl+\`","Key Press","Grave Accent and Tilde","L GUI+L Ctrl"
"10","1","2","Ctrl+[","Key Press","Left Brace","L Ctrl"
"10","2","2","Ctrl+]","Key Press","Right Brace","L Ctrl"
"10","3","2","Ctrl+Shift+T","Key Press","T","L Ctrl+L Shift"
"10","4","2","Ctrl+Shift+Tab","Key Press","Tab","L Ctrl+L Shift"
"10","5","2","Ctrl+Tab","Key Press","Tab","L Ctrl"
"10","7","2","F10","Key Press","F10",""
"10","8","2","Ctrl+Shift+R","Key Press","R","L Ctrl+L Shift"
"10","9","2","Page Up","Key Press","PageUp",""
"10","10","2","Ctrl+.","Key Press","Period and GreaterThan","L Ctrl"
"10","11","2","F4","Key Press","F4",""
"10","12","2","Ctrl+Shift+Down","Key Press","DownArrow","L Ctrl+L Shift"
"10","0","3","Shift+Enter","Key Press","Return Enter","L Shift"
"10","1","3","Ctrl+B","Key Press","B","L Ctrl"
"10","2","3","Win+\`","Key Press","Grave Accent and Tilde","L GUI"
"10","3","3","Shift+Alt+A","Key Press","A","L Shift+L Alt"
"10","4","3","Ctrl+T","Key Press","T","L Ctrl"
"10","5","3","L3","coach_l3_toggle","",""
"10","7","3","Ctrl+Shift+\`","Key Press","Grave Accent and Tilde","L Ctrl+L Shift"
"10","8","3","<","Key Press","Non-US Backslash and Pipe",""
"10","9","3","Page Down","Key Press","PageDown",""
"10","10","3","Alt+Click","coach_alt_click","",""
"10","11","3","Shift+F8","Key Press","F8","L Shift"
"10","12","3","F8","Key Press","F8",""
"10","7","5","L0","coach_base","",""`;

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
