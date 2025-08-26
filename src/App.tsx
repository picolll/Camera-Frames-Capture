import { useRef, useState } from 'react';
import './App.css';
function App() {
  const [hideCamera, setHideCamera] = useState(false);
  const [carouselActive, setCarouselActive] = useState(false);
  const [frames, setFrames] = useState<EncodedVideoChunk[]>([]);
  const [pattern, setPattern] = useState("00110011001100110011");
  const [framesCount, setFramesCount] = useState(20);

  const mySelectRef = useRef<HTMLSelectElement | null>(null);
  const carouselIntervalRef = useRef<number | null>(null);
  const patternRef = useRef<HTMLInputElement | null>(null);

  const decoder = useRef<VideoDecoder>(
    new VideoDecoder({
      output: (videoFrame) => {
        const canvas = document.getElementById("canvasElementForDisplay") as HTMLCanvasElement;
        const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
        ctx.clearRect(0, 0, videoFrame.displayWidth, videoFrame.displayHeight);
        ctx.drawImage(videoFrame, 0, 0);
        videoFrame.close();
      },
      error: e => console.error("Decoder error:", e)
    })
  )

  async function getBestFrontCameraStream() {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const videoDevices = devices.filter(d => d.kind === "videoinput");
    const frontCams = videoDevices.filter(d => d.label.toLowerCase().includes("front"))
    if (frontCams.length === 0) frontCams.push(...videoDevices);
    const constraints = {
      video: {
        deviceId: frontCams[0].deviceId,
        facingMode: "user",
        width: { ideal: 1920 },
        height: { ideal: 1080 }
      }
    };
    return navigator.mediaDevices.getUserMedia(constraints);
  }
  function setScreenColor(color: string) {
    document.body.style.background = color;
  }

  const captureAndEncode = async (video: HTMLVideoElement, stream: MediaStream, pattern: string = "00110011001100110011") => {
    const { width = 640, height = 480 } = stream.getVideoTracks()[0].getSettings();
    const canvas = document.getElementById("canvasElement") as HTMLCanvasElement;
    if (!canvas) throw new Error("No canvas element found");
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Failed to get 2D context");

    const generatedFrames: EncodedVideoChunk[] = [];
    const encoder = new VideoEncoder({
      output: (chunk: EncodedVideoChunk) => generatedFrames.push(chunk),
      error: (e: Error) => console.error(e)
    });
    encoder.configure({
      codec: "vp8",
      width: width as number,
      height: height as number
    });
    if (decoder.current.state !== "configured") decoder.current.configure({ codec: "vp8", codedWidth: width, codedHeight: height });
    const halfSecondInMicroseconds: number = 500000;
    for (let i = 0; i < framesCount; i++) {
      const color = pattern[i] === "0" ? "black" : "white";
      setScreenColor(color);

      await new Promise(res => setTimeout(res, 500));
      ctx.drawImage(video, 0, 0, width, height);
      const bitmap = await createImageBitmap(video);
      const videoFrame = new VideoFrame(bitmap, { timestamp: i * halfSecondInMicroseconds });
      encoder.encode(videoFrame);
      videoFrame.close();
      bitmap.close();
    }
    await encoder.flush();
    encoder.close();

    stream.getVideoTracks().forEach(t => t.stop());
    setHideCamera(true);
    setFrames(generatedFrames);
    setupFrameSelector(generatedFrames, width, height);
  };

  async function start() {
    setHideCamera(false);
    const canvas = document.getElementById("canvasElementForDisplay") as HTMLCanvasElement;
    if(canvas.width > 0) canvas.width = 0;
    if(canvas.height > 0) canvas.height = 0;
    const stream = await getBestFrontCameraStream();
    const video = document.getElementById("videoElement") as HTMLVideoElement;
    if (!video) throw new Error("No video element found");
    video.srcObject = stream;
    await video.play();

    captureAndEncode(video, stream, pattern);
  }

  const showFrame = (id: number, encodedFrames?: EncodedVideoChunk[]) => {
    const framesForChunk: EncodedVideoChunk[] = encodedFrames || frames;
    if (id < 0 || id >= framesForChunk.length) return;
    const chunk = framesForChunk[id];
    decoder.current.decode(chunk);
  }

  async function setupFrameSelector(frames: EncodedVideoChunk[], width: number, height: number) {
    const select = document.getElementById("selectFrame") as HTMLSelectElement;

    for (let i = select.options.length - 1; i >= 0; i--) {
      select.remove(i);
    }
    frames.forEach((chunk, id) => {
      const option = document.createElement('option');
      option.value = id.toString();
      option.text = `Frame ${id + 1} | Timestamp: ${Math.round(chunk.timestamp / 1000)}ms`;
      select.appendChild(option);
    });

    const canvas = document.getElementById("canvasElementForDisplay") as HTMLCanvasElement;
    canvas.width = width;
    canvas.height = height;

    showFrame(0, frames);
  }

  function startAnimate() {
    setCarouselActive(true);
    const options = mySelectRef?.current?.children as HTMLOptionsCollection;
    let i = 0;
    carouselIntervalRef.current = setInterval(() => {
      options[i].selected = true;
      showFrame(parseInt(options[i].value));
      i = (i + 1) % options.length;
    }, 500);
  }

  function stopAnimate() {
    setCarouselActive(false);
    if (!carouselIntervalRef.current) return;
    clearInterval(carouselIntervalRef.current);
  }

  const onSelectChange = (e: { target: { value: string; }; }) => {
    showFrame(parseInt(e.target.value));
  };

  function isBackgroundBlack(): boolean {
    return document.body.style.backgroundColor === "black";
  }

  const isSelectedPatternValid = (): boolean => {
    return pattern.length === framesCount && RegExp(`[0-1]{${framesCount}}`).test(pattern);
  };

  return <>
    <div className='wrapper'>
      <div className='controls'>
        <button disabled={!isSelectedPatternValid()} onClick={() => start()}>Start</button>
        <label htmlFor="pattern">Pattern:</label>
        <input id="pattern" ref={patternRef} type='text' pattern={`[0-1]{${framesCount}}`} value={pattern} title='Only 0 or 1 allowed up to frames count' onChange={(e) => setPattern(e.target.value)} />
        <label htmlFor="framesCount">Frames Count:</label>
        <input id="framesCount" type='number' value={framesCount} onChange={(e) => setFramesCount(parseInt(e.target.value))} />
        <button onClick={() => window.location.reload()}>Reset</button>
        {(frames.length === 0) && <button onClick={() => setHideCamera(prev => !prev)}>{hideCamera ? "Show" : "Hide"} Camera</button>}
        <button onClick={() => setScreenColor(isBackgroundBlack() ? "white" : "black")}>Toggle Background Color</button>
        {!carouselActive && (frames.length !== 0) && <button onClick={startAnimate} >Start Animate</button>}
        {carouselActive && <button onClick={stopAnimate} >Stop Animate</button>}
        <select ref={mySelectRef} hidden={frames.length === 0} id="selectFrame" onChange={onSelectChange} ></select>
      </div>
      <div className='container'>
        <video hidden={hideCamera} id="videoElement" autoPlay />
      </div>
      <div id='containerForFrames'>
        <canvas id="canvasElementForDisplay" ></canvas>
      </div>
      <div id="output">
        <canvas id="canvasElement" style={{ display: "none" }}></canvas>
      </div>
    </div >
  </>
}

export default App;
