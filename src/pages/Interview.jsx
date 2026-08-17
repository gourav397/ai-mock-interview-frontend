function Interview() {
  const answerRef = useRef(null);

  function startVoice() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return alert("Voice sirf Chrome/Edge mein chalega");
    const rec = new SR();
    rec.lang = localStorage.getItem("lang") === "hi" ? "hi-IN" : "en-IN";
    rec.onresult = (e) => { if (answerRef.current) answerRef.current.value = e.results[0][0].transcript; };
    rec.start();
  }
  // ... buttons JSX mein:
  // <textarea ref={answerRef} />
  // <button onClick={startVoice}>🎙️ Bol ke Answer Do</button>
  // <button onClick={() => speak(currentQuestion)}>🔊 Question Suno</button>
}