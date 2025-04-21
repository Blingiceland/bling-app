// webrtc.js
let peerConnection;
let stream;

export async function startStreaming(roomId) {
  try {
    const displayStream = await navigator.mediaDevices.getDisplayMedia({
      video: true,
      audio: true  // tekur system sound ef browser styður það
    });

    const micStream = await navigator.mediaDevices.getUserMedia({
      audio: true
    });

    // Sameina mic við display stream (bætir við audio tracks)
    micStream.getAudioTracks().forEach((track) => {
      displayStream.addTrack(track);
    });

    stream = displayStream;
    peerConnection = new RTCPeerConnection();

    stream.getTracks().forEach(track => {
      peerConnection.addTrack(track, stream);
    });

    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);

    const offerString = JSON.stringify(offer);
    const remoteAnswer = prompt(`Afritaðu og sendu keppanda þetta OFFER:\n\n${offerString}`);

    if (remoteAnswer) {
      const answerDesc = new RTCSessionDescription(JSON.parse(remoteAnswer));
      await peerConnection.setRemoteDescription(answerDesc);
      console.log("Dómari: Tengdur keppanda!");
    }

    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        console.log("Dómari: ICE candidate", event.candidate);
      }
    };

  } catch (err) {
    console.error("Villa við að starta streymi:", err);
  }
}

export async function joinStreaming(roomId) {
  try {
    const micStream = await navigator.mediaDevices.getUserMedia({
      audio: true
    });

    stream = micStream;
    peerConnection = new RTCPeerConnection();

    stream.getTracks().forEach(track => {
      peerConnection.addTrack(track, stream);
    });

    const offerString = prompt("Limdu OFFER frá dómara hér:");
    if (!offerString) return;

    const offerDesc = new RTCSessionDescription(JSON.parse(offerString));
    await peerConnection.setRemoteDescription(offerDesc);

    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);

    const answerString = JSON.stringify(answer);
    alert(`Sendu þetta til baka til dómara:\n\n${answerString}`);

    peerConnection.ontrack = (event) => {
      const remoteStream = event.streams[0];
      const audio = document.createElement("audio");
      audio.srcObject = remoteStream;
      audio.autoplay = true;
      document.body.appendChild(audio);
    };

    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        console.log("Keppandi: ICE candidate", event.candidate);
      }
    };
  } catch (err) {
    console.error("Villa við að tengjast streymi:", err);
  }
}

export function toggleMic() {
  if (!stream) return;
  const audioTracks = stream.getAudioTracks();
  const enabled = !audioTracks[0].enabled;
  audioTracks.forEach(track => track.enabled = enabled);
  return enabled;
}
