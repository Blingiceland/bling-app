let localStream = null;
let peerConnection = null;

const config = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
  ],
};

export async function startStreaming(roomId) {
  console.log("Dómari: Byrjar streymi fyrir room:", roomId);

  try {
    localStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    peerConnection = new RTCPeerConnection(config);

    // Add tracks to connection
    localStream.getTracks().forEach((track) => {
      peerConnection.addTrack(track, localStream);
    });

    // Create offer
    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);

    // Send offer manually (einfalt í þróunarfasa)
    const offerText = JSON.stringify(offer);
    prompt("Afritaðu og sendu keppanda þetta OFFER:", offerText);
  } catch (error) {
    console.error("Dómari: Villa við að starta streymi:", error);
  }
}

export async function joinStreaming(roomId) {
  console.log("Keppandi: Tengist streymi fyrir room:", roomId);

  try {
    peerConnection = new RTCPeerConnection(config);

    // Prompt for offer manually
    const offerString = prompt("Límdu OFFER frá dómara hér:");
    const offer = JSON.parse(offerString);
    await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));

    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);

    // Play audio stream when received
    peerConnection.ontrack = (event) => {
      const remoteAudio = new Audio();
      remoteAudio.srcObject = event.streams[0];
      remoteAudio.play();
    };

    // Send answer back manually
    const answerText = JSON.stringify(answer);
    prompt("Sendu þetta til baka til dómara (ANSWER):", answerText);
  } catch (error) {
    console.error("Keppandi: Villa við að tengjast streymi:", error);
  }
}

export function toggleMic() {
  if (!localStream) return false;

  const audioTrack = localStream.getAudioTracks()[0];
  audioTrack.enabled = !audioTrack.enabled;
  return audioTrack.enabled;
}
