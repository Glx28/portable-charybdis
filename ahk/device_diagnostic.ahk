#Requires AutoHotkey v2.0
#SingleInstance Force

; Passive Raw Input logger for keyboard / mouse fault reproduction.
; Logs physical key identifiers and mouse deltas only; never text/characters.
; RIDEV_INPUTSINK observes input without consuming or changing it.

global RuntimeDir := RegExReplace(A_ScriptDir, "\\ahk$") "\runtime"
global LogPath := RuntimeDir "\device_diagnostic.jsonl"
global HeldKeys := Map()
global DeviceNames := Map()
global MouseBuckets := Map()
global EventBuffer := []
global StartedAt := A_TickCount

DirCreate(RuntimeDir)
try FileAppend("{" Chr(34) "type" Chr(34) ":" Chr(34) "tracker_boot" Chr(34) "}`r`n", LogPath, "UTF-8")
global MonitorGui := Gui("+ToolWindow -Caption")
MonitorGui.Show("Hide")
try RegisterInput()
catch as e {
    FileAppend("{" Chr(34) "type" Chr(34) ":" Chr(34) "tracker_register_error" Chr(34) "," Chr(34) "message" Chr(34) ":" Chr(34) e.Message Chr(34) "}`r`n", LogPath, "UTF-8")
    throw e
}
OnMessage(0x00FF, HandleRawInput)
OnMessage(0x00FE, HandleDeviceChange)
SetTimer(CheckHeldKeys, 250)
SetTimer(FlushMouseBuckets, 1000)
SetTimer(FlushEvents, 500)
OnExit(WriteShutdown)
WriteEvent(Map("type", "tracker_start", "pid", DllCall("GetCurrentProcessId")))
TraySetIcon("shell32.dll", 167)
A_IconTip := "Charybdis device diagnostic active"
A_TrayMenu.Delete()
A_TrayMenu.Add("Open diagnostic log", (*) => Run('notepad.exe "' LogPath '"'))
A_TrayMenu.Add("Exit diagnostic tracker", (*) => ExitApp())

RegisterInput() {
    global MonitorGui
    stride := 8 + A_PtrSize
    devices := Buffer(stride * 2, 0)
    ; Generic Desktop page: keyboard (usage 6) and mouse (usage 2).
    for index, usage in [6, 2] {
        offset := (index - 1) * stride
        NumPut("UShort", 1, devices, offset)
        NumPut("UShort", usage, devices, offset + 2)
        NumPut("UInt", 0x2100, devices, offset + 4) ; INPUTSINK | DEVNOTIFY
        NumPut("Ptr", MonitorGui.Hwnd, devices, offset + 8)
    }
    if !DllCall("RegisterRawInputDevices", "Ptr", devices, "UInt", 2, "UInt", stride, "Int")
        throw OSError()
}

HandleRawInput(wParam, lParam, msg, hwnd) {
    global DeviceNames, HeldKeys, MouseBuckets
    headerSize := 8 + (2 * A_PtrSize)
    size := 0
    result := DllCall("GetRawInputData", "Ptr", lParam, "UInt", 0x10000003,
        "Ptr", 0, "UInt*", &size, "UInt", headerSize, "UInt")
    if result = 0xFFFFFFFF || size < headerSize
        return DefRaw(hwnd, msg, wParam, lParam)

    raw := Buffer(size, 0)
    copied := DllCall("GetRawInputData", "Ptr", lParam, "UInt", 0x10000003,
        "Ptr", raw, "UInt*", &size, "UInt", headerSize, "UInt")
    if copied = 0xFFFFFFFF
        return DefRaw(hwnd, msg, wParam, lParam)

    kind := NumGet(raw, 0, "UInt")
    device := NumGet(raw, 8, "Ptr")
    if !DeviceNames.Has(device)
        DeviceNames[device] := GetDeviceName(device)
    deviceName := DeviceNames[device]
    data := headerSize

    if kind = 1 && size >= data + 16 {
        scan := NumGet(raw, data, "UShort")
        flags := NumGet(raw, data + 2, "UShort")
        vk := NumGet(raw, data + 6, "UShort")
        isUp := (flags & 1) != 0
        extended := (flags & 6) != 0
        id := device "|" scan "|" vk "|" (extended ? 1 : 0)
        now := A_TickCount
        if isUp {
            duration := 0
            if HeldKeys.Has(id) {
                duration := now - HeldKeys[id]["since"]
                HeldKeys.Delete(id)
            }
            WriteEvent(Map("type", "key_up", "device", deviceName, "vk", vk,
                "scan", scan, "extended", extended, "held_ms", duration))
        } else if HeldKeys.Has(id) {
            HeldKeys[id]["repeat_count"] += 1
            HeldKeys[id]["last_repeat"] := now
            WriteEvent(Map("type", "key_repeat", "device", deviceName, "vk", vk,
                "scan", scan, "extended", extended, "repeat_count", HeldKeys[id]["repeat_count"]))
        } else {
            HeldKeys[id] := Map("since", now, "warned", false, "repeat_count", 0, "device", deviceName, "vk", vk, "scan", scan, "extended", extended)
            WriteEvent(Map("type", "key_down", "device", deviceName, "vk", vk,
                "scan", scan, "extended", extended))
        }
    } else if kind = 0 && size >= data + 24 {
        buttons := NumGet(raw, data + 4, "UShort")
        wheelData := NumGet(raw, data + 6, "UShort")
        dx := NumGet(raw, data + 8, "Int")
        dy := NumGet(raw, data + 12, "Int")
        if !MouseBuckets.Has(device)
            MouseBuckets[device] := Map("device", deviceName, "dx", 0, "dy", 0, "packets", 0, "buttons", 0, "wheel", 0)
        bucket := MouseBuckets[device]
        bucket["dx"] += dx
        bucket["dy"] += dy
        bucket["packets"] += 1
        buttonFlags := buttons & 0x3F3F
        if buttonFlags {
            bucket["buttons"] += 1
            WriteEvent(Map("type", "mouse_button", "device", deviceName, "flags", buttonFlags))
        }
        if (buttons & 0x0400) {
            wheel := wheelData >= 0x8000 ? wheelData - 0x10000 : wheelData
            bucket["wheel"] += wheel
            WriteEvent(Map("type", "mouse_wheel", "device", deviceName, "delta", wheel))
        }
    }
    return DefRaw(hwnd, msg, wParam, lParam)
}

HandleDeviceChange(wParam, lParam, msg, hwnd) {
    global DeviceNames
    device := lParam
    name := GetDeviceName(device)
    DeviceNames[device] := name
    WriteEvent(Map("type", wParam = 1 ? "device_arrival" : "device_removal", "device", name))
}

GetDeviceName(device) {
    chars := 0
    DllCall("GetRawInputDeviceInfoW", "Ptr", device, "UInt", 0x20000007, "Ptr", 0, "UInt*", &chars, "UInt")
    if chars < 2 || chars > 4096
        return "device:" device
    deviceNameBuffer := Buffer(chars * 2, 0)
    if DllCall("GetRawInputDeviceInfoW", "Ptr", device, "UInt", 0x20000007, "Ptr", deviceNameBuffer, "UInt*", &chars, "UInt") = 0xFFFFFFFF
        return "device:" device
    return StrGet(deviceNameBuffer, "UTF-16")
}

CheckHeldKeys() {
    global HeldKeys
    now := A_TickCount
    for id, state in HeldKeys {
        age := now - state["since"]
        if age >= 2000 && !state["warned"] {
            state["warned"] := true
            WriteEvent(Map("type", "key_held_threshold", "device", state["device"],
                "vk", state["vk"], "scan", state["scan"], "extended", state["extended"], "held_ms", age))
        }
    }
}

FlushMouseBuckets() {
    global MouseBuckets
    for device, bucket in MouseBuckets {
        if bucket["packets"] > 0 {
            WriteEvent(Map("type", "mouse_motion_window", "device", bucket["device"],
                "dx", bucket["dx"], "dy", bucket["dy"], "packets", bucket["packets"],
                "button_packets", bucket["buttons"], "wheel_delta", bucket["wheel"]))
        }
        bucket["dx"] := 0, bucket["dy"] := 0, bucket["packets"] := 0
        bucket["buttons"] := 0, bucket["wheel"] := 0
    }
}

WriteEvent(event) {
    global EventBuffer
    event["ts_local"] := FormatTime(A_Now, "yyyy-MM-ddTHH:mm:ss") "." Format("{:03}", A_MSec)
    EventBuffer.Push(Json(event))
    if EventBuffer.Length >= 200
        FlushEvents()
}

FlushEvents() {
    global EventBuffer, LogPath
    if !EventBuffer.Length
        return
    text := ""
    for line in EventBuffer
        text .= line "`r`n"
    try FileAppend(text, LogPath, "UTF-8")
    EventBuffer := []
}

Json(value) {
    if value is Map {
        parts := []
        for key, item in value
            parts.Push('"' EscapeJson(String(key)) '":' Json(item))
        return "{" Join(parts, ",") "}"
    }
    if value is Array {
        parts := []
        for item in value
            parts.Push(Json(item))
        return "[" Join(parts, ",") "]"
    }
    if value is String
        return '"' EscapeJson(value) '"'
    if value is Integer || value is Float
        return String(value)
    if value = true
        return "true"
    if value = false
        return "false"
    return "null"
}

EscapeJson(value) {
    value := StrReplace(value, "\", "\\")
    value := StrReplace(value, '"', '\"')
    value := StrReplace(value, "`r", "\r")
    value := StrReplace(value, "`n", "\n")
    value := StrReplace(value, "`t", "\t")
    return value
}

Join(items, separator) {
    output := ""
    for index, item in items
        output .= (index = 1 ? "" : separator) item
    return output
}

DefRaw(hwnd, msg, wParam, lParam) {
    return DllCall("DefWindowProcW", "Ptr", hwnd, "UInt", msg, "UPtr", wParam, "Ptr", lParam, "Ptr")
}

WriteShutdown(*) {
    global StartedAt
    WriteEvent(Map("type", "tracker_stop", "uptime_ms", A_TickCount - StartedAt))
    FlushEvents()
}
