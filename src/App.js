import React, { useState, useEffect, useRef } from "react";
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
  serverTimestamp
} from "firebase/firestore";
import { startDailyCallWithAudioOnly } from "./daily";

function App() {
  const [mode, setMode] = useState(null);
  const [roomId, setRoomId] = useState(null);
  const [inputRoomId, setInputRoomId] = useState("");
  const [playerName, setPlayerName] = useState("");
  const [joined, setJoined] = useState(false);
  const [firstBling, setFirstBling] = useState(null);
  const [players, setPlayers] = useState({});
  const [timer, setTimer] = useState(null);
  const [streamingActive, setStreamingActive] = useState(false);

  const blingSoundRef = useRef(null);

  useEffect(() => {
    blingSoundRef.current = new Audio("/bling.mp3");
  }, []);

  useEffect(() => {
    let countdown;
    if (firstBling) {
      setTimer(15);
      countdown = setInterval(() => {
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
      await updateDoc(roomRef, { firstBling: null });
    }
  };

  useEffect(() => {
    if (roomId) {
      const roomRef = doc(db, "rooms", roomId);
      const unsubRoom = onSnapshot(roomRef, (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setFirstBling(data.firstBling);
          setStreamingActive(data.streamingActive || false);
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

        if (playersSnap.size >= 4) {
          alert("⚠️ Fullt í herberginu – hámark 4 keppendur.");
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
        await updateDoc(roomRef, { firstBling: playerName });
        if (blingSoundRef.current) {
          blingSoundRef.current.currentTime = 0;
          blingSoundRef.current.play();
        }
      }
    } catch (error) {
      console.error("Villa við BLING:", error);
    }
  };

  const addPoint = async (name) => {
    try {
      const playerRef = doc(db, "rooms", roomId, "players", name);
      const playerSnap = await getDoc(playerRef);
      if (playerSnap.exists()) {
        const currentScore = playerSnap.data().score || 0;
        await updateDoc(playerRef, { score: currentScore + 1 });
      }
    } catch (error) {
      console.error("Villa við að bæta stig:", error);
    }
  };

  const subtractPoint = async (name) => {
    try {
      const playerRef = doc(db, "rooms", roomId, "players", name);
      const playerSnap = await getDoc(playerRef);
      if (playerSnap.exists()) {
        const currentScore = playerSnap.data().score || 0;
        await updateDoc(playerRef, { score: currentScore - 1 });
      }
    } catch (error) {
      console.error("Villa við að draga frá stigi:", error);
    }
  };

  const baseStyle = {
    background: "radial-gradient(circle, #222 0%, #000 100%)",
    color: "#fff",
    textAlign: "center",
    minHeight: "100vh",
    padding: "50px",
    fontFamily: "'Press Start 2P', cursive"
  };

  const buttonStyle = {
    fontSize: "1.2em",
    padding: "10px 30px",
    margin: "10px",
    cursor: "pointer",
    backgroundColor: "#ffcc00",
    border: "none",
    borderRadius: "8px",
    fontFamily: "'Press Start 2P', cursive"
  };

  const inputStyle = {
    padding: 12,
    fontSize: "1.5em",
    margin: "10px 0",
    width: "80%",
    maxWidth: "300px",
    color: "black"
  };

  const renderTimer = () => {
    if (firstBling && timer !== null) {
      return timer > 0
        ? <p>⏱ {timer} sekúndur eftir til að svara</p>
        : <p style={{ color: "red" }}>⏰ Tíminn er úti!</p>;
    }
    return null;
  };

  const renderPlayerList = () => (
    <>
      <h3 style={{ marginTop: "30px" }}>📋 Keppendur í herberginu:</h3>
      <ul style={{ listStyle: "none", padding: 0 }}>
        {Object.keys(players).map((name) => (
          <li key={name}>👤 {name}</li>
        ))}
      </ul>
    </>
  );

  const renderScoreboard = () => (
    <>
      <h3 style={{ marginTop: "30px" }}>🏅 Stigatafla:</h3>
      <ul style={{ listStyle: "none", padding: 0 }}>
        {Object.entries(players).map(([name, score]) => (
          <li key={name}>
            {name}: <strong>{score}</strong>
            <button onClick={() => addPoint(name)} style={{ marginLeft: 10 }}>+1</button>
            <button onClick={() => subtractPoint(name)} style={{ marginLeft: 5 }}>-1</button>
          </li>
        ))}
      </ul>
    </>
  );

  if (!mode) {
    return (
      <div style={baseStyle}>
        <h1 style={{ fontSize: "2.5em", marginBottom: "30px" }}>🎉 BLING 🎉</h1>
        <button onClick={() => setMode("host")} style={buttonStyle}>Ég er dómari</button>
        <button onClick={() => setMode("player")} style={buttonStyle}>Ég er keppandi</button>
      </div>
    );
  }

  if (mode === "host") {
    return (
      <div style={baseStyle}>
        <h1 style={{ fontSize: "2em" }}>🎤 Dómari</h1>
        {!roomId && (
          <button onClick={createRoom} style={buttonStyle}>Stofna nýtt herbergi</button>
        )}
        {roomId && (
          <>
            <p>🔑 Herbergi ID: <strong>{roomId}</strong></p>
            <button onClick={() => startDailyCallWithAudioOnly(roomId, db)} style={buttonStyle}>Byrja streymi</button>

            {!streamingActive && (
              <div style={{
                backgroundColor: "#fff3cd",
                color: "#856404",
                padding: "10px 20px",
                borderRadius: "6px",
                marginTop: "20px",
                maxWidth: "500px",
                fontSize: "0.9em",
                lineHeight: "1.5em",
                marginLeft: "auto",
                marginRight: "auto"
              }}>
                💡 <strong>Til að spila tónlist fyrir keppendur:</strong><br />
                Þegar þú smellir á "Byrja streymi", veldu "Browser tab" og <strong>hakkaðu við “Share tab audio”</strong>.<br />
                <br />
                ✅ Chrome virkar best.<br />
                ❌ Ekki hægt að deila bara hljóði án þess að velja skjá eða tab.
              </div>
            )}

            {streamingActive && (
              <div style={{
                backgroundColor: "#d4edda",
                color: "#155724",
                padding: "10px",
                borderRadius: "5px",
                marginTop: "15px",
                maxWidth: "500px",
                margin: "0 auto"
              }}>
                ✅ Streymi virkt – keppendur heyra þig!
                <p style={{ fontSize: "0.8em", marginTop: "10px", color: "#155724" }}>
                  👂 Mundu að velja tab með hljóði og haka við “Share tab audio”. Chrome virkar best!
                </p>
              </div>
            )}
            {firstBling ? (
              <>
                <h2 style={{ color: "#ffcc00" }}>🔔 Fyrsti til að BLINGA: {firstBling}</h2>
                {renderTimer()}
              </>
            ) : (
              <h2>⏳ Beðið eftir BLING...</h2>
            )}
            {renderPlayerList()}
            {renderScoreboard()}
          </>
        )}
      </div>
    );
  }

  if (mode === "player") {
    return (
      <div style={baseStyle}>
        <h1 style={{ fontSize: "2em" }}>🧍 Keppandi</h1>
        {!joined ? (
          <>
            <input style={inputStyle} type="text" placeholder="Nafn" value={playerName} onChange={(e) => setPlayerName(e.target.value)} />
            <br />
            <input style={inputStyle} type="text" placeholder="Herbergi ID" value={inputRoomId} onChange={(e) => setInputRoomId(e.target.value)} />
            <br />
            <button onClick={joinRoom} style={buttonStyle}>Taka þátt</button>
          </>
        ) : (
          <>
            <p>Herbergi: <strong>{roomId}</strong></p>
            <p>Nafn: <strong>{playerName}</strong></p>

            {streamingActive && (
              <button
                style={buttonStyle}
                onClick={async () => {
                  const roomRef = doc(db, "rooms", roomId);
                  const roomSnap = await getDoc(roomRef);
                  if (roomSnap.exists()) {
                    const url = roomSnap.data().dailyRoomUrl;
                    if (url) window.open(url, "_blank");
                    else alert("Engin streymistengill fannst.");
                  }
                }}
              >
                🔊 Opna streymi
              </button>
            )}

            <button onClick={sendBling} style={buttonStyle}>🚨 BLING! 🚨</button>

            {firstBling && (
              <>
                <p style={{ fontSize: "20px", color: "red", marginTop: "20px" }}>
                  🔔 {firstBling} hefur blingað!
                </p>
                {renderTimer()}
              </>
            )}
            {renderPlayerList()}
            {renderScoreboard()}
          </>
        )}
      </div>
    );
  }

  return null;
}

export default App;
