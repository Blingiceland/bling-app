// src/webrtc.js
let localStream;
let peerConnection;
const config = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" }
  ]
};

export const startStreaming = async (roomId) => {
  try {
    console.log("Dómari: Byrjar streymi fyrir room:", roomId);

    localStream = await navigator.mediaDevices.getDisplayMedia({
      video: true,
      audio: true
    });

    peerConnection = new RTCPeerConnection(config);

    localStream.getTracks().forEach(track => {
      peerConnection.addTrack(track, localStream);
    });

    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        console.log("ICE candidate:", event.candidate);
      }
    };

    // Geyma offer í global scope (til að debugga ef villur koma upp)
    window.peerConnection = peerConnection;

  } catch (error) {
    console.error("Dómari: Villa við að starta streymi:", error);
  }
};

export const joinStreaming = async (roomId) => {
  try {
    console.log("Keppandi: Tengist streymi í room:", roomId);

    peerConnection = new RTCPeerConnection(config);

    peerConnection.ontrack = (event) => {
      const remoteStream = new MediaStream();
      remoteStream.addTrack(event.track);

      const audioElement = new Audio();
      audioElement.srcObject = remoteStream;
      audioElement.autoplay = true;
      audioElement.play();
    };

    // Ekki fleiri tilraunir – hér vantar signaling (backend/firestore eða WebSocket)
    // Þetta er placeholder eða forsenda fyrir að búa til alvöru offer/answer samskipti

  } catch (error) {
    console.error("Keppandi: Villa við að tengjast streymi:", error);
  }
};

export const toggleMic = () => {
  if (!localStream) return false;
  const audioTracks = localStream.getAudioTracks();
  if (audioTracks.length === 0) return false;

  const currentState = audioTracks[0].enabled;
  audioTracks[0].enabled = !currentState;
  return !currentState;
};
