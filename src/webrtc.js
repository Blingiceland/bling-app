// webrtc.js
import { db } from "./firebase";
import {
  doc,
  setDoc,
  onSnapshot,
} from "firebase/firestore";

let localStream;
let peerConnection;

const servers = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
};

export const startStreaming = async (roomId) => {
  try {
    localStream = await navigator.mediaDevices.getDisplayMedia({
      video: true,
      audio: true,
    });

    peerConnection = new RTCPeerConnection(servers);

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
        await peerConnection.setRemoteDescription(remoteDesc);
      }
    });

    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        // Optionally: send candidates via signaling (not needed in simple setup)
      }
    };

  } catch (err) {
    console.error("Villa í startStreaming:", err);
  }
};

export const joinStreaming = async (roomId) => {
  try {
    peerConnection = new RTCPeerConnection(servers);

    peerConnection.ontrack = (event) => {
      const remoteVideo = document.createElement("video");
      remoteVideo.srcObject = event.streams[0];
      remoteVideo.autoplay = true;
      remoteVideo.controls = true;
      remoteVideo.className = "fixed bottom-4 right-4 w-1/4 border-4 border-white z-50";
      document.body.appendChild(remoteVideo);
    };

    const offerRef = doc(db, "rooms", roomId, "webrtc", "offer");
    const offerSnap = await onSnapshot(offerRef, async (docSnap) => {
      const data = docSnap.data();
      if (data && data.type === "offer") {
        const remoteDesc = new RTCSessionDescription(data);
        await peerConnection.setRemoteDescription(remoteDesc);

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
  if (localStream) {
    const audioTrack = localStream.getAudioTracks()[0];
    audioTrack.enabled = !audioTrack.enabled;
    return audioTrack.enabled;
  }
  return false;
};
