// customAudioTrack.js
export async function getAudioTrackFromFile(filePath = "/prufa.mp3") {
  return new Promise((resolve, reject) => {
    try {
      const audio = new Audio(filePath);
      audio.crossOrigin = "anonymous"; // ef þú notar hljóð frá öðrum vef
      audio.loop = true;
      audio.volume = 1.0;

      const stream = audio.captureStream();
      const [track] = stream.getAudioTracks();

      audio.play().then(() => {
        console.log("🎵 Audio playing & track ready");
        resolve(track);
      }).catch((err) => {
        console.error("🎧 Villa við að spila audio:", err);
        reject(err);
      });
    } catch (error) {
      reject(error);
    }
  });
}
