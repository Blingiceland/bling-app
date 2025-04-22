// webrtc.js
import { db } from "./firebase";
import {
  doc,
  setDoc,
  onSnapshot,
  getDoc,
  collection,
  addDoc,
  query,
  onSnapshot as onSubcollectionSnapshot,
} from "firebase/firestore";

let peerConnection;
let stream;

export async function startStreaming(roomId) {
  try {
    const displayStream = await navigator.mediaDevices.getDisplayMedia({
      video: true,
      audio: true,
    });

    const micStream = await navigator.mediaDevices.getUserMedia({ audio: true });

    // Sameina system audio + mic í einn stream
    micStream.getAudioTracks().forEach((track) => {
      displayStream.addTrack(track);
    });

    stream = displayStream;
    peerConnection = new RTCPeerConnection();

    stream.getTracks().forEach((track) => {
      peerConnection.addTrack(track, stream);
      console.log("Sendandi track:", track.kind, "enabled:", track.enabled);
    });

    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);

    const roomRef = doc(db, "rooms", roomId);
    await setDoc(roomRef, { offer });

    console.log("Dómari: Byrjar streymi fyrir room:", roomId);

    onSnapshot(roomRef, async (snapshot) => {
      const data = snapshot.data();
      if (data?.answer && !peerConnection.currentRemoteDescription) {
        await peerConnection.setRemoteDescription(new RTCSessionDescription(data.answer));
        console.log("Dómari: Tengdur keppanda!");
      }
    });

    peerConnection.onicecandidate = async (event) => {
      if (event.candidate) {
        const candidatesRef = collection(db, "rooms", roomId, "callerCandidates");
        await addDoc(candidatesRef, event.candidate.toJSON());
      }
    };
  } catch (err) {
    console.error("Villa við að starta streymi:", err);
  }
}
  } catch (err) {
    console.error("Villa við að starta streymi:", err);
  }
}

export async function joinStreaming(roomId) {
  try {
    const micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    stream = micStream;

    peerConnection = new RTCPeerConnection();
    stream.getTracks().forEach((track) => {
      peerConnection.addTrack(track, stream);
    });

    const roomDocRef = doc(db, "rooms", roomId);
    const roomDoc = await getDoc(roomDocRef);
    if (!roomDoc.exists()) {
      throw new Error("Streymi ekki fundið fyrir þetta herbergi.");
    }

    const offer = roomDoc.data().offer;
    await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));

    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);

    await setDoc(roomDocRef, {
      offer,
      answer,
    });

    // Send ICE candidates
    peerConnection.onicecandidate = async (event) => {
      if (event.candidate) {
        const candidatesRef = collection(db, "rooms", roomId, "calleeCandidates");
        await addDoc(candidatesRef, event.candidate.toJSON());
      }
    };

    // Receive remote stream
    peerConnection.ontrack = (event) => {
      const remoteStream = event.streams[0];
      const audio = document.createElement("audio");
      audio.srcObject = remoteStream;
      audio.autoplay = true;
      document.body.appendChild(audio);
    };

    // Listen for ICE candidates from caller
    const callerCandidatesRef = collection(db, "rooms", roomId, "callerCandidates");
    onSubcollectionSnapshot(callerCandidatesRef, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === "added") {
          const candidate = new RTCIceCandidate(change.doc.data());
          peerConnection.addIceCandidate(candidate);
        }
      });
    });
  } catch (err) {
    console.error("Villa við að tengjast streymi:", err);
  }
}

export function toggleMic() {
  if (!stream) return;
  const audioTracks = stream.getAudioTracks();
  const enabled = !audioTracks[0].enabled;
  audioTracks.forEach((track) => (track.enabled = enabled));
  return enabled;
}
