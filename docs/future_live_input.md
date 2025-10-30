# Future: Live Input (Microphone / Line-In)

To add live input capture:

1) Permissions & setup
- Call `navigator.mediaDevices.getUserMedia({ audio: true })`.
- Create a `MediaStreamAudioSourceNode` and connect to `AnalyserNode`.

2) Latency and buffering
- Prefer lower FFT sizes for responsiveness (e.g., 1024) and tune smoothing.
- Consider WebRTC constraints for echo cancellation and noise suppression.

3) UX
- Add a microphone toggle and input device selector.
- Display a small level meter to confirm signal.

4) Safety
- Clamp gains and add a limiter if applying gain to the live signal.

5) Future enhancements
- Onset detection for more precise beat events.
- Multi-band gates to drive specific motion channels.
