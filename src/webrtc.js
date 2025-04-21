// webrtc.js
import { db } from "./firebase";
import { doc, setDoc, onSnapshot } from "firebase/firestore";

let peerConnection;
let localStream;
let remoteStream;
let isMicOn = true;

const config = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
};

export const startStreaming = async (roomId) => {
  try {
    const displayStream = await navigator.mediaDevices.getDisplayMedia({
      video: true,
      audio: true,
    });

    const micStream = await navigator.mediaDevices.getUserMedia({
      audio: true,
    });

    micStream.getAudioTracks().forEach((track) => {
      displayStream.addTrack(track);
    });

    localStream = displayStream;
    peerConnection = new RTCPeerConnection(config);

    localStream.getTracks().forEach((track) => {
      peerConnection.addTrack(track, localStream);
    });

    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);

    await setDoc(doc(db, "rooms", roomId, "webrtc", "offer"), {
      sdp: offer.sdp,
      type: offer.type,
    });

    const answerRef = doc(db, "rooms", roomId, "webrtc", "answer");
    onSnapshot(answerRef, async (docSnap) => {
      const data = docSnap.data();
      if (data && data.type === "answer") {
        const remoteDesc = new RTCSessionDescription(data);
        if (!peerConnection.currentRemoteDescription) {
          await peerConnection.setRemoteDescription(remoteDesc);
        }
      }
    });
  } catch (err) {
    console.error("Villa í startStreaming:", err);
  }
};

export const joinStreaming = async (roomId) => {
  try {
    peerConnection = new RTCPeerConnection(config);
    remoteStream = new MediaStream();

    peerConnection.ontrack = (event) => {
      event.streams[0].getTracks().forEach((track) => {
        remoteStream.addTrack(track);
      });
      const remoteAudio = new Audio();
      remoteAudio.srcObject = remoteStream;
      remoteAudio.autoplay = true;
      remoteAudio.controls = true;
      document.body.appendChild(remoteAudio);
    };

    const offerRef = doc(db, "rooms", roomId, "webrtc", "offer");
    onSnapshot(offerRef, async (docSnap) => {
      const data = docSnap.data();
      if (data && data.type === "offer" && !peerConnection.currentRemoteDescription) {
        const offer = new RTCSessionDescription(data);
        await peerConnection.setRemoteDescription(offer);

        const micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        micStream.getTracks().forEach((track) => peerConnection.addTrack(track, micStream));
        localStream = micStream;

        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);

        await setDoc(doc(db, "rooms", roomId, "webrtc", "answer"), {
          sdp: answer.sdp,
          type: answer.type,
        });
      }
    });
  } catch (err) {
    console.error("Villa í joinStreaming:", err);
  }
};

export const toggleMic = () => {
  if (!localStream) return isMicOn;
  localStream.getAudioTracks().forEach((track) => {
    track.enabled = !track.enabled;
  });
  isMicOn = !isMicOn;
  return isMicOn;
};
