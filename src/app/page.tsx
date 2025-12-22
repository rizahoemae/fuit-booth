"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Icon from "@mdi/react";
import { mdiRefresh } from "@mdi/js";
import Navbar from "./ui/navbar";
// import ShutterSound from "../../public/shutter-sound.m4a";
export default function Home() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [timer, setTimer] = useState(3);
  const [countdownTimer, setCountdownTimer] = useState(3);

  const [runTimer, setRunTimer] = useState(false);
  const [attemptTake, setAttemptTake] = useState(0);
  const [maxAttempt, setMaxAttempt] = useState(3);
  const [filter, setFilter] = useState<string | null>("none");
  const [resetIndex, setResetIndex] = useState<number | null>(null);
  const [photos, setPhotos] = useState<(HTMLCanvasElement | null)[]>([]);
  const [video, setVideo] = useState();
  const [mediaDevices, setMediaDevices] = useState<(MediaDeviceInfo | null)[]>(
    []
  );
  const [selectedMedia, setSelectedMedia] = useState<string | null>(null);
  const recordedBlobs: Blob[] = [];
  const mediaRecorder = useRef<MediaRecorder>(null);
  const [blink, setBlink] = useState(false);
  const truthyNumber = (value: number | null) => {
    if (value || value === 0) {
      return true;
    } else {
      return false;
    }
  };

  useEffect(() => {
    navigator.mediaDevices.enumerateDevices().then((devices) => {
      const videoInputs = devices.filter(
        (device) => device.kind === "videoinput"
      );
      setMediaDevices(videoInputs);
      if (!selectedMedia) {
        setSelectedMedia(videoInputs[0].deviceId);
      }
    });
  }, [setMediaDevices, setSelectedMedia]);

  const filterEffects = {
    none: {
      label: "None",
      filter: "",
      css: "",
    },
    contrast: {
      label: "Contrast",
      filter: "contrast(250%) brightness(110%)",
      css: "contrast-250 brightness-110",
    },
    sepia: {
      label: "Sepia",
      filter: "sepia(100%) contrast(125%)",
      css: "sepia-100 contrast-125",
    },
    grayscale: {
      label: "Grayscale",
      filter: "grayscale brightness(90%) contrast(125%)",
      css: "grayscale brightness-90 contrast-125",
    },
  };

  const shareStream = (stream: MediaStream) => {
    const videoElements = Object.keys(filterEffects).map((item) =>
      document.getElementById(`preview-${item}`)
    );

    videoElements.forEach((video) => {
      if (video) {
        video.srcObject = stream;
        video.play();
      }
    });
  };
  useEffect(() => {
    navigator.mediaDevices
      .getUserMedia({
        video: true,
      })
      .then((stream) => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
          shareStream(stream);

          // Merge audio from the original stream (canvas stream has no audio)
          // const combinedStream = new MediaStream([
          //   ...canvasStream.getVideoTracks(),
          //   ...videoRef.current.srcObject.getAudioTracks(),
          // ]);
          const options = { mimeType: "video/webm;codecs=vp9,opus" };
          try {
            mediaRecorder.current = new MediaRecorder(stream, options);
          } catch (error) {
            console.error("Exception while creating MediaRecorder:", error);
            return;
          }
        }
      })
      .catch((err) => {
        console.error(`An error occurred: ${err}`);
      });
  }, []);

  // const dpi = 72 / 2.54;

  const savePicture = () => {
    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current?.videoWidth ?? 0;
    canvas.height = videoRef.current?.videoHeight ?? 0;

    const context = canvas.getContext("2d");
    if (context) {
      context.translate(canvas.width, 0);
      context.scale(-1, 1);
      if (videoRef.current) {
        context.filter = filterEffects[filter].filter;
        context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      }
    }

    if (truthyNumber(resetIndex ?? null)) {
      const currentPhotos = [...photos];
      currentPhotos[resetIndex ?? 0] = canvas;
      setPhotos(currentPhotos);
      setResetIndex(null);
    } else {
      setPhotos([...photos, canvas]);
    }
  };

  const startVideo = () => {
    if (mediaRecorder && mediaRecorder.current) {
      mediaRecorder.current.ondataavailable = collectVideo;
      mediaRecorder.current.onstop = stopVideo;
      mediaRecorder.current.start();
    }
  };

  const collectVideo = (event) => {
    if (event.data && event.data.size > 0) {
      recordedBlobs.push(event.data);
    }
  };

  const stopVideo = (event) => {
    const superBuffer = new Blob(recordedBlobs, {
      type: mediaRecorder?.current?.mimeType,
    });
    const url = URL.createObjectURL(superBuffer);
    const timestampMs = Date.now();
    const a = document.createElement("a");
    a.href = url;
    a.download = `video-${timestampMs}`;
    a.click();
    URL.revokeObjectURL(url);
  };
  const countdownReset = () => {
    setAttemptTake(0);
    setMaxAttempt(1);
    setRunTimer((prevRun) => (prevRun = !prevRun));
    setCountdownTimer(timer);
  };
  const resetPhoto = (idx: number) => {
    setResetIndex(idx);
    const currentPhotos = [...photos];
    currentPhotos[idx ?? 0] = null;
    setPhotos(currentPhotos);
  };
  const playShutter = () => {
    const audio = new Audio("/shutter-sound.m4a");
    audio.play();
  };
  const drawImageCover = (
    ctx: CanvasRenderingContext2D,
    img: HTMLCanvasElement,
    canvasWidth: number,
    canvasHeight: number,
    dx: number,
    dy: number
  ) => {
    const imageWidth = img.width;
    const imageHeight = img.height;

    const canvasAspectRatio = canvasWidth / canvasHeight;
    const imageAspectRatio = imageWidth / imageHeight;

    let sx, sy, sWidth, sHeight;

    if (imageAspectRatio > canvasAspectRatio) {
      sHeight = imageHeight;
      sWidth = imageHeight * canvasAspectRatio;
      sx = (imageWidth - sWidth) / 2;
      sy = 0;
    } else {
      sWidth = imageWidth;
      sHeight = imageWidth / canvasAspectRatio;
      sx = 0;
      sy = (imageHeight - sHeight) / 2;
    }

    ctx.drawImage(
      img,
      sx,
      sy,
      sWidth,
      sHeight,
      dx,
      dy,
      canvasWidth,
      canvasHeight
    );
  };
  const createStrip = () => {
    const mergedCanvas = document.createElement("canvas");
    mergedCanvas.height = 1772;

    mergedCanvas.width = 591;
    const mergedCtx = mergedCanvas.getContext("2d");
    if (mergedCtx) {
      mergedCtx.fillStyle = "white";
      mergedCtx.fillRect(0, 0, mergedCanvas.width, mergedCanvas.height);
    }

    const padding = 59.5;
    const currentX = padding;
    let currentY = padding;

    const sizeImage = {
      width: 472,
      height: 472,
    };
    photos.forEach((item) => {
      if (mergedCtx && item) {
        drawImageCover(
          mergedCtx,
          item,
          sizeImage.width,
          sizeImage.height,
          currentX,
          currentY
        );
      }

      currentY += sizeImage.height + padding;
    });
    const img = new Image();
    img.src = mergedCanvas.toDataURL();
    const timestampMs = Date.now();

    mergedCanvas.toBlob(function (blob) {
      if (blob) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `fuitbooth-photostrip-${timestampMs}`;
        a.click();
        URL.revokeObjectURL(url);
      }
    }, "image/png");
    mediaRecorder?.current?.stop();
    videoRef?.current?.srcObject?.getTracks().forEach((track) => track.stop()); // Stop all media tracks
  };

  // countdown
  useEffect(() => {
    if (!runTimer || attemptTake >= maxAttempt) {
      return;
    }

    if (countdownTimer <= 0) {
      return;
    }
    const id = window.setInterval(() => {
      setCountdownTimer((t) => {
        if (t <= 0) return 0;
        return t - 1;
      });
    }, 1000);

    return () => {
      clearInterval(id);
    };
  }, [runTimer, attemptTake, maxAttempt, countdownTimer]);

  //kudu pakai usecallback kalo dia dijadiin dependency di useeffect. catat za :D
  const captureOne = useCallback(() => {
    setBlink(true);
    savePicture();
    playShutter();
    setAttemptTake((prevAtt) => prevAtt + 1);
    setTimeout(() => setBlink(false), 150);
    setCountdownTimer(timer);
  }, [savePicture, playShutter, timer]);

  useEffect(() => {
    if (!runTimer || attemptTake >= maxAttempt) return;
    if (countdownTimer !== 0) return;

    const timeoutCapture = setTimeout(() => {
      captureOne();
    }, 200);

    return () => {
      clearTimeout(timeoutCapture);
    };
  }, [countdownTimer, runTimer, attemptTake, maxAttempt, captureOne]);

  const stopCapture = useCallback(() => {
    setAttemptTake(0);
    setRunTimer(false);
  }, []);

  useEffect(() => {
    console.log({ attemptTake, maxAttempt });
    if (attemptTake !== maxAttempt) return;
    const timeoutStop = setTimeout(() => {
      stopCapture();
    }, 200);

    return () => clearTimeout(timeoutStop);
  }, [attemptTake, maxAttempt, stopCapture]);

  const countdown = () => {
    startVideo();
    // if reset
    if (truthyNumber(resetIndex ?? null)) {
      countdownReset();
    } else {
      // if not reset
      setRunTimer((prevRun) => (prevRun = !prevRun));
    }
  };
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans relative">
      <Navbar />
      <main className="flex md:flex-row flex-col h-full w-full md:max-w-7xl items-center justify-between md:py-16 py-24 md:px-0 px-3 ">
        <div className=" md:w-2/3 w-full flex  flex-col items-center md:justify-start justify-center  ">
          <div className="flex items-center w-full md:space-x-6 md:justify-between justify-center">
            {/* filter */}
            <div className=" md:flex hidden flex-col gap-y-3 items-center ">
              {Object.keys(filterEffects).map((item) => (
                <button
                  onClick={() => setFilter(item)}
                  key={item}
                  className={`bg-white relative cursor-pointer w-fit ${
                    filter == item
                      ? "border-2 border-primary rounded-xl"
                      : "border border-gray-system rounded-lg"
                  }`}
                >
                  <video
                    id={`preview-${item}`}
                    className={`-scale-x-100 relative rounded-lg ${filterEffects[item].css} size-32 object-cover `}
                  >
                    Video stream not available.
                  </video>
                  <div className="absolute bottom-0 h-10 bg-linear-to-t rounded-b-lg from-black to-transparent w-full text-sm text-white/70 flex items-center justify-center">
                    {filterEffects[item].label}
                  </div>
                </button>
              ))}
            </div>
            <div className="items-center flex flex-col">
              <div className="flex flex-col justify-center md:items-start items-center">
                {/* select option */}
                <div className="grid grid-cols-2 md:gap-x-6 gap-x-2 md:mb-6 mb-3">
                  <div className="flex flex-col">
                    <label htmlFor="device-media">Choose camera:</label>
                    <select
                      defaultValue={selectedMedia ?? ""}
                      name="device-media"
                      className="bg-white"
                      onChange={(event) => setSelectedMedia(event.target.value)}
                    >
                      <option value="" disabled></option>

                      {mediaDevices.map((device, index) => (
                        <option
                          className="bg-white"
                          key={index}
                          selected={device?.deviceId == selectedMedia}
                          value={device?.deviceId}
                        >
                          {device?.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex flex-col">
                    <label htmlFor="device-media">Choose timer:</label>
                    <select
                      defaultValue={timer ?? ""}
                      name="timer"
                      className="bg-white"
                      onChange={(event) => {
                        setTimer(Number(event.target.value));
                        setCountdownTimer(Number(event.target.value));
                      }}
                    >
                      {Array.from({ length: 5 }, (_, index) => (
                        <option
                          className="bg-white"
                          key={index}
                          selected={index + 1 == timer}
                          value={index + 1}
                        >
                          {index + 1}s
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="relative justify-center flex">
                  <div className="md:p-5 p-2 md:size-150 size-85 rounded-xl justify-center flex bg-white border border-gray-system">
                    <video
                      ref={videoRef}
                      className={`-scale-x-100 relative rounded-lg w-full object-cover ${
                        filter ? filterEffects[filter].css : ""
                      }`}
                    >
                      Video stream not available.
                    </video>
                  </div>
                  {blink ? (
                    <div className="absolute top-0 left-0 bg-white h-full w-full opacity-30 "></div>
                  ) : (
                    ""
                  )}
                  {runTimer && (
                    <h2 className="absolute top-[50%] left-[50%] -translate-x-1/2 text-6xl font-bold text-white/50 ">
                      {countdownTimer}
                    </h2>
                  )}
                </div>
                <div className=" md:hidden flex gap-x-3 items-center mt-3">
                  {Object.keys(filterEffects).map((item) => (
                    <button
                      onClick={() => setFilter(item)}
                      key={item}
                      className={`bg-white relative cursor-pointer w-fit ${
                        filter == item
                          ? "border-2 border-primary rounded-xl"
                          : "border border-gray-system rounded-lg"
                      }`}
                    >
                      <video
                        id={`preview-${item}`}
                        className={`-scale-x-100 relative rounded-lg ${filterEffects[item].css} size-16 object-cover `}
                      >
                        Video stream not available.
                      </video>
                      <div className="absolute bottom-0 md:h-10 h-5 bg-linear-to-t rounded-b-lg from-black to-transparent w-full text-sm text-white/70 flex items-center justify-center">
                        {filterEffects[item].label}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {photos.length == 3 && resetIndex === null ? (
                <button
                  onClick={createStrip}
                  className="rounded-lg bg-secondary p-2 w-1/2 mt-6 cursor-pointer text-primary"
                >
                  Save progress
                </button>
              ) : (
                <button
                  onClick={countdown}
                  className="rounded-lg bg-primary p-2 w-1/2 mt-6 cursor-pointer text-white"
                >
                  Take photo
                </button>
              )}
            </div>
          </div>
        </div>
        <div className=" justify-center flex md:w-1/3 w-full  ">
          <div className="flex md:mt-0 mt-6 bg-white p-4 pb-16 flex-col rounded-lg border-gray-system space-y-4 drop-shadow-sm w-fit">
            {Array.from({ length: 3 }, (_, index) => (
              <div key={index}>
                {photos[index] ? (
                  <div
                    onClick={() => resetPhoto(index)}
                    className="relative reset-container cursor-pointer"
                  >
                    <img
                      src={photos[index].toDataURL("image/png")}
                      alt=""
                      className={`size-40 object-cover`}
                    />
                    <div className="absolute bg-black/30 size-40 top-0 reset-element justify-center items-center">
                      <Icon path={mdiRefresh} size={1}></Icon>
                    </div>
                  </div>
                ) : (
                  <div className="size-40 bg-gray-200"></div>
                )}
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
