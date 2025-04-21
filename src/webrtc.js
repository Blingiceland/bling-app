// webrtc.js
import { doc, onSnapshot, updateDoc } from "firebase/firestore";
import { db } from "./firebase";

let peerConnection;
let localStream;
let remoteStream;
let isMicOn = true;

const config = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
  ],
};

export const startStreaming = async (roomId) => {
  peerConnection = new RTCPeerConnection(config);

  localStream = await navigator.mediaDevices.getDisplayMedia({
    video: true,
    audio: true,
  });

  remoteStream = new MediaStream();
  localStream.getTracks().forEach((track) => {
    peerConnection.addTrack(track, localStream);
  });

  peerConnection.ontrack = (event) => {
    event.streams[0].getTracks().forEach((track) => {
      remoteStream.addTrack(track);
    });
  };

  peerConnection.onicecandidate = async (event) => {
    if (event.candidate) return;
    const offer = peerConnection.localDescription;
    const roomRef = doc(db, "rooms", roomId);
    await updateDoc(roomRef, { offer: JSON.stringify(offer) });
    console.log("Dómari: Byrjar streymi fyrir room:", roomId);
  };

  const offer = await peerConnection.createOffer();
  await peerConnection.setLocalDescription(offer);

  const roomRef = doc(db, "rooms", roomId);
  onSnapshot(roomRef, async (snapshot) => {
    const data = snapshot.data();
    if (!peerConnection.currentRemoteDescription && data?.answer) {
      try {
        const answer = JSON.parse(data.answer);
        await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
        console.log("Dómari: remote description sett.");
      } catch (err) {
        console.error("Villa við að setja remote description:", err);
      }
    }
  });
};

export const joinStreaming = async (roomId) => {
  peerConnection = new RTCPeerConnection(config);
  remoteStream = new MediaStream();

  peerConnection.ontrack = (event) => {
    event.streams[0].getTracks().forEach((track) => {
      remoteStream.addTrack(track);
    });
    const remoteAudio = new Audio();
    remoteAudio.srcObject = remoteStream;
    remoteAudio.play();
  };

  const roomRef = doc(db, "rooms", roomId);
  const roomSnap = await onSnapshot(roomRef, async (snapshot) => {
    const data = snapshot.data();
    if (data?.offer && !peerConnection.currentRemoteDescription) {
      try {
        const offer = JSON.parse(data.offer);
        await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));

        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach((track) => peerConnection.addTrack(track, stream));
        localStream = stream;

        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);
        await updateDoc(roomRef, { answer: JSON.stringify(answer) });
        console.log("Keppandi: Sendi answer aftur í room:", roomId);
      } catch (err) {
        console.error("Keppandi: Villa í offer svarferli:", err);
      }
    }
  });
};

export const toggleMic = () => {
  if (!localStream) return isMicOn;
  localStream.getAudioTracks().forEach((track) => {
    track.enabled = !track.enabled;
  });
  isMicOn = !isMicOn;
  return isMicOn;
};
