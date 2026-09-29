(() => {
  "use strict";

  const SERVICE_UUID = "3f9e4e20-50c4-4b43-a789-8a982318e9a0";
  const CHARACTERISTIC_UUID = "3f9e4e21-50c4-4b43-a789-8a982318e9a0";
  const button = document.getElementById("beaconConnectButton");
  const status = document.getElementById("beaconConnectionStatus");

  if (!button || !status) return;

  let device = null;
  let reconnectTimer = 0;
  let reconnectDelay = 1000;
  let reconnectWanted = false;

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
    const onDisconnected = () => {
      setStatus("Keyboard disconnected");
      button.textContent = "Connect keyboard";
      button.disabled = false;
      scheduleReconnect();
    };
    device.addEventListener("gattserverdisconnected", onDisconnected, { once: true });
    setStatus("Connecting…");
    try {
      const server = await device.gatt.connect();
      const service = await server.getPrimaryService(SERVICE_UUID);
      const characteristic = await service.getCharacteristic(CHARACTERISTIC_UUID);
      await characteristic.startNotifications();
      characteristic.addEventListener("characteristicvaluechanged", submitBeacon);
      clearTimeout(reconnectTimer);
      reconnectTimer = 0;
      reconnectDelay = 1000;
      setStatus(`Connected · ${device.name || "Charybdis"}`);
      button.textContent = "Keyboard connected";
      button.disabled = true;
    } catch (error) {
      device.removeEventListener("gattserverdisconnected", onDisconnected);
      throw error;
    }
  }

  function scheduleReconnect() {
    if (!reconnectWanted || reconnectTimer) return;
    setStatus("Reconnecting to keyboard…");
    reconnectTimer = setTimeout(() => {
      reconnectTimer = 0;
      connect(false);
      reconnectDelay = Math.min(reconnectDelay * 2, 15000);
    }, reconnectDelay);
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
        reconnectWanted = true;
        try {
          await attach(remembered);
        } catch (error) {
          setStatus(error?.message || "Could not connect keyboard");
          scheduleReconnect();
        }
        return;
      }
      if (!allowPrompt) {
        setStatus("Click Connect keyboard to pair Coach");
        scheduleReconnect();
        return;
      }
      const selected = await navigator.bluetooth.requestDevice({
        filters: [{ namePrefix: "V&Z-Charydbis" }],
        optionalServices: [SERVICE_UUID]
      });
      reconnectWanted = true;
      await attach(selected);
    } catch (error) {
      if (error?.name === "NotFoundError") {
        setStatus("Charybdis not found · check Bluetooth");
      } else if (error?.name === "SecurityError" || error?.name === "NotSupportedError") {
        setStatus("Bluetooth connection unavailable in this browser");
      } else {
        setStatus(error?.message || "Could not connect keyboard");
      }
      scheduleReconnect();
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
