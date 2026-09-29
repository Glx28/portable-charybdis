(() => {
  "use strict";

  const SERVICE_UUID = "3f9e4e20-50c4-4b43-a789-8a982318e9a0";
  const CHARACTERISTIC_UUID = "3f9e4e21-50c4-4b43-a789-8a982318e9a0";
  const button = document.getElementById("beaconConnectButton");
  const status = document.getElementById("beaconConnectionStatus");

  if (!button || !status) return;

  let device = null;
  let reconnectTimer = 0;

  function setStatus(message) {
    status.textContent = message;
  }

  async function submitBeacon(event) {
    const value = event.target.value;
    if (!value || value.byteLength < 5) return;
    const [magic, version, layer, kind, pressed] =
      Array.from({ length: 5 }, (_, index) => value.getUint8(index));
    if (magic !== 0x43 || version !== 1 || layer > 10 || kind > 3 || pressed > 1) return;

    try {
      await fetch("/api/coach-beacon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ layer, kind, pressed })
      });
    } catch {
      setStatus("Coach server unavailable");
    }
  }

  async function attach(target) {
    device = target;
    device.addEventListener("gattserverdisconnected", () => {
      setStatus("Keyboard disconnected");
      button.textContent = "Connect keyboard";
      button.disabled = false;
      clearTimeout(reconnectTimer);
      reconnectTimer = setTimeout(() => connect(false).catch(() => {}), 1500);
    }, { once: true });
    setStatus("Connecting…");
    const server = await device.gatt.connect();
    const service = await server.getPrimaryService(SERVICE_UUID);
    const characteristic = await service.getCharacteristic(CHARACTERISTIC_UUID);
    await characteristic.startNotifications();
    characteristic.addEventListener("characteristicvaluechanged", submitBeacon);
    setStatus(`Connected · ${device.name || "Charybdis"}`);
    button.textContent = "Keyboard connected";
    button.disabled = true;
  }

  async function connect(allowPrompt = true) {
    if (!navigator.bluetooth || typeof navigator.bluetooth.requestDevice !== "function") {
      setStatus("Use Edge or Chrome for keyboard connection");
      button.disabled = true;
      return;
    }
    try {
      const permitted = navigator.bluetooth.getDevices
        ? await navigator.bluetooth.getDevices()
        : [];
      const remembered = permitted.find((candidate) =>
        (candidate.name || "").toLowerCase().includes("charydbis") ||
        (candidate.name || "").toLowerCase().includes("charybdis"));
      if (remembered) {
        await attach(remembered);
        return;
      }
      if (!allowPrompt) {
        setStatus("Click Connect keyboard to pair Coach");
        return;
      }
      const selected = await navigator.bluetooth.requestDevice({
        filters: [{ namePrefix: "V&Z-Charydbis" }],
        optionalServices: [SERVICE_UUID]
      });
      await attach(selected);
    } catch (error) {
      if (error?.name === "NotFoundError") {
        setStatus("Charybdis not found · check Bluetooth");
      } else if (error?.name === "SecurityError" || error?.name === "NotSupportedError") {
        setStatus("Bluetooth connection unavailable in this browser");
      } else {
        setStatus(error?.message || "Could not connect keyboard");
      }
    }
  }

  button.addEventListener("click", () => connect(true));
  if (!navigator.bluetooth || typeof navigator.bluetooth.requestDevice !== "function") {
    setStatus("Use Edge or Chrome for keyboard connection");
    button.disabled = true;
  } else {
    connect(false);
  }
})();
