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
import { startStreaming, joinStreaming, toggleMic } from "./webrtc";

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

  if (mode === "host") {
    return (
      <div className="text-center p-6 min-h-screen bg-gradient-to-b from-purple-800 to-black text-white">
        <h1 className="text-4xl font-extrabold mb-2">Dómari 🎧</h1>
        <button onClick={createRoom} className="bg-yellow-500 hover:bg-yellow-600 px-6 py-3 text-xl rounded mb-4">Stofna nýtt herbergi</button>
        {roomId && (
          <>
            <p className="text-lg">Herbergi ID: <span className="font-mono bg-white text-black px-2 py-1 rounded select-all">{roomId}</span></p>
            {firstBling && (
              <>
                <p className="mt-4 text-2xl text-red-400 font-bold animate-pulse">🔔 {firstBling} hefur BLINGAÐ!</p>
                <div className="flex justify-center gap-3 mt-2">
                  <button onClick={() => addScore(firstBling, 1)} className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded">+1 stig</button>
                  <button onClick={() => addScore(firstBling, 2)} className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded">+2 stig</button>
                  <button onClick={() => addScore(firstBling, -1)} className="bg-red-700 hover:bg-red-800 px-4 py-2 rounded">-1 stig</button>
                </div>
              </>
            )}
            {timer !== null && (
              <p className="text-yellow-300 text-lg font-bold mt-2">⏱ {timer} sekúndur eftir</p>
            )}
            <div className="mt-2">
              <button onClick={clearBling} className="bg-red-400 px-3 py-1 rounded">Núlstilla BLING</button>
            </div>
            <div className="mt-6">
              <h3 className="text-2xl font-bold underline mb-2">🎯 Stigatafla</h3>
              <ul className="flex flex-col items-center gap-2">
                {Object.entries(players).map(([name, score]) => (
                  <li key={name} className="bg-white rounded shadow-md w-64 px-4 py-2 flex justify-between items-center">
                    <span className="text-black">{name}: {score} stig</span>
                    <div className="flex gap-1">
                      <button onClick={() => addScore(name, 1)} className="bg-green-500 text-white px-2 py-1 rounded">+1</button>
                      <button onClick={() => addScore(name, -1)} className="bg-red-600 text-white px-2 py-1 rounded">-1</button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
            <div className="mt-6">
              <button onClick={() => startStreaming(roomId)} className="bg-blue-500 px-4 py-2 rounded mr-2">
                🎙️ Byrja streymi
              </button>
              <button onClick={toggleMicHandler} className="bg-gray-600 px-4 py-2 rounded">
                {micOn ? "🔇 Slökkva á mic" : "🎤 Kveikja á mic"}
              </button>
            </div>
          </>
        )}
      </div>
    );
  }

  if (mode === "player") {
    return (
      <div className="text-center p-6 min-h-screen bg-gradient-to-b from-black to-purple-800 text-white">
        <h1 className="text-4xl font-bold mb-4">Keppandi 🧍</h1>
        {!joined ? (
          <>
            <input
              type="text"
              placeholder="Nafn"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              className="block mx-auto mb-2 px-4 py-2 text-black rounded"
            />
            <input
              type="text"
              placeholder="Herbergi ID"
              value={inputRoomId}
              onChange={(e) => setInputRoomId(e.target.value)}
              className="block mx-auto mb-2 px-4 py-2 text-black rounded"
            />
            <button onClick={joinRoom} className="bg-green-500 px-4 py-2 rounded">Taka þátt</button>
          </>
        ) : (
          <>
            <p className="mb-1">Þú ert kominn í herbergi: <strong>{roomId}</strong></p>
            <p className="mb-2">Nafn: <strong>{playerName}</strong></p>
            <button onClick={sendBling} className="mt-2 bg-red-600 px-6 py-3 rounded text-white text-xl animate-pulse">🚨 BLING! 🚨</button>
            <button onClick={() => joinStreaming(roomId)} className="mt-4 bg-blue-500 px-4 py-2 rounded">🎧 Tengjast streymi</button>
            <button onClick={toggleMicHandler} className="mt-2 ml-2 bg-gray-500 px-4 py-2 rounded">
              {micOn ? "🔇 Slökkva á mic" : "🎤 Kveikja á mic"}
            </button>
            {firstBling && (
              <p className="mt-4 text-xl text-red-400">🔔 {firstBling} hefur blingað!</p>
            )}
            {timer !== null && (
              <p className="mt-2 text-yellow-300">
                {timer > 0 ? `⏱ ${timer} sekúndur eftir til að svara` : "⏰ Tíminn er úti!"}
              </p>
            )}
            <div className="mt-6">
              <h3 className="text-xl font-bold">Stigatafla:</h3>
              <ul className="mt-2">
                {Object.entries(players).map(([name, score]) => (
                  <li key={name}>{name}: {score} stig</li>
                ))}
              </ul>
            </div>
          </>
        )}
      </div>
    );
  }

  return null;
}

export default App;
