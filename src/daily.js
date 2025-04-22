import DailyIframe from "@daily-co/daily-js";
import { doc, updateDoc } from "firebase/firestore";

// Býr til nýtt Daily herbergi
export async function createDailyRoom() {
  const apiKey = process.env.REACT_APP_DAILY_API_KEY;

  try {
    const res = await fetch("https://api.daily.co/v1/rooms", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        properties: {
          enable_chat: false,
          start_video_off: true,
          start_audio_off: false,
          exp: Math.floor(Date.now() / 1000) + 3600
        }
      })
    });

    const data = await res.json();

    if (!res.ok) {
      console.error("Villa við að búa til Daily herbergi:", data);
      return null;
    }

    return data.url;
  } catch (error) {
    console.error("⚠️ Villa við Daily API:", error);
    return null;
  }
}

// 🎧 Streymi með aðeins hljóði – engin skjámynd send
export async function startDailyCallWithAudioOnly(roomId, db) {
  const url = await createDailyRoom();
  if (!url) {
    alert("Gat ekki búið til streymi. Athugaðu API-lykil og nettengingu.");
    return;
  }

  const roomRef = doc(db, "rooms", roomId);
  await updateDoc(roomRef, {
    streamingActive: true,
    dailyRoomUrl: url
  });

  const callObject = DailyIframe.createCallObject();
  await callObject.join({ url, videoSource: false });

  try {
    // Grípa mic hljóð
    const micStream = await navigator.mediaDevices.getUserMedia({ audio: true });

    // Grípa tab/system audio + video (video þarf að vera til svo við fáum audio)
    const displayStream = await navigator.mediaDevices.getDisplayMedia({
      video: true, // leyfa browsernum að velja tab/skjá
      audio: true
    });

    // 👉 Fjarlægja video trackið STRAX
    displayStream.getVideoTracks().forEach((track) => track.stop());

    const AudioContext = window.AudioContext || window.webkitAudioContext;
    const audioContext = new AudioContext();

    const destination = audioContext.createMediaStreamDestination();
    const micSource = audioContext.createMediaStreamSource(micStream);
    const tabSource = audioContext.createMediaStreamSource(displayStream);

    micSource.connect(destination);
    tabSource.connect(destination);

    // ✅ Bæta aðeins við audio track
    destination.stream.getTracks().forEach((track) => {
      if (track.kind === "audio") {
        callObject.addTrack(track);
      }
    });

    console.log("✅ Audio-only streymi virkt (mic + tab) – video fjarlægt");
  } catch (error) {
    console.error("❌ Villa við hljóðdeilingu:", error);
  }

  window.open(url, "_blank");
}
