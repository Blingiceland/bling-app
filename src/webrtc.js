// App.js
import React, { useState, useEffect } from "react";
import { db } from "./firebase";
import {
  collection,
  addDoc,
  getDocs,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  onSnapshot,
  serverTimestamp,
  increment
} from "firebase/firestore";
import { startStreaming, joinStreaming, toggleMic, initWebRTC } from "./webrtc";

function App() {
  const [mode, setMode] = useState(null);
  const [roomId, setRoomId] = useState(null);
  const [inputRoomId, setInputRoomId] = useState("");
  const [playerName, setPlayerName] = useState("");
  const [joined, setJoined] = useState(false);
  const [firstBling, setFirstBling] = useState(null);
  const [players, setPlayers] = useState({});
  const [timer, setTimer] = useState(null);
  const [micOn, setMicOn] = useState(true);

  useEffect(() => {
    let countdown;
    if (firstBling) {
      setTimer(15);
      countdown = setInterval(async () => {
        setTimer((prev) => {
          if (prev === 1) {
            clearInterval(countdown);
            handleTimeOut();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      setTimer(null);
    }
    return () => clearInterval(countdown);
  }, [firstBling]);

  const handleTimeOut = async () => {
    if (roomId) {
      const roomRef = doc(db, "rooms", roomId);
      await updateDoc(roomRef, {
        firstBling: null
      });
    }
  };

  useEffect(() => {
    if (roomId) {
      const roomRef = doc(db, "rooms", roomId);
      const unsubRoom = onSnapshot(roomRef, (docSnap) => {
        if (docSnap.exists()) {
          setFirstBling(docSnap.data().firstBling);
        }
      });

      const playersRef = collection(db, "rooms", roomId, "players");
      const unsubPlayers = onSnapshot(playersRef, (snapshot) => {
        const updatedPlayers = {};
        snapshot.forEach((doc) => {
          updatedPlayers[doc.id] = doc.data().score;
        });
        setPlayers(updatedPlayers);
      });

      return () => {
        unsubRoom();
        unsubPlayers();
      };
    }
  }, [roomId]);

  const createRoom = async () => {
    try {
      const docRef = await addDoc(collection(db, "rooms"), {
        createdAt: serverTimestamp(),
        firstBling: null
      });
      setRoomId(docRef.id);
    } catch (error) {
      console.error("Villa við að stofna herbergi:", error);
    }
  };

  const joinRoom = async () => {
    try {
      if (!playerName) {
        alert("Vinsamlegast sláðu inn nafn!");
        return;
      }

      const docRef = doc(db, "rooms", inputRoomId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const playersRef = collection(db, "rooms", inputRoomId, "players");
        const playersSnap = await getDocs(playersRef);

        if (playersSnap.size >= 2) {
          alert("⚠️ Fullt í herberginu – aðeins tveir keppendur í einu.");
          return;
        }

        setRoomId(inputRoomId);
        setJoined(true);

        const playerRef = doc(playersRef, playerName);
        const playerSnap = await getDoc(playerRef);
        if (!playerSnap.exists()) {
          await setDoc(playerRef, { score: 0 });
        }

        // Start listening for WebRTC offer
        initWebRTC(inputRoomId);
      } else {
        alert("Herbergið finnst ekki!");
      }
    } catch (error) {
      console.error("Villa við að tengjast herbergi:", error);
    }
  };

  const sendBling = async () => {
    try {
      const roomRef = doc(db, "rooms", roomId);
      const roomSnap = await getDoc(roomRef);

      if (roomSnap.exists() && !roomSnap.data().firstBling) {
        await updateDoc(roomRef, {
          firstBling: playerName
        });
      }
    } catch (error) {
      console.error("Villa við BLING:", error);
    }
  };

  const clearBling = async () => {
    if (roomId) {
      const roomRef = doc(db, "rooms", roomId);
      await updateDoc(roomRef, { firstBling: null });
    }
  };

  const addScore = async (name, points) => {
    if (roomId) {
      const playerRef = doc(db, "rooms", roomId, "players", name);
      await updateDoc(playerRef, { score: increment(points) });
      await clearBling();
    }
  };

  const toggleMicHandler = () => {
    const isNowOn = toggleMic();
    setMicOn(isNowOn);
  };

  if (!mode) {
    return (
      <div className="text-center p-6">
        <h1 className="text-4xl font-bold mb-4">Bling 🎵</h1>
        <button onClick={() => setMode("host")} className="mr-4 bg-yellow-400 px-4 py-2 rounded">Ég er dómari</button>
        <button onClick={() => setMode("player")} className="bg-green-400 px-4 py-2 rounded">Ég er keppandi</button>
      </div>
    );
  }

  // ... rest af dómara og keppanda útliti helst óbreytt

  return null;
}

export default App;
