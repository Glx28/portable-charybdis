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
      button.textContent = "Connect over Bluetooth";
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

  function connectionError(error, showPopup = false) {
    let message;
    if (error?.name === "NotFoundError") {
      message = "Keyboard chooser closed or no Charybdis selected";
    } else if (error?.name === "SecurityError" || error?.name === "NotSupportedError") {
      message = "Bluetooth unavailable. Open Coach in Edge or Chrome using localhost";
    } else {
      message = error?.message || "Could not connect keyboard";
    }
    setStatus(message);
    if (showPopup) window.alert(`Charybdis Coach could not connect:\n${message}`);
    scheduleReconnect();
  }

  async function connect() {
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
      setStatus("USB layer sync is automatic · click for Bluetooth mode");
    } catch (error) {
      connectionError(error);
    }
  }

  button.addEventListener("click", () => {
    if (!navigator.bluetooth || typeof navigator.bluetooth.requestDevice !== "function") {
      connectionError(new Error("Use Edge or Chrome on localhost for Bluetooth"), true);
      return;
    }

    // requestDevice must run directly inside the click gesture; awaiting getDevices first
    // causes browsers to suppress the chooser as an untrusted request.
    let chooser;
    try {
      chooser = navigator.bluetooth.requestDevice({
        filters: [{ namePrefix: "V&Z-Charydbis" }],
        optionalServices: [SERVICE_UUID]
      });
    } catch (error) {
      connectionError(error, true);
      return;
    }

    setStatus("Optional: choose V&Z-Charydbis in the Bluetooth popup…");
    chooser.then(async (selected) => {
      reconnectWanted = true;
      await attach(selected);
    }).catch((error) => connectionError(error, true));
  });
  if (!navigator.bluetooth || typeof navigator.bluetooth.requestDevice !== "function") {
    setStatus("Use Edge or Chrome for keyboard connection");
    button.disabled = true;
  } else {
    connect();
  }
})();
