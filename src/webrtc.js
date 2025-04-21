let peerConnection;
let localStream;
let remoteStream;
let micTrack;
let roomIdGlobal = null;

export async function startStreaming(roomId) {
  roomIdGlobal = roomId;
  console.log("Dómari: Byrjar streymi fyrir room:", roomId);

  try {
    const stream = await navigator.mediaDevices.getDisplayMedia({
      video: false,
      audio: true
    });

    const micStream = await navigator.mediaDevices.getUserMedia({ audio: true });

    // Sameina display audio og mic audio
    const audioContext = new AudioContext();
    const destination = audioContext.createMediaStreamDestination();

    const displaySource = audioContext.createMediaStreamSource(stream);
    displaySource.connect(destination);

    const micSource = audioContext.createMediaStreamSource(micStream);
    micSource.connect(destination);

    localStream = destination.stream;

    peerConnection = new RTCPeerConnection();
    localStream.getTracks().forEach(track => {
      console.log("Dómari: Bætir við track:", track.kind);
      peerConnection.addTrack(track, localStream);
    });

    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);

    window.localDescription = offer;

    console.log("Dómari: Offer búið til", offer);
    window.offerSDP = JSON.stringify(offer);
    alert("Afritaðu þetta OFFER og sendu keppanda.");
  } catch (err) {
    console.error("Dómari: Villa við að starta streymi:", err);
  }
}

export async function joinStreaming(roomId) {
  roomIdGlobal = roomId;
  console.log("Keppandi: Reynir að tengjast streymi fyrir room:", roomId);

  try {
    const offerSDP = window.prompt("Límdu OFFER frá dómara hér:");
    if (!offerSDP) {
      console.warn("Keppandi: OFFER ekki slegið inn.");
      return;
    }

    const offer = JSON.parse(offerSDP);

    peerConnection = new RTCPeerConnection();

    peerConnection.ontrack = (event) => {
      console.log("Keppandi: Móttekur track:", event.track.kind);
      if (!remoteStream) {
        remoteStream = new MediaStream();
        const audioElement = new Audio();
        audioElement.srcObject = remoteStream;
        audioElement.autoplay = true;
        document.body.appendChild(audioElement);
      }
      remoteStream.addTrack(event.track);
    };

    await peerConnection.setRemoteDescription(offer);
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);

    console.log("Keppandi: Svar tilbúið", answer);
    window.answerSDP = JSON.stringify(answer);
    alert("Afritaðu þetta ANSWER og sendu dómara.");
  } catch (err) {
    console.error("Keppandi: Villa við að tengjast streymi:", err);
  }
}

export function toggleMic() {
  if (!localStream || !localStream.getAudioTracks().length) {
    console.warn("Engin mic í notkun");
    return false;
  }

  micTrack = localStream.getAudioTracks()[0];
  micTrack.enabled = !micTrack.enabled;
  console.log("Mic togglað:", micTrack.enabled);
  return micTrack.enabled;
}
