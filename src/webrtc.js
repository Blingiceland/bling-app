import { doc, setDoc, getDoc } from "firebase/firestore";
import { db } from "./firebase";

let peerConnection;
let localStream;
let remoteStream;
let localMicTrack;

const servers = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
};

// 🎙️ DÓMARI - byrjar streymi
export async function startStreaming(roomId) {
  const displayStream = await navigator.mediaDevices.getDisplayMedia({
    video: true,
    audio: true
  });

  const micStream = await navigator.mediaDevices.getUserMedia({
    audio: true
  });

  localMicTrack = micStream.getAudioTracks()[0]; // vista mic track fyrir mute

  localStream = new MediaStream();

  displayStream.getAudioTracks().forEach((track) => {
    localStream.addTrack(track);
  });

  micStream.getAudioTracks().forEach((track) => {
    localStream.addTrack(track);
  });

  peerConnection = new RTCPeerConnection(servers);

  localStream.getTracks().forEach((track) => {
    peerConnection.addTrack(track, localStream);
  });

  peerConnection.ontrack = (event) => {
    if (!remoteStream) remoteStream = new MediaStream();
    remoteStream.addTrack(event.track);
    const audio = new Audio();
    audio.srcObject = remoteStream;
    audio.play();
  };

  const offer = await peerConnection.createOffer();
  await peerConnection.setLocalDescription(offer);

  const roomRef = doc(db, "rooms", roomId, "stream", "webrtc");
  await setDoc(roomRef, { offer });

  console.log("🎙️ Dómari byrjaði tvíhliða streymi");
}

// 🎧 KEPPANDI - tengist streymi
export async function joinStreaming(roomId) {
  const micStream = await navigator.mediaDevices.getUserMedia({
    audio: true
  });

  localMicTrack = micStream.getAudioTracks()[0]; // vista mic track fyrir mute

  peerConnection = new RTCPeerConnection(servers);

  micStream.getTracks().forEach((track) => {
    peerConnection.addTrack(track, micStream);
  });

  peerConnection.ontrack = (event) => {
    if (!remoteStream) remoteStream = new MediaStream();
    remoteStream.addTrack(event.track);
    const audio = new Audio();
    audio.srcObject = remoteStream;
    audio.play();
  };

  const roomRef = doc(db, "rooms", roomId, "stream", "webrtc");
  const roomSnap = await getDoc(roomRef);

  if (!roomSnap.exists()) {
    alert("⚠️ Streymi hefur ekki verið byrjað af dómara.");
    return;
  }

  const data = roomSnap.data();
  if (!data.offer) {
    alert("⚠️ Streymið er ekki tilbúið ennþá.");
    return;
  }

  const offer = data.offer;
  await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));

  const answer = await peerConnection.createAnswer();
  await peerConnection.setLocalDescription(answer);

  await setDoc(roomRef, { ...data, answer });

  console.log("🎧 Keppandi tengdur – getur bæði heyrt og talað");
}

// 🔇 MUTE / UNMUTE
export function toggleMic() {
  if (localMicTrack) {
    localMicTrack.enabled = !localMicTrack.enabled;
    console.log(`Mic is now ${localMicTrack.enabled ? "ON" : "OFF"}`);
    return localMicTrack.enabled;
  }
  return false;
}
